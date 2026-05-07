import { NextResponse } from 'next/server';
import { getSortedDestinazioniAll } from '../../lib/destinazioni';

export async function GET() {
  try {
    const data = await getSortedDestinazioniAll();
    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
