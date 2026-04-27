'use client';

import { useEffect, useState, useRef } from 'react';
import type { Offerta } from '../lib/offerte';

interface TickerItem {
  id: string;
  flag: string;
  destination: string;
  price: number;
  departDate?: string;
  returnDate?: string;
  label: string; // es. "✈️" o "✈️+🏨"
  days?: number;
  href: string;
}

const STORAGE_KEY = 'offer-ticker-closed';

function parseDays(duration: string): number {
  const n = parseInt(duration);
  return isNaN(n) ? 5 : n;
}

export default function OfferTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [visible, setVisible] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    Promise.all([
      fetch('/api/offerte').then(r => r.json()).catch(() => ({ data: [] })),
      fetch('/api/destinazioni').then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([offRes, destRes]) => {
      const offerte: Offerta[] = offRes.data ?? [];
      const destinazioni: Array<{ id: string; flag: string; destination: string; flightPrice?: number; hotelPerNight?: number; duration: string }> = destRes.data ?? [];

      const tickerItems: TickerItem[] = [
        ...offerte.map((o) => ({
          id: o.id,
          flag: o.flag,
          destination: o.destination,
          price: o.price,
          departDate: o.departDate,
          returnDate: o.returnDate,
          label: '✈️',
          href: '/offerte-catania',
        })),
        ...destinazioni.map((d) => {
          const days = parseDays(d.duration);
          const total = Math.round(((d.flightPrice ?? 0) * 2) + ((d.hotelPerNight ?? 0) * days));
          return {
            id: `dest-${d.id}`,
            flag: d.flag,
            destination: d.destination,
            price: total,
            label: '✈️+🏨',
            days,
            href: `/destinazioni/${d.id}`,
          };
        }),
      ];

      if (tickerItems.length > 0) {
        setItems(tickerItems);
        setVisible(true);
      }
    });
  }, []);

  const close = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible || items.length === 0) return null;

  const looped = [...items, ...items, ...items];

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
          animation: ticker-scroll ${Math.max(20, items.length * 8)}s linear infinite;
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
            {looped.map((item, i) => (
              <a
                key={`${item.id}-${i}`}
                href={item.href}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0 1.25rem', fontSize: '0.8rem',
                  color: 'rgba(255,255,255,0.88)', textDecoration: 'none',
                  whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.08)',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#e0aaff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.88)')}
              >
                <span>{item.flag}</span>
                <span>CTA → {item.destination}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>{item.label}</span>
                <span style={{ color: '#a78bfa', fontWeight: 700 }}>€{item.price}</span>
                {item.days
                  ? <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>· {item.days}gg</span>
                  : item.departDate
                    ? <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>· {item.departDate}{item.returnDate ? `–${item.returnDate}` : ''}</span>
                    : null
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
