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

        {/* ── EDITOR DESTINAZIONI ── */}
        <DestinazioneEditor secret={secret} />

        {/* ── SCANSIONE MENSILE ── */}
        <ScanMensile secret={secret} onAdd={fetchOfferte} />

        {/* ── SCANSIONE OFFERTE CTA ── */}
        <ScanOfferte secret={secret} onAdd={fetchOfferte} />

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

// ── Scansione mensile ──────────────────────────────────────────
interface MensileResult {
  destination: string; destinationCode: string; flag: string;
  price: number; departDate: string; returnDate?: string;
  direct: boolean; affiliateUrl: string; isRoundtrip: boolean;
}

function ScanMensile({ secret, onAdd }: { secret: string; onAdd: () => void }) {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [month, setMonth] = useState(defaultMonth);
  const [maxDays, setMaxDays] = useState(7);
  const [weekendOnly, setWeekendOnly] = useState(false);
  const [roundtrip, setRoundtrip] = useState(true);
  const [results, setResults] = useState<MensileResult[]>([]);
  const [scanning, setScanning] = useState(false);
  const [meta, setMeta] = useState<{ totalCalls: number; dates: number } | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const scan = async () => {
    setScanning(true); setResults([]); setAdded(new Set()); setMeta(null);
    const p = new URLSearchParams({ month, maxDays: String(maxDays), weekendOnly: weekendOnly ? '1' : '0', roundtrip: roundtrip ? '1' : '0' });
    try {
      const res = await fetch(`/api/admin/scan-mensile?${p}`, { headers: { 'x-admin-secret': secret } });
      const d = await res.json();
      setResults(d.data ?? []);
      setMeta(d.meta ?? null);
    } catch { alert('Errore scansione'); }
    finally { setScanning(false); }
  };

  const add = async (r: MensileResult) => {
    const key = r.destinationCode + r.departDate;
    setAdding(r.destinationCode);
    const days = maxDays;
    const res = await fetch('/api/admin/create-destinazione', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({
        destination: r.destination, destinationCode: r.destinationCode, flag: r.flag,
        flightPrice: r.price, departDate: r.departDate, returnDate: r.returnDate,
        direct: r.direct, days,
      }),
    });
    const d = await res.json();
    if (!res.ok && res.status !== 409) {
      alert(`Errore: ${d.error}`);
    } else {
      const msg = res.status === 409
        ? `⚠️ File già esistente: ${d.slug}.md`
        : `✅ Creato: destinazioni/${d.slug}.md — Modifica e poi git push!`;
      alert(msg);
      setAdded(prev => new Set([...prev, key]));
      onAdd();
    }
    setAdding(null);
  };

  return (
    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.4rem' }}>📅 Scansione Mensile CTA</h2>
      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 1.25rem' }}>
        Panoramica completa di tutti i voli da Catania nel mese scelto, ordinati per prezzo.
      </p>

      {/* Controlli */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Mese</label>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '0.4rem 0.75rem', color: '#fff', outline: 'none', colorScheme: 'dark' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Durata max</label>
          <select value={maxDays} onChange={e => setMaxDays(Number(e.target.value))}
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '0.4rem 0.75rem', color: '#fff', outline: 'none' }}>
            {[3,5,7,10,14].map(n => <option key={n} value={n} style={{ background: '#1a0035' }}>{n} giorni</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={weekendOnly} onChange={e => setWeekendOnly(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
            Solo weekend (ven/sab)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={roundtrip} onChange={e => setRoundtrip(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
            Andata e ritorno
          </label>
        </div>
        <button onClick={scan} disabled={scanning} style={{ ...btnStyle, padding: '0.6rem 1.4rem', fontSize: '0.9rem', background: 'rgba(157,78,221,0.4)', alignSelf: 'flex-end' }}>
          {scanning ? '⏳ Scansione...' : '📅 Avvia'}
        </button>
      </div>

      {scanning && meta === null && (
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', textAlign: 'center', padding: '1rem 0' }}>
          Interrogo Kiwi su tutte le rotte × date del mese... potrebbe richiedere 30-60 secondi.
        </p>
      )}

      {meta && (
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
          {results.length} destinazioni trovate · {meta.totalCalls} chiamate totali su {meta.dates} date
        </p>
      )}

      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '480px', overflowY: 'auto' }}>
          {results.map((r) => {
            const key = r.destinationCode + r.departDate;
            const isAdded = added.has(key);
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isAdded ? 'rgba(74,222,128,0.07)' : 'rgba(0,0,0,0.18)', padding: '0.6rem 0.85rem', borderRadius: '10px', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
                  <span style={{ fontSize: '1.1rem' }}>{r.flag}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.destination}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
                      {r.departDate}{r.returnDate ? ` → ${r.returnDate}` : ''} · {r.direct ? '✈️ Diretto' : '🔄 Scalo'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#a78bfa' }}>€{r.price}</span>
                  <button onClick={() => add(r)} disabled={adding === r.destinationCode || isAdded}
                    style={{ padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, border: `1px solid ${isAdded ? 'rgba(74,222,128,0.5)' : 'rgba(157,78,221,0.5)'}`, background: isAdded ? 'rgba(74,222,128,0.15)' : 'rgba(157,78,221,0.25)', color: '#fff', cursor: isAdded ? 'default' : 'pointer' }}>
                    {isAdded ? '✓' : adding === r.destinationCode ? '...' : '➕'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
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

// ── Componente scansione offerte CTA ──────────────────────────
interface ScanResult {
  destination: string; destinationCode: string; flag: string;
  price: number; departDate: string; airline: string;
  direct: boolean; affiliateUrl: string;
}

function ScanOfferte({ secret, onAdd }: { secret: string; onAdd: () => void }) {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [scanning, setScanning] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [roundtrip, setRoundtrip] = useState(false);
  const [nights, setNights] = useState(5);

  const scan = async () => {
    setScanning(true);
    setResults([]);
    setAdded(new Set());
    try {
      const params = new URLSearchParams();
      if (roundtrip) { params.set('roundtrip', '1'); params.set('nights', String(nights)); }
      const res = await fetch(`/api/admin/scan-offerte?${params}`, {
        headers: { 'x-admin-secret': secret },
      });
      const data = await res.json();
      setResults(data.data ?? []);
    } catch {
      alert('Errore durante la scansione');
    } finally {
      setScanning(false);
    }
  };

  const add = async (r: ScanResult) => {
    setAdding(r.destinationCode);
    const retDate = (r as ScanResult & { returnDate?: string }).returnDate;
    const days = retDate ? 5 : 1;
    const res = await fetch('/api/admin/create-destinazione', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({
        destination: r.destination, destinationCode: r.destinationCode, flag: r.flag,
        flightPrice: r.price, departDate: r.departDate, returnDate: retDate,
        direct: r.direct, days,
      }),
    });
    const d = await res.json();
    if (!res.ok && res.status !== 409) {
      alert(`Errore: ${d.error}`);
    } else {
      alert(res.status === 409 ? `⚠️ File già esistente: ${d.slug}.md` : `✅ Creato: destinazioni/${d.slug}.md — Modifica e poi git push!`);
      setAdded((prev) => new Set([...prev, r.destinationCode]));
    }
    setAdding(null);
    onAdd();
  };

  return (
    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>🔍 Scansiona offerte CTA</h2>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', margin: '0.25rem 0 0' }}>
            Prezzi real-time su 28 rotte · ordinate per prezzo
          </p>
          {/* Toggle Solo andata / A/R + notti */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.25)', borderRadius: '999px', padding: '3px' }}>
              {([false, true] as const).map((rt) => (
                <button key={String(rt)} type="button" onClick={() => setRoundtrip(rt)}
                  style={{ padding: '0.3rem 0.85rem', borderRadius: '999px', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    background: roundtrip === rt ? 'var(--primary)' : 'transparent',
                    color: roundtrip === rt ? '#fff' : 'rgba(255,255,255,0.5)',
                  }}>
                  {rt ? 'A/R' : 'Solo andata'}
                </button>
              ))}
            </div>
            {roundtrip && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>Durata:</span>
                <input type="number" min={1} max={30} value={nights} onChange={(e) => setNights(Number(e.target.value))}
                  style={{ width: '52px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '0.25rem 0.5rem', color: '#fff', fontSize: '0.85rem', outline: 'none', textAlign: 'center' }} />
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>notti</span>
              </div>
            )}
          </div>
        </div>
        <button onClick={scan} disabled={scanning} style={{ ...btnStyle, padding: '0.6rem 1.4rem', fontSize: '0.9rem', background: 'rgba(157,78,221,0.4)' }}>
          {scanning ? '⏳ Scansione...' : '🔍 Avvia scansione'}
        </button>
      </div>

      {scanning && (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>
          Interrogo Kiwi su 28 rotte in parallelo... (~10 secondi)
        </p>
      )}

      {results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {results.map((r) => (
            <div key={r.destinationCode} style={{
              background: added.has(r.destinationCode) ? 'rgba(74,222,128,0.08)' : 'rgba(0,0,0,0.2)',
              border: `1px solid ${added.has(r.destinationCode) ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '12px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1rem' }}>{r.flag} <strong>{r.destination}</strong></span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#a78bfa' }}>€{r.price}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                📅 {r.departDate}{(r as ScanResult & { returnDate?: string }).returnDate ? ` → ${(r as ScanResult & { returnDate?: string }).returnDate}` : ''}
                {' '}· {r.direct ? '✈️ Diretto' : '🔄 Scalo'}
              </div>
              <button
                onClick={() => add(r)}
                disabled={adding === r.destinationCode || added.has(r.destinationCode)}
                style={{
                  marginTop: '0.25rem', padding: '0.4rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600,
                  background: added.has(r.destinationCode) ? 'rgba(74,222,128,0.2)' : 'rgba(157,78,221,0.3)',
                  border: `1px solid ${added.has(r.destinationCode) ? 'rgba(74,222,128,0.5)' : 'rgba(157,78,221,0.5)'}`,
                  color: '#fff', cursor: added.has(r.destinationCode) ? 'default' : 'pointer',
                }}
              >
                {added.has(r.destinationCode) ? '✓ Aggiunta' : adding === r.destinationCode ? '...' : '➕ Aggiungi offerta'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Editor destinazioni (salva su Redis) ──────────────────────────
interface DestForm {
  destination: string; flag: string; destinationCode: string;
  coverImage: string; period: string; days: string;
  flightPrice: string; hotelPerNight: string; itineraryCost: string;
  tags: string; featured: boolean;
  perche: string; voliInfo: string; dormire: string;
  nonPerdere: string; quandoAndare: string; itinerario: string;
}

function slugify(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildMarkdown(f: DestForm): string {
  const days = parseInt(f.days) || 5;
  const fp = parseFloat(f.flightPrice) || 0;
  const hn = parseFloat(f.hotelPerNight) || 60;
  const bMin = Math.round(fp * 2 + hn * days * 0.8);
  const bMax = Math.round(fp * 2 + hn * days * 1.3);
  const tags = f.tags.split(',').map(t => t.trim()).filter(Boolean);
  const today = new Date().toISOString().split('T')[0];

  const defaultVoli = `- **Compagnia**: da aggiornare\n- **Prezzo trovato**: da €${fp}\n- **Aeroporto di arrivo**: ${f.destinationCode}`;
  const defaultDormire = `| Zona | Tipologia | Prezzo/notte |\n|---|---|---|\n| Centro | Hotel 3★ | €${hn}-${hn + 30} |`;
  const defaultItinerario = Array.from({ length: days }, (_, i) => {
    if (i === 0) return `### Giorno 1 — Arrivo\n- **Mattina**: \n- **Pranzo**: \n- **Pomeriggio**: \n- **Sera**: `;
    if (i === days - 1) return `### Giorno ${days} — Partenza\n- **Mattina**: Ultima colazione e check-out\n- **Partenza**: Trasferimento all'aeroporto`;
    return `### Giorno ${i + 1}\n- **Mattina**: \n- **Pranzo**: \n- **Pomeriggio**: \n- **Sera**: `;
  }).join('\n\n');

  return `---
title: "${f.destination} in ${days} giorni: voli, hotel e cosa fare"
destination: "${f.destination}"
country: ""
flag: "${f.flag}"
coverImage: "${f.coverImage}"
period: "${f.period}"
duration: "${days} giorni"
budgetMin: ${bMin}
budgetMax: ${bMax}
tags: [${tags.map(t => `"${t}"`).join(', ')}]
flightFrom: "CTA"
flightPrice: ${fp}
hotelPerNight: ${hn}
itineraryCost: ${parseInt(f.itineraryCost) || 3}
featured: ${f.featured}
date: "${today}"
---

## Perché ${f.destination}?

${f.perche || ''}

## Voli da Catania

${f.voliInfo || defaultVoli}

## Dove dormire

${f.dormire || defaultDormire}

## Cosa non perdere

${f.nonPerdere || ''}

## Quando andare

${f.quandoAndare || ''}

---
ITINERARY_LOCKED
---

## Itinerario giorno per giorno

${f.itinerario || defaultItinerario}
`;
}

const emptyDest: DestForm = {
  destination: '', flag: '', destinationCode: '', coverImage: '', period: '', days: '5',
  flightPrice: '', hotelPerNight: '60', itineraryCost: '3', tags: 'Cultura, Relax',
  featured: false, perche: '', voliInfo: '', dormire: '', nonPerdere: '', quandoAndare: '', itinerario: '',
};

function DestinazioneEditor({ secret }: { secret: string }) {
  const [form, setForm] = useState<DestForm>(emptyDest);
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const [list, setList] = useState<Array<{ slug: string; createdAt: number }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    const res = await fetch('/api/admin/destinazioni', { headers: { 'x-admin-secret': secret } });
    const d = await res.json();
    setList((d.data ?? []).map((i: { slug: string; createdAt: number }) => ({ slug: i.slug, createdAt: i.createdAt })));
  }, [secret]);

  useEffect(() => { loadList(); }, [loadList]);

  const set = (k: keyof DestForm, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.destination) return;
    setStatus('saving');
    const slug = slugify(form.destination);
    const markdown = buildMarkdown(form);
    const res = await fetch('/api/admin/destinazioni', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ slug, markdown }),
    });
    if (res.ok) {
      setStatus('ok');
      setForm(emptyDest);
      setShowForm(false);
      loadList();
    } else {
      const d = await res.json();
      setErrMsg(d.error ?? 'Errore');
      setStatus('error');
    }
    setTimeout(() => setStatus('idle'), 3000);
  };

  const del = async (slug: string) => {
    if (!confirm(`Eliminare "${slug}"?`)) return;
    setDeleting(slug);
    await fetch('/api/admin/destinazioni', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ slug }),
    });
    setDeleting(null);
    loadList();
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)',
    padding: '0.55rem 0.75rem', borderRadius: '8px', color: '#fff', outline: 'none', fontSize: '0.9rem', width: '100%',
  };
  const taStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.5 };
  const labelStyle: React.CSSProperties = { fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem', display: 'block' };

  return (
    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>🗺️ Gestione Destinazioni</h2>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', margin: '0.25rem 0 0' }}>
            Crea e pubblica guide senza git push — salvate su Redis.
          </p>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{ ...btnStyle, padding: '0.55rem 1.2rem', background: showForm ? 'rgba(220,50,50,0.2)' : 'rgba(157,78,221,0.4)' }}>
          {showForm ? '✕ Chiudi' : '➕ Nuova destinazione'}
        </button>
      </div>

      {/* Lista destinazioni Redis */}
      {list.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: showForm ? '1.5rem' : 0 }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.25rem' }}>
            {list.length} destinazion{list.length === 1 ? 'e' : 'i'} su Redis
          </div>
          {list.map((item) => (
            <div key={item.slug} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.18)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.slug}</span>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginLeft: '0.75rem' }}>
                  {new Date(item.createdAt).toLocaleDateString('it-IT')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a href={`/destinazioni/${item.slug}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '0.72rem', color: '#a78bfa', textDecoration: 'none', padding: '0.25rem 0.5rem', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '6px' }}>
                  👁 Vedi
                </a>
                <button onClick={() => del(item.slug)} disabled={deleting === item.slug}
                  style={{ background: 'rgba(220,50,50,0.2)', border: '1px solid rgba(220,50,50,0.4)', color: '#fca5a5', fontSize: '0.72rem', padding: '0.25rem 0.6rem', borderRadius: '6px', cursor: 'pointer' }}>
                  {deleting === item.slug ? '...' : '🗑'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* ── Frontmatter ── */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(224,170,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
              Dati principali
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
              {([
                ['destination', 'Destinazione *', 'Barcellona'],
                ['flag', 'Emoji bandiera', '🇪🇸'],
                ['destinationCode', 'IATA', 'BCN'],
                ['coverImage', 'URL immagine copertina', 'https://...'],
                ['period', 'Periodo', 'Maggio–Settembre'],
                ['days', 'Giorni', '5'],
                ['flightPrice', 'Prezzo volo (€)', '89'],
                ['hotelPerNight', 'Hotel/notte (€)', '60'],
                ['itineraryCost', 'Crediti itinerario', '3'],
                ['tags', 'Tag (virgola)', 'Cultura, Relax'],
              ] as [keyof DestForm, string, string][]).map(([k, label, ph]) => (
                <div key={k}>
                  <label style={labelStyle}>{label}</label>
                  <input value={form[k] as string} onChange={e => set(k, e.target.value)} placeholder={ph} style={inputStyle} />
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer', paddingBottom: '0.55rem' }}>
                  <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                  In evidenza
                </label>
              </div>
            </div>
          </div>

          {/* ── Sezioni contenuto ── */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(224,170,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
              Contenuto pubblico
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {([
                ['perche', `Perché [destinazione]?`, 4],
                ['voliInfo', 'Voli da Catania (lascia vuoto per auto)', 3],
                ['dormire', 'Dove dormire (lascia vuoto per tabella auto)', 4],
                ['nonPerdere', 'Cosa non perdere', 4],
                ['quandoAndare', 'Quando andare', 3],
              ] as [keyof DestForm, string, number][]).map(([k, label, rows]) => (
                <div key={k}>
                  <label style={labelStyle}>{label}</label>
                  <textarea value={form[k] as string} onChange={e => set(k, e.target.value)} rows={rows} style={taStyle} />
                </div>
              ))}
            </div>
          </div>

          {/* ── Itinerario (paywall) ── */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,200,100,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
              🔒 Itinerario (a pagamento — lascia vuoto per placeholder auto)
            </div>
            <textarea value={form.itinerario} onChange={e => set('itinerario', e.target.value)} rows={8} style={taStyle}
              placeholder={`### Giorno 1 — Arrivo\n- **Mattina**: ...\n\n### Giorno 2\n- **Mattina**: ...`} />
          </div>

          {status === 'ok' && <p style={{ color: '#4ade80', fontSize: '0.85rem', margin: 0 }}>✓ Destinazione pubblicata!</p>}
          {status === 'error' && <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>✗ {errMsg}</p>}

          <button type="submit" disabled={status === 'saving' || !form.destination}
            style={{ ...btnStyle, padding: '0.7rem 1.5rem', fontSize: '0.9rem', background: 'rgba(157,78,221,0.5)', opacity: status === 'saving' ? 0.7 : 1 }}>
            {status === 'saving' ? 'Pubblicazione...' : '🚀 Pubblica destinazione'}
          </button>
        </form>
      )}
    </div>
  );
}
