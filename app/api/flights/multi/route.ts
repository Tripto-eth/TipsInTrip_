import { NextRequest, NextResponse } from 'next/server';
import { searchKiwiFlights, type CleanFlight } from '../../../lib/kiwi';

interface OriginEntry {
  code: string;
  adults: number;
}

interface MultiSearchBody {
  origins: OriginEntry[];
  destination: string;
  departureDate: string;
  returnDate?: string;
  priority: 'price' | 'sync';
}

interface Combo {
  date: string;
  flights: Array<{ origin: string; adults: number; flight: CleanFlight }>;
  totalPrice: number;
  arrivalGapMinutes: number;
  score: number;
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MultiSearchBody;

    if (!body.origins || !Array.isArray(body.origins) || body.origins.length < 2 || body.origins.length > 6) {
      return NextResponse.json({ error: 'Servono da 2 a 6 aeroporti di partenza' }, { status: 400 });
    }
    if (!body.destination || !body.departureDate) {
      return NextResponse.json({ error: 'Destinazione e data di partenza richieste' }, { status: 400 });
    }

    const results = await Promise.all(
      body.origins.map(({ code, adults }) =>
        searchKiwiFlights({
          flyFrom: code,
          flyTo: body.destination,
          departureDate: body.departureDate,
          returnDate: body.returnDate,
          passengers: { adults: Math.max(1, adults || 1) },
        })
          .then((flights) => ({ origin: code, adults: adults || 1, flights }))
          .catch(() => ({ origin: code, adults: adults || 1, flights: [] as CleanFlight[] })),
      ),
    );

    const missing = results.filter((r) => r.flights.length === 0);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Nessun volo trovato per: ${missing.map((m) => m.origin).join(', ')}` },
        { status: 404 },
      );
    }

    const byDatePerOrigin = results.map(({ flights }) => {
      const m = new Map<string, CleanFlight[]>();
      for (const f of flights) {
        const d = (f.outbound.departLocal || '').split('T')[0];
        if (!d) continue;
        if (!m.has(d)) m.set(d, []);
        m.get(d)!.push(f);
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
          flights: combo.map((flight, i) => ({ origin: results[i].origin, adults: results[i].adults, flight })),
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
