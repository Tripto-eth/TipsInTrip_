import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { getDestinazioneDetail } from '../../../lib/destinazioni';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const { slug } = await req.json();
  if (!slug) return NextResponse.json({ error: 'Slug richiesto' }, { status: 400 });

  const dest = await getDestinazioneDetail(slug);
  if (!dest) return NextResponse.json({ error: 'Destinazione non trovata' }, { status: 404 });

  const cost = dest.itineraryCost;

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const meta = user.privateMetadata as { credits?: number; unlockedItineraries?: string[] };
  const credits = typeof meta.credits === 'number' ? meta.credits : 0;
  const unlocked = Array.isArray(meta.unlockedItineraries) ? meta.unlockedItineraries : [];

  // Già sbloccato → restituisci successo senza scalare
  if (unlocked.includes(slug)) return NextResponse.json({ success: true, alreadyUnlocked: true });

  if (credits < cost) {
    return NextResponse.json({ error: 'Crediti insufficienti', creditsExhausted: true, credits }, { status: 402 });
  }

  await clerk.users.updateUserMetadata(userId, {
    privateMetadata: {
      credits: credits - cost,
      unlockedItineraries: [...unlocked, slug],
    },
  });

  return NextResponse.json({ success: true, creditsRemaining: credits - cost });
}
