'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLang } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLang();

  const LINKS = [
    {
      heading: t.footer.col1,
      items: [
        { label: t.footer.links.catania, href: '/offerte-catania' },
        { label: t.footer.links.multi, href: '/multi-partenze' },
        { label: t.footer.links.inspire, href: '/globe' },
        { label: t.footer.links.ai, href: '/chat' },
      ],
    },
    {
      heading: t.footer.col2,
      items: [
        { label: t.footer.links.itinerari, href: '/itinerari' },
        { label: t.footer.links.consigli, href: '/consigli' },
        { label: t.footer.links.guide, href: '/guide' },
        { label: t.footer.links.blog, href: '/blog' },
      ],
    },
    {
      heading: t.footer.col3,
      items: [
        { label: t.footer.links.essentials, href: '/essentials' },
      ],
    },
  ];

  return (
    <footer style={{
      borderTop: '1px solid rgba(224,170,255,0.12)',
      background: 'rgba(18,0,35,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      padding: '3rem 2rem 2rem',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '2.5rem',
        alignItems: 'start',
      }}>
        {/* Logo + tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link href="/" aria-label="Home TipsinTrip">
            <Image
              src="/baselogo.jpg"
              alt="TipsinTrip"
              width={110}
              height={40}
              style={{ objectFit: 'contain', borderRadius: '8px' }}
            />
          </Link>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', lineHeight: 1.5, margin: 0 }}>
            {t.footer.tagline}
          </p>
        </div>

        {/* Colonne link */}
        {LINKS.map(({ heading, items }) => (
          <div key={heading} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(224,170,255,0.6)', marginBottom: '0.25rem' }}>
              {heading}
            </div>
            {items.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              >
                {label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{
        maxWidth: '1100px',
        margin: '2rem auto 0',
        paddingTop: '1.25rem',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.78rem',
        color: 'rgba(255,255,255,0.35)',
      }}>
        <span>© {new Date().getFullYear()} TipsinTrip. {t.footer.copyright}</span>
        <span>
          {t.footer.madeWith}{' '}
          <span style={{ color: '#e0aaff' }}>♥</span>
          {' '}{t.footer.by}{' '}
          <a
            href="https://www.instagram.com/iltrip_/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'rgba(224,170,255,0.7)', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#e0aaff')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(224,170,255,0.7)')}
          >
            @iltrip_
          </a>
        </span>
      </div>
    </footer>
  );
}
