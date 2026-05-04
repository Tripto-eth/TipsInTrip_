'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth, SignInButton } from '@clerk/nextjs';
import ChatWindow from '../components/ChatWindow';
import InputBar from '../components/InputBar';
import AnimatedLogo from '../components/AnimatedLogo';
import SearchFormCompact from '../components/SearchFormCompact';
import PageHeader from '../components/PageHeader';
import type { ChatMessage } from '../types/chat';
import GlobeLoader from '../components/GlobeLoader';

interface HistoryItem { query: string; ts: number; messages?: ChatMessage[]; }

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'adesso';
  if (m < 60) return `${m}m fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h fa`;
  return `${Math.floor(h / 24)}g fa`;
}

// =============================================================================
// AUTH GATE
// =============================================================================
function AuthGate() {
  return (
    <main style={{ width: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '480px', background: 'rgba(36, 0, 70, 0.55)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(224,170,255,0.25)', borderRadius: '24px', padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', boxShadow: '0 8px 40px rgba(0,0,0,0.4)', textAlign: 'center' }}>
        <Link href="/" aria-label="Home TipsinTrip"><AnimatedLogo size={80} /></Link>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(157,78,221,0.5), rgba(224,170,255,0.3))', border: '1px solid rgba(224,170,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>✨</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #fff, rgba(224,170,255,0.9))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TipsInTrip AI</h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>Il tuo assistente personale per trovare voli economici.<br />Accedi per iniziare a chattare.</p>
        </div>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[{ icon: '🗣️', text: 'Cerca voli in linguaggio naturale' }, { icon: '💡', text: 'Consigli personalizzati sul viaggio' }, { icon: '⚡', text: 'Prezzi in tempo reale da Aviasales' }].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'left' }}>
              <span style={{ fontSize: '1.1rem' }}>{icon}</span>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>{text}</span>
            </div>
          ))}
        </div>
        <SignInButton mode="modal">
          <button style={{ width: '100%', padding: '0.85rem 2rem', borderRadius: '999px', background: 'linear-gradient(135deg, rgba(157,78,221,0.8), rgba(110,40,180,0.9))', border: '1px solid rgba(224,170,255,0.5)', color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(157,78,221,0.4)' }}>
            Accedi o Registrati
          </button>
        </SignInButton>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Login con Google o Email • Gratuito</p>
      </div>
    </main>
  );
}

// =============================================================================
// HISTORY SIDEBAR
// =============================================================================
function HistorySidebar({ history, onSelect, mobileOpen, onClose }: { history: HistoryItem[]; onSelect: (item: HistoryItem) => void; mobileOpen?: boolean; onClose?: () => void }) {
  const listContent = (
    <>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '0.25rem' }}>
        Storico ricerche
      </div>
      {history.length === 0 ? (
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', margin: 0, lineHeight: 1.5 }}>
          Le tue ricerche appariranno qui.
        </p>
      ) : (
        history.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(item)}
            title={item.query}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
              padding: '0.6rem 0.75rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '10px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s, border-color 0.15s',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(157,78,221,0.14)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(157,78,221,0.4)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)';
            }}
          >
            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.82)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', fontFamily: 'inherit' }}>
              {item.query}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'inherit' }}>
              {timeAgo(item.ts)}
            </span>
          </button>
        ))
      )}
    </>
  );

  // Desktop: sidebar fissa a sinistra
  // Mobile: drawer dal basso controllato da mobileOpen
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="history-sidebar-desktop" style={{
        width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px', padding: '1.1rem 1rem', alignSelf: 'flex-start',
        position: 'sticky', top: '1.5rem', maxHeight: 'calc(100dvh - 3rem)', overflowY: 'auto',
      }}>
        {listContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(160deg, rgba(36,0,70,0.98), rgba(20,0,40,0.99))',
              border: '1px solid rgba(224,170,255,0.2)', borderRadius: '20px 20px 0 0',
              padding: '1rem 1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
              maxHeight: '60dvh', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                Storico ricerche
              </span>
              <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50%', width: '28px', height: '28px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>×</button>
            </div>
            {listContent}
          </div>
        </div>
      )}
    </>
  );
}

