import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import { searchKiwiFlights, type KiwiSearchArgs } from '../../lib/kiwi';
import { LOADING_PHRASES, PHRASES_PER_WAIT, PHRASE_DELAY_MS } from '../../lib/loadingPhrases';

// ============================================================
// CONFIGURAZIONE CREDITI
// ============================================================
const CREDITS_ON_SIGNUP = 20;        // crediti iniziali per ogni nuovo utente
const COST_PER_MESSAGE = 5;          // costo base: copre il turno Claude + 1 ricerca voli
const COST_PER_EXTRA_SEARCH = 3;     // costo aggiuntivo per ogni ricerca oltre la prima (query tematiche)

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOOL_ITERATIONS = 4;

function buildSystemPrompt(): string {
  const today = new Date().toISOString().split('T')[0];
  return `Act as a friendly flight expert for Italians.
DATE: ${today}. Missing year? Assume future.

<rules>
1. 'search_flights' needs a departure date. If missing, guess +1 month but TELL user it's a guess.
2. If flyTo is missing, use 'anywhere'. Vary destinations on repeats.
3. Use 'search_flights' for real data.
4. Output Table: Route | Times | Duration | Price | Book. Times as "dd/mm HH:MM → HH:MM". Add layovers. Price=total. Link=deepLink.
5. THEMED QUERIES: if user asks for a TYPE of destination (not a specific city), run 3-4 PARALLEL 'search_flights' calls with appropriate IATA codes, then merge results in ONE table sorted by price:
 - "mare" / "spiaggia" / "beach" → PMI (Palma), BCN, ATH, MLA, HER (Creta), IBZ
 - "montagna" / "sci" / "trekking" → INN, GVA, MXP, ZRH, SZG
 - "capitale europea" / "city break" → LON, PAR, AMS, BER, MAD
 - "città d'arte" / "cultura" → PRG, VIE, BUD, FLR, LIS
 - "romantico" / "weekend di coppia" → PAR, VCE, PRG, BCN
 - "festa" / "nightlife" → IBZ, BCN, BER, AMS, MYK
 - "esotico" / "tropicale" → DXB, BKK, CMB, DPS (scali lunghi — avvisa)
 Pick 3-4 based on origin proximity. Always mention in Italian that you compared multiple destinations.
</rules>

<advice_requirements>
Append these as bullet points in Italian:
 - Visas: Warn if ESTA/eTA/visas needed. EU/Schengen = ID/Passport.
 - eSIM: Outside EU/EEA -> "Rimani connesso con un'eSIM su [Airalo](#)".
 - Insurance: USA -> [Heymondo](#); Long Asia -> [SafetyWing](#); Sports -> [World Nomads](#); Other Intl -> [Heymondo](#).
 - Default: [Booking.com](#) (accommodation), [Bounce](#)/[Radical Storage](#) (luggage).
</advice_requirements>

Reply strictly in Italian, friendly and concise.`;
}

const SEARCH_FLIGHTS_TOOL: Anthropic.Tool = {
  name: 'search_flights',
  description: 'Search flights on Kiwi.com. Max 5 results ordered by price.',
  input_schema: {
    type: 'object',
    properties: {
      flyFrom: { type: 'string', description: 'Origin (IATA or name, e.g. NAP)' },
      flyTo: { type: 'string', description: 'Destination (IATA or English name)' },
      departureDate: { type: 'string', description: 'dd/mm/yyyy' },
      returnDate: { type: 'string', description: 'dd/mm/yyyy (optional)' },
      departureDateFlexRange: { type: 'integer', minimum: 0, maximum: 3, description: 'Flex days (0-3)' },
      returnDateFlexRange: { type: 'integer', minimum: 0, maximum: 3, description: 'Flex days (0-3)' },
      adults: { type: 'integer', minimum: 1, maximum: 9, description: 'Adults' },
      children: { type: 'integer', minimum: 0, maximum: 8, description: 'Children' },
      infants: { type: 'integer', minimum: 0, maximum: 4, description: 'Infants' },
      cabinClass: { type: 'string', enum: ['M', 'W', 'C', 'F'], description: 'M=econ, W=prem, C=bus, F=first' },
    },
    required: ['flyFrom', 'flyTo', 'departureDate'],
  },
};

