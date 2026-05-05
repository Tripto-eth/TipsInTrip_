'use client';

import { useState } from 'react';

interface FlightData {
  destination: string;
  destinationCode: string;
  flag: string;
  price: number;
  departDate: string;
  returnDate?: string;
  airline?: string;
  direct?: boolean;
}

interface Props {
  flight: FlightData;
  secret: string;
  onClose: () => void;
  onPublished: () => void;
}

const STYLES = [
  { id: 'luxury-chill',       emoji: '✨', label: 'Luxury + Chill',          desc: 'Hotel 5★, ritmo lento, esperienze esclusive' },
  { id: 'natura-davedere',    emoji: '🌿', label: 'Natura + Da vedere',       desc: 'Parchi, viewpoint, attrazioni principali, food locale' },
  { id: 'davedere-hiddengems',emoji: '🗝️', label: 'Da vedere + Hidden Gems',  desc: 'Landmark + bar locali, street food, non turistico' },
  { id: 'standard',           emoji: '💸', label: 'Standard',                 desc: 'Mix low-cost, tutto incluso, trasporto pubblico' },
];

const inputStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
  padding: '0.6rem 0.85rem', borderRadius: '8px', color: '#fff',
  outline: 'none', fontSize: '0.88rem', width: '100%', resize: 'vertical' as const,
  fontFamily: 'inherit', lineHeight: 1.5,
};

const taRows: Record<string, number> = {
  perche: 5, dormire: 4, nonPerdere: 5, quandoAndare: 3, voliInfo: 3, stylePreview: 2, itinerario: 14,
};

const fieldLabels: Record<string, string> = {
  perche: 'Perché visitare', dormire: 'Dove dormire',
  nonPerdere: 'Cosa non perdere', quandoAndare: 'Quando andare',
  voliInfo: 'Info volo', stylePreview: '✨ Preview (teaser paywall)', itinerario: '🔒 Itinerario (paywall)',
};

