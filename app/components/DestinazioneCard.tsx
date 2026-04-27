'use client';

import Link from 'next/link';
import type { DestinazioneM } from '../lib/destinazioni';

export default function DestinazioneCard({ d }: { d: DestinazioneM }) {
  return (
    <Link href={`/destinazioni/${d.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <article
        className="dest-card"
        style={{
          borderRadius: '18px',
          overflow: 'hidden',
          background: 'rgba(36,0,70,0.4)',
          border: '1px solid rgba(255,255,255,0.08)',
          transition: 'transform 0.25s, box-shadow 0.25s',
          cursor: 'pointer',
        }}
      >
        <div style={{ position: 'relative', height: '210px', overflow: 'hidden' }}>
          {d.coverImage && (
            <img src={d.coverImage} alt={d.destination} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {d.featured && (
            <span style={{
              position: 'absolute', top: '0.75rem', left: '0.75rem',
              background: 'linear-gradient(135deg,#f59e0b,#d97706)',
              color: '#fff', fontSize: '0.68rem', fontWeight: 700,
              padding: '0.2rem 0.6rem', borderRadius: '999px',
            }}>⭐ In evidenza</span>
          )}
          <span style={{
            position: 'absolute', bottom: '0.75rem', right: '0.75rem',
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
            color: '#fff', fontSize: '0.7rem', fontWeight: 600,
            padding: '0.2rem 0.6rem', borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            🗺️ Itinerario · {d.itineraryCost} crediti
          </span>
        </div>

        <div style={{ padding: '1.1rem 1.25rem 1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.65rem' }}>
            {d.tags?.slice(0, 3).map((tag) => (
              <span key={tag} style={{
                fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.5rem',
                borderRadius: '999px', background: 'rgba(157,78,221,0.2)',
                border: '1px solid rgba(157,78,221,0.4)', color: '#c77dff',
              }}>{tag}</span>
            ))}
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.35rem', color: '#fff', lineHeight: 1.3 }}>
            {d.flag} {d.destination}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', margin: '0 0 0.85rem' }}>
            {d.period} · {d.duration}
          </p>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', flexWrap: 'wrap' }}>
            {d.flightPrice && <span style={{ color: '#a78bfa', fontWeight: 700 }}>✈️ da €{d.flightPrice}</span>}
            {d.hotelPerNight && <span style={{ color: 'rgba(255,255,255,0.55)' }}>🏨 ~€{d.hotelPerNight}/notte</span>}
            {d.budgetMin && <span style={{ color: 'rgba(255,255,255,0.55)' }}>💰 €{d.budgetMin}–{d.budgetMax}</span>}
          </div>
        </div>
      </article>

      <style>{`
        .dest-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 40px rgba(157,78,221,0.3);
        }
      `}</style>
    </Link>
  );
}
