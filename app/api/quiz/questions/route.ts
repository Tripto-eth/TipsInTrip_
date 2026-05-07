import { NextResponse } from 'next/server';
import { BANK } from '../../../lib/questions-bank';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const diff = searchParams.get('diff') as 'easy' | 'medium' | 'hard' | null;
  const count = Math.min(parseInt(searchParams.get('count') || '10', 10), 30);

  const pool = diff ? BANK.filter(q => q.diff === diff) : BANK;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return NextResponse.json({ data: selected, total: pool.length });
}
