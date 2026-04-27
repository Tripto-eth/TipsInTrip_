'use client';

import Link from 'next/link';

interface Props {
  id: string;
  flag: string;
  destination: string;
  coverImage?: string;
  flightPrice?: number;
  hotelPerNight?: number;
  days: number;
  tags?: string[];
  itineraryCost: number;
  featured?: boolean;
}

export default function PacchettoCard({ id, flag, destination, coverImage, flightPrice, hotelPerNight, days, tags, itineraryCost, featured }: Props) {
  // Prezzo totale stimato: volo A/R + hotel
  const totalPrice = Math.round(
    ((flightPrice ?? 0) * 2) + ((hotelPerNight ?? 0) * days)
  );

  return (
    <Link href={`/destinazioni/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article className="pacchetto-card" style={{
        borderRadius: '16px', overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(36,0,70,0.7), rgba(20,0,50,0.9))',
        border: '1px solid rgba(224,170,255,0.2)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer', position: 'relative',
      }}>

        {/* Cover */}
        {coverImage && (
          <div style={{ height: '170px', overflow: 'hidden', position: 'relative' }}>
            <img src={coverImage} alt={destination} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(18,0,35,0.7) 0%, transparent 60%)' }} />
          </div>
        )}

        {/* Badge featured */}
        {featured && (
          <span style={{
            position: 'absolute', top: '0.65rem', left: '0.65rem',
            background: 'linear-gradient(135deg,#f59e0b,#d97706)',
            color: '#fff', fontSize: '0.65rem', fontWeight: 700,
            padding: '0.15rem 0.55rem', borderRadius: '999px', zIndex: 1,
          }}>⭐ In evidenza</span>
        )}

        <div style={{ padding: '0.9rem 1rem 1rem' }}>
          {/* Destination */}
          <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.3rem' }}>
            {flag} CTA → {destination}
          </div>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
              {tags.slice(0, 3).map((t) => (
                <span key={t} style={{
                  fontSize: '0.62rem', fontWeight: 600, padding: '0.1rem 0.45rem',
                  borderRadius: '999px', background: 'rgba(157,78,221,0.2)',
                  border: '1px solid rgba(157,78,221,0.35)', color: '#c77dff',
                }}>{t}</span>
              ))}
            </div>
          )}

          {/* Info riga */}
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {flightPrice && <span>✈️ da €{flightPrice}</span>}
            {hotelPerNight && <span>🏨 €{hotelPerNight}/notte</span>}
            <span>📅 {days} giorni</span>
          </div>

          {/* Prezzo totale + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.1rem' }}>
                ✈️+🏨 Totale stimato
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#a78bfa' }}>
                €{totalPrice}
              </span>
            </div>
            <span style={{
              background: 'var(--primary)', color: '#fff',
              padding: '0.45rem 0.9rem', borderRadius: '999px',
              fontSize: '0.82rem', fontWeight: 700,
            }}>
              Scopri →
            </span>
          </div>

          {/* Itinerario badge */}
          <div style={{ marginTop: '0.65rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            🗺️ Itinerario completo · <span style={{ color: '#c77dff' }}>{itineraryCost} crediti</span>
          </div>
        </div>
      </article>

      <style>{`
        .pacchetto-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(157,78,221,0.35);
        }
      `}</style>
    </Link>
  );
}
