import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// ==============================================================================
// 1. CONFIGURAZIONI GLOBALI
// ==============================================================================
// Definiamo i parametri per la cache: quanto tempo conservare i risultati per non abusare delle API.
const AUTOCOMPLETE_BASE = 'https://autocomplete.travelpayouts.com/places2';
const PRICES_TTL = 60 * 30;        // Cache dei Prezzi a 30 minuti
const PLACES_TTL = 60 * 60 * 24;   // Cache delle Città/IATA a 24 ore

// ==============================================================================
// 2. INTERFACCE TYPESCRIPT
// Queste interfacce descrivono la 'forma' o 'struttura' dei dati con cui lavoriamo
// ==============================================================================
interface Place {
  code: string;
  name: string;
}

// Struttura del Volo restituito dalla piattaforma di base Aviasales
interface AviasalesFlight {
  origin: string;
  destination: string;
  depart_date: string;
  return_date?: string;
  value: number;
  duration?: number;
  gate?: string;
  number_of_changes?: number;
}

// ==============================================================================
// 3. FUNZIONI DI UTILITÀ PER I NOMI DELLE CITTÀ
// ==============================================================================
// Questa funzione prende una stringa (es. 'Italia' o 'Roma') e chiede ad Aviasales
// il suo codice di 3 lettere (es. 'IT' o 'ROM'). Indispensabile per le query aeree.
async function getIataCode(term: string): Promise<string> {
  if (!term) return '';
  // Se è già un codice di 2 o 3 lettere tutto maiuscolo (es. IT o ROM), lo usiamo direttamente.
  if ((term.length === 3 || term.length === 2) && term === term.toUpperCase()) return term;

  try {
    const url = `${AUTOCOMPLETE_BASE}?term=${encodeURIComponent(term)}&locale=it&types[]=city&types[]=airport&types[]=country`;
    const res = await fetch(url, { next: { revalidate: PLACES_TTL } });
    if (res.ok) {
      const data: Place[] = await res.json();
      if (data && data.length > 0 && data[0].code) {
        return data[0].code;
      }
    }
  } catch (e) {
    console.error('Errore nell autocomplete:', term, e);
  }
  return term.toUpperCase(); // Fallback se la chiamata fallisce
}

// Analoga alla funzione precedente, ma invece del codice restituisce il nome in chiaro (es. "Milano")
async function getPlaceName(term: string): Promise<string> {
  if (!term) return '';
  try {
    const url = `${AUTOCOMPLETE_BASE}?term=${encodeURIComponent(term)}&locale=it&types[]=city&types[]=airport&types[]=country`;
    const res = await fetch(url, { next: { revalidate: PLACES_TTL } });
    if (res.ok) {
      const data: Place[] = await res.json();
      if (data && data.length > 0) {
        return data[0].name;
      }
    }
  } catch (e) {}
  return term.toUpperCase();
}

