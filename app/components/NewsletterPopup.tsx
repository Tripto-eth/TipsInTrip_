'use client';

import { useEffect, useState } from 'react';
import { useLang } from '../context/LanguageContext';

export default function NewsletterPopup() {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('tit_nl_dismissed')) return;
    const t = setTimeout(() => setVisible(true), 15000);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    if (typeof window !== 'undefined') sessionStorage.setItem('tit_nl_dismissed', '1');
    setVisible(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: collegare al provider newsletter reale
    setSubmitted(true);
    setTimeout(close, 1800);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nl-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(18, 0, 35, 0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.35s ease forwards',
      }}
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          padding: '2rem 1.75rem 1.75rem',
          background: 'linear-gradient(160deg, rgba(60,9,108,0.92), rgba(36,0,70,0.95))',
          border: '1px solid rgba(224,170,255,0.35)',
          borderRadius: '20px',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Chiudi"
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.75)',
            cursor: 'pointer',
            fontSize: '1rem',
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>

        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✈️</div>

        <h2 id="nl-title" style={{
          fontSize: '1.35rem',
          fontWeight: 700,
          margin: '0 0 0.5rem',
          background: 'linear-gradient(135deg, #c77dff 0%, #e0aaff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {t.newsletter.title}
        </h2>

        <p style={{
          fontSize: '0.9rem',
          color: 'rgba(255,255,255,0.75)',
          margin: '0 0 1.25rem',
          lineHeight: 1.5,
        }}>
          {t.newsletter.body}
        </p>

        {submitted ? (
          <div style={{
            padding: '0.9rem',
            background: 'rgba(157,78,221,0.15)',
            border: '1px solid rgba(224,170,255,0.3)',
            borderRadius: '10px',
            color: 'var(--secondary)',
            fontSize: '0.9rem',
          }}>
            {t.newsletter.success}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.newsletter.placeholder}
              required
              aria-label="Email"
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0.8rem 1rem',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {t.newsletter.submit}
            </button>
          </form>
        )}

        <p style={{
          fontSize: '0.72rem',
          color: 'rgba(255,255,255,0.4)',
          margin: '0.85rem 0 0',
        }}>
          {t.newsletter.disclaimer}
        </p>
      </div>
    </div>
  );
}
