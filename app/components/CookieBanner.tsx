'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Controlliamo se l'utente ha già fatto una scelta
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Piccolo ritardo per un effetto più elegante
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookie-consent', 'all');
    setShowBanner(false);
  };

  const acceptNecessary = () => {
    localStorage.setItem('cookie-consent', 'necessary');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none', // Permette di cliccare attraverso il contenitore invisibile
      }}
    >
      <div 
        style={{
          background: 'rgba(20, 10, 40, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          padding: '1.5rem',
          maxWidth: '800px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
          pointerEvents: 'auto', // Riabilita i click sul banner
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          animation: 'slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ 
            fontSize: '1.5rem', 
            background: 'rgba(255,255,255,0.1)', 
            padding: '10px', 
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            flexShrink: 0
          }}>
            🍪
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
              La tua privacy è importante
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              Utilizziamo i cookie per offrirti l'esperienza migliore, analizzare il traffico e proporti le migliori offerte di viaggio in linea con i tuoi interessi. Cliccando su "Accetta Tutti", acconsenti all'uso di tutti i cookie. Puoi anche scegliere di accettare solo i cookie essenziali. 
              <Link href="/privacy-policy" style={{ color: 'var(--primary)', textDecoration: 'underline', marginLeft: '5px' }}>
                Leggi l'Informativa
              </Link>.
            </p>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          justifyContent: 'flex-end',
          flexWrap: 'wrap' 
        }}>
          <button
            onClick={acceptNecessary}
            style={{
              padding: '0.7rem 1.5rem',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
            }}
          >
            Solo Essenziali
          </button>
          
          <button
            onClick={acceptAll}
            style={{
              padding: '0.7rem 1.5rem',
              borderRadius: '999px',
              background: 'var(--primary)',
              border: 'none',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.target as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.6)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.transform = 'none';
              (e.target as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.4)';
            }}
          >
            Accetta Tutti
          </button>
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes slideUpFade {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @media (max-width: 600px) {
            .cookie-banner-container {
              bottom: 12px !important;
              left: 12px !important;
              right: 12px !important;
            }
            .cookie-banner-inner {
              padding: 1.25rem !important;
              border-radius: 20px !important;
            }
          }
        `}} />
      </div>
    </div>
  );
}
