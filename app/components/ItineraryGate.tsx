'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import styles from '../blog/blog.module.css';
import type { MapsDay } from '../lib/destinazioni';

interface Props {
  slug: string;
  itineraryCost: number;
  itineraryHtml: string;
  destination: string;
  itineraryStyle?: string;
  styleLabel?: string;
  styleEmoji?: string;
  stylePreview?: string;
  mapsPerDay?: MapsDay[];
}

const STORAGE_PREFIX = 'itinerary-unlocked-';

function buildMapsUrl(places: string[]): string {
  if (places.length === 0) return '';
  if (places.length === 1) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(places[0])}`;
  const origin = encodeURIComponent(places[0]);
  const destination = encodeURIComponent(places[places.length - 1]);
  const waypoints = places.slice(1, -1).map(encodeURIComponent).join('|');
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}`;
}

export default function ItineraryGate({ slug, itineraryCost, itineraryHtml, destination, itineraryStyle, styleLabel, styleEmoji, stylePreview, mapsPerDay }: Props) {
  const { isSignedIn } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'error' | 'nocredits'>('idle');

  useEffect(() => {
    if (localStorage.getItem(STORAGE_PREFIX + slug)) { setUnlocked(true); return; }
    if (isSignedIn) {
      fetch('/api/chat').then(r => r.json()).then(d => {
        if (typeof d.credits === 'number') setCredits(d.credits);
      }).catch(() => {});
    }
  }, [isSignedIn, slug]);

  const handleUnlock = async () => {
    if (!isSignedIn) { window.location.href = '/chat'; return; }
    if (credits !== null && credits < itineraryCost) { setStatus('nocredits'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/itinerary/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) {
        localStorage.setItem(STORAGE_PREFIX + slug, '1');
        setUnlocked(true);
        setStatus('ok');
      } else {
        const d = await res.json();
        setStatus(d.creditsExhausted ? 'nocredits' : 'error');
      }
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ marginTop: '3rem' }}>
      {/* Separatore */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>ITINERARIO COMPLETO</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
      </div>

      {unlocked ? (
        <div>
          {/* Header sbloccato */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: '#4ade80', fontSize: '0.9rem', fontWeight: 600 }}>✓ Itinerario sbloccato</span>
              {styleLabel && (
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: '999px', background: 'rgba(157,78,221,0.2)', border: '1px solid rgba(157,78,221,0.4)', color: '#c77dff' }}>
                  {styleEmoji} {styleLabel}
                </span>
              )}
            </div>
            <button
              onClick={handlePrint}
              className="no-print"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', borderRadius: '999px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
            >
              📄 Scarica PDF
            </button>
          </div>

          {/* Itinerario */}
          <div
            className={styles.articleContent}
            dangerouslySetInnerHTML={{ __html: itineraryHtml }}
            style={{ lineHeight: 1.8, fontSize: '1rem' }}
          />

          {/* Google Maps per giorno */}
          {mapsPerDay && mapsPerDay.length > 0 && (
            <div className="no-print" style={{ marginTop: '2rem', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.85rem' }}>
                🗺️ Apri su Google Maps
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {mapsPerDay.map((d) => {
                  const url = buildMapsUrl(d.places);
                  if (!url) return null;
                  return (
                    <a key={d.day} href={url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', borderRadius: '999px', background: 'rgba(66,133,244,0.15)', border: '1px solid rgba(66,133,244,0.35)', color: '#93c5fd', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      🗺️ {d.label}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Badge stile — preview gratuita */}
          {itineraryStyle && styleLabel && (
            <div style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem', background: 'rgba(157,78,221,0.1)', border: '1px solid rgba(157,78,221,0.25)', borderRadius: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{styleEmoji}</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#c77dff' }}>{styleLabel}</span>
              </div>
              {stylePreview && (
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.6 }}>{stylePreview}</p>
              )}
            </div>
          )}

          {/* Anteprima sfocata */}
          <div style={{ filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none', maxHeight: '280px', overflow: 'hidden' }}
            dangerouslySetInnerHTML={{ __html: itineraryHtml }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, rgba(18,0,35,0.95) 70%)' }} />

          {/* Card sblocco */}
          <div style={{
            position: 'relative', marginTop: '-80px', zIndex: 2,
            background: 'rgba(36,0,70,0.7)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(224,170,255,0.25)', borderRadius: '20px',
            padding: '2rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🗺️</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
              Itinerario giorno per giorno — {destination}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              Piano completo con orari, indirizzi, prezzi reali e consigli insider.<br />
              Sblocca una volta, tieni per sempre.
            </p>

            {status === 'nocredits' && (
              <p style={{ color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Crediti insufficienti. Hai {credits} crediti, servono {itineraryCost}.
              </p>
            )}
            {status === 'error' && (
              <p style={{ color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1rem' }}>Errore. Riprova.</p>
            )}

            <button onClick={handleUnlock} disabled={loading} style={{
              background: 'linear-gradient(135deg, rgba(157,78,221,0.8), rgba(110,40,180,0.9))',
              border: '1px solid rgba(224,170,255,0.4)', color: '#fff', fontSize: '1rem', fontWeight: 700,
              padding: '0.85rem 2rem', borderRadius: '999px', cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px rgba(157,78,221,0.4)', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Sblocco...' : `🔓 Sblocca itinerario — ${itineraryCost} crediti`}
            </button>

            {!isSignedIn && <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.75rem' }}>Accedi per utilizzare i tuoi crediti</p>}
            {isSignedIn && credits !== null && (
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.75rem' }}>
                Hai {credits} crediti · {credits >= itineraryCost ? 'Sufficienti ✓' : 'Insufficienti'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
