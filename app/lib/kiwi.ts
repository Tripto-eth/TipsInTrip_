import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const KIWI_MCP_URL = 'https://mcp.kiwi.com/';

// Parametri supportati dall'API Kiwi MCP (schema ufficiale)
export interface KiwiSearchArgs {
  flyFrom: string;
  flyTo?: string;
  departureDate: string;           // dd/mm/yyyy
  departureDateFlexRange?: number; // 0–3
  returnDate?: string;             // dd/mm/yyyy
  returnDateFlexRange?: number;    // 0–3
  passengers?: { adults?: number; children?: number; infants?: number };
  cabinClass?: 'M' | 'W' | 'C' | 'F';
  sort?: 'price' | 'duration' | 'quality' | 'date';
  curr?: string;
  locale?: string;
  // Questi NON vanno a Kiwi — usati solo lato client
  maxResults?: number;
  directFlightsOnly?: boolean;
}

export interface CleanLeg {
  from: string;
  to: string;
  cityFrom: string;
  cityTo: string;
  departLocal: string;
  arriveLocal: string;
  durationMinutes: number;
  layovers: string[];
}

export interface CleanFlight {
  outbound: CleanLeg;
  return?: CleanLeg;
  price: number;
  currency: string;
  deepLink: string;
}

interface RawLeg {
  flyFrom?: unknown;
  flyTo?: unknown;
  cityFrom?: unknown;
  cityTo?: unknown;
  departure?: { local?: unknown };
  arrival?: { local?: unknown };
  durationInSeconds?: unknown;
  layovers?: Array<{ cityCode?: unknown; city?: unknown; flyFrom?: unknown; flyTo?: unknown }>;
}

interface RawFlight extends RawLeg {
  price?: unknown;
  currency?: unknown;
  deepLink?: unknown;
  return?: RawLeg;
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' ? v : fallback;
}

function cleanLeg(raw: RawLeg): CleanLeg {
  return {
    from: str(raw.flyFrom),
    to: str(raw.flyTo),
    cityFrom: str(raw.cityFrom),
    cityTo: str(raw.cityTo),
    departLocal: str(raw.departure?.local),
    arriveLocal: str(raw.arrival?.local),
    durationMinutes: Math.round(num(raw.durationInSeconds) / 60),
    layovers: (raw.layovers ?? [])
      .map((l) => str(l.cityCode) || str(l.city) || str(l.flyFrom))
      .filter(Boolean),
  };
}

function dateOnly(iso: string): string {
  return iso ? iso.split('T')[0] : '';
}

function buildAffiliateDeepLink(
  outbound: CleanLeg,
  ret: CleanLeg | undefined,
  passengers: KiwiSearchArgs['passengers'],
): string {
  const affilid = process.env.KIWI_AFFILIATE_ID;
  const params = new URLSearchParams();
  params.set('from', outbound.from);
  params.set('to', outbound.to);
  params.set('departure', dateOnly(outbound.departLocal));
  if (ret) params.set('return', dateOnly(ret.departLocal));
  params.set('adults', String(passengers?.adults ?? 1));
  if (passengers?.children) params.set('children', String(passengers.children));
  if (passengers?.infants) params.set('infants', String(passengers.infants));
  if (affilid) params.set('affilid', affilid);
  return `https://www.kiwi.com/deep?${params.toString()}`;
}

function cleanOne(raw: RawFlight, passengers?: KiwiSearchArgs['passengers']): CleanFlight {
  const outbound = cleanLeg(raw);
  const ret = raw.return ? cleanLeg(raw.return) : undefined;
  return {
    outbound,
    return: ret,
    price: num(raw.price),
    currency: str(raw.currency, 'EUR'),
    deepLink: str(raw.deepLink) || buildAffiliateDeepLink(outbound, ret, passengers),
  };
}

// Estrae array di voli da qualsiasi formato di risposta Kiwi MCP
function extractFlights(text: string): RawFlight[] | null {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed as RawFlight[];
    // Kiwi potrebbe wrappare in { data: [...] } o { flights: [...] } o { results: [...] }
    for (const key of ['data', 'flights', 'results', 'items']) {
      if (parsed && Array.isArray(parsed[key])) return parsed[key] as RawFlight[];
    }
  } catch {
    // non è JSON — non fare niente
  }
  return null;
}

export async function searchKiwiFlights(args: KiwiSearchArgs): Promise<CleanFlight[]> {
  const { maxResults = 5, directFlightsOnly, ...rest } = args;

  // Costruisce solo i parametri nello schema ufficiale Kiwi MCP
  const toolArgs: Record<string, unknown> = {
    sort: rest.sort ?? 'price',
    curr: rest.curr ?? 'EUR',
    locale: rest.locale ?? 'it',
    flyFrom: rest.flyFrom,
    departureDate: rest.departureDate,
  };
  if (rest.flyTo) toolArgs.flyTo = rest.flyTo;
  if (rest.departureDateFlexRange != null) toolArgs.departureDateFlexRange = rest.departureDateFlexRange;
  if (rest.returnDate) toolArgs.returnDate = rest.returnDate;
  if (rest.returnDateFlexRange != null) toolArgs.returnDateFlexRange = rest.returnDateFlexRange;
  if (rest.passengers) toolArgs.passengers = rest.passengers;
  if (rest.cabinClass) toolArgs.cabinClass = rest.cabinClass;

  const client = new Client({ name: 'tipsintrip', version: '0.1.0' }, { capabilities: {} });
  const transport = new SSEClientTransport(new URL(KIWI_MCP_URL));

  try {
    await client.connect(transport);

    const result = await client.callTool({ name: 'search-flight', arguments: toolArgs });

    const blocks = Array.isArray(result.content) ? result.content : [];
    for (const block of blocks) {
      if (block && typeof block === 'object' && 'type' in block && block.type === 'text') {
        const text = (block as { text: string }).text;
        const flights = extractFlights(text);
        if (flights && flights.length > 0) {
          const filtered = directFlightsOnly
            ? flights.filter((f) => !f.layovers?.length && (!f.return || !(f.return as RawLeg).layovers?.length))
            : flights;
          return filtered.slice(0, maxResults).map((raw) => cleanOne(raw, args.passengers));
        }
      }
    }

    console.warn('[kiwi] Nessun volo estratto. Blocks ricevuti:', JSON.stringify(blocks).slice(0, 400));
    return [];
  } catch (err) {
    console.error('[kiwi] Errore MCP:', err instanceof Error ? err.message : err);
    throw err;
  } finally {
    await client.close().catch(() => {});
  }
}