interface ChatMessage { role: 'user' | 'assistant'; content: string; }
interface ToolInput {
  flyFrom: string; flyTo: string; departureDate: string; returnDate?: string;
  departureDateFlexRange?: number; returnDateFlexRange?: number;
  adults?: number; children?: number; infants?: number; cabinClass?: 'M' | 'W' | 'C' | 'F';
}

function toKiwiArgs(input: ToolInput): KiwiSearchArgs {
  const { adults, children, infants, ...rest } = input;
  const passengers =
    adults !== undefined || children !== undefined || infants !== undefined
      ? { adults: adults ?? 1, children: children ?? 0, infants: infants ?? 0 }
      : undefined;
  return { ...rest, passengers };
}

// ============================================================
// HELPER: leggi i crediti correnti dall'utente Clerk
// Se non esistono ancora li inizializziamo a CREDITS_ON_SIGNUP
// ============================================================
async function getUserCredits(userId: string): Promise<number> {
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const meta = user.privateMetadata as { credits?: number };
  // Prima volta che l'utente usa la chat → assegniamo i crediti iniziali
  if (typeof meta.credits !== 'number') {
    await clerk.users.updateUserMetadata(userId, {
      privateMetadata: { credits: CREDITS_ON_SIGNUP },
    });
    return CREDITS_ON_SIGNUP;
  }
  return meta.credits;
}

// ============================================================
// HELPER: scala i crediti e salva
// ============================================================
async function deductCredits(userId: string, currentCredits: number): Promise<number> {
  const clerk = await clerkClient();
  const newCredits = Math.max(0, currentCredits - COST_PER_MESSAGE);
  await clerk.users.updateUserMetadata(userId, {
    privateMetadata: { credits: newCredits },
  });
  return newCredits;
}

// ============================================================
// HELPER: scala i crediti extra per ricerche aggiuntive (query tematiche)
// Chiamato alla fine dello stream quando sappiamo quante ricerche sono state fatte
// ============================================================
async function deductExtraSearches(userId: string, extraSearches: number): Promise<number> {
  if (extraSearches <= 0) return -1;
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const meta = user.privateMetadata as { credits?: number };
  const current = typeof meta.credits === 'number' ? meta.credits : 0;
  const newCredits = Math.max(0, current - extraSearches * COST_PER_EXTRA_SEARCH);
  await clerk.users.updateUserMetadata(userId, {
    privateMetadata: { credits: newCredits },
  });
  return newCredits;
}

// ============================================================
// ENDPOINT: GET /api/chat — restituisce i crediti rimasti
// Chiamato dal frontend per aggiornare il contatore
// ============================================================
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const credits = await getUserCredits(userId);
  return NextResponse.json({ credits });
}

