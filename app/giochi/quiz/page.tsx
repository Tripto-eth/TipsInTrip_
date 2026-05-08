'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth, SignInButton } from '@clerk/nextjs';
import { useLang } from '../../context/LanguageContext';
import {
  type Difficulty, type QuizQuestion, type Game,
  DIFFICULTY_CONFIG, getLeaderboard, saveScore, type ScoreEntry,
} from '../../lib/quizData';
import type { LeaderboardEntry } from '../../api/quiz/score/route';

const PURPLE = '#9d4edd';
const PURPLE_LIGHT = '#c77dff';
const BG = `radial-gradient(circle at 20% 0%, rgba(157,78,221,0.18) 0%, transparent 55%), radial-gradient(circle at 80% 80%, rgba(90,0,160,0.12) 0%, transparent 50%), #120023`;

function TimerBar({ seconds, max }: { seconds: number; max: number }) {
  const pct = (seconds / max) * 100;
  const color = pct > 50 ? '#4ade80' : pct > 25 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: '1rem' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 1s linear, background 0.5s' }} />
    </div>
  );
}

const OPTS = ['A', 'B', 'C', 'D'];
type Phase = 'menu' | 'playing' | 'feedback' | 'results';

function DiffBadge({ diff }: { diff: string }) {
  const c = DIFFICULTY_CONFIG[diff as Difficulty];
  return (
    <span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(157,78,221,0.18)', border: '1px solid rgba(157,78,221,0.3)', fontSize: '0.72rem', color: PURPLE_LIGHT }}>
      {c?.label || diff}
    </span>
  );
}

