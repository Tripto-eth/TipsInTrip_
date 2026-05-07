'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

const MULTI_TOUR_KEY = 'tipsintrip-tour-multi';
const PURPLE = '#9d4edd';
const PURPLE_LIGHT = '#c77dff';
const TOOLTIP_BG = 'rgba(22,0,46,0.98)';
const TOOLTIP_WIDTH = 320;

interface Rect { top: number; left: number; width: number; height: number; }

interface Step {
  target: string;
  title: string;
  content: string;
  placement: 'top' | 'bottom';
  navigateTo?: string;
  nextKey?: string;
  spotlightClickable?: boolean;
}

const STEPS: Step[] = [
  {
    target: '#tour-multi-origins',
    title: 'Aggiungi le città di tutti',
    content: 'Metti la tua città e quella di ogni amico o familiare — troviamo un mix di andate verso la stessa destinazione, ognuno dalla propria città.',
    placement: 'bottom',
  },
  {
    target: '#tour-multi-priority',
    title: 'Sincrono o Prezzo?',
    content: '"Sincrono" ordina per chi arriva più vicino nello stesso orario — prenderete un solo taxi tutti insieme. "Prezzo" ordina per convenienza e ognuno fa come vuole.',
    placement: 'top',
  },
  {
    target: '#tour-guide-nav',
    title: 'I Local Experts',
    content: 'Qui trovi gli accompagnatori locali — come avere un cugino all\'estero. Ti aiutano con tutto: giri, consigli, prezzi locali, transfer. Clicca per scoprirli!',
    placement: 'bottom',
    navigateTo: '/guide',
    nextKey: 'tipsintrip-tour-guide',
    spotlightClickable: true,
  },
];

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

export default function MultiTourGuide() {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const cancelRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && localStorage.getItem(MULTI_TOUR_KEY)) {
      const t = setTimeout(() => setActive(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!active) return;
    const unlock = lockBodyScroll();
    const block = (e: Event) => {
      if ((e.target as HTMLElement)?.closest?.('[data-tour-tooltip]')) return;
      e.preventDefault();
    };
    const blockKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'Space', 'PageUp', 'PageDown'].includes(e.code)) e.preventDefault();
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
  }, [active]);

  const measureStep = useCallback(async (target: string) => {
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    await new Promise((r) => setTimeout(r, 200));
    if (cancelRef.current) return;

    let el: HTMLElement | null = null;
    for (let i = 0; i < 10; i++) {
      el = document.querySelector(target) as HTMLElement | null;
      if (el && el.offsetParent !== null) break;
      await new Promise((r) => setTimeout(r, 100));
      if (cancelRef.current) return;
    }
    if (!el) return;

    const r = el.getBoundingClientRect();
    const inView = r.top >= 80 && r.top + r.height <= window.innerHeight - 80;
    if (!inView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise((r) => setTimeout(r, 550));
      if (cancelRef.current) return;
    }

    const fr = el.getBoundingClientRect();
    if (fr.width > 0 && fr.height > 0) setRect({ top: fr.top, left: fr.left, width: fr.width, height: fr.height });
  }, []);

  useEffect(() => {
    if (!active) return;
    const step = STEPS[stepIndex];
    if (!step) return;
    cancelRef.current = false;
    measureStep(step.target);
    return () => { cancelRef.current = true; };
  }, [stepIndex, active, measureStep]);

  useEffect(() => {
    if (!active) return;
    const step = STEPS[stepIndex];
    if (!step) return;
    let rafId: number;
    const track = () => {
      const el = document.querySelector(step.target) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setRect((prev) => {
            if (!prev) return { top: r.top, left: r.left, width: r.width, height: r.height };
            if (Math.abs(prev.top - r.top) > 1 || Math.abs(prev.left - r.left) > 1 || Math.abs(prev.width - r.width) > 1 || Math.abs(prev.height - r.height) > 1) {
              return { top: r.top, left: r.left, width: r.width, height: r.height };
            }
            return prev;
          });
        }
      }
      rafId = requestAnimationFrame(track);
    };
    rafId = requestAnimationFrame(track);
    return () => cancelAnimationFrame(rafId);
  }, [stepIndex, active]);

  const finish = useCallback(() => {
    localStorage.removeItem(MULTI_TOUR_KEY);
    setActive(false);
    setRect(null);
  }, []);

  const next = () => {
    const step = STEPS[stepIndex];
    if (step.navigateTo) {
      localStorage.removeItem(MULTI_TOUR_KEY);
      if (step.nextKey) localStorage.setItem(step.nextKey, '1');
      setActive(false);
      router.push(step.navigateTo);
      return;
    }
    if (stepIndex < STEPS.length - 1) { setRect(null); setStepIndex(stepIndex + 1); }
    else finish();
  };
  const prev = () => { if (stepIndex > 0) { setRect(null); setStepIndex(stepIndex - 1); } };

  if (!active || !mounted) return null;

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  let tooltipPos: React.CSSProperties = {};
  if (rect && viewport.w > 0) {
    const safeWidth = Math.min(TOOLTIP_WIDTH, viewport.w - 24);
    const targetCenter = rect.left + rect.width / 2;
    const idealLeft = targetCenter - safeWidth / 2;
    tooltipPos.left = Math.max(12, Math.min(idealLeft, viewport.w - safeWidth - 12));
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

  const content = (
    <div
      onTouchMove={(e) => { if (!(e.target as HTMLElement)?.closest?.('[data-tour-tooltip]')) e.preventDefault(); }}
      onWheel={(e) => { if (!(e.target as HTMLElement)?.closest?.('[data-tour-tooltip]')) e.preventDefault(); }}
    >
      {/* Click blocker */}
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', inset: 0, zIndex: 11000, background: 'transparent', pointerEvents: 'all' }} />

      {/* Overlay scuro (transizione) */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 11001, background: 'rgba(0,0,0,0.88)', pointerEvents: 'none', transition: 'opacity 0.3s ease', opacity: rect ? 0 : 1 }} />

      {/* Spotlight */}
      {rect && (
        <div
          onClick={step.spotlightClickable ? next : undefined}
          style={{
            position: 'fixed',
            top: rect.top - 8, left: rect.left - 8,
            width: rect.width + 16, height: rect.height + 16,
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
          position: 'fixed', ...tooltipPos, zIndex: 12000,
          background: TOOLTIP_BG,
          border: `1px solid rgba(157,78,221,0.55)`,
          borderRadius: '20px',
          padding: '1.4rem 1.5rem 1.25rem',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
          color: '#fff', fontFamily: 'inherit', pointerEvents: 'all',
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
          <button onClick={finish} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.32)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
            Salta
          </button>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {stepIndex > 0 && (
              <button onClick={prev} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '999px', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600, padding: '0.45rem 0.9rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Indietro
              </button>
            )}
            <button onClick={next} style={{ background: `linear-gradient(135deg, ${PURPLE}, #7b2cbf)`, border: 'none', borderRadius: '999px', color: '#fff', fontSize: '0.85rem', fontWeight: 700, padding: '0.5rem 1.25rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(157,78,221,0.4)' }}>
              {step.navigateTo ? 'Scopri le Guide →' : isLast ? 'Fatto! 🎉' : 'Continua'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '1rem' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: i === stepIndex ? '20px' : '6px', height: '6px', borderRadius: '999px', background: i === stepIndex ? PURPLE : 'rgba(255,255,255,0.18)', transition: 'width 0.3s ease' }} />
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
