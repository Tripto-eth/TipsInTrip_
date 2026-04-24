'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

type OS = 'ios' | 'android' | null;

const STORAGE_KEY = 'pwa-prompt-dismissed';

export default function PWAInstallPrompt() {
  const [os, setOs] = useState<OS>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Già installata come PWA → non mostrare
    const isStandalone =
      ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true) ||
      window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // Già rifiutata in precedenza
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Solo mobile
    const ua = navigator.userAgent;
    const isMobile = window.innerWidth < 768 || /Mobi|Android/i.test(ua);
    if (!isMobile) return;

    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);

    if (isIOS) { setOs('ios'); setVisible(true); }
    else if (isAndroid) { setOs('android'); setVisible(true); }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(10,0,25,0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div style={{
        width: '100%', maxWidth: '380px',
        background: 'rgba(30,0,60,0.95)',
        border: '1px solid rgba(224,170,255,0.25)',
        borderRadius: '24px',
        padding: '2rem 1.5rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Logo + titolo */}
        <Image src="/baselogo.jpg" alt="TipsinTrip" width={64} height={64}
          style={{ borderRadius: '16px', objectFit: 'cover' }} />

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
            Aggiungi TipsinTrip alla schermata Home
          </h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
            Accedi più velocemente ai voli migliori, come un'app vera.
          </p>
        </div>

        {/* Istruzioni */}
        <div style={{
          width: '100%', background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '14px', padding: '1rem',
          display: 'flex', flexDirection: 'column', gap: '0.85rem',
        }}>
          {os === 'ios' ? (
            <>
              <Step n={1} icon="⬆️" text={<>Tocca il tasto <strong>Condividi</strong> in basso nel browser Safari</>} />
              <Step n={2} icon="➕" text={<>Scorri e seleziona <strong>&ldquo;Aggiungi a schermata Home&rdquo;</strong></>} />
              <Step n={3} icon="✅" text={<>Tocca <strong>Aggiungi</strong> in alto a destra</>} />
            </>
          ) : (
            <>
              <Step n={1} icon="⋮" text={<>Tocca i <strong>tre puntini</strong> in alto a destra nel browser</>} />
              <Step n={2} icon="➕" text={<>Seleziona <strong>&ldquo;Aggiungi a schermata Home&rdquo;</strong></>} />
              <Step n={3} icon="✅" text={<>Conferma toccando <strong>Aggiungi</strong></>} />
            </>
          )}
        </div>

        {/* Badge OS */}
        <div style={{
          fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)',
          display: 'flex', alignItems: 'center', gap: '0.35rem',
        }}>
          {os === 'ios' ? '🍎 Istruzioni per iOS / Safari' : '🤖 Istruzioni per Android / Chrome'}
        </div>

        {/* CTA */}
        <button
          onClick={dismiss}
          style={{
            width: '100%', padding: '0.8rem',
            borderRadius: '999px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.9rem', fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
        >
          Continua su WEB
        </button>
      </div>
    </div>
  );
}

function Step({ n, icon, text }: { n: number; icon: string; text: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
      <div style={{
        flexShrink: 0, width: '26px', height: '26px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(157,78,221,0.5), rgba(224,170,255,0.3))',
        border: '1px solid rgba(224,170,255,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.7rem', fontWeight: 700, color: '#fff',
      }}>
        {n}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <span>{text}</span>
      </div>
    </div>
  );
}