export default function PackageGeneratorModal({ flight, secret, onClose, onPublished }: Props) {
  const [selectedStyle, setSelectedStyle] = useState('');
  const [days, setDays] = useState(5);
  const [step, setStep] = useState<'style' | 'generating' | 'preview'>('style');
  const [generated, setGenerated] = useState<Record<string, string>>({});
  const [mapsPerDay, setMapsPerDay] = useState<Array<{ day: number; label: string; places: string[] }>>([]);
  const [styleLabel, setStyleLabel] = useState('');
  const [styleEmoji, setStyleEmoji] = useState('');
  const [hotelPerNight, setHotelPerNight] = useState(80);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!selectedStyle) return;
    setStep('generating');
    setError('');
    try {
      const res = await fetch('/api/admin/generate-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ ...flight, days, style: selectedStyle }),
      });
      if (!res.ok) throw new Error('Errore generazione');
      const data = await res.json();
      setGenerated({
        perche: data.perche ?? '',
        dormire: data.dormire ?? '',
        nonPerdere: data.nonPerdere ?? '',
        quandoAndare: data.quandoAndare ?? '',
        voliInfo: data.voliInfo ?? '',
        stylePreview: data.stylePreview ?? '',
        itinerario: data.itinerario ?? '',
      });
      setMapsPerDay(data.mapsPerDay ?? []);
      setStyleLabel(data.styleLabel ?? '');
      setStyleEmoji(data.styleEmoji ?? '');
      setHotelPerNight(data.hotelPerNight ?? 80);
      setStep('preview');
    } catch {
      setError('Errore durante la generazione. Riprova.');
      setStep('style');
    }
  };

  const publish = async () => {
    setPublishing(true);
    const fp = flight.price;
    const d = days;
    const hn = hotelPerNight;
    const bMin = Math.round(fp * 2 + hn * d * 0.8);
    const bMax = Math.round(fp * 2 + hn * d * 1.3);
    const slug = flight.destination.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const today = new Date().toISOString().split('T')[0];

    const markdown = `---
title: "${flight.destination} in ${d} giorni: voli, hotel e cosa fare"
destination: "${flight.destination}"
country: ""
flag: "${flight.flag}"
coverImage: ""
period: "Da definire"
duration: "${d} giorni"
budgetMin: ${bMin}
budgetMax: ${bMax}
tags: ["Viaggio", "Europa"]
flightFrom: "CTA"
flightPrice: ${fp}
hotelPerNight: ${hn}
itineraryCost: 3
featured: false
date: "${today}"
itineraryStyle: "${selectedStyle}"
styleLabel: "${styleLabel}"
styleEmoji: "${styleEmoji}"
stylePreview: ${JSON.stringify(generated.stylePreview)}
mapsJson: ${JSON.stringify(JSON.stringify(mapsPerDay))}
---

## Perché ${flight.destination}?

${generated.perche}

## Voli da Catania

${generated.voliInfo}

## Dove dormire

${generated.dormire}

## Cosa non perdere

${generated.nonPerdere}

## Quando andare

${generated.quandoAndare}

---
ITINERARY_LOCKED
---

${generated.itinerario}
`;

    const res = await fetch('/api/admin/destinazioni', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ slug, markdown }),
    });
    setPublishing(false);
    if (res.ok || res.status === 409) {
      onPublished();
      onClose();
    } else {
      setError('Errore pubblicazione.');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(36,0,70,0.97), rgba(20,0,50,0.99))',
        border: '1px solid rgba(224,170,255,0.2)', borderRadius: '20px',
        width: '100%', maxWidth: '720px', maxHeight: '90dvh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>
              {flight.flag} Crea pacchetto — {flight.destination}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.2rem' }}>
              ✈️ €{flight.price} · {flight.departDate}{flight.returnDate ? ` → ${flight.returnDate}` : ' (solo andata)'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Body scrollabile */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '1.5rem' }}>

          {/* Step 1: selezione stile + giorni */}
          {(step === 'style' || step === 'generating') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(224,170,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.85rem' }}>
                  Scegli lo stile del pacchetto
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {STYLES.map((s) => (
                    <button key={s.id} type="button" onClick={() => setSelectedStyle(s.id)}
                      style={{
                        background: selectedStyle === s.id ? 'rgba(157,78,221,0.3)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${selectedStyle === s.id ? 'rgba(157,78,221,0.7)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '12px', padding: '0.9rem 1rem', cursor: 'pointer',
                        textAlign: 'left', color: '#fff', transition: 'all 0.15s',
                      }}>
                      <div style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>{s.emoji}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.2rem' }}>{s.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>Giorni:</div>
                {[3, 5, 7, 10, 14].map((n) => (
                  <button key={n} type="button" onClick={() => setDays(n)}
                    style={{ padding: '0.3rem 0.75rem', borderRadius: '999px', border: `1px solid ${days === n ? 'rgba(157,78,221,0.8)' : 'rgba(255,255,255,0.15)'}`, background: days === n ? 'rgba(157,78,221,0.3)' : 'transparent', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                    {n}gg
                  </button>
                ))}
              </div>

              {error && <p style={{ color: '#f87171', fontSize: '0.85rem' }}>{error}</p>}

              <button
                onClick={generate}
                disabled={!selectedStyle || step === 'generating'}
                style={{
                  padding: '0.85rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem',
                  background: selectedStyle ? 'linear-gradient(135deg, rgba(157,78,221,0.7), rgba(110,40,180,0.8))' : 'rgba(255,255,255,0.08)',
                  border: 'none', color: '#fff', cursor: selectedStyle ? 'pointer' : 'not-allowed',
                  opacity: step === 'generating' ? 0.7 : 1,
                }}
              >
                {step === 'generating' ? '⏳ Claude sta generando il pacchetto...' : '✨ Genera con AI'}
              </button>
            </div>
          )}

          {/* Step 2: preview editabile */}
          {step === 'preview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 1rem', background: 'rgba(157,78,221,0.15)', border: '1px solid rgba(157,78,221,0.35)', borderRadius: '10px', fontSize: '0.85rem' }}>
                <span>{styleEmoji}</span>
                <span style={{ fontWeight: 700 }}>{styleLabel}</span>
                <span style={{ color: 'rgba(255,255,255,0.45)', marginLeft: 'auto' }}>{days} giorni · €{hotelPerNight}/notte (hotel stimato)</span>
              </div>

              {Object.entries(fieldLabels).map(([key, label]) => (
                <div key={key}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: key === 'itinerario' ? 'rgba(255,200,100,0.7)' : key === 'stylePreview' ? '#c77dff' : 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.35rem' }}>
                    {label}
                  </label>
                  <textarea
                    value={generated[key] ?? ''}
                    onChange={(e) => setGenerated(p => ({ ...p, [key]: e.target.value }))}
                    rows={taRows[key]}
                    style={inputStyle}
                  />
                </div>
              ))}

              {/* Google Maps preview */}
              {mapsPerDay.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                    🗺️ Google Maps generati ({mapsPerDay.length} giorni)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {mapsPerDay.map((d) => (
                      <div key={d.day} style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.75rem', borderRadius: '8px' }}>
                        <span style={{ color: '#a78bfa', fontWeight: 600 }}>{d.label}</span>: {d.places.join(' → ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && <p style={{ color: '#f87171', fontSize: '0.85rem' }}>{error}</p>}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setStep('style')}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }}>
                  ← Rigenera
                </button>
                <button onClick={publish} disabled={publishing}
                  style={{ flex: 2, padding: '0.75rem', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(157,78,221,0.7), rgba(110,40,180,0.85))', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', opacity: publishing ? 0.7 : 1 }}>
                  {publishing ? '⏳ Pubblicazione...' : '🚀 Pubblica pacchetto'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
