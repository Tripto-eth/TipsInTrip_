'use client';

import { useState } from 'react';
import styles from './NewsletterForm.module.css';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? 'ok' : 'error');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'ok') {
    return (
      <div className={styles.success}>
        <span aria-hidden>✅</span> Sei dentro! Ti scriveremo presto.
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <input
        type="email"
        required
        placeholder="la-tua@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={styles.input}
        disabled={status === 'loading'}
      />
      <button type="submit" className={styles.btn} disabled={status === 'loading'}>
        {status === 'loading' ? 'Invio…' : 'Iscriviti'}
      </button>
      {status === 'error' && (
        <p className={styles.errorMsg}>Qualcosa è andato storto. Riprova.</p>
      )}
    </form>
  );
}