// ============================================================
// ENDPOINT: POST /api/chat — elabora il messaggio e scala i crediti
// ============================================================
export async function POST(request: NextRequest) {
  // 1. Verifica che l'utente sia autenticato
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Devi effettuare il login per usare la chat.' }, { status: 401 });
  }

  // 2. Controlla i crediti PRIMA di fare qualsiasi chiamata AI
  const credits = await getUserCredits(userId);
  if (credits < COST_PER_MESSAGE) {
    return NextResponse.json(
      {
        error: `Crediti esauriti. Hai ancora ${credits} crediti, ma ogni messaggio ne richiede ${COST_PER_MESSAGE}. Contatta il supporto per ricaricarli.`,
        credits,
        creditsExhausted: true,
      },
      { status: 402 } // 402 Payment Required — semanticamente corretto
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY non configurata' }, { status: 500 });
  }

  try {
    const { messages: incoming } = (await request.json()) as { messages?: ChatMessage[] };
    if (!incoming || !Array.isArray(incoming)) {
      return NextResponse.json({ error: 'messages è richiesto' }, { status: 400 });
    }

    const messages: Anthropic.MessageParam[] = incoming.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const systemPrompt = buildSystemPrompt();
    const encoder = new TextEncoder();

    // 3. Scala i crediti PRIMA di aprire lo stream così possiamo mandare i nuovi crediti in header
    const newCredits = await deductCredits(userId, credits);

    const customStream = new ReadableStream({
      async start(controller) {
        // Se il client si disconnette (chiude la tab, cancel), interrompiamo tutto
        // per non bruciare token Claude inutilmente
        let aborted = false;
        const onAbort = () => {
          aborted = true;
          try { controller.close(); } catch {}
        };
        request.signal.addEventListener('abort', onAbort);

        // Contatore totale di ricerche voli fatte in questo turno (per billing variabile)
        let totalSearches = 0;

        try {
          for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
            if (aborted) return;

            const stream = client.messages.stream({
              model: MODEL,
              max_tokens: 1024,
              system: systemPrompt,
              tools: [SEARCH_FLIGHTS_TOOL],
              messages,
            });

            stream.on('text', (textChunk) => {
              if (aborted) return;
              try { controller.enqueue(encoder.encode(textChunk)); } catch {}
            });

            const response = await stream.finalMessage();
            if (aborted) return;

            if (response.stop_reason !== 'tool_use') {
              break;
            }

            messages.push({ role: 'assistant', content: response.content });

            const toolUses = response.content.filter(
              (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
            );
            totalSearches += toolUses.length;

            // Rotatore di frasi "divertenti" che gira in parallelo alla chiamata Kiwi
            let stopRotating = false;
            const rotatePhrases = (async () => {
              const shuffled = [...LOADING_PHRASES].sort(() => Math.random() - 0.5);
              const count = Math.floor(
                Math.random() * (PHRASES_PER_WAIT.max - PHRASES_PER_WAIT.min + 1),
              ) + PHRASES_PER_WAIT.min;
              const picks = shuffled.slice(0, count);

              try { controller.enqueue(encoder.encode('\n\n')); } catch {}
              for (let i = 0; i < picks.length; i++) {
                if (stopRotating || aborted) break;
                try {
                  controller.enqueue(encoder.encode(picks[i] + '\n'));
                } catch {}
                // Aspetta prima della prossima (ma esce subito se Kiwi ha finito)
                await new Promise((r) => setTimeout(r, PHRASE_DELAY_MS));
              }
            })();

            const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
              toolUses.map(async (tu) => {
                try {
                  const flights = await searchKiwiFlights(toKiwiArgs(tu.input as ToolInput));
                  return {
                    type: 'tool_result' as const,
                    tool_use_id: tu.id,
                    content: JSON.stringify({ count: flights.length, flights }),
                  };
                } catch (err) {
                  const msg = err instanceof Error ? err.message : 'errore sconosciuto';
                  return {
                    type: 'tool_result' as const,
                    tool_use_id: tu.id,
                    content: JSON.stringify({ error: msg }),
                    is_error: true,
                  };
                }
              }),
            );

            // Kiwi ha finito → ferma il rotatore e aspetta che termini il ciclo corrente
            stopRotating = true;
            await rotatePhrases;

            // Spazio prima della tabella che Claude genererà
            try { controller.enqueue(encoder.encode('\n')); } catch {}

            if (aborted) return;

            messages.push({ role: 'user', content: toolResults });
          }

          // Billing variabile: la prima ricerca è inclusa nel COST_PER_MESSAGE,
          // ogni ricerca aggiuntiva costa COST_PER_EXTRA_SEARCH
          const extras = Math.max(0, totalSearches - 1);
          if (extras > 0 && !aborted) {
            await deductExtraSearches(userId, extras);
          }

          request.signal.removeEventListener('abort', onAbort);
          try { controller.close(); } catch {}
        } catch (streamError) {
          console.error('Errore interno stream:', streamError);
          request.signal.removeEventListener('abort', onAbort);

          // Rimborsa i crediti in caso di crash (solo se non è un abort volontario)
          if (!aborted) {
            try {
              await (await clerkClient()).users.updateUserMetadata(userId, {
                privateMetadata: { credits: credits },
              });
              controller.enqueue(
                encoder.encode('\n\n[Errore di connessione. I crediti ti sono stati rimborsati.]'),
              );
            } catch {}
          }
          try { controller.close(); } catch {}
        }
      },
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Credits-Remaining': String(newCredits),
      },
    });
  } catch (error) {
    console.error('Errore API chat:', error);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
