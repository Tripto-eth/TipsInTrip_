'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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

  // Offerte
  type OffertaForm = {
    destination: string; destinationCode: string; flag: string;
    price: string; originalPrice: string; departDate: string; returnDate: string;
    airline: string; direct: boolean; affiliateUrl: string;
    highlight: string; validUntil: string;
  };
  const emptyOfferta: OffertaForm = {
    destination: '', destinationCode: '', flag: '✈️',
    price: '', originalPrice: '', departDate: '', returnDate: '',
    airline: 'Ryanair', direct: true, affiliateUrl: '',
    highlight: '', validUntil: '',
  };
  const [offertaForm, setOffertaForm] = useState<OffertaForm>(emptyOfferta);
  const [offertaStatus, setOffertaStatus] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle');
  const [offerte, setOfferte] = useState<Array<{ id: string; destination: string; price: number; flag: string }>>([]);

  const fetchOfferte = useCallback(async () => {
    const res = await fetch('/api/offerte');
    const data = await res.json();
    setOfferte(data.data ?? []);
  }, []);

  useEffect(() => { if (authed) fetchOfferte(); }, [authed, fetchOfferte]);

  const saveOfferta = async (e: React.FormEvent) => {
    e.preventDefault();
    setOffertaStatus('saving');
    const payload = {
      ...offertaForm,
      price: Number(offertaForm.price),
      originalPrice: offertaForm.originalPrice ? Number(offertaForm.originalPrice) : undefined,
      direct: offertaForm.direct,
    };
    const res = await fetch('/api/admin/offerte', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify(payload),
    });
    if (res.ok) { setOffertaStatus('ok'); setOffertaForm(emptyOfferta); fetchOfferte(); }
    else setOffertaStatus('error');
    setTimeout(() => setOffertaStatus('idle'), 3000);
  };

  const deleteOfferta = async (id: string) => {
    await fetch('/api/admin/offerte', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ id }),
    });
    fetchOfferte();
  };

  // Push notifications
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushUrl, setPushUrl] = useState('https://tipsintrip.com');
  const [pushStatus, setPushStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [pushResult, setPushResult] = useState('');

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

  const sendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle || !pushMessage) return;
    setPushStatus('sending');
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ title: pushTitle, message: pushMessage, url: pushUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setPushStatus('ok');
        setPushResult(`Inviata a ${data.recipients ?? '?'} utenti`);
        setPushTitle(''); setPushMessage('');
      } else {
        setPushStatus('error');
        setPushResult(JSON.stringify(data.error));
      }
    } catch {
      setPushStatus('error');
      setPushResult('Errore di rete');
    }
  };

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

        {/* ── SEZIONE OFFERTE CATANIA ── */}
        <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>🔥 Nuova Offerta da Catania</h2>
          <form onSubmit={saveOfferta} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.9rem' }}>
              {([
                ['destination', 'Destinazione', 'Barcellona'],
                ['destinationCode', 'IATA', 'BCN'],
                ['flag', 'Emoji bandiera', '🇪🇸'],
                ['airline', 'Compagnia', 'Ryanair'],
                ['price', 'Prezzo (€)', '29'],
                ['originalPrice', 'Prezzo originale (€, opz.)', '59'],
                ['departDate', 'Data partenza', '15 mag'],
                ['returnDate', 'Data ritorno (opz.)', '20 mag'],
                ['affiliateUrl', 'Link affiliato', 'https://...'],
                ['highlight', 'Badge (es. Offerta lampo)', ''],
                ['validUntil', 'Scade il (YYYY-MM-DD)', ''],
              ] as [keyof OffertaForm, string, string][]).map(([field, label, ph]) => (
                <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>{label}</label>
                  <input
                    value={offertaForm[field] as string}
                    onChange={(e) => setOffertaForm(p => ({ ...p, [field]: e.target.value }))}
                    placeholder={ph}
                    style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.55rem 0.75rem', borderRadius: '8px', color: '#fff', outline: 'none', fontSize: '0.9rem' }}
                  />
                </div>
              ))}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={offertaForm.direct} onChange={(e) => setOffertaForm(p => ({ ...p, direct: e.target.checked }))}
                style={{ accentColor: 'var(--primary)' }} />
              Volo diretto
            </label>
            {offertaStatus === 'ok' && <p style={{ color: '#4ade80', fontSize: '0.85rem' }}>✓ Offerta aggiunta!</p>}
            {offertaStatus === 'error' && <p style={{ color: '#f87171', fontSize: '0.85rem' }}>✗ Errore nel salvataggio</p>}
            <button type="submit" disabled={offertaStatus === 'saving'} style={{ ...btnStyle, padding: '0.7rem 1.5rem', fontSize: '0.9rem', background: 'rgba(157,78,221,0.4)', opacity: offertaStatus === 'saving' ? 0.7 : 1 }}>
              {offertaStatus === 'saving' ? 'Salvataggio...' : '➕ Aggiungi offerta'}
            </button>
          </form>

          {/* Lista offerte esistenti */}
          {offerte.length > 0 && (
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem' }}>Offerte attive ({offerte.length})</div>
              {offerte.map((o) => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.88rem' }}>{o.flag} {o.destination} — €{o.price}</span>
                  <button onClick={() => deleteOfferta(o.id)} style={{ background: 'rgba(220,50,50,0.2)', border: '1px solid rgba(220,50,50,0.4)', color: '#fca5a5', fontSize: '0.72rem', padding: '0.25rem 0.6rem', borderRadius: '6px', cursor: 'pointer' }}>
                    🗑 Elimina
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── SEZIONE NOTIFICHE PUSH ── */}
        <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>🔔 Invia Notifica Push</h2>
          <form onSubmit={sendPush} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Titolo</label>
              <input value={pushTitle} onChange={(e) => setPushTitle(e.target.value)} required
                placeholder="Es. Offerta lampo: Roma-Londra a €29!" maxLength={64}
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.7rem 1rem', borderRadius: '8px', color: '#fff', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Messaggio</label>
              <textarea value={pushMessage} onChange={(e) => setPushMessage(e.target.value)} required rows={3}
                placeholder="Es. Solo oggi, partenza 15 maggio. Clicca per vedere..."
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.7rem 1rem', borderRadius: '8px', color: '#fff', outline: 'none', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>URL destinazione</label>
              <input value={pushUrl} onChange={(e) => setPushUrl(e.target.value)}
                placeholder="https://tipsintrip.com/..."
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.7rem 1rem', borderRadius: '8px', color: '#fff', outline: 'none' }} />
            </div>
            {pushStatus === 'ok' && <p style={{ color: '#4ade80', fontSize: '0.9rem' }}>✓ {pushResult}</p>}
            {pushStatus === 'error' && <p style={{ color: '#f87171', fontSize: '0.9rem' }}>✗ {pushResult}</p>}
            <button type="submit" disabled={pushStatus === 'sending'} style={{ ...btnStyle, padding: '0.7rem 1.5rem', fontSize: '0.95rem', background: 'rgba(157,78,221,0.4)', opacity: pushStatus === 'sending' ? 0.7 : 1 }}>
              {pushStatus === 'sending' ? 'Invio...' : '🔔 Invia a tutti gli iscritti'}
            </button>
          </form>
        </div>
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
