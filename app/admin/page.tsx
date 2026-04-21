'use client';

import { useState, useEffect, useCallback } from 'react';

interface UserRow {
  id: string;
  email: string;
  name: string;
  imageUrl: string;
  credits: number;
  createdAt: number;
}

// ============================================================
// Pannello Admin — accessibile solo con la password corretta
// URL: /admin
// ============================================================
export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null); // userId in aggiornamento
  const [addAmount, setAddAmount] = useState<Record<string, string>>({}); // input per ogni utente

  const fetchUsers = useCallback(async (pwd: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/credits', {
        headers: { 'x-admin-secret': pwd },
      });
      if (res.status === 401) { setError('Password errata.'); setAuthed(false); return; }
      const data = await res.json();
      setUsers(data.users ?? []);
      setAuthed(true);
    } catch {
      setError('Errore di rete.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(secret);
  };

  const updateCredits = async (userId: string, mode: 'set' | 'add', amount: number) => {
    setUpdating(userId);
    try {
      const res = await fetch('/api/admin/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ userId, credits: amount, mode }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, credits: data.credits } : u))
        );
      }
    } finally {
      setUpdating(null);
    }
  };

  // ──────────────────────────────────────────────
  // SCHERMATA DI LOGIN ADMIN
  // ──────────────────────────────────────────────
  if (!authed) {
    return (
      <main style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
      }}>
        <form
          onSubmit={handleLogin}
          style={{
            background: 'rgba(36,0,70,0.65)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(224,170,255,0.25)',
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem',
            width: '100%',
            maxWidth: '380px',
          }}
        >
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, textAlign: 'center' }}>
            🔐 Admin Panel
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: 0 }}>
            Inserisci la password admin per accedere
          </p>
          {error && (
            <div style={{ background: 'rgba(220,50,50,0.2)', border: '1px solid rgba(220,50,50,0.4)', borderRadius: '8px', padding: '0.7rem 1rem', fontSize: '0.85rem', color: '#ffaaaa' }}>
              {error}
            </div>
          )}
          <input
            type="password"
            placeholder="Password admin"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            autoFocus
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.8rem',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, rgba(157,78,221,0.8), rgba(110,40,180,0.9))',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>
      </main>
    );
  }

  // ──────────────────────────────────────────────
  // PANNELLO PRINCIPALE
  // ──────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100dvh', padding: '2rem 1rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>👤 Gestione Utenti</h1>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', margin: '0.25rem 0 0' }}>
            {users.length} utenti registrati
          </p>
        </div>
        <button
          onClick={() => fetchUsers(secret)}
          style={{
            padding: '0.5rem 1.2rem',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          🔄 Aggiorna
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {users.map((user) => (
          <div
            key={user.id}
            style={{
              background: 'rgba(36,0,70,0.5)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(224,170,255,0.15)',
              borderRadius: '14px',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            {/* Avatar */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.imageUrl || '/favicon.ico'}
              alt={user.name}
              width={42}
              height={42}
              style={{ borderRadius: '50%', flexShrink: 0 }}
            />

            {/* Info utente */}
            <div style={{ flex: 1, minWidth: '160px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>{user.email}</div>
            </div>

            {/* Badge crediti correnti */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.85rem',
              borderRadius: '999px',
              background: user.credits < 5 ? 'rgba(220,50,50,0.2)' : 'rgba(157,78,221,0.2)',
              border: `1px solid ${user.credits < 5 ? 'rgba(220,50,50,0.4)' : 'rgba(224,170,255,0.3)'}`,
              fontWeight: 700,
              fontSize: '0.9rem',
              color: user.credits < 5 ? '#ff8080' : 'rgba(224,170,255,0.9)',
              whiteSpace: 'nowrap',
            }}>
              ⚡ {user.credits} crediti
            </div>

            {/* Controlli */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {/* Aggiungi crediti personalizzati */}
              <input
                type="number"
                min={1}
                max={1000}
                placeholder="N"
                value={addAmount[user.id] ?? ''}
                onChange={(e) => setAddAmount((prev) => ({ ...prev, [user.id]: e.target.value }))}
                style={{
                  width: '60px',
                  padding: '0.4rem 0.5rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  textAlign: 'center',
                }}
              />
              <button
                disabled={updating === user.id || !addAmount[user.id]}
                onClick={() => updateCredits(user.id, 'add', parseInt(addAmount[user.id] || '0', 10))}
                style={{ ...btnStyle, background: 'rgba(50,180,100,0.3)', border: '1px solid rgba(50,180,100,0.5)' }}
              >
                + Aggiungi
              </button>
              {/* Preset rapidi */}
              <button
                disabled={updating === user.id}
                onClick={() => updateCredits(user.id, 'set', 20)}
                style={{ ...btnStyle }}
              >
                Reset 20
              </button>
              <button
                disabled={updating === user.id}
                onClick={() => updateCredits(user.id, 'set', 0)}
                style={{ ...btnStyle, background: 'rgba(220,50,50,0.2)', border: '1px solid rgba(220,50,50,0.4)' }}
              >
                Azzera
              </button>
            </div>

            {updating === user.id && (
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>Salvataggio...</span>
            )}
          </div>
        ))}

        {users.length === 0 && !loading && (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: '3rem' }}>
            Nessun utente trovato.
          </p>
        )}
      </div>
    </main>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '0.4rem 0.85rem',
  borderRadius: '999px',
  background: 'rgba(157,78,221,0.25)',
  border: '1px solid rgba(224,170,255,0.3)',
  color: '#fff',
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};
