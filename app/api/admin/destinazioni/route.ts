import { NextRequest, NextResponse } from 'next/server';
import {
  getDestinazioniRedis,
  saveDestinazioneRedis,
  deleteDestinazioneRedis,
} from '../../../lib/destinazioni';

function checkAuth(req: NextRequest) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const items = await getDestinazioniRedis();
  return NextResponse.json({ data: items });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  try {
    const body = await req.json();
    const { slug: rawSlug, markdown } = body as { slug?: string; markdown?: string };

    if (!rawSlug || !markdown) {
      return NextResponse.json({ error: 'slug e markdown richiesti' }, { status: 400 });
    }

    const slug = slugify(rawSlug);
    await saveDestinazioneRedis(slug, markdown);
    return NextResponse.json({ success: true, slug });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  try {
    const { slug } = await req.json();
    if (!slug) return NextResponse.json({ error: 'slug richiesto' }, { status: 400 });
    await deleteDestinazioneRedis(slug);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
