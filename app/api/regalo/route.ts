import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const KEY = 'regalo:q3';

// POST — Corinne invia la risposta (pubblico)
export async function POST(request: Request) {
  try {
    const { answer } = await request.json();
    if (!answer || typeof answer !== 'string') {
      return NextResponse.json({ error: 'Risposta mancante' }, { status: 400 });
    }
    await redis.set(KEY, answer.trim());
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[regalo POST]', err);
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}

// GET — solo admin (x-admin-secret header)
export async function GET(request: Request) {
  const secret = request.headers.get('x-admin-secret');
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }
  try {
    const answer = await redis.get<string>(KEY);
    return NextResponse.json({ answer: answer ?? null });
  } catch (err) {
    console.error('[regalo GET]', err);
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}
