import { NextRequest, NextResponse } from 'next/server';
import { searchKiwiFlights } from '../../../lib/kiwi';

function checkAuth(req: NextRequest) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET;
}

const CTA_ROUTES = [
  { code: 'STN', name: 'Londra Stansted', flag: '🇬🇧' },
  { code: 'LGW', name: 'Londra Gatwick',  flag: '🇬🇧' },
  { code: 'BCN', name: 'Barcellona',       flag: '🇪🇸' },
  { code: 'MAD', name: 'Madrid',           flag: '🇪🇸' },
  { code: 'PMI', name: 'Palma Maiorca',    flag: '🇪🇸' },
  { code: 'IBZ', name: 'Ibiza',            flag: '🇪🇸' },
  { code: 'CDG', name: 'Parigi CDG',       flag: '🇫🇷' },
  { code: 'AMS', name: 'Amsterdam',        flag: '🇳🇱' },
  { code: 'BER', name: 'Berlino',          flag: '🇩🇪' },
  { code: 'MUC', name: 'Monaco',           flag: '🇩🇪' },
  { code: 'FRA', name: 'Francoforte',      flag: '🇩🇪' },
  { code: 'HAM', name: 'Amburgo',          flag: '🇩🇪' },
  { code: 'VIE', name: 'Vienna',           flag: '🇦🇹' },
  { code: 'PRG', name: 'Praga',            flag: '🇨🇿' },
  { code: 'BUD', name: 'Budapest',         flag: '🇭🇺' },
  { code: 'ATH', name: 'Atene',            flag: '🇬🇷' },
  { code: 'MLA', name: 'Malta',            flag: '🇲🇹' },
  { code: 'LIS', name: 'Lisbona',          flag: '🇵🇹' },
  { code: 'DUB', name: 'Dublino',          flag: '🇮🇪' },
  { code: 'CPH', name: 'Copenhagen',       flag: '🇩🇰' },
  { code: 'WAW', name: 'Varsavia',         flag: '🇵🇱' },
  { code: 'BRU', name: 'Bruxelles',        flag: '🇧🇪' },
  { code: 'ZRH', name: 'Zurigo',           flag: '🇨🇭' },
  { code: 'TLV', name: 'Tel Aviv',         flag: '🇮🇱' },
  { code: 'SSH', name: 'Sharm el-Sheikh',  flag: '🇪🇬' },
  { code: 'FCO', name: 'Roma Fiumicino',   flag: '🇮🇹' },
  { code: 'MXP', name: 'Milano Malpensa', flag: '🇮🇹' },
  { code: 'NAP', name: 'Napoli',           flag: '🇮🇹' },
];

function toDdmmyyyy(d: Date): string {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

// Genera le date di partenza nel mese (weekend o ogni 7gg)
function getTargetDates(yearMonth: string, weekendOnly: boolean): Date[] {
  const [year, month] = yearMonth.split('-').map(Number);
  const dates: Date[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  today.setHours(0,0,0,0);

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day);
    if (d <= today) continue; // salta date passate
    const dow = d.getDay(); // 0=dom, 5=ven, 6=sab
    if (weekendOnly) {
      if (dow === 5 || dow === 6) dates.push(d); // venerdì o sabato
    } else {
      if (dow === 1 || dow === 3 || dow === 5) dates.push(d); // lun/mer/ven ogni settimana
    }
  }
  return dates;
}

// Esegue N tasks in parallelo con concorrenza limitata
async function withConcurrency<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = [];
  let idx = 0;

  const run = async (): Promise<void> => {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  };

  await Promise.all(Array.from({ length: limit }, run));
  return results;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const yearMonth = searchParams.get('month') ?? new Date().toISOString().slice(0, 7);
  const maxDays = Math.max(1, Math.min(30, parseInt(searchParams.get('maxDays') ?? '7', 10)));
  const weekendOnly = searchParams.get('weekendOnly') === '1';
  const roundtrip = searchParams.get('roundtrip') !== '0'; // default true

  const depDates = getTargetDates(yearMonth, weekendOnly);
  if (depDates.length === 0) {
    return NextResponse.json({ data: [], message: 'Nessuna data disponibile per il mese selezionato' });
  }

  // Costruisce tutte le combinazioni destinazione × data
  const tasks = CTA_ROUTES.flatMap((route) =>
    depDates.map((depDate) => async () => {
      const depDdmm = toDdmmyyyy(depDate);
      const retDate = new Date(depDate);
      retDate.setDate(retDate.getDate() + maxDays);
      const retDdmm = toDdmmyyyy(retDate);

      try {
        const flights = await searchKiwiFlights({
          flyFrom: 'CTA',
          flyTo: route.code,
          departureDate: depDdmm,
          returnDate: roundtrip ? retDdmm : undefined,
          returnDateFlexRange: roundtrip ? 1 : undefined,
          maxResults: 1,
          limit: 1,
          passengers: { adults: 1 },
        });
        if (!flights.length) return null;
        const f = flights[0];
        const retStr = f.return ? shortDate(f.return.departLocal.split('T')[0]) : undefined;
        return {
          destination: route.name,
          destinationCode: route.code,
          flag: route.flag,
          price: Math.round(f.price),
          departDate: shortDate(f.outbound.departLocal.split('T')[0]),
          returnDate: retStr,
          direct: f.outbound.layovers.length === 0,
          airline: f.outbound.layovers.length === 0 ? 'Diretto' : 'Con scalo',
          affiliateUrl: f.deepLink,
          isRoundtrip: Boolean(f.return),
        };
      } catch {
        return null;
      }
    })
  );

  // Concorrenza limitata a 12 per non sovraccaricare Kiwi
  const raw = await withConcurrency(tasks, 12);

  // Dedup: per ogni rotta, tieni solo il prezzo più basso
  const bestByRoute = new Map<string, typeof raw[0]>();
  for (const r of raw) {
    if (!r) continue;
    const key = r.destinationCode;
    const existing = bestByRoute.get(key);
    if (!existing || r.price < existing.price) bestByRoute.set(key, r);
  }

  const found = [...bestByRoute.values()].sort((a, b) => a!.price - b!.price);

  return NextResponse.json({
    data: found,
    meta: { totalCalls: tasks.length, dates: depDates.length, destinations: CTA_ROUTES.length },
  });
}
