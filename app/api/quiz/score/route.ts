import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const lbKey = (game: string) => `lb:${game}`;
const playerKey = (game: string, userId: string) => `player:${game}:${userId}`;

export interface LeaderboardEntry {
  userId: string;
  name: string;
  score: number;
  correct: number;
  total: number;
  diff: string;
  date: string;
}

// GET — top 20 global leaderboard
export async function GET(request: Request) {
  try {
    const game = new URL(request.url).searchParams.get('game') ?? 'quiz';
    const rows = await redis.zrange(lbKey(game), 0, 19, { rev: true, withScores: true });
    const entries: LeaderboardEntry[] = [];

    for (let i = 0; i < rows.length; i += 2) {
      const userId = rows[i] as string;
      const score = Number(rows[i + 1]);
      const data = await redis.hgetall(playerKey(game, userId)) as Record<string, string> | null;
      if (data) {
        entries.push({
          userId,
          name: data.name || 'Giocatore',
          score,
          correct: Number(data.correct ?? 0),
          total: Number(data.total ?? 10),
          diff: data.diff || 'easy',
          date: data.date || '',
        });
      }
    }

    return NextResponse.json({ data: entries });
  } catch (err) {
    console.error('[quiz/score GET]', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}

// POST — save score (auth required)
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { score, correct, total, diff, game = 'quiz' } = await request.json();
    if (typeof score !== 'number') return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const name = user.firstName || user.username || user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Giocatore';

    const current = await redis.zscore(lbKey(game), userId);
    if (current === null || score > Number(current)) {
      await redis.zadd(lbKey(game), { score, member: userId });
      await redis.hset(playerKey(game, userId), {
        name,
        correct: String(correct),
        total: String(total),
        diff,
        date: new Date().toISOString().split('T')[0],
      });
    }

    return NextResponse.json({ ok: true, bestScore: Math.max(score, Number(current ?? 0)) });
  } catch (err) {
    console.error('[quiz/score POST]', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
