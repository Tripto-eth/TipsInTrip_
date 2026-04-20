import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { searchKiwiFlights, type KiwiSearchArgs } from '../../lib/kiwi';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOOL_ITERATIONS = 4;

function buildSystemPrompt(): string {
  const today = new Date().toISOString().split('T')[0];
  return `Sei un assistente di ricerca voli amichevole e conciso che aiuta utenti italiani a trovare voli economici.

DATA ODIERNA: ${today}. Se l'utente indica una data senza anno (es. "15 agosto"), interpretala come la prossima occorrenza futura a partire da oggi. Non assumere MAI che una data sia passata: usa ${today} come riferimento.

Quando l'utente chiede voli:
1. Usa SEMPRE il tool search_flights per cercare voli reali (ti arriveranno già i 5 migliori per prezzo)
2. Ogni volo ha un campo "outbound" (andata) e opzionalmente "return" (ritorno)
3. Formato tabella:
   - Solo andata: Rotta | Orari | Durata | Prezzo | Prenota
   - Andata + ritorno: Andata | Orari A | Ritorno | Orari R | Prezzo tot | Prenota
4. Negli orari usa il formato "dd/mm HH:MM → HH:MM" basato sui campi departLocal/arriveLocal
5. Se ci sono scali in una tratta, mostrali nella rotta (es. "NAP → BCN → LGW"), usando i layovers
6. Il prezzo è totale (andata+ritorno se presente). Link di prenotazione dal campo deepLink
7. Dopo i risultati suggerisci 2-3 ricerche correlate

Tono: amichevole, diretto, in italiano. Sii conciso.`;
}

const SEARCH_FLIGHTS_TOOL: Anthropic.Tool = {
  name: 'search_flights',
  description:
    'Cerca voli reali tramite Kiwi.com. Restituisce al massimo 5 risultati ordinati per prezzo con rotta, orari locali, durata, prezzo in EUR, scali e link di prenotazione.',
  input_schema: {
    type: 'object',
    properties: {
      flyFrom: {
        type: 'string',
        description: 'Aeroporto o città di partenza (codice IATA o nome, es. NAP, Napoli).',
      },
      flyTo: {
        type: 'string',
        description: 'Aeroporto o città di arrivo. Usa nomi in inglese per città ambigue (London invece di Londra).',
      },
      departureDate: {
        type: 'string',
        description: 'Data di partenza in formato dd/mm/yyyy.',
      },
      returnDate: {
        type: 'string',
        description: 'Data di ritorno in formato dd/mm/yyyy (opzionale, solo per andata/ritorno).',
      },
      departureDateFlexRange: {
        type: 'integer',
        minimum: 0,
        maximum: 3,
        description: 'Flessibilità data di partenza in giorni (0-3).',
      },
      returnDateFlexRange: {
        type: 'integer',
        minimum: 0,
        maximum: 3,
        description: 'Flessibilità data di ritorno in giorni (0-3).',
      },
      adults: { type: 'integer', minimum: 1, maximum: 9, description: 'Numero adulti (default 1).' },
      children: { type: 'integer', minimum: 0, maximum: 8, description: 'Numero bambini 3-11 anni.' },
      infants: { type: 'integer', minimum: 0, maximum: 4, description: 'Numero neonati <2 anni.' },
      cabinClass: {
        type: 'string',
        enum: ['M', 'W', 'C', 'F'],
        description: 'Classe: M economy, W premium, C business, F first.',
      },
    },
    required: ['flyFrom', 'flyTo', 'departureDate'],
  },
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ToolInput {
  flyFrom: string;
  flyTo: string;
  departureDate: string;
  returnDate?: string;
  departureDateFlexRange?: number;
  returnDateFlexRange?: number;
  adults?: number;
  children?: number;
  infants?: number;
  cabinClass?: 'M' | 'W' | 'C' | 'F';
}

function toKiwiArgs(input: ToolInput): KiwiSearchArgs {
  const { adults, children, infants, ...rest } = input;
  const passengers =
    adults !== undefined || children !== undefined || infants !== undefined
      ? { adults: adults ?? 1, children: children ?? 0, infants: infants ?? 0 }
      : undefined;
  return { ...rest, passengers };
}

export async function POST(request: NextRequest) {
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

    let finalText = '';
    const systemPrompt = buildSystemPrompt();

    for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        tools: [SEARCH_FLIGHTS_TOOL],
        messages,
      });

      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );

      if (toolUses.length === 0 || response.stop_reason !== 'tool_use') {
        finalText = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('');
        break;
      }

      messages.push({ role: 'assistant', content: response.content });

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

      messages.push({ role: 'user', content: toolResults });
    }

    return NextResponse.json({ message: finalText });
  } catch (error) {
    console.error('Errore API chat:', error);
    const msg = error instanceof Error ? error.message : 'Errore interno del server';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
