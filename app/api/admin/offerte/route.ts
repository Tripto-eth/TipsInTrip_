import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { addOfferta, deleteOfferta } from '../../../lib/offerte';

function checkAuth(req: NextRequest) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  try {
    const body = await req.json();
    const offerta = await addOfferta(body);
    revalidatePath('/offerte-catania');
    return NextResponse.json({ success: true, offerta });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const { id } = await req.json();
  await deleteOfferta(id);
  revalidatePath('/offerte-catania');
  return NextResponse.json({ success: true });
}
