import { NextRequest, NextResponse } from 'next/server';
import { searchKiwiFlights, type CleanFlight } from '../../../lib/kiwi';

interface OriginEntry {
  code: string;
  adults: number;
}

type DateMode = 'exact' | 'flex3' | 'range';

interface MultiSearchBody {
  origins: OriginEntry[];
  destination: string;
  dateMode?: DateMode;
  departureDate: string;
  departureDateEnd?: string;
  returnDate?: string;
  returnDateEnd?: string;
  priority: 'price' | 'sync';
}

interface Combo {
  date: string;
  flights: Array<{ origin: string; adults: number; flight: CleanFlight }>;
  totalPrice: number;
  arrivalGapMinutes: number;
  score: number;
}

interface DateChunk {
  date: string;
  flex: number;
}

function cartesian<T>(arrs: T[][]): T[][] {
  if (arrs.length === 0) return [[]];
  if (arrs.length === 1) return arrs[0].map((x) => [x]);
  const rest = cartesian(arrs.slice(1));
  const out: T[][] = [];
  for (const head of arrs[0]) {
    for (const tail of rest) out.push([head, ...tail]);
  }
  return out;
}

function ddmmyyyyToIso(s: string): string {
  const [d, m, y] = s.split('/');
  return `${y}-${m}-${d}`;
}

function isoToDdmmyyyy(s: string): string {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

function planChunks(startDdmm: string, endDdmm: string | undefined, mode: DateMode): DateChunk[] {
  if (mode === 'exact') return [{ date: startDdmm, flex: 0 }];
  if (mode === 'flex3') return [{ date: startDdmm, flex: 3 }];
  if (!endDdmm) return [{ date: startDdmm, flex: 0 }];

  const startIso = ddmmyyyyToIso(startDdmm);
  const endIso = ddmmyyyyToIso(endDdmm);
  const startTime = Date.parse(startIso + 'T00:00:00Z');
  const endTime = Date.parse(endIso + 'T00:00:00Z');
  if (!startTime || !endTime || endTime < startTime) return [{ date: startDdmm, flex: 0 }];

  const totalDays = Math.round((endTime - startTime) / 86400000) + 1;
  const chunks: DateChunk[] = [];
  let cursor = 0;
  while (cursor < totalDays) {
    const chunkLen = Math.min(4, totalDays - cursor);
    const chunkStartIso = new Date(startTime + cursor * 86400000).toISOString().split('T')[0];
    chunks.push({ date: isoToDdmmyyyy(chunkStartIso), flex: chunkLen - 1 });
    cursor += chunkLen;
  }
  return chunks;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MultiSearchBody;

    if (!body.origins || !Array.isArray(body.origins) || body.origins.length < 2 || body.origins.length > 6) {
      return NextResponse.json({ error: 'Servono da 2 a 6 aeroporti di partenza' }, { status: 400 });
    }
    if (!body.destination || !body.departureDate) {
      return NextResponse.json({ error: 'Destinazione e data di partenza richieste' }, { status: 400 });
    }

    const mode: DateMode = body.dateMode ?? 'exact';
    const isRoundTrip = Boolean(body.returnDate);

    const outChunks = planChunks(body.departureDate, body.departureDateEnd, mode);
    const retChunks = isRoundTrip
      ? planChunks(body.returnDate!, body.returnDateEnd, mode)
      : [null as DateChunk | null];

    const totalCalls = body.origins.length * outChunks.length * retChunks.length;
    if (totalCalls > 24) {
      return NextResponse.json(
        { error: `Range troppo ampio: ${totalCalls} chiamate stimate (max 24).` },
        { status: 400 },
      );
    }

    const perOriginResults = await Promise.all(
      body.origins.map(async ({ code, adults }) => {
        const adultsClean = Math.max(1, adults || 1);
        const calls: Promise<CleanFlight[]>[] = [];
        for (const oc of outChunks) {
          for (const rc of retChunks) {
            calls.push(
              searchKiwiFlights({
                flyFrom: code,
                flyTo: body.destination,
                departureDate: oc.date,
                departureDateFlexRange: oc.flex || undefined,
                returnDate: rc ? rc.date : undefined,
                returnDateFlexRange: rc && rc.flex ? rc.flex : undefined,
                passengers: { adults: adultsClean },
                maxResults: 50,
              }).catch(() => [] as CleanFlight[]),
            );
          }
        }
        const chunks = await Promise.all(calls);
        const merged = chunks.flat();
        const seen = new Set<string>();
        const deduped: CleanFlight[] = [];
        for (const f of merged) {
          const key = `${f.outbound.departLocal}|${f.outbound.from}|${f.outbound.to}|${f.return?.departLocal ?? ''}|${f.price}`;
          if (seen.has(key)) continue;
          seen.add(key);
          deduped.push(f);
        }
        return { origin: code, adults: adultsClean, flights: deduped };
      }),
    );

    const missing = perOriginResults.filter((r) => r.flights.length === 0);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Nessun volo trovato per: ${missing.map((m) => m.origin).join(', ')}` },
        { status: 404 },
      );
    }

    const TOP_PER_DATE = 3;
    const byDatePerOrigin = perOriginResults.map(({ flights }) => {
      const m = new Map<string, CleanFlight[]>();
      for (const f of flights) {
        const d = (f.outbound.departLocal || '').split('T')[0];
        if (!d) continue;
        if (!m.has(d)) m.set(d, []);
        m.get(d)!.push(f);
      }
      for (const [d, arr] of m) {
        arr.sort((a, b) => a.price - b.price);
        m.set(d, arr.slice(0, TOP_PER_DATE));
      }
      return m;
    });

    const commonDates = [...byDatePerOrigin[0].keys()].filter((d) =>
      byDatePerOrigin.every((m) => m.has(d)),
    );

    if (commonDates.length === 0) {
      return NextResponse.json(
        { error: 'Nessuna data comune trovata tra gli aeroporti selezionati' },
        { status: 404 },
      );
    }

    const combos: Combo[] = [];
    for (const date of commonDates) {
      const perOriginForDate = byDatePerOrigin.map((m) => m.get(date)!);
      const product = cartesian(perOriginForDate);
      for (const combo of product) {
        const totalPrice = combo.reduce((s, f) => s + f.price, 0);
        const arrivals = combo
          .map((f) => Date.parse(f.outbound.arriveLocal))
          .filter((t) => !Number.isNaN(t));
        if (arrivals.length !== combo.length) continue;
        const gapMin = Math.round((Math.max(...arrivals) - Math.min(...arrivals)) / 60000);
        const gapHours = gapMin / 60;
        const score = body.priority === 'sync' ? totalPrice + gapHours * 100 : totalPrice + gapHours * 10;
        combos.push({
          date,
          flights: combo.map((flight, i) => ({
            origin: perOriginResults[i].origin,
            adults: perOriginResults[i].adults,
            flight,
          })),
          totalPrice: Math.round(totalPrice),
          arrivalGapMinutes: gapMin,
          score,
        });
      }
    }

    combos.sort((a, b) => a.score - b.score);

    return NextResponse.json({ data: combos.slice(0, 5) });
  } catch (error) {
    console.error('Errore API multi:', error);
    const msg = error instanceof Error ? error.message : 'Errore interno del server';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
