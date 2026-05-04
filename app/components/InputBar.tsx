'use client';

import { useRef, useEffect, useState } from 'react';

const PLACEHOLDERS = [
  'Voli economici per Lisbona a giugno…',
  'Una settimana al mare sotto i 400€…',
  'Capitali europee weekend lungo a maggio…',
  'Cosa fare a Barcellona in 3 giorni…',
  'Voli low cost dal weekend prossimo…',
  'Capodanno in Asia entro 800€…',
  'Mete avventura per chi ama il trekking…',
  'Dove andare con 50€ da Catania?',
  'Voli diretti per le isole greche…',
  'Weekend romantico in Europa…',
];

interface InputBarProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export default function InputBar({ value, onChange, onSend, disabled }: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }, [value]);

  useEffect(() => {
    if (value) return;
    const id = setInterval(() => setPhraseIdx((i) => (i + 1) % PLACEHOLDERS.length), 2800);
    return () => clearInterval(id);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'flex-end',
      padding: '0.75rem',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '14px',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={PLACEHOLDERS[phraseIdx]}
        rows={1}
        disabled={disabled}
        aria-label="Scrivi la tua richiesta di viaggio"
        style={{
          flex: 1,
          resize: 'none',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#fff',
          fontSize: '0.95rem',
          lineHeight: 1.4,
          fontFamily: 'inherit',
          padding: '0.5rem 0.6rem',
          maxHeight: '140px',
          overflowY: 'auto',
        }}
      />
      <button
        type="button"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        aria-label="Invia"
        style={{
          minWidth: '44px',
          height: '44px',
          borderRadius: '10px',
          border: 'none',
          background: disabled || !value.trim() ? 'rgba(255,255,255,0.08)' : 'var(--primary)',
          color: '#fff',
          cursor: disabled || !value.trim() ? 'default' : 'pointer',
          fontSize: '1.1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.15s ease',
        }}
      >
        {disabled ? (
          <span
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
              display: 'inline-block',
            }}
          />
        ) : (
          <span aria-hidden>➤</span>
        )}
      </button>
    </div>
  );
}
