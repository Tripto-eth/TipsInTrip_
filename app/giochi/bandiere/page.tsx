'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth, SignInButton } from '@clerk/nextjs';
import { useLang } from '../../context/LanguageContext';
import { DIFFICULTY_CONFIG, type Difficulty, getLeaderboard, saveScore } from '../../lib/quizData';

const PURPLE = '#9d4edd';
const PURPLE_LIGHT = '#c77dff';
const BG = `radial-gradient(circle at 20% 0%, rgba(157,78,221,0.18) 0%, transparent 55%), radial-gradient(circle at 80% 80%, rgba(90,0,160,0.12) 0%, transparent 50%), #120023`;
const OPTS = ['A', 'B', 'C', 'D'];

interface FlagRound {
  flag: string;
  country: string;
  opts: [string, string, string, string];
  a: 0 | 1 | 2 | 3;
}

function TimerBar({ seconds, max }: { seconds: number; max: number }) {
  const pct = (seconds / max) * 100;
  const color = pct > 50 ? '#4ade80' : pct > 25 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: '1rem' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 1s linear, background 0.5s' }} />
    </div>
  );
}

type Phase = 'menu' | 'playing' | 'feedback' | 'results';

export default function BandierePage() {
  const { isSignedIn } = useAuth();
  const { t } = useLang();
  const tg = t.games;
  const [phase, setPhase] = useState<Phase>('menu');
  const [diff, setDiff] = useState<Difficulty>('easy');
  const [rounds, setRounds] = useState<FlagRound[]>([]);
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cfg = DIFFICULTY_CONFIG[diff];
  const round = rounds[qi];

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startGame = async (d: Difficulty) => {
    setDiff(d);
    setPhase('playing');
    setQi(0); setScore(0); setCorrect(0); setSelected(null); setSaved(false);
    setTimeLeft(DIFFICULTY_CONFIG[d].time);
    try {
      const res = await fetch(`/api/quiz/flags?diff=${d}&count=10`);
      const data = await res.json();
      setRounds(data.data || []);
    } catch { setPhase('menu'); }
  };

  useEffect(() => {
    if (phase !== 'playing') return;
    setTimeLeft(DIFFICULTY_CONFIG[diff].time);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { stopTimer(); handleAnswer(-1); return 0; }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qi, phase]);

  const handleAnswer = useCallback((idx: number) => {
    if (phase !== 'playing' || !round) return;
    stopTimer();
    setSelected(idx);
    if (idx === round.a) {
      const bonus = Math.round((timeLeft / cfg.time) * 10);
      setScore(s => s + cfg.points + bonus);
      setCorrect(c => c + 1);
    }
    setPhase('feedback');
    setTimeout(() => {
      if (qi + 1 >= rounds.length) setPhase('results');
      else { setQi(i => i + 1); setSelected(null); setPhase('playing'); }
    }, 1400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round, qi, rounds.length, cfg, timeLeft, stopTimer]);

  useEffect(() => {
    if (phase !== 'results') return;
    saveScore({ score, correct, total: rounds.length, diff, date: new Date().toISOString() });
    if (isSignedIn && !saved) {
      setSaved(true);
      fetch('/api/quiz/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, correct, total: rounds.length, diff }),
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const btnStyle = (idx: number): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: '100%', padding: '0.85rem 1rem', borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.05)',
      color: '#fff', fontSize: '0.92rem', fontWeight: 500,
      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.75rem',
    };
    if (phase !== 'feedback' || selected === null) return base;
    if (idx === round?.a) return { ...base, background: 'rgba(74,222,128,0.18)', border: '1px solid rgba(74,222,128,0.55)', color: '#4ade80', fontWeight: 700 };
    if (idx === selected) return { ...base, background: 'rgba(248,113,113,0.18)', border: '1px solid rgba(248,113,113,0.55)', color: '#f87171' };
    return { ...base, opacity: 0.4 };
  };

  const pageStyle: React.CSSProperties = { minHeight: '100dvh', background: BG, color: '#fff', padding: '1.5rem 1.25rem 5rem', maxWidth: 600, margin: '0 auto' };

  // ── MENU ────────────────────────────────────────────────────────────────
  if (phase === 'menu') return (
    <main style={pageStyle}>
      <Link href="/giochi" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
        {tg.back}
      </Link>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🚩</div>
        <h1 style={{ fontSize: 'clamp(1.6rem,5vw,2.2rem)', fontWeight: 900, margin: '0 0 0.5rem', background: `linear-gradient(135deg,#fff,${PURPLE_LIGHT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {tg.flagTitle}
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          {tg.flagSubtitle}
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
          const c = DIFFICULTY_CONFIG[d];
          return (
            <button key={d} onClick={() => startGame(d)} style={{
              padding: '1rem 1.25rem', borderRadius: 16,
              border: `1px solid ${d === 'easy' ? 'rgba(74,222,128,0.3)' : d === 'medium' ? 'rgba(251,191,36,0.3)' : 'rgba(248,113,113,0.3)'}`,
              background: d === 'easy' ? 'rgba(74,222,128,0.07)' : d === 'medium' ? 'rgba(251,191,36,0.07)' : 'rgba(248,113,113,0.07)',
              color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <span style={{ fontSize: '1.4rem' }}>{c.emoji}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{d === 'easy' ? tg.easy : d === 'medium' ? tg.medium : tg.hard}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                    {d === 'easy' ? tg.easyHint : d === 'medium' ? tg.mediumHint : tg.hardHint}
                    {' · '}{c.points} {tg.ptPerQ} · {c.time}{tg.secPerQ}
                  </div>
                </div>
              </div>
              <span style={{ opacity: 0.5 }}>→</span>
            </button>
          );
        })}
      </div>
    </main>
  );

  // ── RESULTS ─────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const pct = Math.round((correct / rounds.length) * 100);
    const medal = pct >= 90 ? '🏆' : pct >= 70 ? '🥈' : pct >= 50 ? '🥉' : '📚';
    const board = getLeaderboard().slice(0, 5);
    return (
      <main style={pageStyle}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>{medal}</div>
          <h2 style={{ fontSize: 'clamp(1.4rem,5vw,2rem)', fontWeight: 900, margin: '0 0 0.3rem' }}>{score} punti</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 0.75rem' }}>{correct} su {rounds.length} corrette — {pct}%</p>
          {saved && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{tg.saved}</div>}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
          <button onClick={() => startGame(diff)} style={{ flex: 1, padding: '0.85rem', borderRadius: 14, background: `linear-gradient(135deg,${PURPLE},#7b2cbf)`, border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            {tg.replay}
          </button>
          <button onClick={() => setPhase('menu')} style={{ flex: 1, padding: '0.85rem', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            {tg.changeDiff}
          </button>
        </div>
        {!isSignedIn && (
          <div style={{ padding: '1rem 1.25rem', borderRadius: 16, background: 'rgba(157,78,221,0.1)', border: '1px solid rgba(157,78,221,0.3)', marginBottom: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>{tg.loginTitle}</div>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', margin: '0 0 0.25rem', lineHeight: 1.6 }}>
              {tg.loginText}
            </p>
            <p style={{ fontSize: '0.82rem', margin: '0 0 0.85rem', lineHeight: 1.7 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Scala la classifica · Guadagna punti · Vinci premi, sconti, itinerari e… </span>
              <span style={{ color: '#c77dff', fontWeight: 800, fontSize: '0.95rem' }}>VIAGGIA! ✈️</span>
            </p>
            <SignInButton mode="modal">
              <button style={{ padding: '0.7rem 1.8rem', borderRadius: 999, background: `linear-gradient(135deg,${PURPLE},#7b2cbf)`, border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                {tg.signIn}
              </button>
            </SignInButton>
          </div>
        )}
        {board.length > 0 && (
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
              {tg.myScores}
            </div>
            {board.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', borderRadius: 10, marginBottom: '0.3rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {e.correct}/{e.total}</span>
                <span style={{ fontWeight: 700, color: PURPLE_LIGHT }}>{e.score}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    );
  }

  // ── PLAYING / FEEDBACK ──────────────────────────────────────────────────
  if (!round) return <main style={pageStyle}><div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>{tg.flagLoading}</div></main>;

  return (
    <main style={pageStyle}>
      <style>{`@keyframes flagPop { from { opacity:0; transform:scale(0.7); } to { opacity:1; transform:scale(1); } } .flag-anim { animation: flagPop 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both; }`}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>{qi + 1} / {rounds.length}</span>
        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>⚡ {score} pt</span>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: '1rem' }}>
        {rounds.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i < qi ? PURPLE : i === qi ? PURPLE_LIGHT : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
        ))}
      </div>

      <TimerBar seconds={timeLeft} max={cfg.time} />

      {/* Bandiera grande */}
      <div className="flag-anim" key={qi} style={{ textAlign: 'center', margin: '1.5rem 0 2rem' }}>
        <div style={{ fontSize: 'clamp(5rem,20vw,8rem)', lineHeight: 1, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' }}>
          {round.flag}
        </div>
        <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.75rem' }}>
          {tg.whichCountry}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {round.opts.map((opt, i) => (
          <button key={i} onClick={() => handleAnswer(i)} disabled={phase === 'feedback'} style={btnStyle(i)}>
            <span style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
              background: phase === 'feedback' && i === round.a ? 'rgba(74,222,128,0.3)' : phase === 'feedback' && i === selected ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.78rem', fontWeight: 700,
            }}>
              {OPTS[i]}
            </span>
            {opt}
          </button>
        ))}
      </div>

      {phase === 'feedback' && selected !== null && (
        <div style={{
          marginTop: '1.25rem', padding: '0.75rem 1rem', borderRadius: 12, textAlign: 'center',
          background: selected === round.a ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
          border: `1px solid ${selected === round.a ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
          fontSize: '0.88rem', fontWeight: 600,
          color: selected === round.a ? '#4ade80' : '#f87171',
        }}>
          {selected === round.a
            ? `✅ Corretto! +${cfg.points + Math.round((timeLeft / cfg.time) * 10)} pt`
            : `❌ Era: ${round.country}`}
        </div>
      )}
    </main>
  );
}
