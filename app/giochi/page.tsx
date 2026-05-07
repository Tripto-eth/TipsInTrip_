import Link from 'next/link';
import styles from '../page.module.css';

const GAMES = [
  {
    href: '/giochi/quiz',
    emoji: '🌍',
    title: 'Quiz Viaggi',
    desc: '10 domande su capitali, bandiere e curiosità travel. 3 difficoltà, classifica personale.',
    badge: 'Disponibile',
    badgeColor: 'rgba(74,222,128,0.2)',
    badgeBorder: 'rgba(74,222,128,0.4)',
    badgeText: '#4ade80',
    available: true,
  },
  {
    href: '/giochi/bandiere',
    emoji: '🚩',
    title: 'Indovina la Bandiera',
    desc: 'Vedi una bandiera emoji e scegli a quale nazione appartiene tra 4 opzioni. 160 paesi, 3 difficoltà.',
    badge: 'Disponibile',
    badgeColor: 'rgba(74,222,128,0.2)',
    badgeBorder: 'rgba(74,222,128,0.4)',
    badgeText: '#4ade80',
    available: true,
  },
  {
    href: '#',
    emoji: '💸',
    title: 'Indovina il Prezzo',
    desc: 'Ti mostriamo una rotta (es. CTA→LHR) e tu devi indovinare il range di prezzo.',
    badge: 'Presto',
    badgeColor: 'rgba(251,191,36,0.15)',
    badgeBorder: 'rgba(251,191,36,0.35)',
    badgeText: '#fbbf24',
    available: false,
  },
  {
    href: '#',
    emoji: '🗺️',
    title: 'Paese Misterioso',
    desc: '5 indizi rivelati uno alla volta: meno usi, più punti guadagni. Indovina la nazione.',
    badge: 'Presto',
    badgeColor: 'rgba(251,191,36,0.15)',
    badgeBorder: 'rgba(251,191,36,0.35)',
    badgeText: '#fbbf24',
    available: false,
  },
];

export default function GiochiPage() {
  return (
    <main className={styles.main} style={{ paddingBottom: '5rem' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1.25rem 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎮</div>
          <h1 style={{ fontSize: 'clamp(1.6rem,5vw,2.2rem)', fontWeight: 900, color: '#fff', margin: '0 0 0.5rem' }}>
            TipsinTrip Games
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.65)', margin: '0 0 0.4rem', lineHeight: 1.5 }}>
            Metti alla prova la tua conoscenza del mondo
          </p>
          <p style={{ fontSize: '0.82rem', margin: 0, lineHeight: 1.55 }}>
            <span style={{ color: 'rgba(255,255,255,0.45)' }}>e guadagna </span>
            <span style={{ color: '#c77dff', fontWeight: 700 }}>crediti TipsinTrip</span>
            <span style={{ color: 'rgba(255,255,255,0.45)' }}> per </span>
            <span style={{ color: 'rgba(255,255,255,0.75)' }}>Chat AI, Sconti, Itinerari e molto altro!</span>
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {GAMES.map((g) => (
            <Link
              key={g.title}
              href={g.href}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '1rem',
                padding: '1.1rem 1.25rem', borderRadius: 18,
                background: g.available ? 'rgba(157,78,221,0.08)' : 'rgba(255,255,255,0.03)',
                border: g.available ? '1px solid rgba(157,78,221,0.3)' : '1px solid rgba(255,255,255,0.07)',
                textDecoration: 'none', color: '#fff',
                opacity: g.available ? 1 : 0.65,
                pointerEvents: g.available ? 'auto' : 'none',
                transition: 'transform 0.15s, border-color 0.15s',
              }}
            >
              <div style={{ fontSize: '2.2rem', flexShrink: 0, lineHeight: 1 }}>{g.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{g.title}</span>
                  <span style={{
                    padding: '1px 8px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700,
                    background: g.badgeColor, border: `1px solid ${g.badgeBorder}`, color: g.badgeText,
                  }}>{g.badge}</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>{g.desc}</p>
              </div>
              {g.available && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '1.1rem', flexShrink: 0, alignSelf: 'center' }}>→</span>}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
