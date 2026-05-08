'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../page.module.css';
import { useLang } from '../context/LanguageContext';
import type { LeaderboardEntry } from '../api/quiz/score/route';

const GAME_LABELS: Record<string, { label: string; emoji: string }> = {
  quiz:     { label: 'Quiz',      emoji: '🌍' },
  flags:    { label: 'Bandiere',  emoji: '🚩' },
  emoji:    { label: 'Emoji',     emoji: '🤔' },
};

function CombinedLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/quiz/score?game=all')
      .then(r => r.json())
      .then(d => setEntries(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '1rem 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
      Caricamento…
    </div>
  );
  if (!entries.length) return (
    <div style={{ textAlign: 'center', padding: '1rem 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
      Nessun punteggio ancora — sii il primo!
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      {entries.map((e, i) => {
        const g = GAME_LABELS[e.game ?? 'quiz'] ?? { label: e.game ?? '', emoji: '🎮' };
        return (
          <div key={`${e.userId}-${e.game}`} style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.5rem 0.75rem', borderRadius: 10,
            background: i === 0 ? 'rgba(157,78,221,0.1)' : 'rgba(255,255,255,0.02)',
            border: i === 0 ? '1px solid rgba(157,78,221,0.2)' : '1px solid rgba(255,255,255,0.04)',
          }}>
            <span style={{ fontSize: '0.8rem', width: 20, flexShrink: 0, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
            </span>
            <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {e.name}
            </span>
            <span style={{
              fontSize: '0.65rem', fontWeight: 600, padding: '1px 6px', borderRadius: 999,
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {g.emoji} {g.label}
            </span>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: i < 3 ? '#c77dff' : 'rgba(255,255,255,0.7)', flexShrink: 0 }}>
              {e.score}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function GiochiPage() {
  const { t } = useLang();
  const g = t.games;

  const GAMES = [
    { href: '/giochi/quiz',     emoji: '🌍', title: g.quizTitle,    desc: g.quizDesc,    badge: g.available,   bc: 'rgba(74,222,128,0.2)',  bb: 'rgba(74,222,128,0.4)',  bt: '#4ade80', ok: true },
    { href: '/giochi/bandiere', emoji: '🚩', title: g.flagTitle,    desc: g.flagDesc,    badge: g.available,   bc: 'rgba(74,222,128,0.2)',  bb: 'rgba(74,222,128,0.4)',  bt: '#4ade80', ok: true },
    { href: '/giochi/emoji',    emoji: '🤔', title: "Indovina dall'Emoji", desc: 'Tre emoji, una destinazione. Paesi, città, cibo e compagnie aeree.', badge: g.available, bc: 'rgba(74,222,128,0.2)', bb: 'rgba(74,222,128,0.4)', bt: '#4ade80', ok: true },
    { href: '#',                emoji: '💸', title: g.priceTitle,   desc: g.priceDesc,   badge: g.comingSoon,  bc: 'rgba(251,191,36,0.15)', bb: 'rgba(251,191,36,0.35)', bt: '#fbbf24', ok: false },
    { href: '#',                emoji: '🗺️', title: g.mysteryTitle, desc: g.mysteryDesc, badge: g.comingSoon,  bc: 'rgba(251,191,36,0.15)', bb: 'rgba(251,191,36,0.35)', bt: '#fbbf24', ok: false },
  ];

  return (
    <main className={styles.main} style={{ paddingBottom: '5rem' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1.25rem 0' }}>

        {/* Header */}
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

        {/* Game cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
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

        {/* Combined leaderboard */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            🏆 Classifica globale
          </div>
          <CombinedLeaderboard />
        </div>

      </div>
    </main>
  );
}
