import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Email non valida' }, { status: 400 });
  }

  const normalized = email.toLowerCase().trim();
  await redis.sadd('newsletter:emails', normalized);

  return NextResponse.json({ ok: true });
}
