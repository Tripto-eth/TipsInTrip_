import { NextResponse } from 'next/server';
import { searchKiwiFlights, type CleanFlight } from '../../lib/kiwi';

// ==============================================================================
// CONFIG
// ==============================================================================
const AUTOCOMPLETE_BASE = 'https://autocomplete.travelpayouts.com/places2';
const PRICES_TTL = 60 * 30;        // 30 min
const PLACES_TTL = 60 * 60 * 24;   // 24h

// ==============================================================================
// TIPI (output UI)
// ==============================================================================
interface UIFlight {
  id: string;
  route: string;
  airline: string;
  price: number;
  depart_date: string;
  return_date: string | null;
  isRoundTrip: boolean;
  duration_out_str: string;
  duration_back_str: string;
  stops_out: number;
  stops_back: number;
  deepLink: string;
}

interface Place {
  code: string;
  name: string;
  type?: string;
}

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

type AnywhereScope = 'all' | 'italy' | 'foreign';

interface SearchParams {
  origin: string;
  destination: string;
  isRoundTrip: boolean;
  isSpecificDate: boolean;
  exactDepartDate: string | null;
  exactReturnDate: string | null;
  flexDepartStart: string | null;
  flexDepartEnd: string | null;
  flexReturnStart: string | null;
  flexReturnEnd: string | null;
  directOnly: boolean;
  anywhereScope: AnywhereScope;
}

// ==============================================================================
// UTILITIES
// ==============================================================================
async function lookupPlace(term: string): Promise<Place | null> {
  if (!term) return null;
  try {
    const url = `${AUTOCOMPLETE_BASE}?term=${encodeURIComponent(term)}&locale=it&types[]=city&types[]=airport&types[]=country`;
    const res = await fetch(url, { next: { revalidate: PLACES_TTL } });
    if (res.ok) {
      const data: Place[] = await res.json();
      if (data && data.length > 0) return data[0];
    }
  } catch {}
  return null;
}

async function getIataCode(term: string): Promise<string> {
  if (!term) return '';
  if ((term.length === 3 || term.length === 2) && term === term.toUpperCase()) return term;
  const place = await lookupPlace(term);
  return place?.code || term.toUpperCase();
}

async function getPlaceName(term: string): Promise<string> {
  if (!term) return '';
  const place = await lookupPlace(term);
  return place?.name || term.toUpperCase();
}

