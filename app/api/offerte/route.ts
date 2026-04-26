import { NextResponse } from 'next/server';
import { getOfferte } from '../../lib/offerte';

export async function GET() {
  try {
    const offerte = await getOfferte();
    return NextResponse.json({ data: offerte });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
