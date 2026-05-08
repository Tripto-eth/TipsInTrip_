'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pwa-notif-prompt-dismissed';

export default function PwaNotificationPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true) ||
      window.matchMedia('(display-mode: standalone)').matches;

    if (!isStandalone) return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const show = () => setVisible(true);

    // Se il tutorial è già stato completato in una sessione precedente, mostra dopo 10s
    if (localStorage.getItem('tipsintrip-tour-done')) {
      const t = setTimeout(show, 10000);
      return () => clearTimeout(t);
    }

    // Altrimenti aspetta la fine del tutorial, poi mostra dopo 3s
    let t: ReturnType<typeof setTimeout>;
    const onTutorialFinished = () => { t = setTimeout(show, 3000); };
    window.addEventListener('tutorial-finished', onTutorialFinished);
    return () => {
      window.removeEventListener('tutorial-finished', onTutorialFinished);
      clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const enable = async () => {
    dismiss();
    try {
      const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
      if (!appId) return;
      const { default: OneSignal } = await import('react-onesignal');
      await OneSignal.Notifications.requestPermission();
    } catch {}
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(68px + env(safe-area-inset-bottom, 0px) + 12px)',
      left: '12px',
      right: '12px',
      zIndex: 9999,
      background: 'linear-gradient(135deg, rgba(36,0,70,0.97) 0%, rgba(60,9,108,0.97) 100%)',
      border: '1px solid rgba(224,170,255,0.35)',
      borderRadius: '20px',
      padding: '1.25rem 1.25rem 1rem',
      boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(157,78,221,0.2)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      animation: 'slideUpPrompt 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
    }}>
      <style>{`
        @keyframes slideUpPrompt {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Close */}
      <button
        onClick={dismiss}
        style={{ position: 'absolute', top: '0.75rem', right: '0.85rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', cursor: 'pointer', lineHeight: 1 }}
        aria-label="Chiudi"
      >✕</button>

      {/* Icona + testo */}
      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{
          flexShrink: 0, width: '44px', height: '44px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #9d4edd, #7b2cbf)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
        }}>✈️</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.3rem', color: '#fff' }}>
            Non perdere le offerte flash
          </div>
          <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
            Nel mondo dei voli <strong style={{ color: '#c77dff' }}>il tempo è tutto</strong>. Le tariffe migliori durano ore, a volte minuti. Attiva le notifiche e sarai il primo a saperlo.
          </div>
        </div>
      </div>

      {/* Bullets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem', padding: '0 0 0 0.25rem' }}>
        {[
          { icon: '⚡', text: 'Offerte in tempo reale, appena disponibili' },
          { icon: '🎯', text: 'Solo le migliori partenze da Catania' },
          { icon: '🔕', text: 'Niente spam — solo offerte vere' },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>
            <span style={{ fontSize: '0.9rem' }}>{icon}</span>
            {text}
          </div>
        ))}
      </div>

      {/* Bottoni */}
      <div style={{ display: 'flex', gap: '0.6rem' }}>
        <button
          onClick={enable}
          style={{
            flex: 2, padding: '0.75rem', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #9d4edd, #7b2cbf)',
            color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(157,78,221,0.4)',
          }}
        >
          🔔 Attiva notifiche
        </button>
        <button
          onClick={dismiss}
          style={{
            flex: 1, padding: '0.75rem', borderRadius: '12px',
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
          }}
        >
          Forse dopo
        </button>
      </div>
    </div>
  );
}
