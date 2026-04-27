import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { Redis } from '@upstash/redis';

const dir = path.join(process.cwd(), 'destinazioni');
const LOCK_MARKER = 'ITINERARY_LOCKED';
const REDIS_KEY = 'destinazioni-redis';

export interface DestinazioneM {
  id: string;
  title: string;
  destination: string;
  country: string;
  flag: string;
  coverImage: string;
  period: string;
  duration: string;
  budgetMin: number;
  budgetMax: number;
  tags: string[];
  flightFrom?: string;
  flightPrice?: number;
  hotelPerNight?: number;
  itineraryCost: number;
  featured?: boolean;
  date: string;
}

export interface DestinazioneDetail extends DestinazioneM {
  publicHtml: string;
  itineraryHtml: string;
}

export interface DestinazioneRedisItem {
  slug: string;
  markdown: string;
  createdAt: number;
}

// ── Redis singleton ──────────────────────────────────────────────
let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) _redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
  return _redis;
}

// ── Parse a raw markdown string into DestinazioneM ──────────────
function parseDestinazioneM(id: string, raw: string): DestinazioneM {
  const { data } = matter(raw);
  return { id, ...(data as Omit<DestinazioneM, 'id'>) };
}

// ── Parse a raw markdown string into DestinazioneDetail ─────────
async function parseDestinazioneDetail(id: string, raw: string): Promise<DestinazioneDetail> {
  const { data, content } = matter(raw);
  const lockIdx = content.indexOf(LOCK_MARKER);
  const publicMd = lockIdx >= 0 ? content.slice(0, lockIdx).replace(/---\s*$/, '').trim() : content;
  const itineraryMd = lockIdx >= 0 ? content.slice(lockIdx + LOCK_MARKER.length).replace(/^---/, '').trim() : '';
  const toHtml = async (md: string) => (await remark().use(html).process(md)).toString();
  const [publicHtml, itineraryHtml] = await Promise.all([toHtml(publicMd), toHtml(itineraryMd)]);
  return { id, ...(data as Omit<DestinazioneM, 'id'>), publicHtml, itineraryHtml };
}

// ── Filesystem (sync) — used for build-time static params ────────
export function getSortedDestinazioni(): DestinazioneM[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((fileName) => {
      const id = fileName.replace(/\.md$/, '');
      const raw = fs.readFileSync(path.join(dir, fileName), 'utf8');
      return parseDestinazioneM(id, raw);
    })
    .sort(sortFn);
}

// ── Redis CRUD ───────────────────────────────────────────────────
export async function getDestinazioniRedis(): Promise<DestinazioneRedisItem[]> {
  try {
    const r = getRedis();
    return await r.lrange<DestinazioneRedisItem>(REDIS_KEY, 0, -1);
  } catch { return []; }
}

export async function saveDestinazioneRedis(slug: string, markdown: string): Promise<void> {
  const r = getRedis();
  const all = await r.lrange<DestinazioneRedisItem>(REDIS_KEY, 0, -1);
  // Remove existing with same slug then prepend
  for (const item of all) {
    if (item.slug === slug) await r.lrem(REDIS_KEY, 1, item);
  }
  await r.lpush(REDIS_KEY, { slug, markdown, createdAt: Date.now() });
}

export async function deleteDestinazioneRedis(slug: string): Promise<void> {
  const r = getRedis();
  const all = await r.lrange<DestinazioneRedisItem>(REDIS_KEY, 0, -1);
  const target = all.find((i) => i.slug === slug);
  if (target) await r.lrem(REDIS_KEY, 1, target);
}

// ── Merged: filesystem + Redis ───────────────────────────────────
function sortFn(a: DestinazioneM, b: DestinazioneM): number {
  if (a.featured && !b.featured) return -1;
  if (!a.featured && b.featured) return 1;
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

export async function getSortedDestinazioniAll(): Promise<DestinazioneM[]> {
  const fsItems = getSortedDestinazioni();
  const fsSlugs = new Set(fsItems.map((d) => d.id));

  const redisItems = await getDestinazioniRedis();
  const redisDestinazioniM = redisItems
    .filter((i) => !fsSlugs.has(i.slug)) // filesystem takes precedence
    .map((i) => parseDestinazioneM(i.slug, i.markdown));

  return [...fsItems, ...redisDestinazioniM].sort(sortFn);
}

export async function getDestinazioneDetail(id: string): Promise<DestinazioneDetail | null> {
  // Check filesystem first
  const fsPath = path.join(dir, `${id}.md`);
  if (fs.existsSync(fsPath)) {
    const raw = fs.readFileSync(fsPath, 'utf8');
    return parseDestinazioneDetail(id, raw);
  }

  // Fallback to Redis
  const redisItems = await getDestinazioniRedis();
  const found = redisItems.find((i) => i.slug === id);
  if (!found) return null;
  return parseDestinazioneDetail(id, found.markdown);
}
