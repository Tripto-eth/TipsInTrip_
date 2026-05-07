'use client';

import { useState, useEffect, useRef } from 'react';
import { useLang } from '../context/LanguageContext';
import NewsletterPopup from './NewsletterPopup';

const PILL_DISMISSED_KEY = 'tit_lang_pill_dismissed';
const GIFT_DELAY_MS = 9000;
const BOTTOM = 'calc(68px + env(safe-area-inset-bottom, 0px) + 14px)';

// ─── Scroll-to-top ──────────────────────────────────────────────────────────
function ScrollTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Torna in cima"
      style={{
        position: 'fixed', right: 14, bottom: BOTTOM, zIndex: 990,
        width: 44, height: 44, borderRadius: '50%',
        background: 'rgba(22,0,46,0.88)',
        border: '1px solid rgba(224,170,255,0.28)',
        color: '#c77dff', fontSize: '1.15rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 4px 18px rgba(0,0,0,0.4)',
        transition: 'transform 0.18s, box-shadow 0.18s',
      }}
    >
      ↑
    </button>
  );
}

// ─── Language pill + gift ────────────────────────────────────────────────────
export default function MobileFloatingActions() {
  const { lang, setLang } = useLang();
  const [dismissed, setDismissed] = useState(true); // start hidden, check in effect
  const [langOpen, setLangOpen] = useState(false);
  const [phase, setPhase] = useState<'pill' | 'gift' | 'gone'>('pill');
  const [nlOpen, setNlOpen] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef(0);
  const giftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interacted = useRef(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' && localStorage.getItem(PILL_DISMISSED_KEY);
    if (!saved) setDismissed(false);
  }, []);

  // Avvia timer per trasformare pill in regalo
  useEffect(() => {
    if (dismissed || phase !== 'pill') return;
    giftTimerRef.current = setTimeout(() => {
      if (!interacted.current) setPhase('gift');
    }, GIFT_DELAY_MS);
    return () => { if (giftTimerRef.current) clearTimeout(giftTimerRef.current); };
  }, [dismissed, phase]);

  const dismiss = () => {
    localStorage.setItem(PILL_DISMISSED_KEY, '1');
    setDismissed(true);
    setLangOpen(false);
  };

  const handleLangClick = () => {
    interacted.current = true;
    if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
    setLangOpen(v => !v);
  };

  const selectLang = (l: 'it' | 'en') => {
    setLang(l);
    setLangOpen(false);
  };

  // Touch swipe left to dismiss
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    if (dx < 0) setTranslateX(dx);
  };
  const onTouchEnd = () => {
    setIsDragging(false);
    if (translateX < -60) {
      dismiss();
    } else {
      setTranslateX(0);
    }
  };

  if (dismissed) return <ScrollTopButton />;

  const pillStyle: React.CSSProperties = {
    position: 'fixed', left: 14, bottom: BOTTOM, zIndex: 990,
    transform: `translateX(${translateX}px)`,
    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25,0.8,0.25,1), opacity 0.3s',
    opacity: translateX < -30 ? Math.max(0, 1 + translateX / 120) : 1,
  };

  return (
    <>
      <ScrollTopButton />

      {/* Language pill */}
      {phase === 'pill' && (
        <div style={pillStyle} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <button
            onClick={handleLangClick}
            aria-label="Lingua"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 12px', borderRadius: 999,
              background: 'rgba(22,0,46,0.88)',
              border: '1px solid rgba(224,170,255,0.28)',
              color: '#fff', fontSize: '0.78rem', fontWeight: 600,
              cursor: 'pointer', backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxShadow: '0 4px 18px rgba(0,0,0,0.4)',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>{lang === 'it' ? '🇮🇹' : '🇬🇧'}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>←</span>
          </button>

          {langOpen && (
            <>
              <div onClick={() => setLangOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: -1 }} />
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 8px)', left: 0,
                background: 'rgba(22,0,46,0.95)', border: '1px solid rgba(224,170,255,0.22)',
                borderRadius: 14, padding: '6px', display: 'flex', flexDirection: 'column', gap: 4,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}>
                {([['it', '🇮🇹', 'Italiano'], ['en', '🇬🇧', 'English']] as const).map(([code, flag, name]) => (
                  <button
                    key={code}
                    onClick={() => selectLang(code)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 14px', borderRadius: 10, border: 'none',
                      background: lang === code ? 'rgba(157,78,221,0.25)' : 'transparent',
                      color: lang === code ? '#c77dff' : '#fff',
                      fontWeight: lang === code ? 700 : 500,
                      fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{flag}</span> {name}
                  </button>
                ))}
                <button
                  onClick={dismiss}
                  style={{
                    marginTop: 2, padding: '6px 14px', borderRadius: 10, border: 'none',
                    background: 'transparent', color: 'rgba(255,255,255,0.35)',
                    fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  }}
                >
                  Rimuovi
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Gift icon → newsletter */}
      {phase === 'gift' && (
        <button
          onClick={() => setNlOpen(true)}
          aria-label="Sorpresa"
          style={{
            position: 'fixed', left: 14, bottom: BOTTOM, zIndex: 990,
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(157,78,221,0.9), rgba(123,44,191,0.9))',
            border: '1px solid rgba(224,170,255,0.35)',
            color: '#fff', fontSize: '1.3rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 4px 18px rgba(157,78,221,0.45)',
            animation: 'giftPulse 2s ease-in-out infinite',
          }}
        >
          <style>{`@keyframes giftPulse { 0%,100% { box-shadow:0 4px 18px rgba(157,78,221,0.45); } 50% { box-shadow:0 4px 28px rgba(157,78,221,0.75), 0 0 0 6px rgba(157,78,221,0.12); } }`}</style>
          🎁
        </button>
      )}

      {nlOpen && (
        <NewsletterPopup
          forceOpen={nlOpen}
          onForceClose={() => { setNlOpen(false); setPhase('gone'); setDismissed(true); }}
        />
      )}
    </>
  );
}
