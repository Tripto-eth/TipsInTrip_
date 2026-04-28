import { NextRequest, NextResponse } from 'next/server';
import { saveDestinazioneRedis } from '../../../lib/destinazioni';

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

function buildMarkdown(data: {
  destination: string;
  flag: string;
  destinationCode: string;
  flightPrice: number;
  departDate: string;
  returnDate?: string;
  direct: boolean;
  tags: string[];
  period: string;
  days: number;
}): string {
  const today = new Date().toISOString().split('T')[0];
  const hotelEstimate = 60;
  const budgetMin = Math.round(data.flightPrice * 2 + hotelEstimate * data.days * 0.8);
  const budgetMax = Math.round(data.flightPrice * 2 + hotelEstimate * data.days * 1.3);

  return `---
title: "${data.destination} in ${data.days} giorni: voli, hotel e cosa fare"
destination: "${data.destination}"
country: ""
flag: "${data.flag}"
coverImage: ""
period: "${data.period}"
duration: "${data.days} giorni"
budgetMin: ${budgetMin}
budgetMax: ${budgetMax}
tags: [${data.tags.map(t => `"${t}"`).join(', ')}]
flightFrom: "CTA"
flightPrice: ${data.flightPrice}
hotelPerNight: ${hotelEstimate}
itineraryCost: 3
featured: false
date: "${today}"
---

## Perché ${data.destination}?

<!-- ✏️ Scrivi qui perché vale la pena visitare ${data.destination} -->

## Voli da Catania

- **Compagnia**: ${data.direct ? 'Volo diretto' : 'Con scalo'}
- **Durata volo**: da aggiornare
- **Prezzo trovato**: da €${data.flightPrice}${data.departDate ? ` (${data.departDate}${data.returnDate ? ` → ${data.returnDate}` : ''})` : ''}
- **Aeroporto di arrivo**: ${data.destinationCode}

## Dove dormire

<!-- ✏️ Aggiungi consigli hotel/quartieri con prezzi -->

| Zona | Tipologia | Prezzo/notte |
|---|---|---|
| Centro | Hotel 3★ | €${hotelEstimate}-${hotelEstimate + 30} |

## Cosa non perdere

<!-- ✏️ Inserisci le attrazioni principali -->

-
-
-

## Quando andare

<!-- ✏️ Descrivi il periodo migliore -->

---
ITINERARY_LOCKED
---

## Itinerario giorno per giorno

<!-- ✏️ Scrivi l'itinerario completo giorno per giorno -->

### Giorno 1 — Arrivo
- **Mattina**:
- **Pranzo**:
- **Pomeriggio**:
- **Sera**:

${Array.from({ length: data.days - 2 }, (_, i) => `### Giorno ${i + 2}\n- **Mattina**: \n- **Pranzo**: \n- **Pomeriggio**: \n- **Sera**: `).join('\n\n')}

### Giorno ${data.days} — Partenza
- **Mattina**: Ultima colazione e check-out
- **Partenza**: Trasferimento all'aeroporto

### Budget riassuntivo
| Voce | Costo stimato |
|---|---|
| Volo A/R | €${data.flightPrice * 2} |
| Hotel ${data.days - 1} notti | €${hotelEstimate * (data.days - 1)} |
| Cibo | € |
| Trasporti locali | € |
| Attrazioni | € |
| **Totale** | **€${budgetMin}–${budgetMax}** |
`;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  try {
    const body = await req.json();
    const { destination, flag, destinationCode, flightPrice, departDate, returnDate, direct, days } = body;

    if (!destination || !destinationCode) {
      return NextResponse.json({ error: 'destination e destinationCode richiesti' }, { status: 400 });
    }

    const slug = slugify(destination);

    const months = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
    void months;
    let period = 'Tutto l\'anno';
    if (departDate) {
      const parts = departDate.split(' ');
      const monthAbbr = parts[1]?.toLowerCase();
      const monthMap: Record<string, string> = { gen:'Gennaio',feb:'Febbraio',mar:'Marzo',apr:'Aprile',mag:'Maggio',giu:'Giugno',lug:'Luglio',ago:'Agosto',set:'Settembre',ott:'Ottobre',nov:'Novembre',dic:'Dicembre' };
      if (monthMap[monthAbbr]) period = monthMap[monthAbbr];
    }

    const content = buildMarkdown({
      destination, flag, destinationCode,
      flightPrice: flightPrice ?? 0,
      departDate, returnDate, direct: direct ?? true,
      tags: ['Cultura', 'Relax'],
      period,
      days: days ?? 5,
    });

    // Salva su Redis (funziona su Vercel — il filesystem è read-only)
    await saveDestinazioneRedis(slug, content);

    return NextResponse.json({ success: true, slug, filePath: `redis:${slug}` });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