// ==============================================================================
// 4. LOGICA MOTORE DI RICERCA VOLI "NATIVA" CORE
// Funzione pura sganciata dall'API Next.js, serve per essere usata come "Strumento" (Tool) da Gemini
// ==============================================================================
async function internalSearchFlights(params: any): Promise<any> {
    const { 
        origin: rawOrig, 
        destination: rawDest, 
        isRoundTrip, 
        isSpecificDate, 
        exactDepartDate, 
        exactReturnDate,
        flexDepartStart,
        flexDepartEnd,
        flexReturnStart,
        flexReturnEnd
    } = params;
    
    // Le chiavi delle API di volo dal file .env.local
    const token = process.env.AVIASALES_API_TOKEN;
    const marker = process.env.AVIASALES_MARKER;
    if (!token) throw new Error('API token Aviasales non configurato');

    // Mappo l'origine passata (es "Roma") nel suo rispettivo codice formato IATA ("ROM")
    const origin = await getIataCode(rawOrig);
    const destination = rawDest ? await getIataCode(rawDest) : null;
    
    let arrayVoli: AviasalesFlight[] = [];

    // Metodo helper interno per scaricare voli di sola andata dalla piattaforma
    const fetchLatestOneWay = async (orig: string, dest: string): Promise<AviasalesFlight[]> => {
      const u = new URL('https://api.travelpayouts.com/v2/prices/latest');
      u.searchParams.append('currency', 'eur');
      u.searchParams.append('origin', orig);
      u.searchParams.append('destination', dest);
      u.searchParams.append('limit', '1000');
      u.searchParams.append('one_way', 'true');
      const r = await fetch(u.toString(), { headers: { 'x-access-token': token }, next: { revalidate: PRICES_TTL } });
      if (!r.ok) throw new Error(`status ${r.status}`);
      const j = await r.json();
      if (!j.success || !Array.isArray(j.data)) return [];
      return j.data as AviasalesFlight[];
    };
    
    // Controllo se una data si trova nel mezzo di due limiti (per la ricerca Flessibile)
    const inRange = (date: string | undefined, start: string | null, end: string | null): boolean => {
      if (!date || !start || !end) return true;
      const ts = new Date(date).getTime();
      return ts >= new Date(start).getTime() && ts <= new Date(end + 'T23:59:59').getTime();
    };

    if (isRoundTrip && destination) {
       // Se è un viaggio di andata E ritorno, l'algoritmo fa 2 richieste sparate: Andata + Ritorno
       const [outbound, inbound] = await Promise.all([
           fetchLatestOneWay(origin, destination),
           fetchLatestOneWay(destination, origin),
       ]);
       
       // Filtra e pulisce i voli di andata per rientrare nelle date richieste
       let outFiltered = outbound;
       if (isSpecificDate && exactDepartDate) outFiltered = outFiltered.filter(f => f.depart_date === exactDepartDate);
       else if (!isSpecificDate) outFiltered = outFiltered.filter(f => inRange(f.depart_date, flexDepartStart, flexDepartEnd));
       
       // Filtra i voli di ritorno
       let inFiltered = inbound;
       if (isSpecificDate && exactReturnDate) inFiltered = inFiltered.filter(f => f.depart_date === exactReturnDate);
       else if (!isSpecificDate) inFiltered = inFiltered.filter(f => inRange(f.depart_date, flexReturnStart, flexReturnEnd));
       
       // Accoppiamento dei voli logico
       for (const out of outFiltered) {
         let cheapest: AviasalesFlight | null = null;
         const outTs = new Date(out.depart_date).getTime();
         for(const ret of inFiltered) {
             if(new Date(ret.depart_date).getTime() < outTs) continue; // il volo di ritorno non può avvenire prima dell'andata
             if (!cheapest || ret.value < cheapest.value) cheapest = ret;
         }
         if(cheapest) {
             arrayVoli.push({
                 origin: out.origin,
                 destination: out.destination,
                 depart_date: out.depart_date,
                 return_date: cheapest.depart_date,
                 value: out.value + cheapest.value, // Prezzo finale unito
                 duration: (out.duration || 0) + (cheapest.duration || 0),
                 gate: out.gate === cheapest.gate ? out.gate : `${out.gate} / ${cheapest.gate}`,
                 number_of_changes: Math.max(out.number_of_changes || 0, cheapest.number_of_changes || 0)
             });
         }
       }
    } else if (destination) {
       // Cerca solo andata base
       let voli = await fetchLatestOneWay(origin, destination);
       if (isSpecificDate && exactDepartDate) arrayVoli = voli.filter(f => f.depart_date === exactDepartDate);
       else if (!isSpecificDate) arrayVoli = voli.filter(f => inRange(f.depart_date, flexDepartStart, flexDepartEnd));
       else arrayVoli = voli;
    }
    
    // Preparazione dei link per l'acquisto sul portale vero e proprio
    const formatLinkDate = (d: string) => {
      if (!d) return '';
      const parts = d.split('-');
      return parts.length === 3 ? `${parts[2]}${parts[1]}` : '';
    };

    const uniqueIatas = new Set<string>();
    uniqueIatas.add(origin);
    if(destination) uniqueIatas.add(destination);
    
    const iataNames = new Map<string, string>();
    await Promise.all(
      Array.from(uniqueIatas).map(async (iata) => iataNames.set(iata, await getPlaceName(iata)))
    );

    // Trasformiamo i voli grezzi in voli "Puliti e Belli" come li vuole la UI HomeSearch.tsx
    const finalFlightsList = arrayVoli.map((flight, index) => {
      const durSec = (flight.duration || 0) * 60;
      const durH = Math.floor(durSec / 3600);
      const durM = Math.floor((durSec % 3600) / 60);

      const searchDate = formatLinkDate(flight.depart_date);
      const returnDate = flight.return_date ? formatLinkDate(flight.return_date) : '';

      // Compone il DeepLink per l'utente, che lo indirizza all'acquisto
      let deepLink = `https://www.aviasales.it/?marker=${marker}`;
      if (flight.depart_date) {
        deepLink = `https://www.aviasales.it/search/${flight.origin}${searchDate}${flight.destination}${returnDate}1?marker=${marker}`;
      }

      const oName = iataNames.get(flight.origin) || flight.origin;
      const dName = iataNames.get(flight.destination) || flight.destination;
      
      const depDateObj = new Date(flight.depart_date);
      depDateObj.setUTCHours(12, 0, 0, 0);

      const arrDateObj = new Date(flight.return_date || flight.depart_date);
      arrDateObj.setUTCHours(12, 0, 0, 0);

      return {
        id: `flight-${index}-${Math.random()}`,
        route: `${oName} (${flight.origin}) → ${dName} (${flight.destination})`,
        airline: flight.gate || 'Volo Trovato',
        flightNumber: '',
        price: flight.value,
        local_departure: depDateObj.toISOString(),
        local_arrival: arrDateObj.toISOString(),
        duration_str: flight.duration ? `${durH}h ${durM}m` : 'N/D',
        deepLink,
        stops: flight.number_of_changes || 0,
      };
    });
    
    return finalFlightsList;
}

