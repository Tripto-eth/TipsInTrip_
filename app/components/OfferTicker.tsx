'use client';

import { useEffect, useState, useRef } from 'react';
import type { Offerta } from '../lib/offerte';

const STORAGE_KEY = 'offer-ticker-closed';

export default function OfferTicker() {
  const [offerte, setOfferte] = useState<Offerta[]>([]);
  const [visible, setVisible] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    fetch('/api/offerte')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.data) && d.data.length > 0) {
          setOfferte(d.data);
          setVisible(true);
        }
      })
      .catch(() => {});
  }, []);

  const close = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible || offerte.length === 0) return null;

  // Duplica gli item per far sembrare il loop infinito
  const items = [...offerte, ...offerte, ...offerte];

  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker-scroll ${Math.max(20, offerte.length * 8)}s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div style={{
        width: '100%',
        background: 'linear-gradient(90deg, rgba(157,78,221,0.25) 0%, rgba(36,0,70,0.6) 50%, rgba(157,78,221,0.25) 100%)',
        borderBottom: '1px solid rgba(224,170,255,0.2)',
        borderTop: '1px solid rgba(224,170,255,0.1)',
        position: 'relative',
        overflow: 'hidden',
        height: '38px',
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* Label fissa */}
        <div style={{
          flexShrink: 0,
          padding: '0 0.85rem',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          color: '#c77dff',
          textTransform: 'uppercase',
          borderRight: '1px solid rgba(224,170,255,0.2)',
          whiteSpace: 'nowrap',
          zIndex: 2,
          background: 'rgba(18,0,35,0.7)',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
        }}>
          🔥 Offerte
        </div>

        {/* Striscia scorrevole */}
        <div style={{ flex: 1, overflow: 'hidden', height: '100%', display: 'flex', alignItems: 'center' }}>
          <div className="ticker-track" ref={trackRef}>
            {items.map((o, i) => (
              <a
                key={`${o.id}-${i}`}
                href={o.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0 1.25rem',
                  fontSize: '0.8rem',
                  color: 'rgba(255,255,255,0.88)',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  borderRight: '1px solid rgba(255,255,255,0.08)',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#e0aaff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.88)')}
              >
                <span>{o.flag}</span>
                <span>CTA → {o.destination}</span>
                <span style={{ color: '#a78bfa', fontWeight: 700 }}>€{o.price}</span>
                {o.returnDate
                  ? <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem' }}>· A/R {o.departDate}–{o.returnDate}</span>
                  : <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem' }}>· {o.departDate}</span>
                }
              </a>
            ))}
          </div>
        </div>

        {/* Pulsante chiudi */}
        <button
          onClick={close}
          aria-label="Chiudi striscia offerte"
          style={{
            flexShrink: 0,
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.45)',
            fontSize: '1rem',
            cursor: 'pointer',
            padding: '0 0.75rem',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.15s',
            zIndex: 2,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
        >
          ✕
        </button>
      </div>
    </>
  );
}
