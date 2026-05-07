import { NextResponse } from 'next/server';
import { getFlagRound } from '../../../lib/flagData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const diff = (searchParams.get('diff') || 'easy') as 'easy' | 'medium' | 'hard';
  const count = Math.min(parseInt(searchParams.get('count') || '10', 10), 20);
  const rounds = getFlagRound(diff, count);
  return NextResponse.json({ data: rounds });
}
