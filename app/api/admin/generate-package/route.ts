import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

function checkAuth(req: NextRequest) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const STYLE_CONFIGS = {
  'luxury-chill': {
    label: 'Luxury + Chill',
    emoji: '✨',
    hotelRange: '€200–400',
    hotelEst: 280,
    prompt: `STILE: Luxury + Chill
- Hotel: 5 stelle, resort con spa/piscina, boutique di lusso. Stima €200-400/notte.
- Ritmo: lento. Max 2-3 attività al giorno con molto tempo libero.
- Attività: spa, rooftop bar, tour privati, esperienze esclusive.
- Cibo: ristoranti fine dining, cocktail bar di design, colazioni in hotel.
- Tono: sofisticato ed esclusivo. "Ti meriti il meglio."`,
  },
  'natura-davedere': {
    label: 'Natura + Da vedere',
    emoji: '🌿',
    hotelRange: '€80–150',
    hotelEst: 100,
    prompt: `STILE: Natura + Da vedere
- Hotel: 3-4 stelle in posizione strategica. Stima €80-150/notte.
- Ritmo: medio. Mix di escursioni naturalistiche e visite culturali.
- Attività: parchi, hiking, viewpoint, attrazioni principali, mercati alimentari.
- Cibo: ristoranti locali tradizionali, trattorie, mercati del cibo.
- Tono: avventuroso ma accessibile. "Il meglio della natura e della cultura."`,
  },
  'davedere-hiddengems': {
    label: 'Da vedere + Hidden Gems',
    emoji: '🗝️',
    hotelRange: '€60–100',
    hotelEst: 75,
    prompt: `STILE: Da vedere + Hidden Gems
- Hotel: Airbnb o boutique in quartieri locali, lontano dalle zone turistiche. Stima €60-100/notte.
- Ritmo: intenso ma non frenetico. 4-5 cose al giorno.
- Attività: attrazioni principali + bar nascosti frequentati dai locali, mercatini di quartiere, street food, attività non turistiche.
- Cibo: street food, bar e trattorie dove mangiano i locals, colazioni in panetteria.
- Tono: da viaggiatore esperto. "Vivi la città come un local."`,
  },
  'standard': {
    label: 'Standard',
    emoji: '💸',
    hotelRange: '€40–80',
    hotelEst: 55,
    prompt: `STILE: Standard (smart low-cost)
- Hotel: budget hotel, B&B, hostel con camera privata. Stima €40-80/notte.
- Ritmo: medio, ottimizza i trasporti pubblici.
- Attività: mix di attrazioni gratuite e a pagamento, musei gratuiti, passeggiate.
- Cibo: street food, supermercati, posti economici ma buoni.
- Tono: pratico e furbo. "Massima esperienza con minima spesa."`,
  },
};

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { destination, destinationCode, flag, price, departDate, returnDate, days, style } = await req.json();

  const cfg = STYLE_CONFIGS[style as keyof typeof STYLE_CONFIGS];
  if (!cfg) return NextResponse.json({ error: 'Stile non valido' }, { status: 400 });

  const nights = days ?? 5;

  const systemPrompt = `Sei un esperto di viaggi che crea guide dettagliate in italiano per viaggiatori italiani.
Rispondi SEMPRE e SOLO con un oggetto JSON valido, senza markdown, senza backtick, nessun testo prima o dopo.

${cfg.prompt}`;

  const userPrompt = `Crea una guida pacchetto per:
- Destinazione: ${destination} (${destinationCode}) ${flag}
- Volo da Catania: €${price} ${departDate}${returnDate ? ` → ${returnDate}` : ' (solo andata)'}
- Durata: ${nights} giorni
- Stile: ${cfg.label}

Restituisci questo JSON (tutti i campi obbligatori):
{
  "perche": "3-4 paragrafi su perché visitare ${destination} con questo stile. Tono coinvolgente.",
  "dormire": "Markdown: zone consigliate, tipologia hotel per questo stile, fascia di prezzo (${cfg.hotelRange}/notte). Minimo 2 zone.",
  "nonPerdere": "Markdown: lista di 5-7 cose da non perdere coerenti con lo stile (non elenco numerico, usa - con grassetto e descrizione breve).",
  "quandoAndare": "2-3 paragrafi su stagionalità, clima, eventi locali.",
  "voliInfo": "Info volo: CTA → ${destinationCode}, €${price}, ${departDate}${returnDate ? `, ritorno ${returnDate}` : ', solo andata'}. Aggiungi 1-2 suggerimenti pratici su come arrivare dall'aeroporto.",
  "stylePreview": "2 frasi teaser che descrivono QUESTO stile per ${destination}. Deve incuriosire senza spoilerare l'itinerario. Usato come anteprima prima del paywall.",
  "itinerario": "Itinerario giorno per giorno in markdown. Usa formato:\\n### Giorno 1 — [Titolo tematico]\\n**Mattina** (9:00–13:00): ...\\n**Pranzo**: ...\\n**Pomeriggio** (14:00–19:00): ...\\n**Sera**: ...\\n\\nOgni giorno deve avere almeno 3-4 luoghi/attività specifici e nominati. ${nights} giorni totali.",
  "tags": ["tag1", "tag2", "tag3"],
  "hotelPerNight": ${cfg.hotelEst},
  "mapsPerDay": [
    { "day": 1, "label": "Giorno 1 — titolo", "places": ["Nome luogo specifico, ${destination}", "Altro luogo, ${destination}"] }
  ]
}

IMPORTANTE per mapsPerDay: includi TUTTI i ${nights} giorni, ogni luogo deve essere nel formato "Nome Luogo, ${destination}" per Google Maps. Solo luoghi fisici visitabili (no ristoranti generici, no "hotel").`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('');
    const data = JSON.parse(text);

    return NextResponse.json({
      ...data,
      style,
      styleLabel: cfg.label,
      styleEmoji: cfg.emoji,
      hotelRange: cfg.hotelRange,
    });
  } catch (err) {
    console.error('generate-package error:', err);
    return NextResponse.json({ error: 'Errore generazione AI' }, { status: 500 });
  }
}
