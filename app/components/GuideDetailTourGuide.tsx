'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

const DETAIL_TOUR_KEY = 'tipsintrip-tour-guide-detail';
const PURPLE = '#9d4edd';
const PURPLE_LIGHT = '#c77dff';
const TOOLTIP_BG = 'rgba(22,0,46,0.98)';
const TOOLTIP_WIDTH = 320;

interface Rect { top: number; left: number; width: number; height: number; }

const STEPS = [
  {
    target: '#tour-guide-form',
    title: 'Prenota e organizza',
    content: 'Da qui puoi contattare la guida, fissare una chiamata e organizzare tutto prima di partire. Zero sorprese, massima tranquillità.',
    placement: 'top' as const,
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

export default function GuideDetailTourGuide() {
  const [active, setActive] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const cancelRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && localStorage.getItem(DETAIL_TOUR_KEY)) {
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

  const step = STEPS[0];

  const measureStep = useCallback(async () => {
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    await new Promise((r) => setTimeout(r, 200));
    if (cancelRef.current) return;

    let el: HTMLElement | null = null;
    for (let i = 0; i < 10; i++) {
      el = document.querySelector(step.target) as HTMLElement | null;
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
  }, [step.target]);

  useEffect(() => {
    if (!active) return;
    cancelRef.current = false;
    measureStep();
    return () => { cancelRef.current = true; };
  }, [active, measureStep]);

  useEffect(() => {
    if (!active) return;
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
  }, [active, step.target]);

  const finish = useCallback(() => {
    localStorage.removeItem(DETAIL_TOUR_KEY);
    setActive(false);
    setRect(null);
  }, []);

  if (!active || !mounted) return null;

  let tooltipPos: React.CSSProperties = {};
  if (rect && viewport.w > 0) {
    const TOOLTIP_H = 240;
    const safeWidth = Math.min(TOOLTIP_WIDTH, viewport.w - 24);
    const targetCenter = rect.left + rect.width / 2;
    const idealLeft = targetCenter - safeWidth / 2;
    tooltipPos.left = Math.max(12, Math.min(idealLeft, viewport.w - safeWidth - 12));
    tooltipPos.width = safeWidth;

    const spaceAbove = rect.top;
    const spaceBelow = viewport.h - rect.top - rect.height;
    const rawTop = spaceAbove >= spaceBelow
      ? rect.top - TOOLTIP_H - 18
      : rect.top + rect.height + 18;
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
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', inset: 0, zIndex: 11000, background: 'transparent', pointerEvents: 'all' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 11001, background: 'rgba(0,0,0,0.88)', pointerEvents: 'none', transition: 'opacity 0.3s ease', opacity: rect ? 0 : 1 }} />

      {rect && (
        <div style={{
          position: 'fixed',
          top: rect.top - 8, left: rect.left - 8,
          width: rect.width + 16, height: rect.height + 16,
          borderRadius: '16px',
          boxShadow: `0 0 0 9999px rgba(0,0,0,0.88), 0 0 0 3px ${PURPLE}, 0 0 30px rgba(157,78,221,0.5)`,
          pointerEvents: 'none',
          zIndex: 11002,
          transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
        }} />
      )}

      <div
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button
            onClick={finish}
            style={{
              background: `linear-gradient(135deg, ${PURPLE}, #7b2cbf)`,
              border: 'none', borderRadius: '999px',
              color: '#fff', fontSize: '0.9rem', fontWeight: 700,
              padding: '0.55rem 1.5rem', cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(157,78,221,0.4)',
            }}
          >
            Ottimo, ho capito! 🎉
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
