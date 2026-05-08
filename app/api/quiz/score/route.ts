import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const lbKey = (game: string) => `lb:${game}`;
const playerKey = (game: string, userId: string) => `player:${game}:${userId}`;

const ALL_GAMES = ['quiz', 'flags', 'emoji'];

export interface LeaderboardEntry {
  userId: string;
  name: string;
  score: number;
  correct: number;
  total: number;
  diff: string;
  date: string;
  game?: string;
}

function maskName(raw: string): string {
  const local = raw.includes('@') ? raw.split('@')[0] : raw;
  if (local.length <= 2) return local[0] + '***';
  return local[0] + '*'.repeat(Math.min(local.length - 2, 5)) + local[local.length - 1];
}

async function fetchGame(game: string, limit: number, isAdmin: boolean): Promise<LeaderboardEntry[]> {
  const rows = await redis.zrange(lbKey(game), 0, limit - 1, { rev: true, withScores: true });
  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < rows.length; i += 2) {
    const userId = rows[i] as string;
    const score = Number(rows[i + 1]);
    const data = await redis.hgetall(playerKey(game, userId)) as Record<string, string> | null;
    if (data) {
      const rawName = data.name || 'Giocatore';
      entries.push({
        userId,
        name: isAdmin ? rawName : maskName(rawName),
        score,
        correct: Number(data.correct ?? 0),
        total: Number(data.total ?? 10),
        diff: data.diff || 'easy',
        date: data.date || '',
        game,
      });
    }
  }
  return entries;
}

// GET — leaderboard (game=quiz|flags|emoji|all)
export async function GET(request: Request) {
  try {
    const { userId: viewerId } = await auth();
    const isAdmin = !!viewerId && viewerId === process.env.ADMIN_CLERK_USER_ID;

    const game = new URL(request.url).searchParams.get('game') ?? 'quiz';

    if (game === 'all') {
      const results = await Promise.all(ALL_GAMES.map(g => fetchGame(g, 10, isAdmin)));
      const combined = results.flat().sort((a, b) => b.score - a.score).slice(0, 30);
      return NextResponse.json({ data: combined });
    }

    const entries = await fetchGame(game, 20, isAdmin);
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
