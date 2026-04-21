import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

const CREDITS_DEFAULT = 20;

// Middleware di autenticazione admin — controlla l'header Authorization
function isAdmin(request: NextRequest): boolean {
  const auth = request.headers.get('x-admin-secret');
  return auth === process.env.ADMIN_SECRET;
}

// ============================================================
// GET /api/admin/credits — lista tutti gli utenti con i crediti
// ============================================================
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const clerk = await clerkClient();
    const { data: users } = await clerk.users.getUserList({ limit: 100, orderBy: '-created_at' });

    const result = users.map((user) => {
      const meta = user.privateMetadata as { credits?: number };
      return {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress ?? '—',
        name: [user.firstName, user.lastName].filter(Boolean).join(' ') || '—',
        imageUrl: user.imageUrl,
        credits: typeof meta.credits === 'number' ? meta.credits : CREDITS_DEFAULT,
        createdAt: user.createdAt,
      };
    });

    return NextResponse.json({ users: result });
  } catch (err) {
    console.error('Admin GET error:', err);
    return NextResponse.json({ error: 'Errore nel recupero utenti' }, { status: 500 });
  }
}

// ============================================================
// POST /api/admin/credits — imposta o aggiunge crediti a un utente
// Body: { userId: string, credits: number, mode: 'set' | 'add' }
// ============================================================
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const { userId, credits, mode } = await request.json() as {
      userId: string;
      credits: number;
      mode: 'set' | 'add';
    };

    if (!userId || typeof credits !== 'number') {
      return NextResponse.json({ error: 'userId e credits sono obbligatori' }, { status: 400 });
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const meta = user.privateMetadata as { credits?: number };
    const current = typeof meta.credits === 'number' ? meta.credits : CREDITS_DEFAULT;

    const newCredits = mode === 'add'
      ? current + credits      // aggiungi
      : Math.max(0, credits);  // imposta direttamente (minimo 0)

    await clerk.users.updateUserMetadata(userId, {
      privateMetadata: { credits: newCredits },
    });

    return NextResponse.json({ success: true, credits: newCredits });
  } catch (err) {
    console.error('Admin POST error:', err);
    return NextResponse.json({ error: 'Errore aggiornamento crediti' }, { status: 500 });
  }
}
