'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import styles from '../blog/blog.module.css';

interface Props {
  slug: string;
  itineraryCost: number;
  itineraryHtml: string;
  destination: string;
}

const STORAGE_PREFIX = 'itinerary-unlocked-';

export default function ItineraryGate({ slug, itineraryCost, itineraryHtml, destination }: Props) {
  const { isSignedIn } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'error' | 'nocredits'>('idle');

  useEffect(() => {
    // Controlla se già sbloccato in questa sessione
    if (localStorage.getItem(STORAGE_PREFIX + slug)) {
      setUnlocked(true);
      return;
    }
    // Carica crediti utente
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

  return (
    <div style={{ marginTop: '3rem' }}>
      {/* Separatore */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>ITINERARIO COMPLETO</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
      </div>

      {unlocked ? (
        /* Contenuto sbloccato */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#4ade80', fontSize: '0.9rem', fontWeight: 600 }}>
            ✓ Itinerario sbloccato
          </div>
          <div
            className={styles.articleContent}
            dangerouslySetInnerHTML={{ __html: itineraryHtml }}
            style={{ lineHeight: 1.8, fontSize: '1rem' }}
          />
        </div>
      ) : (
        /* Paywall */
        <div style={{ position: 'relative' }}>
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
              <p style={{ color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Errore. Riprova.
              </p>
            )}

            <button
              onClick={handleUnlock}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, rgba(157,78,221,0.8), rgba(110,40,180,0.9))',
                border: '1px solid rgba(224,170,255,0.4)',
                color: '#fff', fontSize: '1rem', fontWeight: 700,
                padding: '0.85rem 2rem', borderRadius: '999px', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(157,78,221,0.4)',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Sblocco...' : `🔓 Sblocca itinerario — ${itineraryCost} crediti`}
            </button>

            {!isSignedIn && (
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.75rem' }}>
                Accedi per utilizzare i tuoi crediti
              </p>
            )}
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
