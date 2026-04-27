import { NextRequest, NextResponse } from 'next/server';
import { searchKiwiFlights } from '../../../lib/kiwi';

function checkAuth(req: NextRequest) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET;
}

// Rotte chiave da CTA — dirette o quasi, le più cercate
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

function tomorrowDdmmyyyy(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function isoFromDdmm(ddmm: string): string {
  const [dd, mm, yyyy] = ddmm.split('/');
  return `${yyyy}-${mm}-${dd}`;
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const depDate = tomorrowDdmmyyyy();

  const roundtrip = req.nextUrl.searchParams.get('roundtrip') === '1';
  const nights = Math.max(1, parseInt(req.nextUrl.searchParams.get('nights') ?? '5', 10));

  // Calcola data di ritorno = partenza + nights giorni
  function returnDateDdmm(depDdmm: string, n: number): string {
    const [dd, mm, yyyy] = depDdmm.split('/').map(Number);
    const d = new Date(yyyy, mm - 1, dd + n);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }

  const retDate = roundtrip ? returnDateDdmm(depDate, nights) : undefined;

  const results = await Promise.all(
    CTA_ROUTES.map(async (route) => {
      try {
        const flights = await searchKiwiFlights({
          flyFrom: 'CTA',
          flyTo: route.code,
          departureDate: depDate,
          departureDateFlexRange: 3,
          returnDate: retDate,
          returnDateFlexRange: retDate ? 2 : undefined,
          maxResults: 1,
          limit: 1,
          passengers: { adults: 1 },
        });
        if (!flights.length) return null;
        const f = flights[0];
        const retDateStr = f.return ? shortDate(f.return.departLocal.split('T')[0]) : undefined;
        return {
          destination: route.name,
          destinationCode: route.code,
          flag: route.flag,
          price: Math.round(f.price),
          departDate: shortDate(f.outbound.departLocal.split('T')[0]),
          returnDate: retDateStr,
          airline: f.outbound.layovers.length === 0 ? 'Diretto' : 'Con scalo',
          direct: f.outbound.layovers.length === 0,
          affiliateUrl: f.deepLink,
          isRoundtrip: Boolean(f.return),
        };
      } catch {
        return null;
      }
    })
  );

  const found = results
    .filter(Boolean)
    .sort((a, b) => a!.price - b!.price);

  return NextResponse.json({ data: found });
}