// =============================================================================
// CHAT PAGE
// =============================================================================
export default function ChatPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/chat').then((r) => r.json()).then((d) => { if (typeof d.credits === 'number') setCredits(d.credits); }).catch(() => {});
    fetch('/api/history').then((r) => r.json()).then((d) => { if (Array.isArray(d.history)) setHistory(d.history); }).catch(() => {});
  }, [isSignedIn]);

  // sendMessage deve essere useCallback e stare PRIMA dei return condizionali
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const queryTs = Date.now();
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages([...nextMessages, { role: 'assistant', content: '' }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (typeof data.credits === 'number') setCredits(data.credits);
        setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: data.creditsExhausted ? `⚠️ ${data.error}` : `Ops, qualcosa è andato storto: ${data.error || 'errore sconosciuto'}` }]);
        return;
      }

      const creditsHeader = res.headers.get('X-Credits-Remaining');
      if (creditsHeader !== null) {
        const n = parseInt(creditsHeader, 10);
        if (!Number.isNaN(n)) setCredits(n);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let fullResponse = '';
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
          });
        }
      }

      // Salva conversazione completa nello storico solo a fine stream
      const completeMessages: ChatMessage[] = [...nextMessages, { role: 'assistant', content: fullResponse }];
      const historyItem: HistoryItem = { query: trimmed, ts: queryTs, messages: completeMessages };
      setHistory((prev) => [historyItem, ...prev].slice(0, 30));
      fetch('/api/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: trimmed, ts: queryTs, messages: completeMessages }) }).catch(() => {});

      fetch('/api/chat').then((r) => r.json()).then((d) => { if (typeof d.credits === 'number') setCredits(d.credits); }).catch(() => {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'errore di rete';
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        return [...prev.slice(0, -1), { ...last, content: `${last.content}\n\n[Connessione interrotta: ${msg}]` }];
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const handleHistorySelect = useCallback((item: HistoryItem) => {
    if (item.messages && item.messages.length > 0) {
      setMessages(item.messages);
      setInput('');
    } else {
      setInput(item.query);
    }
  }, []);

  // ── Conditional renders DOPO tutti gli hook ──
  if (!isLoaded) {
    return (
      <main style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <GlobeLoader size={120} />
      </main>
    );
  }

  if (!isSignedIn) return <AuthGate />;

  const creditsExhausted = credits !== null && credits < 5;

  return (
    <>
      <PageHeader title="✨ TipsInTrip AI" description="Trova il volo più economico — chiedilo in italiano" />
      <main style={{ width: '100%', flex: 1, display: 'flex', justifyContent: 'center', padding: '1.5rem 1rem', gap: '1.5rem', alignItems: 'flex-start', boxSizing: 'border-box' }}>

        {/* Storico ricerche — sidebar sinistra (desktop) / drawer (mobile) */}
        <HistorySidebar history={history} onSelect={handleHistorySelect} mobileOpen={historyOpen} onClose={() => setHistoryOpen(false)} />

        {/* Chat principale */}
        <section style={{ flex: 1, maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 }}>
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 0 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '0.25rem' }}>
            {/* Tasto storico — visibile solo su mobile */}
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="history-mobile-btn"
              aria-label="Storico ricerche"
              style={{ display: 'none', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '999px', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Storico
            </button>
            {credits !== null && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.65rem', borderRadius: '999px', background: creditsExhausted ? 'rgba(220,50,50,0.2)' : 'rgba(157,78,221,0.2)', border: `1px solid ${creditsExhausted ? 'rgba(220,50,50,0.4)' : 'rgba(224,170,255,0.35)'}`, fontSize: '0.75rem', fontWeight: 600, color: creditsExhausted ? '#ff8080' : 'rgba(224,170,255,0.9)' }}>
                <span>{creditsExhausted ? '⛔' : '⚡'}</span>
                <span>{credits} crediti rimasti</span>
              </div>
            )}
          </header>

          <div style={{ flex: 1, minHeight: '400px', background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <ChatWindow messages={messages} isLoading={isLoading} />
          </div>

          {creditsExhausted && (
            <div style={{ padding: '0.9rem 1.25rem', borderRadius: '12px', background: 'rgba(220,50,50,0.15)', border: '1px solid rgba(220,50,50,0.35)', color: '#ffaaaa', fontSize: '0.88rem', textAlign: 'center' }}>
              ⛔ Hai esaurito i tuoi 20 crediti. Contatta il supporto per ricaricarli.
            </div>
          )}

          <button type="button" onClick={() => setShowForm((v) => !v)} style={{ alignSelf: 'flex-start', padding: '0.3rem 0.7rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', cursor: 'pointer' }}>
            {showForm ? '▲ Nascondi form' : '▼ Mostra form guidato'}
          </button>

          {showForm && <SearchFormCompact onSubmit={sendMessage} disabled={isLoading || creditsExhausted} />}

          <InputBar value={input} onChange={setInput} onSend={() => sendMessage(input)} disabled={isLoading || creditsExhausted} />
        </section>
      </main>
    </>
  );
}
