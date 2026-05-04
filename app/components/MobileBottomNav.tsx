'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AnimatedLogo from './AnimatedLogo';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
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
  { href: '/', label: 'Home', icon: <HomeIcon /> },
  { href: '/multi-partenze', label: 'Multi', icon: <MultiIcon /> },
];

const ITEMS_RIGHT: NavItem[] = [
  { href: '/guide', label: 'Guide', icon: <GuideIcon /> },
  { href: '/blog', label: 'Blog', icon: <BlogIcon /> },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const renderItem = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
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
      </div>
    </nav>
  );
}
