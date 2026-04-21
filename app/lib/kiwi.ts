import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const KIWI_MCP_URL = 'https://mcp.kiwi.com/';
const DEFAULT_MAX_RESULTS = 5;

export interface KiwiSearchArgs {
  flyFrom: string;
  flyTo: string;
  departureDate: string;
  returnDate?: string;
  departureDateFlexRange?: number;
  returnDateFlexRange?: number;
  passengers?: { adults?: number; children?: number; infants?: number };
  cabinClass?: 'M' | 'W' | 'C' | 'F';
  sort?: 'price' | 'duration' | 'quality' | 'date';
  curr?: string;
  locale?: string;
  maxResults?: number;
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
  layovers?: Array<{ cityCode?: unknown; city?: unknown }>;
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
      .map((l) => str(l.cityCode) || str(l.city))
      .filter(Boolean),
  };
}

function dateOnly(iso: string): string {
  return iso ? iso.split('T')[0] : '';
}

function buildAffiliateDeepLink(
  outbound: CleanLeg,
  ret: CleanLeg | undefined,
  passengers: { adults?: number; children?: number; infants?: number } | undefined,
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
    deepLink: buildAffiliateDeepLink(outbound, ret, passengers),
  };
}

export async function searchKiwiFlights(args: KiwiSearchArgs): Promise<CleanFlight[]> {
  const client = new Client({ name: 'tipsintrip', version: '0.1.0' }, { capabilities: {} });
  const transport = new SSEClientTransport(new URL(KIWI_MCP_URL));
  const { maxResults = DEFAULT_MAX_RESULTS, ...toolArgs } = args;

  try {
    await client.connect(transport);
    const result = await client.callTool({
      name: 'search-flight',
      arguments: {
        sort: 'price',
        curr: 'EUR',
        locale: 'it',
        ...toolArgs,
      },
    });

    const blocks = Array.isArray(result.content) ? result.content : [];
    for (const block of blocks) {
      if (block && typeof block === 'object' && 'type' in block && block.type === 'text') {
        const text = (block as { text: string }).text;
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            return parsed.slice(0, maxResults).map((raw: RawFlight) => cleanOne(raw, args.passengers));
          }
        } catch {
          // not JSON, skip
        }
      }
    }
    return [];
  } finally {
    await client.close().catch(() => {});
  }
}
