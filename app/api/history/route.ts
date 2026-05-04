import { auth } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const MAX_HISTORY = 30;

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const raw = await redis.lrange<string>(`chat-history:${userId}`, 0, MAX_HISTORY - 1);
  const history = raw.map((item) => {
    try { return typeof item === 'string' ? JSON.parse(item) : item; } catch { return null; }
  }).filter(Boolean);

  return NextResponse.json({ history });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const query: string = typeof body.query === 'string' ? body.query.trim() : '';
  if (!query) return NextResponse.json({ error: 'Query mancante' }, { status: 400 });

  const item = JSON.stringify({
    query,
    ts: body.ts ?? Date.now(),
    messages: Array.isArray(body.messages) ? body.messages : [],
  });

  await redis.lpush(`chat-history:${userId}`, item);
  await redis.ltrim(`chat-history:${userId}`, 0, MAX_HISTORY - 1);

  return NextResponse.json({ ok: true });
}
