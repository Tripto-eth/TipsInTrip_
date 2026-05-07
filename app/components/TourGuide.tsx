'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import GlobeLoader from './GlobeLoader';

const TOUR_KEY = 'tipsintrip-tour-done';

interface TourStep {
  target: string;
  title: string;
  content: string;
  placement: 'top' | 'bottom';
  beforeShow?: () => void;
  navigateTo?: string;
  spotlightClickable?: boolean;
}

interface Props {
  onExpandForm: () => void;
  onActivateNotti: () => void;
  onDeactivateNotti: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PURPLE = '#9d4edd';
const PURPLE_LIGHT = '#c77dff';
const TOOLTIP_BG = 'rgba(22,0,46,0.98)';
const TOOLTIP_WIDTH = 320;

// ── Lock scroll: usa touch-action e overscroll invece di overflow ──
// Rimuovere overflow:hidden permette a scrollIntoView di funzionare correttamente
function lockBodyScroll(): () => void {
  if (typeof window === 'undefined') return () => {};
  const o = {
    bodyTouchAction: document.body.style.touchAction,
    bodyOverscroll: document.body.style.overscrollBehavior,
    htmlOverscroll: document.documentElement.style.overscrollBehavior,
  };
  document.body.style.touchAction = 'none';
  document.body.style.overscrollBehavior = 'none';
  document.documentElement.style.overscrollBehavior = 'none';

  return () => {
    document.body.style.touchAction = o.bodyTouchAction;
    document.body.style.overscrollBehavior = o.bodyOverscroll;
    document.documentElement.style.overscrollBehavior = o.htmlOverscroll;
  };
}

// ── Helper per espandere il target dello slider notti ──
function getTargetRect(step: TourStep, element: HTMLElement): Rect {
  if (step.target === '#tour-notti-slider') {
    const parent = element.parentElement;
    if (parent && parent.clientHeight < 150 && parent.clientHeight > element.clientHeight) {
      const pr = parent.getBoundingClientRect();
      return { top: pr.top, left: pr.left, width: pr.width, height: pr.height };
    }
    const r = element.getBoundingClientRect();
    return { top: r.top - 45, left: r.left, width: r.width, height: r.height + 45 };
  }
  const r = element.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export default function TourGuide({ onExpandForm, onActivateNotti, onDeactivateNotti }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<'hidden' | 'welcome' | 'welcome-exit' | 'tour'>('hidden');
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const cancelRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  const steps: TourStep[] = [
    {
      target: '#tour-trip-type',
      title: 'Andata o Andata e Ritorno?',
      content: 'Sì, lo sappiamo — questo lo conosci già. Ma ci tenevi così tanto che l\'abbiamo messo comunque.',
      placement: 'top',
    },
    {
      target: '#tour-notti-btn',
      title: 'La modalità Notti',
      content: 'Scegli partenza, destinazione e solo la data di andata — poi decidi tu quante notti restare.',
      placement: 'top',
    },
    {
      target: '#tour-notti-slider',
      title: 'Quante notti?',
      content: 'Trascina lo slider e scegli la durata della vacanza — da 1 a 31 notti.',
      placement: 'top',
      beforeShow: onActivateNotti,
    },
    {
      target: '#tour-flessibile',
      title: 'Date flessibili',
      content: 'Non hai date fisse? Con "Flessibile" imposti un range e troviamo le opzioni migliori in quel periodo.',
      placement: 'top',
      beforeShow: onDeactivateNotti,
    },
    {
      target: '#tour-multitratta',
      title: 'Multi-Partenze — per viaggiare insieme',
      content: 'Partite da città diverse e arrivate tutti alla stessa meta. Inserisci fino a 6 aeroporti, uno per ogni città da cui parte qualcuno del gruppo. Clicca su Multi o premi Continua per scoprirlo.',
      placement: 'bottom',
      navigateTo: '/multi-partenze',
      spotlightClickable: true,
    },
  ];

  // ── Mostra welcome alla prima visita ──────────────────────────
  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(TOUR_KEY)) {
      const t = window.setTimeout(() => setPhase('welcome'), 800);
      return () => window.clearTimeout(t);
    }
  }, []);

  // ── Tracking viewport ─────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateVp = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    updateVp();
    window.addEventListener('resize', updateVp);
    return () => window.removeEventListener('resize', updateVp);
  }, []);

  // ── Lock scroll una volta sola: solo quando entriamo/usciamo da hidden ──
  const isActive = phase !== 'hidden';
  useEffect(() => {
    if (!isActive) return;
    const unlock = lockBodyScroll();

    // Blocca anche eventi di scroll
    const block = (e: Event) => {
      const target = e.target as HTMLElement;
      // Permetti scroll su elementi del tooltip (testo lungo) ma non sul resto
      if (target?.closest?.('[data-tour-tooltip]')) return;
      e.preventDefault();
    };
    const blockKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'Space', 'PageUp', 'PageDown'].includes(e.code)) {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', block, { passive: false });
    window.addEventListener('touchmove', block, { passive: false });
    window.addEventListener('keydown', blockKey, { passive: false });

    return () => {
      unlock();
      window.removeEventListener('wheel', block);
      window.removeEventListener('touchmove', block);
      window.removeEventListener('keydown', blockKey);
    };
  }, [isActive]);

  // ── Misura il target con scroll-into-view smart ───────────────
  const measureStep = useCallback(async (step: TourStep) => {
    // Run beforeShow per attivare/disattivare modalità
    if (step.beforeShow) step.beforeShow();

    // Wait per il re-render React (doppio rAF + 200ms per essere sicuri)
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    await new Promise((r) => setTimeout(r, 200));
    if (cancelRef.current) return;

    // Cerca il primo elemento visibile (gestisce duplicati come navbar + bottom nav)
    let el: HTMLElement | null = null;
    for (let i = 0; i < 10; i++) {
      const candidates = Array.from(document.querySelectorAll(step.target)) as HTMLElement[];
      el = candidates.find((c) => {
        if (c.offsetParent === null) return false;
        const r = c.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }) ?? null;
      if (el) break;
      await new Promise((r) => setTimeout(r, 100));
      if (cancelRef.current) return;
    }
    if (!el) return;

    let r = getTargetRect(step, el);

    // Se il target è fuori dal viewport, scrolla per centrarlo
    const inView = r.top >= 80 && r.top + r.height <= window.innerHeight - 80;
    if (!inView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Aspetta che lo smooth scroll finisca
      await new Promise((r) => setTimeout(r, 550));
      if (cancelRef.current) return;
      r = getTargetRect(step, el);
    }

    if (r.width > 0 && r.height > 0) {
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }
  }, []);

  // ── Quando cambia step, misura il target ──────────────────────
  useEffect(() => {
    if (phase !== 'tour') return;
    const step = steps[stepIndex];
    if (!step) return;

    cancelRef.current = false;
    measureStep(step);

    return () => {
      cancelRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, phase, measureStep]);

  // ── Sincronizzazione continua della posizione (risolve animazioni o scroll lenti) ──
  useEffect(() => {
    if (phase !== 'tour') return;
    const step = steps[stepIndex];
    if (!step) return;

    let rafId: number;
    const trackPosition = () => {
      const candidates = Array.from(document.querySelectorAll(step.target)) as HTMLElement[];
      const el = candidates.find((c) => { const r = c.getBoundingClientRect(); return r.width > 0 && r.height > 0; }) ?? null;
      if (el) {
        const r = getTargetRect(step, el);
        if (r.width > 0 && r.height > 0) {
          setRect((prev) => {
            if (!prev) return { top: r.top, left: r.left, width: r.width, height: r.height };
            if (
              Math.abs(prev.top - r.top) > 1 ||
              Math.abs(prev.left - r.left) > 1 ||
              Math.abs(prev.width - r.width) > 1 ||
              Math.abs(prev.height - r.height) > 1
            ) {
              return { top: r.top, left: r.left, width: r.width, height: r.height };
            }
            return prev;
          });
        }
      }
      rafId = requestAnimationFrame(trackPosition);
    };
    rafId = requestAnimationFrame(trackPosition);

    return () => cancelAnimationFrame(rafId);
  }, [stepIndex, phase]);

  // ── Azioni ───────────────────────────────────────────────────
  const startTour = () => {
    setPhase('welcome-exit');
    onExpandForm();
    window.setTimeout(() => {
      setStepIndex(0);
      setPhase('tour');
    }, 1300);
  };

  const finish = useCallback(() => {
    localStorage.setItem(TOUR_KEY, '1');
    setPhase('hidden');
    setRect(null);
    onDeactivateNotti();
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('tutorial-finished'));
  }, [onDeactivateNotti]);

  const skipWelcome = () => {
    localStorage.setItem(TOUR_KEY, '1');
    setPhase('hidden');
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('tutorial-finished'));
  };

  const next = () => {
    const step = steps[stepIndex];
    if (step.navigateTo) {
      localStorage.setItem(TOUR_KEY, '1');
      localStorage.setItem('tipsintrip-tour-multi', '1');
      setPhase('hidden');
      router.push(step.navigateTo);
      return;
    }
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  // ── Render ───────────────────────────────────────────────────
  if (phase === 'hidden' || !mounted) return null;

  let content;
  // ▌ Welcome / Welcome-exit ▌
  if (phase === 'welcome' || phase === 'welcome-exit') {
    const exiting = phase === 'welcome-exit';
    content = (
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.preventDefault()}
        style={{
          position: 'fixed', inset: 0, zIndex: 12000,
          backgroundColor: exiting ? 'transparent' : 'rgba(0,0,0,0.96)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '3rem',
          transition: exiting ? 'background-color 0.7s ease 0.5s' : 'none',
          pointerEvents: exiting ? 'none' : 'all',
          padding: '1.5rem',
          boxSizing: 'border-box'
        }}
      >
        <style>{`
          @keyframes tourBgPulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50%      { transform: scale(1.15); opacity: 0.8; }
          }
          @keyframes tourSlideUp {
            from { opacity: 0; transform: translateY(30px); filter: blur(8px); }
            to   { opacity: 1; transform: translateY(0); filter: blur(0); }
          }
          @keyframes tourScaleIn {
            from { opacity: 0; transform: scale(0.85) translateY(20px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes tourGlow {
            0%, 100% { box-shadow: 0 6px 24px rgba(157,78,221,0.45); }
            50%      { box-shadow: 0 6px 36px rgba(157,78,221,0.85), 0 0 0 8px rgba(157,78,221,0.12); }
          }
        @keyframes tourExitText {
          0%   { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
          100% { opacity: 0; transform: scale(0.1) translateY(-100px); filter: blur(8px); pointer-events: none; }
        }
        @keyframes tourExitGlobe {
          0%   { transform: scale(1); opacity: 1; filter: blur(0); }
          20%  { transform: scale(0.85) translateY(5px); opacity: 1; filter: blur(0); }
          100% { transform: scale(50) translateY(0); opacity: 0; filter: blur(10px); pointer-events: none; }
        }
        @keyframes tourExitBtnZoom {
          0%   { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
          100% { opacity: 0; transform: scale(0.5) translateY(50px); filter: blur(8px); pointer-events: none; }
          }
          .tour-bg-glow {
            position: absolute; inset: 0; pointer-events: none;
            background:
              radial-gradient(circle at 30% 30%, rgba(157,78,221,0.25) 0%, transparent 45%),
              radial-gradient(circle at 70% 70%, rgba(199,125,255,0.2) 0%, transparent 45%);
            animation: tourBgPulse 5s ease-in-out infinite;
          }
          .tour-welcome-pre {
            font-size: clamp(0.85rem, 3vw, 1.1rem); font-weight: 600;
            letter-spacing: 0.4em;
            color: rgba(255,255,255,0.5);
            text-transform: uppercase; margin: 0;
            animation: tourSlideUp 0.7s cubic-bezier(0.25, 0.8, 0.25, 1) both;
          }
          .tour-welcome-title {
            font-size: clamp(2.8rem, 11vw, 5.5rem);
            font-weight: 900; letter-spacing: -0.025em;
            text-align: center; line-height: 1.05;
            color: #fff; margin: 0; padding: 0;
            width: 100%;
            animation: tourScaleIn 0.85s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.15s both;
          }
          .tour-welcome-title .accent {
            background: linear-gradient(135deg, #c77dff 0%, #9d4edd 50%, #7b2cbf 100%);
            -webkit-background-clip: text; background-clip: text;
            -webkit-text-fill-color: transparent;
            display: inline-block;
          }
          .tour-welcome-sub {
            font-size: clamp(1.05rem, 4.5vw, 1.3rem); color: rgba(255,255,255,0.75);
            margin: 0; text-align: center; font-weight: 500;
            padding: 0 1rem; max-width: 500px; line-height: 1.6;
            animation: tourSlideUp 0.7s cubic-bezier(0.25, 0.8, 0.25, 1) 0.45s both;
          }
          .tour-welcome-actions {
            display: flex; flex-direction: column;
            align-items: center; gap: 1.2rem; margin-top: 1rem;
            animation: tourSlideUp 0.7s cubic-bezier(0.25, 0.8, 0.25, 1) 0.7s both;
          }
          .tour-welcome-btn {
            padding: 1.1rem 3.2rem; border-radius: 999px;
            background: linear-gradient(135deg, #9d4edd, #7b2cbf);
            border: none; color: #fff; text-transform: uppercase;
            font-weight: 800; font-size: 1.15rem;
            cursor: pointer; font-family: inherit;
            letter-spacing: 0.03em;
            animation: tourGlow 2.4s ease-in-out infinite;
            transition: transform 0.18s, box-shadow 0.18s;
          }
          .tour-welcome-btn:active { transform: scale(0.96); }
          .tour-welcome-skip {
            background: none; border: none;
            color: rgba(255,255,255,0.32);
            font-size: 0.82rem; cursor: pointer; font-family: inherit;
            transition: color 0.2s;
          }
          .tour-welcome-skip:hover { color: rgba(255,255,255,0.6); }
        .tour-exit-text { animation: tourExitText 0.6s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards; }
        .tour-exit-globe { animation: tourExitGlobe 1.3s ease-in forwards; }
        .tour-exit-actions { animation: tourExitBtnZoom 0.5s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards; }
        `}</style>

        <div className="tour-bg-glow" style={{ opacity: exiting ? 0 : 1, transition: exiting ? 'opacity 0.5s ease' : 'none' }} />

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '800px' }}>
          <div className={exiting ? 'tour-exit-globe' : ''} style={{ zIndex: 3, position: 'relative' }}>
            <GlobeLoader />
          </div>
          
          <div className={exiting ? 'tour-exit-text' : ''} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem', marginTop: '1.2rem' }}>
            <p className="tour-welcome-pre">Tour interattivo</p>
            <h1 className="tour-welcome-title">
              BENVENUTO IN<br />
              <span className="accent">TIPS IN TRIP</span>
            </h1>
            <p className="tour-welcome-sub">
              Ti mostriamo come trovare i voli più convenienti in pochi secondi.
            </p>
          </div>
        </div>

        <div className={`tour-welcome-actions ${exiting ? 'tour-exit-actions' : ''}`} style={{ position: 'relative', zIndex: 1 }}>
          <button onClick={startTour} className="tour-welcome-btn">
            Iniziamo →
          </button>
          <button onClick={skipWelcome} className="tour-welcome-skip">
            Salta tutorial
          </button>
        </div>
      </div>
    );
  } else {
    // ▌ Tour attivo ▌
    const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  let tooltipPos: React.CSSProperties = {};
  if (rect && viewport.w > 0) {
    const safeWidth = Math.min(TOOLTIP_WIDTH, viewport.w - 24);
    const targetCenter = rect.left + rect.width / 2;
    const idealLeft = targetCenter - safeWidth / 2;
    const safeLeft = Math.max(12, Math.min(idealLeft, viewport.w - safeWidth - 12));

    tooltipPos.left = safeLeft;
    tooltipPos.width = safeWidth;

    const TOOLTIP_H = 240;
    const spaceBelow = viewport.h - rect.top - rect.height;
    const spaceAbove = rect.top;
    let placement = step.placement;
    if (placement === 'bottom' && spaceBelow < TOOLTIP_H && spaceAbove > spaceBelow) placement = 'top';
    if (placement === 'top' && spaceAbove < TOOLTIP_H && spaceBelow > spaceAbove) placement = 'bottom';

    const rawTop = placement === 'bottom'
      ? rect.top + rect.height + 18
      : rect.top - TOOLTIP_H - 18;
    tooltipPos.top = Math.max(8, Math.min(rawTop, viewport.h - TOOLTIP_H - 8));
  } else {
    tooltipPos.left = '50%';
    tooltipPos.top = '50%';
    tooltipPos.transform = 'translate(-50%, -50%)';
    tooltipPos.width = Math.min(TOOLTIP_WIDTH, viewport.w - 24);
  }

    content = (
    <div
      onTouchMove={(e) => {
        const t = e.target as HTMLElement;
        if (!t?.closest?.('[data-tour-tooltip]')) e.preventDefault();
      }}
      onWheel={(e) => {
        const t = e.target as HTMLElement;
        if (!t?.closest?.('[data-tour-tooltip]')) e.preventDefault();
      }}
    >
      {/* Click blocker fullscreen */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed', inset: 0, zIndex: 11000,
          background: 'transparent',
          pointerEvents: 'all',
        }}
      />

      {/* Overlay scuro fullscreen — visibile durante transizioni */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 11001,
        background: 'rgba(0,0,0,0.88)',
        pointerEvents: 'none',
        transition: 'opacity 0.3s ease',
        opacity: rect ? 0 : 1,
      }} />

      {/* Spotlight con box-shadow infinito */}
      {rect && (
        <div
          onClick={step.spotlightClickable ? next : undefined}
          style={{
            position: 'fixed',
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            borderRadius: '12px',
            boxShadow: `0 0 0 9999px rgba(0,0,0,0.88), 0 0 0 3px ${PURPLE}, 0 0 30px rgba(157,78,221,0.5)`,
            pointerEvents: step.spotlightClickable ? 'all' : 'none',
            cursor: step.spotlightClickable ? 'pointer' : 'default',
            zIndex: 11002,
            transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        key={stepIndex}
        data-tour-tooltip
        style={{
          position: 'fixed',
          ...tooltipPos,
          zIndex: 12000,
          background: TOOLTIP_BG,
          border: `1px solid rgba(157,78,221,0.55)`,
          borderRadius: '20px',
          padding: '1.4rem 1.5rem 1.25rem',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
          color: '#fff',
          fontFamily: 'inherit',
          pointerEvents: 'all',
          animation: 'tourPop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      >
        <style>{`@keyframes tourPop { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>

        <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.55rem', color: PURPLE_LIGHT, lineHeight: 1.3 }}>
          {step.title}
        </div>

        <div style={{ fontSize: '0.86rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.78)', marginBottom: '1.15rem' }}>
          {step.content}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <button onClick={finish} style={{
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.32)',
            fontSize: '0.75rem', cursor: 'pointer',
            fontFamily: 'inherit', padding: 0,
          }}>
            Salta
          </button>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {stepIndex > 0 && (
              <button onClick={prev} style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '999px',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.8rem', fontWeight: 600,
                padding: '0.45rem 0.9rem', cursor: 'pointer',
                fontFamily: 'inherit',
              }}>
                ← Indietro
              </button>
            )}
            <button onClick={next} style={{
              background: `linear-gradient(135deg, ${PURPLE}, #7b2cbf)`,
              border: 'none', borderRadius: '999px',
              color: '#fff', fontSize: '0.85rem', fontWeight: 700,
              padding: '0.5rem 1.25rem', cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(157,78,221,0.4)',
            }}>
              {step.navigateTo ? 'Scopri Multi →' : isLast ? 'Fatto!' : 'Continua'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '1rem' }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === stepIndex ? '20px' : '6px',
              height: '6px',
              borderRadius: '999px',
              background: i === stepIndex ? PURPLE : 'rgba(255,255,255,0.18)',
              transition: 'width 0.3s ease',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
  }

  return createPortal(content, document.body);
}