function GlobalLeaderboard({ game }: { game: Game }) {
  const { t } = useLang();
  const tg = t.games;
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/quiz/score?game=${game}`)
      .then(r => r.json())
      .then(d => setEntries(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', padding: '1rem 0' }}>{tg.loading}</div>;
  if (!entries.length) return <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', padding: '1rem 0' }}>{tg.noScores}</div>;

  return (
    <div>
      {entries.map((e, i) => (
        <div key={e.userId} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.75rem', borderRadius: 10, marginBottom: '0.35rem', background: i === 0 ? 'rgba(157,78,221,0.12)' : 'rgba(255,255,255,0.03)', border: i === 0 ? '1px solid rgba(157,78,221,0.25)' : '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ width: 22, textAlign: 'center', flexShrink: 0 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{DIFFICULTY_CONFIG[e.diff as Difficulty]?.label || e.diff} · {e.correct}/{e.total} · {e.date}</div>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: i === 0 ? PURPLE_LIGHT : 'rgba(255,255,255,0.8)', flexShrink: 0 }}>{e.score}</span>
        </div>
      ))}
    </div>
  );
}

export default function QuizPage() {
  const { isSignedIn } = useAuth();
  const { t } = useLang();
  const tg = t.games;
  const [phase, setPhase] = useState<Phase>('menu');
  const [diff, setDiff] = useState<Difficulty>('easy');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [localBoard, setLocalBoard] = useState<ScoreEntry[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cfg = DIFFICULTY_CONFIG[diff];
  const q = questions[qi];

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startGame = async (d: Difficulty) => {
    setDiff(d);
    setPhase('playing');
    setQi(0); setScore(0); setCorrect(0); setSelected(null);
    setSaved(false); setSaving(false);
    setTimeLeft(DIFFICULTY_CONFIG[d].time);
    try {
      const res = await fetch(`/api/quiz/questions?diff=${d}&count=10`);
      const data = await res.json();
      setQuestions(data.data || []);
    } catch {
      // fallback: ricarica la pagina
      setPhase('menu');
    }
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
    if (phase !== 'playing' || !q) return;
    stopTimer();
    setSelected(idx);
    const isCorrect = idx === q.a;
    let gained = 0;
    if (isCorrect) {
      const timeBonus = Math.round((timeLeft / cfg.time) * 10);
      gained = cfg.points + timeBonus;
      setScore(s => s + gained);
      setCorrect(c => c + 1);
    }
    setPhase('feedback');
    setTimeout(() => {
      if (qi + 1 >= questions.length) { setPhase('results'); }
      else { setQi(i => i + 1); setSelected(null); setPhase('playing'); }
    }, 1400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, q, qi, questions.length, cfg, timeLeft, stopTimer]);

  // Save local score + submit to global leaderboard
  useEffect(() => {
    if (phase !== 'results') return;
    const entry: ScoreEntry = { score, correct, total: questions.length, diff, date: new Date().toISOString() };
    saveScore(entry, 'quiz');
    setLocalBoard(getLeaderboard('quiz'));

    if (isSignedIn && !saved) {
      setSaving(true);
      fetch('/api/quiz/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, correct, total: questions.length, diff, game: 'quiz' }),
      })
        .then(() => setSaved(true))
        .catch(() => {})
        .finally(() => setSaving(false));
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
    if (idx === q?.a) return { ...base, background: 'rgba(74,222,128,0.18)', border: '1px solid rgba(74,222,128,0.55)', color: '#4ade80', fontWeight: 700 };
    if (idx === selected) return { ...base, background: 'rgba(248,113,113,0.18)', border: '1px solid rgba(248,113,113,0.55)', color: '#f87171' };
    return { ...base, opacity: 0.4 };
  };

  const pageStyle: React.CSSProperties = {
    minHeight: '100dvh', background: BG, color: '#fff',
    padding: '1.5rem 1.25rem 5rem', maxWidth: 600, margin: '0 auto',
  };

  // ── MENU ──────────────────────────────────────────────────────────────────
  if (phase === 'menu') {
    return (
      <main style={pageStyle}>
        <Link href="/giochi" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
          {tg.back}
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🌍</div>
          <h1 style={{ fontSize: 'clamp(1.6rem,5vw,2.2rem)', fontWeight: 900, margin: '0 0 0.5rem', background: `linear-gradient(135deg,#fff,${PURPLE_LIGHT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {tg.quizTitle}
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{tg.quizSubtitle}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem' }}>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
            const c = DIFFICULTY_CONFIG[d];
            const label = d === 'easy' ? tg.easy : d === 'medium' ? tg.medium : tg.hard;
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
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{label}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{c.points} {tg.ptPerQ} · {c.time}{tg.secPerQ}</div>
                  </div>
                </div>
                <span style={{ opacity: 0.5, fontSize: '1.1rem' }}>→</span>
              </button>
            );
          })}
        </div>

        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            {tg.leaderboardTitle}
          </div>
          <GlobalLeaderboard game="quiz" />
        </div>
      </main>
    );
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const pct = Math.round((correct / questions.length) * 100);
    const medal = pct >= 90 ? '🏆' : pct >= 70 ? '🥈' : pct >= 50 ? '🥉' : '📚';
    return (
      <main style={pageStyle}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>{medal}</div>
          <h2 style={{ fontSize: 'clamp(1.4rem,5vw,2rem)', fontWeight: 900, margin: '0 0 0.3rem' }}>{score} {tg.pointsSuffix}</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 0.75rem' }}>{correct} {tg.correctOf} {questions.length} {tg.correctSuffix} — {pct}%</p>
          <DiffBadge diff={diff} />
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
            {saving && tg.saving}
            {saved && tg.saved}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
          <button onClick={() => startGame(diff)} style={{ flex: 1, padding: '0.85rem', borderRadius: 14, background: `linear-gradient(135deg,${PURPLE},#7b2cbf)`, border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            {tg.replay}
          </button>
          <button onClick={() => setPhase('menu')} style={{ flex: 1, padding: '0.85rem', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            {tg.changeDiff}
          </button>
        </div>

        {!isSignedIn && (
          <div style={{ padding: '1rem 1.25rem', borderRadius: 16, background: 'rgba(157,78,221,0.1)', border: '1px solid rgba(157,78,221,0.3)', marginBottom: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>{tg.loginTitle}</div>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', margin: '0 0 0.25rem', lineHeight: 1.6 }}>{tg.loginText}</p>
            <p style={{ fontSize: '0.82rem', margin: '0 0 0.85rem', lineHeight: 1.7 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>{tg.loginTagline} </span>
              <span style={{ color: '#c77dff', fontWeight: 800, fontSize: '0.95rem' }}>{tg.loginCTA}</span>
            </p>
            <SignInButton mode="modal">
              <button style={{ padding: '0.7rem 1.8rem', borderRadius: 999, background: `linear-gradient(135deg,${PURPLE},#7b2cbf)`, border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(157,78,221,0.35)' }}>
                {tg.signIn}
              </button>
            </SignInButton>
          </div>
        )}

        {localBoard.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
              {tg.myScores}
            </div>
            {localBoard.slice(0, 5).map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', borderRadius: 10, marginBottom: '0.3rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', width: 20 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}><DiffBadge diff={e.diff} /> {e.correct}/{e.total}</span>
                </div>
                <span style={{ fontWeight: 700, color: PURPLE_LIGHT }}>{e.score}</span>
              </div>
            ))}
          </div>
        )}

        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            {tg.globalLb}
          </div>
          <GlobalLeaderboard game="quiz" />
        </div>
      </main>
    );
  }

  // ── PLAYING / FEEDBACK ───────────────────────────────────────────────────
  if (!q) return null;
  return (
    <main style={pageStyle}>
      <style>{`
        @keyframes qPop { from { opacity:0; transform:scale(0.94) translateY(14px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .q-anim { animation: qPop 0.35s cubic-bezier(0.175,0.885,0.32,1.275) both; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>{qi + 1} / {questions.length}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>⚡ {score} pt</span>
          <DiffBadge diff={diff} />
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1rem' }}>
        {questions.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i < qi ? PURPLE : i === qi ? PURPLE_LIGHT : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
        ))}
      </div>

      <TimerBar seconds={timeLeft} max={cfg.time} />

      {/* Question */}
      <div className="q-anim" key={qi} style={{ marginBottom: '1.5rem' }}>
        {q.emoji && <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '0.75rem' }}>{q.emoji}</div>}
        <p style={{ fontSize: 'clamp(1rem,3.5vw,1.2rem)', fontWeight: 700, lineHeight: 1.45, textAlign: 'center', margin: 0 }}>{q.q}</p>
      </div>

      {/* Answers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {q.opts.map((opt, i) => (
          <button key={i} onClick={() => handleAnswer(i)} disabled={phase === 'feedback'} style={btnStyle(i)}>
            <span style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
              background: phase === 'feedback' && i === q.a ? 'rgba(74,222,128,0.3)' : phase === 'feedback' && i === selected ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.1)',
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
          background: selected === q.a ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
          border: `1px solid ${selected === q.a ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
          fontSize: '0.88rem', fontWeight: 600,
          color: selected === q.a ? '#4ade80' : '#f87171',
        }}>
          {selected === q.a
            ? `${tg.correct} +${cfg.points + Math.round((timeLeft / cfg.time) * 10)} ${tg.pointsSuffix}`
            : `${tg.wrong} ${q.opts[q.a]}`}
        </div>
      )}
    </main>
  );
}
