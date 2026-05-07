import { NextResponse } from 'next/server';
import { getOfferte } from '../../lib/offerte';

export async function GET() {
  try {
    const offerte = await getOfferte();
    return NextResponse.json({ data: offerte }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
