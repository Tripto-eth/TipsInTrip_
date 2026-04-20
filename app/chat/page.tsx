'use client';

import { useState } from 'react';
import Link from 'next/link';
import ChatWindow from '../components/ChatWindow';
import InputBar from '../components/InputBar';
import AnimatedLogo from '../components/AnimatedLogo';
import SearchFormCompact from '../components/SearchFormCompact';
import type { ChatMessage } from '../types/chat';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Ops, qualcosa è andato storto: ${data.error || 'errore sconosciuto'}` },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message || '' }]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'errore di rete';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Ops, qualcosa è andato storto: ${msg}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main style={{
      width: '100%',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '1rem',
    }}>
      <header style={{
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem 0 1rem',
      }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }} aria-label="Home">
          <AnimatedLogo size={64} />
        </Link>
        <div style={{ textAlign: 'right' }}>
          <h1 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Trova il volo più economico</h1>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Chiedilo in italiano o usa il form</p>
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
          <SearchFormCompact onSubmit={sendMessage} disabled={isLoading} />
        )}

        <InputBar
          value={input}
          onChange={setInput}
          onSend={() => sendMessage(input)}
          disabled={isLoading}
        />
      </section>
    </main>
  );
}
