'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth, useUser, SignInButton, SignOutButton } from '@clerk/nextjs';
import AnimatedLogo from './AnimatedLogo';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  id?: string;
}

function GameIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="4" />
      <line x1="12" y1="10" x2="12" y2="14" />
      <line x1="10" y1="12" x2="14" y2="12" />
      <circle cx="17" cy="11" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="19" cy="13" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12 12 3l9 9" />
      <path d="M5 10v10h5v-6h4v6h5V10" />
    </svg>
  );
}

function MultiIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18h18" />
      <path d="M5 14l5-5 4 3 5-7" />
      <circle cx="5" cy="14" r="1.4" fill="currentColor" />
      <circle cx="10" cy="9" r="1.4" fill="currentColor" />
      <circle cx="14" cy="12" r="1.4" fill="currentColor" />
      <circle cx="19" cy="5" r="1.4" fill="currentColor" />
    </svg>
  );
}

function GuideIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 21c0-3.5 3.1-6 7-6s7 2.5 7 6" />
    </svg>
  );
}

function BlogIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="13" y2="18" />
    </svg>
  );
}

const ITEMS_LEFT: NavItem[] = [
  { href: '/giochi', label: 'Giochi', icon: <GameIcon /> },
  { href: '/', label: 'Home', icon: <HomeIcon /> },
  { href: '/multi-partenze', label: 'Multi', icon: <MultiIcon />, id: 'tour-multitratta' },
];

const ITEMS_RIGHT: NavItem[] = [
  { href: '/guide', label: 'Guide', icon: <GuideIcon />, id: 'tour-guide-nav' },
  { href: '/blog', label: 'Blog', icon: <BlogIcon /> },
];

function AccountDrawer({ onClose }: { onClose: () => void }) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/chat').then(r => r.json()).then(d => {
      if (typeof d.credits === 'number') setCredits(d.credits);
    }).catch(() => {});
  }, [isSignedIn]);

  const initials = user?.firstName?.[0]?.toUpperCase() || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || '?';

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1998, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'fixed', left: 0, right: 0,
        bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))',
        zIndex: 1999,
        background: 'linear-gradient(180deg, rgba(28,0,55,0.98) 0%, rgba(18,0,35,0.99) 100%)',
        border: '1px solid rgba(224,170,255,0.18)', borderBottom: 'none',
        borderRadius: '22px 22px 0 0',
        padding: '1.25rem 1.25rem 1.5rem',
        boxShadow: '0 -12px 40px rgba(0,0,0,0.5)',
        animation: 'slideUpDrawer 0.3s cubic-bezier(0.25,0.8,0.25,1)',
      }}>
        <style>{`@keyframes slideUpDrawer { from { opacity:0; transform:translateY(100%); } to { opacity:1; transform:translateY(0); } }`}</style>

        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.18)', margin: '0 auto 1.25rem' }} />

        {isSignedIn ? (
          <>
            {/* Header utente */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: 46, height: 46, borderRadius: '50%',
                background: 'linear-gradient(135deg, #9d4edd, #7b2cbf)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', fontWeight: 800, color: '#fff', flexShrink: 0,
              }}>
                {user?.imageUrl ? <img src={user.imageUrl} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" /> : initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.fullName || user?.firstName || 'Utente'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.emailAddresses?.[0]?.emailAddress}
                </div>
              </div>
            </div>

            {/* Crediti */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.75rem 1rem', borderRadius: 14,
              background: 'rgba(157,78,221,0.12)', border: '1px solid rgba(157,78,221,0.3)',
              marginBottom: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>⚡</span>
                <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)' }}>Crediti Trip AI</span>
              </div>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#c77dff' }}>
                {credits === null ? '...' : credits}
              </span>
            </div>

            {/* Azioni */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              <Link href="/chat" onClick={onClose} style={{
                display: 'flex', alignItems: 'center', gap: '0.65rem',
                padding: '0.75rem 1rem', borderRadius: 12,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff', textDecoration: 'none', fontSize: '0.88rem',
              }}>
                <span>🛒</span> Acquista crediti
              </Link>
              <Link href="/chat" onClick={onClose} style={{
                display: 'flex', alignItems: 'center', gap: '0.65rem',
                padding: '0.75rem 1rem', borderRadius: 12,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff', textDecoration: 'none', fontSize: '0.88rem',
              }}>
                <span>✈️</span> Trip AI Chat
              </Link>
            </div>

            <SignOutButton>
              <button onClick={onClose} style={{
                width: '100%', padding: '0.75rem', borderRadius: 12,
                background: 'rgba(220,50,50,0.12)', border: '1px solid rgba(220,50,50,0.3)',
                color: '#ff8080', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                🚪 Esci
              </button>
            </SignOutButton>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👤</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', marginBottom: '0.3rem' }}>Accedi a TipsinTrip</div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                Registrati gratis e ricevi 20 crediti per la Trip AI
              </div>
            </div>
            <SignInButton mode="modal">
              <button onClick={onClose} style={{
                width: '100%', padding: '0.85rem', borderRadius: 12,
                background: 'linear-gradient(135deg, #9d4edd, #7b2cbf)',
                border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 15px rgba(157,78,221,0.4)',
              }}>
                🔑 Accedi / Registrati
              </button>
            </SignInButton>
          </>
        )}
      </div>
    </>
  );
}

function AccountButton() {
  const { isSignedIn } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setDrawerOpen(true)}
        aria-label="Account"
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: '3px', padding: '6px 4px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.55)', fontSize: '0.65rem', fontWeight: 500,
          letterSpacing: '0.02em', transition: 'color 0.15s',
        }}
      >
        {isSignedIn ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        )}
        <span>{isSignedIn ? 'Account' : 'Login'}</span>
      </button>
      {drawerOpen && <AccountDrawer onClose={() => setDrawerOpen(false)} />}
    </>
  );
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const renderItem = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        id={item.id}
        href={item.href}
        aria-label={item.label}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          padding: '6px 4px',
          color: active ? '#e0aaff' : 'rgba(255,255,255,0.55)',
          textDecoration: 'none',
          fontSize: '0.65rem',
          fontWeight: active ? 700 : 500,
          letterSpacing: '0.02em',
          transition: 'color 0.15s',
        }}
      >
        {item.icon}
        <span>{item.label}</span>
      </Link>
    );
  };

  const chatActive = pathname === '/chat';

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Navigazione mobile"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        display: 'none', // mostrato solo via media query
        alignItems: 'flex-end',
        height: '68px',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
        background: 'rgba(20, 0, 40, 0.85)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderTop: '1px solid rgba(224, 170, 255, 0.18)',
        boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div style={{ flex: 1, display: 'flex', height: '60px' }}>
        {ITEMS_LEFT.map(renderItem)}
      </div>

      {/* Center pallino → /chat */}
      <Link
        href="/chat"
        aria-label="Apri chat AI"
        style={{
          flex: '0 0 auto',
          width: '64px',
          height: '64px',
          marginTop: '-22px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary, #9d4edd) 0%, #b65cff 100%)',
          border: chatActive ? '3px solid #e0aaff' : '3px solid rgba(20, 0, 40, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 22px rgba(157, 78, 221, 0.55), 0 0 0 1px rgba(224,170,255,0.3)',
          textDecoration: 'none',
          alignSelf: 'flex-start',
        }}
      >
        <AnimatedLogo size={42} />
      </Link>

      <div style={{ flex: 1, display: 'flex', height: '60px' }}>
        {ITEMS_RIGHT.map(renderItem)}
        <AccountButton />
      </div>
    </nav>
  );
}
