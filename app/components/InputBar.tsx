'use client';

import { useRef, useEffect } from 'react';

interface InputBarProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export default function InputBar({ value, onChange, onSend, disabled }: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
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
        placeholder="Da dove parti? Dove vuoi andare?"
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
