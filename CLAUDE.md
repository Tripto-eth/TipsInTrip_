Robe da fare:
-Sfrutta il "cervello" della tua app! Istruisci il tuo backend in Next.js in questo modo:

Se Gemini nota che l'utente sta chiedendo un viaggio negli Stati Uniti, fagli generare un avviso testuale: "Attenzione: le spese mediche negli USA sono altissime. Ti consiglio fortemente di fare un'assicurazione come Heymondo [Tuo Link]".

Se l'utente organizza un viaggio di 3 mesi in Asia, proponi SafetyWing.

Se inserisce parole come "Sci", "Surf" o "Trekking", proponi World Nomads.

-

# FlightList Clone — Project Brief

## Project Overview
Build a flight search aggregator inspired by flightlist.io, focused on **flexible-date exploration** and monetized via **affiliate links**. The product is a browsing tool for finding cheap flights across a date range or to "anywhere" from a given origin — **not a full OTA**. Booking happens via redirect to partner sites.

## Core Design Decisions

- **Primary data source**: Travelpayouts Data API (aka Aviasales Data API — same thing, same company). Free tier, no MAU gate, generous cached data perfect for inspiration-style queries.
- **Monetization**: Aviasales affiliate links via Travelpayouts `marker`. Users click "Book" → redirect to aviasales.com with tracking → commission on completed bookings (up to 70% of Aviasales' cut).
- **Explicitly out of scope**: virtual interlining at Kiwi's quality level. Kiwi's Tequila platform has been invitation-only since May 2024 and is unreachable for new independent projects. A basic `self_transfer_builder` module is planned as Phase 3 to approximate simple 2-leg self-transfers, but it will not match Kiwi's routing quality.
- **Optional fallback data sources (Phase 3+, not required for MVP)**: Duffel (1,500 free searches/month), SerpAPI Google Flights (100 free/month). Introduced only if Travelpayouts coverage gaps become user-visible.

## Architecture

Modular, following the same pattern as the arbitrage bot project (connectors / core / models). Single responsibility per module, thin interfaces between layers.

```
project_root/
├── connectors/
│   ├── __init__.py
│   ├── base.py              # abstract FlightDataConnector interface
│   ├── travelpayouts.py     # PRIMARY — wraps Travelpayouts/Aviasales Data API
│   ├── duffel.py            # Phase 3 — optional live fallback
│   └── serpapi_google.py    # Phase 3 — optional verification
├── core/
│   ├── __init__.py
│   ├── aggregator.py        # merges/dedupes offers from multiple connectors
│   ├── filters.py           # budget, direct-only, airlines, layover, cabin
│   ├── date_range.py        # flexible-date search logic
│   ├── anywhere_search.py   # country/region/continent expansion
│   ├── self_transfer.py     # Phase 3 — 2-leg combinator
│   └── affiliate_linker.py  # builds deep links with Travelpayouts marker
├── models/
│   ├── __init__.py
│   ├── flight_offer.py      # canonical internal format
│   ├── location.py          # airport/city/country/region
│   └── search_query.py      # user search params
├── tests/
│   ├── connectors/
│   ├── core/
│   └── fixtures/            # recorded JSON responses from real API calls
├── .env.example
├── requirements.txt
└── CLAUDE.md
```

## Canonical Models

### `FlightOffer`
Internal unified representation. Every connector must map its response into this shape — no raw vendor payloads leak upward.

```python
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

@dataclass
class FlightLeg:
    origin: str                  # IATA airport code
    destination: str             # IATA airport code
    depart_at: datetime          # UTC
    arrive_at: datetime          # UTC
    airline: str                 # IATA airline code
    flight_number: str
    duration_minutes: int

@dataclass
class FlightOffer:
    origin: str                  # IATA airport code
    destination: str             # IATA airport code
    depart_date: date
    return_date: date | None     # None for one-way
    price: Decimal
    currency: str                # ISO 4217
    airlines: list[str]          # IATA codes, multiple if self-transfer
    total_duration_minutes: int
    stops: int                   # 0 = direct
    is_self_transfer: bool       # True if legs bought as separate tickets
    legs: list[FlightLeg]
    deep_link: str               # affiliate-tagged booking URL
    source: str                  # "travelpayouts", "duffel", etc.
    fetched_at: datetime         # when the data was pulled
```

### `SearchQuery`
Unified user input, accepted by every connector.

```python
from typing import Literal

@dataclass
class SearchQuery:
    origin: str | list[str]              # IATA, or country/region code
    destination: str | list[str] | Literal["anywhere"]
    depart_from: date
    depart_to: date                      # date-range support (single date → from == to)
    return_from: date | None
    return_to: date | None
    trip_type: Literal["oneway", "roundtrip"]
    max_price: Decimal | None
    direct_only: bool = False
    airlines_include: list[str] | None = None
    airlines_exclude: list[str] | None = None
    max_layover_hours: int | None = None
    cabin: Literal["economy", "premium", "business", "first"] = "economy"
    adults: int = 1
    children: int = 0
    infants: int = 0
    currency: str = "EUR"
```

## Travelpayouts Data API — Endpoint Map

Base URL: `https://api.travelpayouts.com`
Auth: `X-Access-Token` header, value from `TRAVELPAYOUTS_TOKEN` env var.

| Endpoint | Purpose | Maps to |
|---|---|---|
| `/v2/prices/latest` | Recent cached prices for origin→dest | Standard search |
| `/v1/prices/calendar` | Price per day across a month | **Date-range / flexible calendar** |
| `/v1/prices/cheap` | Cheapest non-stop tickets | Quick cheapest lookup |
| `/v1/prices/direct` | Direct flights only | `direct_only=True` filter |
| `/v1/city-directions` | Popular destinations from origin | **Anywhere search** |
| `/v2/prices/month-matrix` | Price matrix by month | Monthly overview |
| `/data/en/airports.json` | Airport static data | Location autocomplete |
| `/data/en/cities.json` | City static data | Location autocomplete |
| `/data/en/countries.json` | Country static data | Region expansion |

**Important caveats to document in connector docstrings:**
- Travelpayouts data is **cached**, not live. Results may be 1–24 hours stale. Acceptable for flightlist-style browsing UX; document prominently in user-facing text.
- Rate limit: **200 requests/hour per IP**. Implement a token bucket in the connector.
- Responses are gzip-encoded — handle `Content-Encoding: gzip` explicitly.
- Prices historically returned in RUB by default; always pass `currency` query param.

## Affiliate Link Construction

Aviasales deep link format:
```
https://search.aviasales.com/flights/
  ?origin_iata={origin}
  &destination_iata={dest}
  &depart_date={YYYY-MM-DD}
  &return_date={YYYY-MM-DD}      # optional
  &adults={n}
  &children={n}
  &infants={n}
  &trip_class={0|1|2}            # 0=economy, 1=business, 2=first
  &marker={TRAVELPAYOUTS_MARKER}
  &sub_id={optional_tracking_id}
```

`affiliate_linker.py` must:
- Always inject `marker` from `TRAVELPAYOUTS_MARKER` env var — reject link-building if not set.
- Preserve original search params so Aviasales re-runs the same query on landing.
- Support optional `sub_id` for tracking which page/widget drove the click (e.g. `"calendar_june2026"`, `"anywhere_europe"`).
- Return the URL as a string; never perform HTTP, only construction.

## Phased Roadmap

### Phase 1 — Foundation (start here)
1. `models/flight_offer.py`, `models/location.py`, `models/search_query.py` with full dataclasses and unit tests (validation, serialization round-trips).
2. `connectors/base.py` — abstract interface: `async def search(query: SearchQuery) -> list[FlightOffer]`.
3. `connectors/travelpayouts.py` implementing **only `/v1/prices/calendar`** to start, mapping responses to `FlightOffer`.
4. Unit tests with recorded fixtures (`tests/fixtures/travelpayouts_calendar_*.json`) — **no live API calls in CI**.
5. `core/affiliate_linker.py` + tests.
6. A CLI script `scripts/demo.py` that accepts `origin`, `dest`, `depart_from`, `depart_to` and prints the resulting offers with working affiliate links.

**Definition of done for Phase 1**: run `python scripts/demo.py NAP LON 2026-06-01 2026-06-30` and see a list of `FlightOffer` with valid affiliate URLs.

### Phase 2 — Core features
- Wrap remaining Travelpayouts endpoints.
- `core/date_range.py` — aggregates calendar endpoint into user-facing date-range results.
- `core/anywhere_search.py` — expands "anywhere" and country/region queries via `/v1/city-directions` + static data files.
- `core/filters.py` — post-fetch filtering (budget, airlines, direct, layover, cabin).
- `core/aggregator.py` — even with one connector now, establish the multi-source merge pattern for later.

### Phase 3 — Extensions (only if needed)
- `connectors/duffel.py` for live verification before redirect.
- `core/self_transfer.py` — for A→B routes without direct option, try hub candidates (STN, BGY, CRL, BER, MAD, BCN, WAW, IST, DXB, DOH) and combine two one-way queries with MCT filtering (min 3h international, 2h domestic). Present as "self-transfer, 2 separate tickets" with explicit disclaimer. **Disclaimer is non-negotiable** — user must understand the lack of protection.
- Persistent cache layer (Redis or SQLite) to reduce API calls and serve static inspiration pages.

## Environment Variables

`.env.example` to commit:
```
TRAVELPAYOUTS_TOKEN=your_api_token_here
TRAVELPAYOUTS_MARKER=your_affiliate_marker_here

# Phase 3 (optional):
DUFFEL_API_KEY=
SERPAPI_KEY=
```

Real `.env` must be in `.gitignore` from commit #1.

## Development Conventions

- **Python 3.11+**, type hints everywhere, `from __future__ import annotations` at the top of every module.
- **Async by default**: `httpx.AsyncClient`. Connectors are `async`; the aggregator uses `asyncio.gather` for parallel fetches.
- **Dependencies** (keep minimal):
  - `httpx` — async HTTP
  - `python-dotenv` — env var loading
  - `pydantic` v2 OR plain `dataclasses` (prefer dataclasses for simplicity; switch to pydantic only if runtime validation becomes painful)
  - `structlog` — structured JSON logging
  - `pytest`, `pytest-asyncio`, `respx` — testing
- **Testing**: recorded fixtures, no live calls in CI. One integration test file (`tests/integration/`) may hit real API, skipped by default, run manually with `pytest -m integration`.
- **Logging**: log every outbound API call with URL, status, latency, and response size. No tokens in logs.
- **Errors**: Connector failures degrade gracefully — aggregator continues with remaining sources. Never let one API failure 500 the whole query. Use a `ConnectorError` exception hierarchy.
- **Rate limiting**: token bucket in each connector, limits driven by config.

## Non-Goals (state explicitly to prevent scope creep)

- **Not a full OTA.** No payment processing, no PNR handling, no reservation management, no customer support.
- **Not replicating Kiwi's virtual interlining.** The optional `self_transfer.py` is a naive hub-combiner, not a routing engine. It will be clearly marked as "experimental" in UI.
- **Not scraping.** All data via official APIs. If Travelpayouts coverage is insufficient, add another official API (Duffel, SerpAPI), never scrape.
- **Not real-time-first.** Cached Travelpayouts data is the product. Live lookup happens only at click time via affiliate redirect (which is Aviasales' job, not ours).

## Starting Task for Claude Code

Build **Phase 1 top-to-bottom**: models → base connector → Travelpayouts calendar endpoint → affiliate linker → CLI demo. Write tests alongside each module, not after. Commit after each module is green.

Deliver when `python scripts/demo.py NAP LON 2026-06-01 2026-06-30` prints a list of real `FlightOffer` objects with valid affiliate URLs, using real Travelpayouts credentials from `.env`.


NUOVO CLAUDE DA INTEGRARE

# FlightChat — CLAUDE.md

## Cos'è questo progetto
Un sito di ricerca voli con interfaccia ibrida: form guidato con chip/suggerimenti di input precompilati + chat AI sotto. L'utente costruisce la query usando frasi suggerite cliccabili, oppure scrive liberamente. Il cervello è Claude API (Haiku 4.5) con Kiwi MCP Server connesso per i dati voli live. La monetizzazione avviene tramite link affiliate Kiwi.com sui risultati.

## Stack tecnico
- **Frontend**: Next.js 14+ con App Router, React, Tailwind CSS
- **Backend**: API Routes di Next.js (no server separato)
- **LLM**: Claude API — modello `claude-haiku-4-5-20251001`
- **Dati voli**: Kiwi.com MCP Server ufficiale via alpic.cloud
- **Monetizzazione**: Kiwi.com Affiliate Program (via Webgains o Travelpayouts)
- **Hosting**: compatibile con Vercel (default), Railway, o VPS

## Struttura del progetto

```
/
├── app/
│   ├── page.tsx                  # Homepage con form + chat
│   ├── layout.tsx                # Layout globale
│   └── api/
│       └── chat/
│           └── route.ts          # API Route — bridge Claude API + Kiwi MCP
├── components/
│   ├── ChatWindow.tsx            # Finestra messaggi scrollabile
│   ├── InputBar.tsx              # Input testuale + bottone invio
│   ├── ChipSuggestions.tsx       # Chip cliccabili con frasi suggerite
│   ├── FlightResultCard.tsx      # Card singolo risultato volo
│   └── QuickFilters.tsx          # Filtri rapidi (diretti, budget, date)
├── lib/
│   ├── claude.ts                 # Client Claude API con MCP connector
│   ├── affiliate.ts              # Costruisce deep link affiliate Kiwi
│   └── suggestions.ts            # Lista frasi suggerite per i chip
├── types/
│   └── flight.ts                 # TypeScript types per FlightOffer, Message, etc.
├── .env.local                    # Variabili d'ambiente (NON committare)
├── .env.example                  # Template variabili (committare)
└── CLAUDE.md                     # Questo file
```

## Variabili d'ambiente

`.env.example` da committare:
```
ANTHROPIC_API_KEY=your_key_here
KIWI_AFFILIATE_ID=your_affiliate_id_here
```

`.env.local` reale — mai committare. Aggiungere a `.gitignore` dal primo commit.

Come ottenerle:
- `ANTHROPIC_API_KEY`: console.anthropic.com → API Keys
- `KIWI_AFFILIATE_ID`: programma affiliate Kiwi via Webgains (webgains.com) o Travelpayouts

## UX — Come funziona l'interfaccia

### Schermata principale
L'utente vede:
1. **Header** con logo e tagline tipo "Trova il volo più economico, chiedilo in italiano"
2. **ChipSuggestions** — riga di chip cliccabili con frasi di partenza
3. **InputBar** — campo testo con placeholder "Da dove parti? Dove vuoi andare?"
4. **ChatWindow** — inizialmente vuoto, si popola con la conversazione

### Flusso di utilizzo
1. L'utente clicca un chip (es. "Voli economici da Napoli questo weekend") → la frase appare nell'InputBar
2. L'utente può modificarla o inviarla direttamente
3. Il messaggio va all'API Route `/api/chat`
4. Claude chiama il Kiwi MCP tool `search-flight`
5. I risultati tornano come messaggio nella ChatWindow con FlightResultCard
6. Sotto i risultati appaiono chip contestuali ("Cerca date più economiche", "Solo voli diretti", "Prova Londra Gatwick invece")

### Chip suggeriti iniziali — `lib/suggestions.ts`

```typescript
export const INITIAL_SUGGESTIONS = [
  // Per chi non sa dove andare
  "Voli economici da Napoli questo weekend",
  "Dove posso andare con meno di 50€ da Napoli?",
  "Le mete più economiche da Napoli a giugno",

  // Per chi sa la destinazione
  "Napoli → Londra, date flessibili",
  "Napoli → Barcellona, solo andata",
  "Napoli → Amsterdam, andata e ritorno",

  // Per chi cerca ispirazione
  "Mare economico sotto 80€ da Napoli",
  "Capitali europee dal prezzo più basso",
  "Voli del weekend con partenza venerdì sera",

  // Filtri rapidi
  "Solo voli diretti",
  "Partenza mattina presto",
  "Bagaglio incluso sotto 100€",
];

// Chip contestuali post-risultato
export const FOLLOWUP_SUGGESTIONS = [
  "Cerca date più economiche",
  "Mostrami solo voli diretti",
  "Prova con aeroporti vicini",
  "Quanto costa il ritorno?",
  "Cerca la settimana dopo",
];
```

## API Route — `/api/chat/route.ts`

Cuore del backend. Riceve il messaggio dell'utente, chiama Claude API con Kiwi MCP connesso, restituisce la risposta.

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Sei un assistente di ricerca voli amichevole e conciso che aiuta utenti italiani a trovare voli economici.

Quando l'utente chiede voli:
1. Usa SEMPRE il tool search-flight di Kiwi per cercare voli reali
2. Mostra i risultati in formato tabella markdown con colonne: Rotta | Orari | Durata | Prezzo | Prenota
3. Ogni riga della colonna Prenota deve contenere il link di booking
4. Dopo i risultati suggerisci sempre 2-3 ricerche correlate
5. Se la rotta non ha voli diretti, proponi combinazioni con scalo e specifica che sono self-transfer (due biglietti separati — l'utente deve fare il check-in due volte)

Tono: amichevole, diretto, in italiano. Sii conciso.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "messages è richiesto" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
      mcp_servers: [
        {
          type: "url",
          url: "https://mcp.alpic.cloud/servers/kiwi-com-flight-search/mcp",
          name: "kiwi-flight-search",
        },
      ],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("");

    return Response.json({ message: text });
  } catch (error) {
    console.error("Errore API chat:", error);
    return Response.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
```

**Nota critica**: il campo `mcp_servers` nella Claude API è diverso dalla configurazione di Claude Desktop. Non richiede nessun setup locale — basta passarlo nella chiamata API e funziona out-of-the-box.

## Affiliate link — `lib/affiliate.ts`

```typescript
export function buildKiwiAffiliateLink({
  origin,
  destination,
  departureDate,
  returnDate,
  adults = 1,
}: {
  origin: string;
  destination: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string;
  adults?: number;
}): string {
  const affiliateId = process.env.KIWI_AFFILIATE_ID;

  if (!affiliateId) {
    console.warn("KIWI_AFFILIATE_ID non configurato — link senza tracking");
  }

  const params = new URLSearchParams({
    from: origin,
    to: destination,
    departure: departureDate,
    adults: adults.toString(),
    ...(returnDate && { return: returnDate }),
    ...(affiliateId && { affilid: affiliateId }),
  });

  return `https://www.kiwi.com/deep?${params.toString()}`;
}
```

## TypeScript Types — `types/flight.ts`

```typescript
export interface FlightOffer {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  price: number;
  currency: string;
  airline: string;
  duration: string;
  stops: number;
  isSelfTransfer: boolean;
  bookingLink: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChipSuggestion {
  label: string;
  prompt: string;
  category: "inspiration" | "destination" | "filter" | "followup";
}
```

## Roadmap — Phase 1: MVP

Costruire in questo ordine preciso, uno step alla volta.

### Step 1 — Setup progetto
```bash
npx create-next-app@latest flightchat --typescript --tailwind --app
cd flightchat
npm install @anthropic-ai/sdk
```
Crea `.env.local` con le variabili reali. Aggiungi `.env.local` al `.gitignore`. Verifica che `ANTHROPIC_API_KEY` sia valida.

### Step 2 — API Route `/api/chat`
Implementa la route come descritta sopra. Testa con curl prima di toccare il frontend:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Cerca voli da Napoli a Londra il 10 giugno 2026, solo andata, 1 adulto"}]}'
```
**Step 2 è superato quando la risposta contiene voli reali di Kiwi con prezzi e link.** Non procedere allo Step 3 prima di aver visto questo funzionare.

### Step 3 — ChatWindow + InputBar
Componenti base della chat. La ChatWindow mostra i messaggi in modo scrollabile con auto-scroll all'ultimo messaggio. L'InputBar ha campo testo + bottone invio. Lo stato `messages: ChatMessage[]` vive in `app/page.tsx`. Durante il caricamento mostra uno spinner nell'InputBar e disabilita il bottone.

### Step 4 — ChipSuggestions
Chip cliccabili sopra l'InputBar. Al click il testo appare nel campo input ma NON viene inviato automaticamente — l'utente può modificarlo prima di premere invio. Dopo ogni risposta del bot, sostituisce i chip iniziali con FOLLOWUP_SUGGESTIONS.

### Step 5 — FlightResultCard
Quando la risposta contiene una tabella di voli, renderizzala come card visive. Parse del markdown → componente card con: logo compagnia, orari, durata, prezzo in evidenza, bottone "Prenota" che apre il link in nuova tab. Se `isSelfTransfer` è true, mostra un badge giallo "Self-transfer — 2 biglietti separati".

### Step 6 — QuickFilters
Toggle e filtri rapidi sopra l'InputBar: "Solo diretti", budget slider (€0-500), date rapide (Questo weekend / Prossima settimana / Flessibile). Quando attivati, aggiungono contesto automatico al prompt inviato all'API.

## Roadmap — Phase 2: Miglioramenti post-MVP

- **Anywhere search**: lista hardcodata di ~80 destinazioni raggiungibili da Napoli. Claude fa chiamate parallele per ciascuna e restituisce i prezzi ordinati. Visualizzazione opzionale su mappa con Leaflet.
- **Origini multiple**: non solo Napoli — autocomplete aeroporto con rilevamento IP opzionale.
- **Memoria conversazione**: mantieni le ultime 8 coppie messaggio nel contesto per conversazioni coerenti senza ripetere l'origine ogni volta.
- **SEO pages**: pagine statiche pre-generate "Voli economici da Napoli a Londra" con dati Travelpayouts Data API cached — portano traffico organico che converte via chat.
- **Price alert**: l'utente lascia email + rotta + budget target, un job notturno controlla e manda notifica.

## Roadmap — Phase 3: Hosting

Scegli in base al traffico:

| Opzione | Costo | Pro | Contro |
|---|---|---|---|
| **Vercel** | Gratis (poi ~$20/mese) | Deploy automatico da GitHub, zero config | Timeout funzioni 10s — verificare con Kiwi MCP |
| **Railway** | $5/mese | Nessun timeout artificiale, semplice | Meno automatico di Vercel |
| **Hetzner VPS** | €4/mese | Pieno controllo, scalabile | Serve configurare nginx + PM2 manualmente |

Inizia con Vercel. Se le chiamate Kiwi MCP superano i 10 secondi consistentemente, migra su Railway.

## Stima costi operativi mensili

Con Haiku 4.5 a $1/$5 per milione di token:
- 1 ricerca tipica ≈ 500 token input + 800 token output ≈ $0.005
- 1.000 ricerche/mese ≈ $5 di API
- 10.000 ricerche/mese ≈ $50 di API

Commissione affiliate Kiwi: 3% sul prezzo del biglietto.
Con un conversion rate del 2% su 1.000 ricerche → 20 booking da €80 medi → €48 di commissione.
Break-even stimato: ~500-1.000 ricerche/mese attive.

## Convenzioni di codice

- TypeScript strict mode attivo — no `any` espliciti
- Componenti React con arrow function e named export
- API Routes con try/catch esplicito — mai catch vuoto
- Variabili d'ambiente sempre via `process.env`, mai hardcoded nel codice
- Link affiliate costruiti SEMPRE tramite `lib/affiliate.ts`, mai inline
- Nessun segreto nei log — non loggare `ANTHROPIC_API_KEY` o `KIWI_AFFILIATE_ID`

## Non fare (scope creep da evitare)

- Non implementare pagamento o prenotazione diretta — solo redirect affiliate
- Non costruire un DB nella Phase 1 — lo stato vive in memoria React
- Non mostrare il system prompt all'utente né esporlo via endpoint
- Non committare `.env.local` — verificare `.gitignore` prima del primo push
- Non usare `any` per i tipi delle risposte MCP — wrappa in type guard

## Primo task per Claude Code

Leggi questo file per intero. Poi esegui **solo Step 1 e Step 2** della Phase 1. Quando il test curl restituisce voli reali di Kiwi con prezzi, fermati e mostrami l'output completo prima di procedere con il frontend.