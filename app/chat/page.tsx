'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, SignInButton } from '@clerk/nextjs';
import ChatWindow from '../components/ChatWindow';
import InputBar from '../components/InputBar';
import AnimatedLogo from '../components/AnimatedLogo';
import SearchFormCompact from '../components/SearchFormCompact';
import PageHeader from '../components/PageHeader';
import type { ChatMessage } from '../types/chat';

// =============================================================================
// AUTH GATE — schermata mostrata agli utenti non autenticati
// =============================================================================
function AuthGate() {
  return (
    <main
      style={{
        width: '100%',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      {/* Card Liquid Glass */}
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(36, 0, 70, 0.55)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(224,170,255,0.25)',
          borderRadius: '24px',
          padding: '3rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <Link href="/" aria-label="Home TipsinTrip">
          <AnimatedLogo size={80} />
        </Link>

        {/* Icona AI */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(157,78,221,0.5), rgba(224,170,255,0.3))',
            border: '1px solid rgba(224,170,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
          }}
        >
          ✨
        </div>

        {/* Testi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h1
            style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              margin: 0,
              background: 'linear-gradient(135deg, #fff, rgba(224,170,255,0.9))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            TipsInTrip AI
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>
            Il tuo assistente personale per trovare voli economici.<br />
            Accedi per iniziare a chattare.
          </p>
        </div>

        {/* Features teaser */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {[
            { icon: '🗣️', text: 'Cerca voli in linguaggio naturale' },
            { icon: '💡', text: 'Consigli personalizzati sul viaggio' },
            { icon: '⚡', text: 'Prezzi in tempo reale da Aviasales' },
          ].map(({ icon, text }) => (
            <div
              key={text}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 1rem',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.07)',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{icon}</span>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* CTA Login */}
        <SignInButton mode="modal">
          <button
            style={{
              width: '100%',
              padding: '0.85rem 2rem',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, rgba(157,78,221,0.8), rgba(110,40,180,0.9))',
              border: '1px solid rgba(224,170,255,0.5)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(157,78,221,0.4)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 28px rgba(157,78,221,0.6)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(157,78,221,0.4)';
            }}
          >
            Accedi o Registrati
          </button>
        </SignInButton>

        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          Login con Google o Email • Gratuito
        </p>
      </div>
    </main>
  );
}

// =============================================================================
// CHAT PAGE — visibile solo agli utenti autenticati
// =============================================================================
export default function ChatPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  // Carica i crediti dal server al primo render (solo se autenticato)
  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/chat')
      .then((r) => r.json())
      .then((d) => { if (typeof d.credits === 'number') setCredits(d.credits); })
      .catch(() => {});
  }, [isSignedIn]);

  // Mentre Clerk carica lo stato auth, mostra un loader minimo
  if (!isLoaded) {
    return (
      <main style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(224,170,255,0.3)', borderTopColor: 'rgba(224,170,255,0.9)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </main>
    );
  }

  // Utente non autenticato → mostra Auth Gate
  if (!isSignedIn) {
    return <AuthGate />;
  }

  const creditsExhausted = credits !== null && credits < 5;

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || creditsExhausted) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    // Aggiungiamo in un colpo solo: messaggio utente + placeholder assistant
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
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: data.creditsExhausted
              ? `⚠️ ${data.error}`
              : `Ops, qualcosa è andato storto: ${data.error || 'errore sconosciuto'}` },
        ]);
        return;
      }

      // Leggi i crediti aggiornati dall'header subito (no extra round-trip)
      const creditsHeader = res.headers.get('X-Credits-Remaining');
      if (creditsHeader !== null) {
        const n = parseInt(creditsHeader, 10);
        if (!Number.isNaN(n)) setCredits(n);
      }

      // Leggi lo stream chunk per chunk e aggiorna l'ultimo messaggio
      const reader = res.body!.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
          });
        }
      }

      // Stream finito — rileggi i crediti finali (possono essere stati scalati
      // di più per ricerche multiple in query tematiche)
      fetch('/api/chat')
        .then((r) => r.json())
        .then((d) => { if (typeof d.credits === 'number') setCredits(d.credits); })
        .catch(() => {});
    } catch (err) {
      // Preserva il testo già streammato e appendi l'errore in coda
      const msg = err instanceof Error ? err.message : 'errore di rete';
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        return [
          ...prev.slice(0, -1),
          { ...last, content: `${last.content}\n\n[Connessione interrotta: ${msg}]` },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* bgImage="/headers/chat.jpg" — aggiungi la tua immagine quando pronta */}
      <PageHeader
        title="✨ TipsInTrip AI"
        description="Trova il volo più economico — chiedilo in italiano"
      />
    <main style={{
      width: '100%',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '1.5rem 1rem',
    }}>
      <header style={{
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0.25rem 0 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        marginBottom: '0.75rem',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
          {/* Contatore Crediti */}
          {credits !== null && (

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.2rem 0.65rem',
              borderRadius: '999px',
              background: creditsExhausted
                ? 'rgba(220,50,50,0.2)'
                : 'rgba(157,78,221,0.2)',
              border: `1px solid ${creditsExhausted ? 'rgba(220,50,50,0.4)' : 'rgba(224,170,255,0.35)'}`,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: creditsExhausted ? '#ff8080' : 'rgba(224,170,255,0.9)',
            }}>
              <span>{creditsExhausted ? '⛔' : '⚡'}</span>
              <span>{credits} crediti rimasti</span>
            </div>
          )}
        </div>
      </header>

      <section style={{
        width: '100%',
        maxWidth: '800px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        minHeight: 0,
      }}>
        <div style={{
          flex: 1,
          minHeight: '400px',
          background: 'rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <ChatWindow messages={messages} isLoading={isLoading} />
        </div>

        {/* Banner crediti esauriti */}
        {creditsExhausted && (
          <div style={{
            padding: '0.9rem 1.25rem',
            borderRadius: '12px',
            background: 'rgba(220,50,50,0.15)',
            border: '1px solid rgba(220,50,50,0.35)',
            color: '#ffaaaa',
            fontSize: '0.88rem',
            textAlign: 'center',
          }}>
            ⛔ Hai esaurito i tuoi 20 crediti. Contatta il supporto per ricaricarli.
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          style={{
            alignSelf: 'flex-start',
            padding: '0.3rem 0.7rem',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.78rem',
            cursor: 'pointer',
          }}
        >
          {showForm ? '▲ Nascondi form' : '▼ Mostra form guidato'}
        </button>

        {showForm && (
          <SearchFormCompact onSubmit={sendMessage} disabled={isLoading || creditsExhausted} />
        )}

        <InputBar
          value={input}
          onChange={setInput}
          onSend={() => sendMessage(input)}
          disabled={isLoading || creditsExhausted}
        />
      </section>
    </main>
    </>
  );
}

