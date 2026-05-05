'use client';

const PHRASES = [
  'Conosci il tuo Local prima di partire',
  'Prenota il tuo Local Expert ✦',
  'Crea l\'itinerario insieme ✦',
  'Vivi il viaggio senza pensieri ✦',
];

const looped = [...PHRASES, ...PHRASES, ...PHRASES];

export default function GuideTicker() {
  return (
    <>
      <style>{`
        @keyframes guide-ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .guide-ticker-track {
          display: flex;
          width: max-content;
          animation: guide-ticker-scroll 18s linear infinite;
        }
        .guide-ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div style={{
        width: '100%',
        background: 'linear-gradient(90deg, rgba(157,78,221,0.25) 0%, rgba(36,0,70,0.6) 50%, rgba(157,78,221,0.25) 100%)',
        borderBottom: '1px solid rgba(224,170,255,0.2)',
        borderTop: '1px solid rgba(224,170,255,0.1)',
        overflow: 'hidden',
        height: '38px',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{ flex: 1, overflow: 'hidden', height: '100%', display: 'flex', alignItems: 'center' }}>
          <div className="guide-ticker-track">
            {looped.map((phrase, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 2rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.88)',
                  whiteSpace: 'nowrap',
                  borderRight: '1px solid rgba(255,255,255,0.08)',
                  letterSpacing: '0.01em',
                }}
              >
                {phrase}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
