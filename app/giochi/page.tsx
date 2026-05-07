'use client';

import Link from 'next/link';
import styles from '../page.module.css';
import { useLang } from '../context/LanguageContext';

export default function GiochiPage() {
  const { t } = useLang();
  const g = t.games;

  const GAMES = [
    { href: '/giochi/quiz',     emoji: '🌍', title: g.quizTitle,    desc: g.quizDesc,    badge: g.available,   bc: 'rgba(74,222,128,0.2)',  bb: 'rgba(74,222,128,0.4)',  bt: '#4ade80', ok: true },
    { href: '/giochi/bandiere', emoji: '🚩', title: g.flagTitle,    desc: g.flagDesc,    badge: g.available,   bc: 'rgba(74,222,128,0.2)',  bb: 'rgba(74,222,128,0.4)',  bt: '#4ade80', ok: true },
    { href: '#',                emoji: '💸', title: g.priceTitle,   desc: g.priceDesc,   badge: g.comingSoon,  bc: 'rgba(251,191,36,0.15)', bb: 'rgba(251,191,36,0.35)', bt: '#fbbf24', ok: false },
    { href: '#',                emoji: '🗺️', title: g.mysteryTitle, desc: g.mysteryDesc, badge: g.comingSoon,  bc: 'rgba(251,191,36,0.15)', bb: 'rgba(251,191,36,0.35)', bt: '#fbbf24', ok: false },
  ];

  return (
    <main className={styles.main} style={{ paddingBottom: '5rem' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1.25rem 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎮</div>
          <h1 style={{ fontSize: 'clamp(1.6rem,5vw,2.2rem)', fontWeight: 900, color: '#fff', margin: '0 0 0.5rem' }}>
            {g.pageTitle}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.65)', margin: '0 0 0.4rem', lineHeight: 1.5 }}>
            {g.subtitle}
          </p>
          <p style={{ fontSize: '0.82rem', margin: 0, lineHeight: 1.55 }}>
            <span style={{ color: 'rgba(255,255,255,0.45)' }}>{g.tagline.split('crediti TipsinTrip')[0]}</span>
            <span style={{ color: '#c77dff', fontWeight: 700 }}>crediti TipsinTrip</span>
            <span style={{ color: 'rgba(255,255,255,0.75)' }}>{g.tagline.split('crediti TipsinTrip')[1]}</span>
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {GAMES.map((game) => (
            <Link
              key={game.title}
              href={game.href}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '1rem',
                padding: '1.1rem 1.25rem', borderRadius: 18,
                background: game.ok ? 'rgba(157,78,221,0.08)' : 'rgba(255,255,255,0.03)',
                border: game.ok ? '1px solid rgba(157,78,221,0.3)' : '1px solid rgba(255,255,255,0.07)',
                textDecoration: 'none', color: '#fff',
                opacity: game.ok ? 1 : 0.65,
                pointerEvents: game.ok ? 'auto' : 'none',
              }}
            >
              <div style={{ fontSize: '2.2rem', flexShrink: 0, lineHeight: 1 }}>{game.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{game.title}</span>
                  <span style={{ padding: '1px 8px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, background: game.bc, border: `1px solid ${game.bb}`, color: game.bt }}>
                    {game.badge}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>{game.desc}</p>
              </div>
              {game.ok && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '1.1rem', flexShrink: 0, alignSelf: 'center' }}>→</span>}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
