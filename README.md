This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


# TipsinTrip — Motore di Ricerca Voli AI-Powered

Benvenuto nella documentazione del motore di ricerca voli di TipsinTrip. Questo documento fa da "mappa del tesoro" per orientarti tra i file del progetto e metterci le mani in autonomia.

---

## 🏛️ Architettura del Progetto

TipsinTrip è un'app **full-stack basata su Next.js 16** (App Router). All'interno dello stesso progetto convivono frontend (i componenti visivi con il vetro viola) e backend (le API che parlano con i fornitori di dati voli).

Il prodotto è **bifronte**, con due flussi di ricerca indipendenti:

1. **Form classico** (homepage `/`) — l'utente compila origine, destinazione, date e clicca "Partiamo". Il backend interroga **Travelpayouts/Aviasales** e restituisce una lista di voli. Nessuna AI nel mezzo.
2. **Chat AI** (pagina `/chat`) — l'utente scrive liberamente in italiano ("voglio andare a Londra a giugno"). **Claude Haiku 4.5** capisce la richiesta e invoca il tool `search_flights` che il backend proxya verso il **server MCP di Kiwi.com**. Le risposte arrivano come messaggi chat con tabelle di voli cliccabili.

- **Frontend:** codice eseguito nel browser dell'utente. Form, calendari, effetto *liquid glass*, chat UI. Si trova in `/app/` e `/app/components/`.
- **Backend:** API route di Next.js, eseguite sul server. Si trova in `/app/api/`.

---

## 🗂️ Mappa dei File Chiave

### 🔹 Flusso 1 — Form classico (homepage)

#### `app/page.tsx`
Homepage. È solo un wrapper che monta `<HomeSearch />`.

#### `app/components/HomeSearch.tsx`
Cuore dell'UI del form classico. Contiene l'autocomplete delle città/aeroporti, i bottoni tipologia viaggio (Solo Andata / Andata+Ritorno / Date Flessibili), i calendari, i filtri rapidi (solo diretti, prezzo massimo), e la lista dei risultati renderizzati come card.
- **Autocomplete:** componente `<AutocompleteInput>` in cima al file — qui si decide come appaiono i suggerimenti quando l'utente digita.
- **Stati React:** variabili come `isRoundTrip`, `origin`, `directOnly`, `maxPrice` governano cosa mostrare e cosa inviare all'API.

#### `app/components/MiniDatePicker.tsx` e `MiniRangePicker.tsx`
Calendari viola che si aprono in popup. Il colore `rgba(36, 0, 70, 0.85)` dà la tinta "prugna" — modifica lì per cambiare pelle.

#### `app/api/flights/route.ts`
Endpoint backend del form classico. **Non usa AI**: chiama direttamente Travelpayouts (`/v2/prices/latest` per rotte A→B, `/v1/city-directions` per modalità "ovunque"), filtra i risultati (directOnly, maxPrice), costruisce i deep link affiliate Aviasales con il `AVIASALES_MARKER`, e restituisce JSON al frontend. Per roundtrip fa due query one-way in parallelo e le accoppia — la cache di Travelpayouts sui roundtrip è sparsa, questa strategia ci restituisce molti più risultati.

### 🔹 Flusso 2 — Chat AI

#### `app/chat/page.tsx`
Pagina chat. Tiene lo stato `messages[]` (conversazione) e fa POST a `/api/chat` a ogni invio.

#### `app/components/ChatWindow.tsx` e `InputBar.tsx`
Finestra scrollabile con auto-scroll + barra di input con textarea auto-resize ed Enter per inviare (Shift+Enter per newline).

#### `app/api/chat/route.ts`
Cervello AI della chat. Stack:
1. Riceve i messaggi dal frontend
2. Chiama **Claude Haiku 4.5** (`@anthropic-ai/sdk`) dichiarando un tool locale `search_flights`
3. Se Claude richiede il tool, il backend invoca `searchKiwiFlights()` (vedi sotto)
4. Passa il risultato compatto (5 voli puliti) a Claude, che formula la risposta finale in tabella markdown
5. Loop tool-use max 4 iterazioni (per ricerche multiple in una sola conversazione)

Il system prompt istruisce Claude sul formato tabella per solo-andata vs andata+ritorno.

#### `app/lib/kiwi.ts`
Client MCP che parla direttamente con `https://mcp.kiwi.com/` via transport SSE. Esposto come `searchKiwiFlights(args)`: si connette, invoca il tool `search-flight` di Kiwi, estrae **solo i campi che ci servono** (rotta, orari locali, durata, prezzo, scali come codici IATA, deep link) e **tronca a 5 risultati**. Così Claude elabora ~500 token invece di ~30.000.

Entrambi i leg (andata e ritorno) vengono estratti separatamente come oggetti `CleanLeg` — Claude può mostrare due colonne in tabella per i roundtrip.

#### `app/types/chat.ts`
Tipo condiviso `ChatMessage` per la conversazione.

### 🔹 Stile condiviso

#### `app/globals.css`
CSS globale, variabili di tema (viola `--background`, `--primary`), animazioni (`spin`, `dotPulse`, `fadeIn`).

#### `app/page.module.css`
CSS module della homepage. Classi come `.searchClassicBox` controllano box-radius, backdrop-filter (effetto vetro), trasparenza, e l'hover che scurisce lo sfondo.

---

## 🛠 Come funziona la chat AI sotto il cofano (Tool Calling)

Il pattern è **tool-use Anthropic nativo**, non MCP end-to-end:

1. **Dichiarazione del tool** — in `app/api/chat/route.ts` definiamo il JSON schema di `search_flights` (parametri: flyFrom, flyTo, departureDate, returnDate, adulti, ecc.).
2. **Comprensione** — Claude legge il messaggio dell'utente. Se decide di cercare voli, risponde con un blocco `tool_use` contenente gli argomenti.
3. **Esecuzione backend** — il nostro loop in `route.ts` intercetta la `tool_use`, chiama `searchKiwiFlights(args)` (in `app/lib/kiwi.ts`). Quella funzione apre una connessione MCP verso `mcp.kiwi.com`, invoca il tool `search-flight`, filtra il JSON grezzo a 5 risultati compatti.
4. **Risposta finale** — il JSON compatto torna a Claude come `tool_result`. Claude lo impagina in tabella markdown e aggiunge suggerimenti di ricerca.

**Perché non usiamo il connector `mcp_servers` di Anthropic?** Perché il payload grezzo di Kiwi è molto pesante (15 voli × 12 campi nested = ~30k token). Facendo noi da proxy e tagliando a 5 risultati con soli i campi essenziali, il consumo token scende di oltre 60x.

---

## 🔑 Variabili d'ambiente

File `.env.local` (non committato):

```
ANTHROPIC_API_KEY=sk-ant-...      # per la chat AI — console.anthropic.com
AVIASALES_API_TOKEN=...            # per Travelpayouts — travelpayouts.com
AVIASALES_MARKER=...               # ID affiliate per i deep link
KIWI_AFFILIATE_ID=...              # per link affiliate Kiwi (futuro)
```

`.env.example` contiene solo placeholder ed è committato come riferimento.

---

💡 **Consiglio finale:** se rompi qualcosa, usa git per tornare indietro. Tutto il codice ha commenti in italiano dove serve. Buono sviluppo! 🚀