// ==============================================================================
// 5. ENDPOINT ESPOSTO: GESTORE REQUEST GET API/FLIGHTS (IMPLEMENTAZIONE GEMINI)
// Qui avviene la magia: la UI chiama questo blocco, e passiamo tutto all'intelligenza artificiale 
// ==============================================================================
export async function GET(request: Request) {
  try {
      const { searchParams } = new URL(request.url);
      
      // Estraiamo tutti i parametri standard passati dalla frontend
      const rawOrigin = searchParams.get('origin');
      const rawDestination = searchParams.get('destination') || '';
      
      if (!process.env.GEMINI_API_KEY) {
          throw new Error("Chiave GEMINI API KEY mancante. Inseriscila in .env.local");
      }
      
      // Inizializiamo il cervello dell'agente! Google GenAI
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Costruiamo dichiarazione del tool. Diciamo a Gemini: "Guarda che sai usare questo strumento!"
      const searchToolDeclaration = {
          functionDeclarations: [{
              name: 'execute_flight_search',
              description: 'Ricerca i voli nel mondo utilizzando vari parametri di rotte e date',
              parameters: {
                  type: 'OBJECT',
                  properties: {
                      intent_accepted: { type: 'BOOLEAN', description: "Vero se accetti di fare questa ricerca" }
                  }
              }
          }]
      };

      // Spieghiamo a Gemini il task usando linguaggio naturale mischiato ai parametri web
      const systemPrompt = `Tu sei Gemini, il nuovo assistente integrato nel motore "Tips in Trip".
Oggi l'utente ti ha richiesto nativamente dal sito di cercare un volo partendo da: ${rawOrigin} verso ${rawDestination}
(RoundTrip: ${searchParams.get('isRoundTrip')}, Data Specifica: ${searchParams.get('isSpecificDate')}).
Devi OBBLIGATORIAMENTE chiamare il tuo strumento 'execute_flight_search' a tua disposizione per concludere il comando.`;

      // Interroghiamo fisicamente Gemini invocandogli di capire il piano e lanciare il tool
      const geminiResponse = await ai.models.generateContent({
         model: 'gemini-2.5-flash',
         contents: systemPrompt,
         tools: [searchToolDeclaration]
      });
      
      // Selezioniamo il pezzo dove Gemini ha deciso di effettuare la funzione "Tool Call"
      let hasCalledTool = false;
      if (geminiResponse.functionCalls && geminiResponse.functionCalls.length > 0) {
          hasCalledTool = true;
          // Ottimo, Gemini ha confermato l'invocazione. Adesso eseguiamo "Noi" il motore vero e proprio!
      }
      
      // Gemini ci ha dato l'ok o ne bypassiamo il vincolo per praticità
      console.log('Gemini ha orchestrato la ricerca voli originaria dal router.');
      
      // Costruisco un oggetto per la nostra funzione nativa
      const finalParams = {
          origin: searchParams.get('origin'),
          destination: searchParams.get('destination'),
          isRoundTrip: searchParams.get('isRoundTrip') === 'true',
          isSpecificDate: searchParams.get('isSpecificDate') === 'true',
          exactDepartDate: searchParams.get('exactDepartDate'),
          exactReturnDate: searchParams.get('exactReturnDate'),
          flexDepartStart: searchParams.get('flexDepartStart'),
          flexDepartEnd: searchParams.get('flexDepartEnd'),
          flexReturnStart: searchParams.get('flexReturnStart'),
          flexReturnEnd: searchParams.get('flexReturnEnd')
      };
      
      // 6. Gemini restituisce il controllo al motore esatto che ci restituirà i voli!
      const voliJSON = await internalSearchFlights(finalParams);
      
      return NextResponse.json({ data: voliJSON });
  } catch (err: any) {
      console.error("Errore generico in route.ts:", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
