'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, SignInButton, UserButton } from '@clerk/nextjs';
import AnimatedLogo from './AnimatedLogo';
import styles from '../page.module.css';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const showCenterLogo = pathname !== '/';

  return (
    <>
      <nav
        className={styles.navbar}
        style={{
          background: 'rgba(36, 0, 70, 0.55)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(224,170,255,0.18)',
          padding: '0.85rem 2rem',
          boxShadow: '0 4px 20px -8px rgba(0,0,0,0.4)',
          position: 'relative',
        }}
      >
        <div className={styles.navLeft} style={{ alignItems: 'center', gap: '1.25rem' }}>
          <button
            type="button"
            className="nav-hamburger"
            aria-label="Apri menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="nav-desktop-only" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: '1.25rem', whiteSpace: 'nowrap', alignItems: 'center' }}>
            <Link href="/offerte-catania" className={styles.navLink}>Migliori offerte da Catania</Link>
            <Link href="/multi-partenze" className={styles.navLink}>Multi-Partenze</Link>
            <Link href="/itinerari" className={styles.navLink}>Itinerari e Tour</Link>
            <Link href="/consigli" className={styles.navLink}>Consigli di viaggio</Link>
            <Link href="/essentials" className={styles.navLink}>Essenziali</Link>
            <Link href="/globe" className={styles.navLink}>Ispirami</Link>
            <Link href="/guide" className={styles.navLink}>Guide Tips in Trip</Link>
          </div>
        </div>
        <div className={styles.navCenter} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {showCenterLogo && (
            <Link href="/" aria-label="Torna alla home" style={{ display: 'inline-flex' }}>
              <AnimatedLogo size={40} />
            </Link>
          )}
        </div>
        <div className={styles.navRight} style={{ gap: '0.75rem', alignItems: 'center' }}>
          {isSignedIn ? (
            <div>
              <UserButton appearance={{ elements: { userButtonAvatarBox: { width: 35, height: 35 } } }} />
            </div>
          ) : (
            <SignInButton mode="modal">
              <button
                className={styles.navLink}
                aria-label="Login"
                style={{
                  alignItems: 'center',
                  padding: '0.45rem 1.1rem',
                  borderRadius: '999px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.25)',
                  whiteSpace: 'nowrap',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Login
              </button>
            </SignInButton>
          )}
        </div>
      </nav>

      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 900,
            background: 'rgba(18, 0, 35, 0.6)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            justifyContent: 'flex-start',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '80%',
              maxWidth: '320px',
              height: '100%',
              background: 'linear-gradient(160deg, rgba(60,9,108,0.97), rgba(36,0,70,0.98))',
              borderRight: '1px solid rgba(224,170,255,0.25)',
              padding: '1.25rem 1.25rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Chiudi menu"
              style={{
                alignSelf: 'flex-end',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '1.1rem',
                cursor: 'pointer',
                marginBottom: '0.75rem',
              }}
            >
              ×
            </button>
            <Link href="/offerte-catania" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.9rem 0.5rem', color: '#fff', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              Migliori offerte da Catania
            </Link>
            <Link href="/multi-partenze" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.9rem 0.5rem', color: '#fff', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              Multi-Partenze
            </Link>
            <Link href="/itinerari" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.9rem 0.5rem', color: '#fff', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              Itinerari e Tour
            </Link>
            <Link href="/consigli" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.9rem 0.5rem', color: '#fff', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              Consigli di viaggio
            </Link>
            <Link href="/essentials" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.9rem 0.5rem', color: '#fff', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              Essenziali
            </Link>
            <Link href="/globe" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.9rem 0.5rem', color: '#fff', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              Ispirami 🌍
            </Link>
            <Link
              href="/chat"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                marginTop: '1rem',
                padding: '0.7rem 1rem',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, rgba(157,78,221,0.35), rgba(224,170,255,0.25))',
                border: '1px solid rgba(224,170,255,0.4)',
                color: '#fff',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              ✨ TipsInTrip AI
            </Link>
            {isSignedIn ? (
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center', width: '100%' }}>
                <UserButton appearance={{ elements: { userButtonAvatarBox: { width: 40, height: 40 } } }} />
              </div>
            ) : (
              <SignInButton mode="modal">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.7rem 1rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: 'transparent',
                    color: '#fff',
                    fontWeight: 600,
                    textAlign: 'center',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  Login
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      )}
    </>
  );
}