function isoToDdmmyyyy(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function daysBetween(startIso: string, endIso: string): number {
  const s = Date.parse(startIso + 'T00:00:00Z');
  const e = Date.parse(endIso + 'T00:00:00Z');
  if (!s || !e) return 0;
  return Math.round((e - s) / 86400000);
}

function middleDate(startIso: string, endIso: string): string {
  const s = Date.parse(startIso + 'T00:00:00Z');
  const e = Date.parse(endIso + 'T00:00:00Z');
  return new Date((s + e) / 2).toISOString().split('T')[0];
}

function minutesToStr(mins: number): string {
  if (!mins || mins <= 0) return 'N/D';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

// Country-level searches (es. "IT", "US") vanno dirette su Aviasales:
// Kiwi MCP gestisce invece bene sia città/aeroporti che 'anywhere'.
function isBroadSearch(params: SearchParams): boolean {
  const { origin, destination } = params;
  if (origin.length === 2) return true;
  // "anywhere" va bene per Kiwi, non è broad
  if (destination && destination.length === 2 && destination.toLowerCase() !== 'anywhere') return true;
  return false;
}

// ==============================================================================
// KIWI SEARCH — motore primario per rotte airport-to-airport
// ==============================================================================

// Destinazioni popolari usate per espandere "anywhere" in chiamate Kiwi specifiche.
// Kiwi MCP non gestisce bene il valore letterale "anywhere", quindi facciamo fan-out.

// 🇮🇹 Aeroporti italiani — usati quando l'utente sceglie "Ovunque in Italia"
const ITALIAN_AIRPORTS = [
  'FCO', // Roma Fiumicino
  'CIA', // Roma Ciampino
  'MXP', // Milano Malpensa
  'LIN', // Milano Linate
  'BGY', // Milano Bergamo (Orio al Serio)
  'VCE', // Venezia Marco Polo
  'TSF', // Venezia Treviso
  'NAP', // Napoli Capodichino
  'CTA', // Catania Fontanarossa
  'PMO', // Palermo Punta Raisi
  'TPS', // Trapani Birgi
  'CIY', // Comiso
  'LMP', // Lampedusa
  'PNL', // Pantelleria
  'BLQ', // Bologna
  'BRI', // Bari
  'BDS', // Brindisi
  'PSA', // Pisa
  'FLR', // Firenze
  'CAG', // Cagliari
  'OLB', // Olbia
  'AHO', // Alghero
  'TRN', // Torino
  'CUF', // Cuneo
  'VRN', // Verona
  'GOA', // Genova
  'SUF', // Lamezia Terme
  'REG', // Reggio Calabria
  'CRV', // Crotone
  'PSR', // Pescara
  'AOI', // Ancona
  'PEG', // Perugia
  'RMI', // Rimini
  'TRS', // Trieste
  'BZO', // Bolzano
];

// 🌍 Aeroporti esteri — usati quando l'utente sceglie "Ovunque all'estero"
const FOREIGN_AIRPORTS = [
  // ==========================================
  // 🇪🇺 TUTTE LE CAPITALI EUROPEE
  // ==========================================
  'LHR', 'LGW', 'STN', 'LTN', // Londra (UK)
  'CDG', 'ORY', 'BVA', // Parigi (Francia)
  'BER', // Berlino (Germania)
  'MAD', // Madrid (Spagna)
  'AMS', // Amsterdam (Paesi Bassi)
  'VIE', // Vienna (Austria)
  'PRG', // Praga (Repubblica Ceca)
  'BUD', // Budapest (Ungheria)
  'ATH', // Atene (Grecia)
  'LIS', // Lisbona (Portogallo)
  'DUB', // Dublino (Irlanda)
  'BRU', 'CRL', // Bruxelles / Charleroi (Belgio)
  'CPH', // Copenhagen (Danimarca)
  'ARN', 'NYO', // Stoccolma (Svezia)
  'OSL', // Oslo (Norvegia)
  'HEL', // Helsinki (Finlandia)
  'WAW', 'WMI', // Varsavia (Polonia)
  'OTP', // Bucarest (Romania)
  'SOF', // Sofia (Bulgaria)
  'BEG', // Belgrado (Serbia)
  'ZAG', // Zagabria (Croazia)
  'LJU', // Lubiana (Slovenia)
  'BTS', // Bratislava (Slovacchia)
  'TIA', // Tirana (Albania)
  'SJJ', // Sarajevo (Bosnia)
  'SKP', // Skopje (Macedonia del Nord)
  'TGD', // Podgorica (Montenegro)
  'KIV', // Chisinau (Moldavia)
  'RIX', // Riga (Lettonia)
  'VNO', // Vilnius (Lituania)
  'TLL', // Tallinn (Estonia)
  'KEF', // Reykjavik (Islanda)
  'LUX', // Lussemburgo
  'MLA', // Malta
  'LCA', 'PFO', // Cipro (Larnaca/Paphos - Nicosia non ha aeroporto)

  // ==========================================
  // ✈️ DIRETTI DA CATANIA (RYANAIR & WIZZ AIR)
  // Non già inclusi in Italia o Capitali
  // ==========================================
  
  // SPAGNA
  'BCN', // Barcellona
  'SVQ', // Siviglia
  'AGP', // Malaga
  'VLC', // Valencia
  'PMI', // Palma di Maiorca
  'IBZ', // Ibiza
  
  // GERMANIA
  'MUC', // Monaco di Baviera
  'FRA', // Francoforte
  'HHN', // Francoforte Hahn
  'CGN', // Colonia
  'DUS', // Dusseldorf
  'NRN', // Dusseldorf Weeze
  'HAM', // Amburgo
  'FMM', // Memmingen
  'NUE', // Norimberga
  'DTM', // Dortmund
  'STR', // Stoccarda
  
  // FRANCIA
  'MRS', // Marsiglia
  'LDE', // Lourdes
  'TLS', // Tolosa
  'BOD', // Bordeaux
  
  // EUROPA DELL'EST
  'KRK', // Cracovia (Polonia)
  'KTW', // Katowice (Polonia)
  'WRO', // Breslavia (Polonia)
  'CLJ', // Cluj-Napoca (Romania)
  'IAS', // Iasi (Romania)
  'TSR', // Timisoara (Romania)
  
  // BENELUX E SVIZZERA
  'EIN', // Eindhoven (Paesi Bassi)
  'BSL', // Basilea (Svizzera)
  'ZRH', // Zurigo (Svizzera)
  'GVA', // Ginevra (Svizzera)
  
  // EXTRA-UE (Diretti Low Cost da Catania)
  'TLV', // Tel Aviv (Israele)
  'SSH', // Sharm el-Sheikh (Egitto)
  'CAI'  // Il Cairo (Egitto)
];

// Estrae da un SearchParams la data centrale + flex range (per Kiwi)
function computeKiwiDates(params: SearchParams): { depDate: string; depFlex: number; retDate?: string; retFlex: number } {
  let depDate: string;
  let depFlex = 0;
  if (params.isSpecificDate && params.exactDepartDate) {
    depDate = params.exactDepartDate;
  } else if (params.flexDepartStart && params.flexDepartEnd) {
    depDate = middleDate(params.flexDepartStart, params.flexDepartEnd);
    const span = daysBetween(params.flexDepartStart, params.flexDepartEnd);
    depFlex = Math.min(3, Math.max(0, Math.floor(span / 2)));
  } else if (params.flexDepartStart) {
    depDate = params.flexDepartStart;
  } else {
    throw new Error('Data di partenza non specificata');
  }

  let retDate: string | undefined;
  let retFlex = 0;
  if (params.isRoundTrip) {
    if (params.isSpecificDate && params.exactReturnDate) {
      retDate = params.exactReturnDate;
    } else if (params.flexReturnStart && params.flexReturnEnd) {
      retDate = middleDate(params.flexReturnStart, params.flexReturnEnd);
      const span = daysBetween(params.flexReturnStart, params.flexReturnEnd);
      retFlex = Math.min(3, Math.max(0, Math.floor(span / 2)));
    } else if (params.flexReturnStart) {
      retDate = params.flexReturnStart;
    }
  }

  return { depDate, depFlex, retDate, retFlex };
}

// Seleziona la lista di IATA di destinazione in base allo scope scelto.
function getAnywhereTargets(scope: AnywhereScope): string[] {
  if (scope === 'italy') return ITALIAN_AIRPORTS;
  if (scope === 'foreign') return FOREIGN_AIRPORTS;
  return [...ITALIAN_AIRPORTS, ...FOREIGN_AIRPORTS];
}

// Fan-out su destinazioni popolari quando l'utente chiede "Ovunque".
// Kiwi MCP non supporta realmente "anywhere" → facciamo N chiamate parallele
// e uniamo i risultati ordinati per prezzo.
async function kiwiSearchAnywhere(origin: string, params: SearchParams): Promise<UIFlight[]> {
  const { depDate, depFlex, retDate, retFlex } = computeKiwiDates(params);

  const targets = getAnywhereTargets(params.anywhereScope);

  const calls = targets
    .filter((iata: string) => iata !== origin) // salta l'origine
    .map((dest: string) =>
      searchKiwiFlights({
        flyFrom: origin,
        flyTo: dest,
        departureDate: isoToDdmmyyyy(depDate),
        departureDateFlexRange: depFlex || undefined,
        returnDate: retDate ? isoToDdmmyyyy(retDate) : undefined,
        returnDateFlexRange: retFlex || undefined,
        maxResults: 5,
        passengers: { adults: 1 },
        directFlightsOnly: params.directOnly || undefined,
      }).catch(() => [] as CleanFlight[]),
    );

  const chunks = await Promise.all(calls);
  const allFlights = chunks.flat();
  return allFlights.map((f, i) => cleanFlightToUI(f, i));
}

// Converte una CleanFlight Kiwi in una UIFlight
function cleanFlightToUI(f: CleanFlight, idx: number): UIFlight {
  const outDate = f.outbound.departLocal.split('T')[0];
  const retDateStr = f.return ? f.return.departLocal.split('T')[0] : null;
  const cityFrom = f.outbound.cityFrom || f.outbound.from;
  const cityTo = f.outbound.cityTo || f.outbound.to;
  return {
    id: `kiwi-${idx}-${f.outbound.from}${f.outbound.to}-${Date.now()}-${Math.random()}`,
    route: `${cityFrom} (${f.outbound.from}) → ${cityTo} (${f.outbound.to})`,
    airline: f.outbound.layovers.length === 0 ? 'Volo diretto' : 'Volo con scalo',
    price: Math.round(f.price),
    depart_date: outDate,
    return_date: retDateStr,
    isRoundTrip: Boolean(f.return),
    duration_out_str: minutesToStr(f.outbound.durationMinutes),
    duration_back_str: f.return ? minutesToStr(f.return.durationMinutes) : '',
    stops_out: f.outbound.layovers.length,
    stops_back: f.return ? f.return.layovers.length : 0,
    deepLink: f.deepLink,
  };
}

async function kiwiSearch(params: SearchParams): Promise<UIFlight[]> {
  const origin = await getIataCode(params.origin);
  const isAnywhere = !params.destination || params.destination.toLowerCase() === 'anywhere';

  // Se "anywhere" → fan-out su destinazioni popolari
  if (isAnywhere) {
    return kiwiSearchAnywhere(origin, params);
  }

  const destination = await getIataCode(params.destination);
  const { depDate, depFlex, retDate, retFlex } = computeKiwiDates(params);

  const flights: CleanFlight[] = await searchKiwiFlights({
    flyFrom: origin,
    flyTo: destination,
    departureDate: isoToDdmmyyyy(depDate),
    departureDateFlexRange: depFlex || undefined,
    returnDate: retDate ? isoToDdmmyyyy(retDate) : undefined,
    returnDateFlexRange: retFlex || undefined,
    maxResults: 200,
    passengers: { adults: 1 },
    directFlightsOnly: params.directOnly || undefined,
  });

  return flights.map((f, i) => cleanFlightToUI(f, i));
}

// ==============================================================================
// AVIASALES SEARCH — fallback + motore per ricerche broad ("ovunque", country)
// ==============================================================================
async function aviasalesSearch(params: SearchParams): Promise<UIFlight[]> {
  const token = process.env.AVIASALES_API_TOKEN;
  const marker = process.env.AVIASALES_MARKER;
  if (!token) throw new Error('API token Aviasales non configurato');

  const origin = await getIataCode(params.origin);
  const destRaw = params.destination;
  const destination = destRaw && destRaw.toLowerCase() !== 'anywhere' ? await getIataCode(destRaw) : null;

  let arrayVoli: AviasalesFlight[] = [];

  const fetchLatest = async (
    orig: string,
    dest: string | null,
    oneWay: boolean,
  ): Promise<AviasalesFlight[]> => {
    const u = new URL('https://api.travelpayouts.com/v2/prices/latest');
    u.searchParams.append('currency', 'eur');
    u.searchParams.append('origin', orig);
    if (dest) u.searchParams.append('destination', dest);
    u.searchParams.append('limit', '1000');
    u.searchParams.append('one_way', oneWay ? 'true' : 'false');
    const r = await fetch(u.toString(), {
      headers: { 'x-access-token': token },
      next: { revalidate: PRICES_TTL },
    });
    if (!r.ok) throw new Error(`Aviasales status ${r.status}`);
    const j = await r.json();
    if (!j.success || !Array.isArray(j.data)) return [];
    return j.data as AviasalesFlight[];
  };

  const inRange = (date: string | undefined, start: string | null, end: string | null): boolean => {
    if (!date || !start || !end) return true;
    const ts = new Date(date).getTime();
    return ts >= new Date(start).getTime() && ts <= new Date(end + 'T23:59:59').getTime();
  };

  // city-directions usa campi diversi da /v2/prices/latest.
  // Normalizziamo nella stessa shape AviasalesFlight.
  interface CityDirectionRaw {
    origin?: string;
    destination?: string;
    price?: number;
    value?: number;
    transfers?: number;
    number_of_changes?: number;
    departure_at?: string;
    return_at?: string;
    depart_date?: string;
    return_date?: string;
    airline?: string;
    gate?: string;
    duration?: number;
  }
  const normalizeCityDirection = (raw: CityDirectionRaw): AviasalesFlight => ({
    origin: raw.origin || '',
    destination: raw.destination || '',
    depart_date: raw.depart_date || (raw.departure_at ? raw.departure_at.split('T')[0] : ''),
    return_date: raw.return_date || (raw.return_at ? raw.return_at.split('T')[0] : undefined),
    value: raw.value ?? raw.price ?? 0,
    duration: raw.duration,
    gate: raw.gate || raw.airline || '',
    number_of_changes: raw.number_of_changes ?? raw.transfers ?? 0,
  });

  const fetchCityDirections = async (): Promise<AviasalesFlight[]> => {
    const u = new URL('https://api.travelpayouts.com/v1/city-directions');
    u.searchParams.append('origin', origin);
    u.searchParams.append('currency', 'eur');
    const r = await fetch(u.toString(), {
      headers: { 'x-access-token': token },
      next: { revalidate: PRICES_TTL },
    });
    if (!r.ok) return [];
    const j = await r.json();
    if (!j.success || !j.data || typeof j.data !== 'object') return [];
    return Object.values(j.data as Record<string, CityDirectionRaw>).map(normalizeCityDirection);
  };

  if (params.isRoundTrip && destination) {
    // Destinazione specifica + A/R: 2 chiamate one-way e accoppiamento per prezzo minimo
    const [outbound, inbound] = await Promise.all([
      fetchLatest(origin, destination, true),
      fetchLatest(destination, origin, true),
    ]);

    let outFiltered = outbound;
    if (params.isSpecificDate && params.exactDepartDate) {
      outFiltered = outFiltered.filter((f) => f.depart_date === params.exactDepartDate);
    } else if (!params.isSpecificDate) {
      outFiltered = outFiltered.filter((f) => inRange(f.depart_date, params.flexDepartStart, params.flexDepartEnd));
    }

    let inFiltered = inbound;
    if (params.isSpecificDate && params.exactReturnDate) {
      inFiltered = inFiltered.filter((f) => f.depart_date === params.exactReturnDate);
    } else if (!params.isSpecificDate) {
      inFiltered = inFiltered.filter((f) => inRange(f.depart_date, params.flexReturnStart, params.flexReturnEnd));
    }

    for (const out of outFiltered) {
      let cheapest: AviasalesFlight | null = null;
      const outTs = new Date(out.depart_date).getTime();
      for (const ret of inFiltered) {
        if (new Date(ret.depart_date).getTime() < outTs) continue;
        if (!cheapest || ret.value < cheapest.value) cheapest = ret;
      }
      if (cheapest) {
        arrayVoli.push({
          origin: out.origin,
          destination: out.destination,
          depart_date: out.depart_date,
          return_date: cheapest.depart_date,
          value: out.value + cheapest.value,
          duration: (out.duration || 0) + (cheapest.duration || 0),
          gate: out.gate === cheapest.gate ? out.gate : `${out.gate} / ${cheapest.gate}`,
          number_of_changes: Math.max(out.number_of_changes || 0, cheapest.number_of_changes || 0),
        });
      }
    }
  } else if (params.isRoundTrip && !destination) {
    // Anywhere + A/R: strategia multi-endpoint per massima copertura
    // 1) /v2/prices/latest one_way=false → roundtrip puri (spesso scarsi)
    // 2) /v2/prices/latest one_way=true → destinazioni one-way
    // 3) /v1/city-directions → destinazioni popolari dall'origine (ispirazione, molto ampio)
    const [rtResults, owResults, cityDirs] = await Promise.all([
      fetchLatest(origin, null, false).catch(() => [] as AviasalesFlight[]),
      fetchLatest(origin, null, true).catch(() => [] as AviasalesFlight[]),
      fetchCityDirections().catch(() => [] as AviasalesFlight[]),
    ]);

    const rtOnly = rtResults.filter((f) => f.return_date);
    // Preferisce roundtrip "veri"; se pochi o assenti, integra con one-way + city-directions
    let candidates: AviasalesFlight[] = rtOnly.length >= 5
      ? rtOnly
      : [...rtOnly, ...owResults, ...cityDirs];

    // Dedupe per combo origin/destination/depart_date (evita doppioni tra rt e ow)
    const seen = new Set<string>();
    candidates = candidates.filter((f) => {
      const key = `${f.origin}|${f.destination}|${f.depart_date}|${f.return_date ?? ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Filtro partenza: applica solo se ci restano risultati, altrimenti mantieni tutto
    const applySoftFilter = (arr: AviasalesFlight[], fn: (f: AviasalesFlight) => boolean): AviasalesFlight[] => {
      const strict = arr.filter(fn);
      return strict.length > 0 ? strict : arr;
    };

    if (params.isSpecificDate && params.exactDepartDate) {
      candidates = applySoftFilter(candidates, (f) => f.depart_date === params.exactDepartDate);
    } else if (!params.isSpecificDate && params.flexDepartStart && params.flexDepartEnd) {
      candidates = applySoftFilter(candidates, (f) =>
        inRange(f.depart_date, params.flexDepartStart, params.flexDepartEnd),
      );
    }

    // Filtro ritorno: applica solo alle entry che hanno return_date, morbido
    if (params.isSpecificDate && params.exactReturnDate) {
      candidates = applySoftFilter(candidates, (f) => !f.return_date || f.return_date === params.exactReturnDate);
    } else if (!params.isSpecificDate && params.flexReturnStart && params.flexReturnEnd) {
      candidates = applySoftFilter(candidates, (f) =>
        !f.return_date || inRange(f.return_date, params.flexReturnStart, params.flexReturnEnd),
      );
    }

    arrayVoli = candidates;
  } else if (!params.isRoundTrip && !destination) {
    // Anywhere + solo andata: integriamo latest + city-directions
    const [latest, cityDirs] = await Promise.all([
      fetchLatest(origin, null, true).catch(() => [] as AviasalesFlight[]),
      fetchCityDirections().catch(() => [] as AviasalesFlight[]),
    ]);

    let candidates: AviasalesFlight[] = [...latest, ...cityDirs];

    // Dedup
    const seen = new Set<string>();
    candidates = candidates.filter((f) => {
      const key = `${f.origin}|${f.destination}|${f.depart_date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Soft date filter
    const applySoft = (arr: AviasalesFlight[], fn: (f: AviasalesFlight) => boolean) => {
      const strict = arr.filter(fn);
      return strict.length > 0 ? strict : arr;
    };
    if (params.isSpecificDate && params.exactDepartDate) {
      candidates = applySoft(candidates, (f) => f.depart_date === params.exactDepartDate);
    } else if (!params.isSpecificDate && params.flexDepartStart && params.flexDepartEnd) {
      candidates = applySoft(candidates, (f) => inRange(f.depart_date, params.flexDepartStart, params.flexDepartEnd));
    }
    arrayVoli = candidates;
  } else {
    // Destinazione specifica + solo andata
    let voli = await fetchLatest(origin, destination, true);
    if (params.isSpecificDate && params.exactDepartDate) {
      arrayVoli = voli.filter((f) => f.depart_date === params.exactDepartDate);
    } else if (!params.isSpecificDate) {
      arrayVoli = voli.filter((f) => inRange(f.depart_date, params.flexDepartStart, params.flexDepartEnd));
    } else {
      arrayVoli = voli;
    }
  }

  const formatLinkDate = (d: string) => {
    if (!d) return '';
    const parts = d.split('-');
    return parts.length === 3 ? `${parts[2]}${parts[1]}` : '';
  };

  const uniqueIatas = new Set<string>();
  uniqueIatas.add(origin);
  for (const v of arrayVoli) {
    uniqueIatas.add(v.origin);
    uniqueIatas.add(v.destination);
  }
  const iataNames = new Map<string, string>();
  await Promise.all(Array.from(uniqueIatas).map(async (iata) => iataNames.set(iata, await getPlaceName(iata))));

  return arrayVoli.map((flight, index) => {
    const durH = Math.floor((flight.duration || 0) / 60);
    const durM = (flight.duration || 0) % 60;
    const searchDate = formatLinkDate(flight.depart_date);
    const returnDate = flight.return_date ? formatLinkDate(flight.return_date) : '';

    let deepLink = `https://www.aviasales.it/?marker=${marker}`;
    if (flight.depart_date) {
      deepLink = `https://www.aviasales.it/search/${flight.origin}${searchDate}${flight.destination}${returnDate}1?marker=${marker}`;
    }

    const oName = iataNames.get(flight.origin) || flight.origin;
    const dName = iataNames.get(flight.destination) || flight.destination;

    return {
      id: `avs-${index}-${flight.origin}${flight.destination}-${Math.random()}`,
      route: `${oName} (${flight.origin}) → ${dName} (${flight.destination})`,
      airline: flight.gate || 'Volo trovato',
      price: flight.value,
      depart_date: flight.depart_date,
      return_date: flight.return_date || null,
      isRoundTrip: Boolean(flight.return_date),
      duration_out_str: flight.duration ? `${durH}h ${durM}m` : 'N/D',
      duration_back_str: '',
      stops_out: flight.number_of_changes || 0,
      stops_back: 0,
      deepLink,
    };
  });
}

// ==============================================================================
// ENDPOINT GET /api/flights
// Strategia: Kiwi per rotte precise; Aviasales per ricerche broad e come fallback
// ==============================================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const directOnly = searchParams.get('directOnly') === 'true';
    const maxPriceParam = searchParams.get('maxPrice');
    const maxPrice = maxPriceParam ? parseInt(maxPriceParam, 10) : null;

    const rawScope = searchParams.get('anywhereScope');
    const anywhereScope: AnywhereScope =
      rawScope === 'italy' || rawScope === 'foreign' ? rawScope : 'all';

    const params: SearchParams = {
      origin: searchParams.get('origin') || '',
      destination: searchParams.get('destination') || '',
      isRoundTrip: searchParams.get('isRoundTrip') === 'true',
      isSpecificDate: searchParams.get('isSpecificDate') === 'true',
      exactDepartDate: searchParams.get('exactDepartDate'),
      exactReturnDate: searchParams.get('exactReturnDate'),
      flexDepartStart: searchParams.get('flexDepartStart'),
      flexDepartEnd: searchParams.get('flexDepartEnd'),
      flexReturnStart: searchParams.get('flexReturnStart'),
      flexReturnEnd: searchParams.get('flexReturnEnd'),
      directOnly,
      anywhereScope,
    };

    if (!params.origin) {
      return NextResponse.json({ error: 'Origine richiesta' }, { status: 400 });
    }

    // Applica directOnly su un set di risultati
    const applyDirect = (arr: UIFlight[]): UIFlight[] =>
      directOnly ? arr.filter((v) => v.stops_out === 0 && v.stops_back === 0) : arr;

    // Accumuliamo TUTTI i raw di entrambi i motori, così in caso di directOnly zero
    // possiamo rilassare e mostrare comunque qualcosa
    let rawAll: UIFlight[] = [];
    let engine: 'kiwi' | 'aviasales' = 'aviasales';
    let relaxed = false;

    if (isBroadSearch(params)) {
      engine = 'aviasales';
      const avsRaw = await aviasalesSearch(params);
      rawAll = avsRaw;
      console.log(`[flights] Aviasales (broad): ${avsRaw.length} raw`);
    } else {
      // Prova Kiwi prima
      let kiwiRaw: UIFlight[] = [];
      try {
        kiwiRaw = await kiwiSearch(params);
        console.log(`[flights] Kiwi: ${kiwiRaw.length} raw`);
      } catch (kiwiErr) {
        console.warn('[flights] Kiwi ha fallito:', kiwiErr);
      }
      rawAll = kiwiRaw;
      engine = 'kiwi';

      // Se Kiwi direct-filtrato è vuoto, proviamo anche Aviasales per integrare
      if (applyDirect(kiwiRaw).length === 0) {
        try {
          const avsRaw = await aviasalesSearch(params);
          console.log(`[flights] Aviasales (fallback): ${avsRaw.length} raw`);
          // Unisci i raw da entrambi i motori, evitando duplicati per combo route+data
          const seen = new Set(kiwiRaw.map((v) => `${v.route}|${v.depart_date}|${v.price}`));
          for (const v of avsRaw) {
            const key = `${v.route}|${v.depart_date}|${v.price}`;
            if (!seen.has(key)) { seen.add(key); rawAll.push(v); }
          }
          if (kiwiRaw.length === 0) engine = 'aviasales';
        } catch (avsErr) {
          console.error('[flights] Aviasales ha fallito:', avsErr);
          if (rawAll.length === 0) throw avsErr;
        }
      }
    }

    // Applica directOnly; se azzera tutto, rilassiamo e mostriamo i non-diretti (meglio di niente)
    let voli = applyDirect(rawAll);
    if (voli.length === 0 && directOnly && rawAll.length > 0) {
      relaxed = true;
      voli = rawAll;
      console.log(`[flights] directOnly ha azzerato — rilassato, mostro ${voli.length} non-diretti`);
    }

    if (maxPrice && maxPrice > 0) voli = voli.filter((v) => v.price <= maxPrice);

    voli.sort((a, b) => a.price - b.price);

    console.log(`[flights] engine=${engine} origin=${params.origin} dest=${params.destination} direct=${directOnly} relaxed=${relaxed} → ${voli.length} risultati`);
    return NextResponse.json({ data: voli, engine, relaxed });
  } catch (err: unknown) {
    console.error('Errore in /api/flights:', err);
    const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
