import { NextResponse } from 'next/server';
import { getSortedDestinazioniAll } from '../../lib/destinazioni';

export async function GET() {
  try {
    const data = await getSortedDestinazioniAll();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
