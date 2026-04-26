import type { Offerta } from '../lib/offerte';

export default function OffertaCard({ o, onDelete, adminSecret }: {
  o: Offerta;
  onDelete?: (id: string) => void;
  adminSecret?: string;
}) {
  const handleDelete = async () => {
    if (!adminSecret || !onDelete) return;
    await fetch('/api/admin/offerte', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
      body: JSON.stringify({ id: o.id }),
    });
    onDelete(o.id);
  };

  return (
    <a
      href={o.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, rgba(36,0,70,0.7) 0%, rgba(20,0,50,0.9) 100%)',
        border: '1px solid rgba(224,170,255,0.2)',
        borderRadius: '16px',
        overflow: 'hidden',
        textDecoration: 'none',
        color: '#fff',
        transition: 'transform 0.2s, box-shadow 0.2s',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 12px 32px rgba(157,78,221,0.35)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
      }}
    >
      {/* Badge highlight */}
      {o.highlight && (
        <div style={{
          position: 'absolute', top: '0.6rem', right: '0.6rem',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#fff', fontSize: '0.65rem', fontWeight: 700,
          padding: '0.2rem 0.55rem', borderRadius: '999px', letterSpacing: '0.03em',
        }}>
          {o.highlight}
        </div>
      )}

      {/* Header destinazione */}
      <div style={{ padding: '1.1rem 1.1rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ fontSize: '2rem' }}>{o.flag}</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2 }}>{o.destination}</div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.1rem' }}>
            {o.direct ? '✈️ Volo diretto' : '✈️ Con scalo'} · {o.airline}
          </div>
        </div>
      </div>

      {/* Date */}
      <div style={{ padding: '0 1.1rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)' }}>
        📅 {o.departDate}{o.returnDate ? ` → ${o.returnDate}` : ' (solo andata)'}
      </div>

      {/* Prezzo + CTA */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.8rem 1.1rem 1rem', marginTop: '0.5rem',
      }}>
        <div>
          {o.originalPrice && (
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through', marginRight: '0.4rem' }}>
              €{o.originalPrice}
            </span>
          )}
          <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#a78bfa' }}>€{o.price}</span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginLeft: '0.3rem' }}>p.p.</span>
        </div>
        <span style={{
          background: 'var(--primary)', color: '#fff',
          padding: '0.5rem 1rem', borderRadius: '999px',
          fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap',
        }}>
          Prenota →
        </span>
      </div>

      {/* Bottone admin elimina */}
      {adminSecret && onDelete && (
        <button
          onClick={(e) => { e.preventDefault(); handleDelete(); }}
          style={{
            background: 'rgba(220,50,50,0.2)', border: '1px solid rgba(220,50,50,0.4)',
            color: '#fca5a5', fontSize: '0.72rem', padding: '0.3rem 0.7rem',
            margin: '0 1.1rem 0.8rem', borderRadius: '8px', cursor: 'pointer',
            width: 'fit-content',
          }}
        >
          🗑 Elimina
        </button>
      )}
    </a>
  );
}
