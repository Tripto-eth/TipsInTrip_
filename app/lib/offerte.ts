import { Redis } from '@upstash/redis';

export interface Offerta {
  id: string;
  destination: string;       // "Barcellona"
  destinationCode: string;   // "BCN"
  flag: string;              // "🇪🇸"
  price: number;             // 29
  originalPrice?: number;    // 59 (barrato)
  departDate: string;        // "15 mag"
  returnDate?: string;       // "20 mag" (vuoto = solo andata)
  airline: string;           // "Ryanair"
  direct: boolean;
  affiliateUrl: string;
  highlight?: string;        // "Offerta lampo" / "Solo oggi"
  validUntil?: string;       // ISO date — nasconde card scadute
  createdAt: number;
}

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

const KEY = 'offerte-catania';

export async function getOfferte(): Promise<Offerta[]> {
  const r = getRedis();
  const raw = await r.lrange<Offerta>(KEY, 0, -1);
  const now = Date.now();
  return raw
    .filter((o) => !o.validUntil || new Date(o.validUntil).getTime() > now)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function addOfferta(o: Omit<Offerta, 'id' | 'createdAt'>): Promise<Offerta> {
  const r = getRedis();
  const offerta: Offerta = {
    ...o,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  await r.lpush(KEY, offerta);
  return offerta;
}

export async function deleteOfferta(id: string): Promise<void> {
  const r = getRedis();
  const all = await r.lrange<Offerta>(KEY, 0, -1);
  const toDelete = all.find((o) => o.id === id);
  if (toDelete) await r.lrem(KEY, 1, toDelete);
}
