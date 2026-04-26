import { NextRequest, NextResponse } from 'next/server';

// Invia una notifica push a tutti i subscriber (o a un segmento specifico).
// Chiamata dal pannello admin o da trigger automatici (es. nuova offerta volo).
export async function POST(request: NextRequest) {
  const apiKey = process.env.ONESIGNAL_API_KEY;
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

  if (!apiKey || !appId) {
    return NextResponse.json({ error: 'OneSignal non configurato' }, { status: 500 });
  }

  // Protezione minima: solo chiamate con il secret admin
  const authHeader = request.headers.get('x-admin-secret');
  if (authHeader !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const { title, message, url, segment } = await request.json();

    if (!title || !message) {
      return NextResponse.json({ error: 'title e message sono richiesti' }, { status: 400 });
    }

    const body = {
      app_id: appId,
      headings: { it: title, en: title },
      contents: { it: message, en: message },
      url: url || 'https://tipsintrip.com',
      included_segments: [segment || 'All'],
      web_push_topic: 'tipsintrip-offers',
    };

    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('OneSignal error:', data);
      return NextResponse.json({ error: data }, { status: res.status });
    }

    return NextResponse.json({ success: true, id: data.id, recipients: data.recipients });
  } catch (err) {
    console.error('Push send error:', err);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
