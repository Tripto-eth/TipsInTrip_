'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth, SignInButton } from '@clerk/nextjs';
import ChatWindow from './ChatWindow';
import InputBar from './InputBar';
import GlobeLoader from './GlobeLoader';
import type { ChatMessage } from '../types/chat';
import styles from './HomeAIBar.module.css';

const PLACEHOLDERS = [
  'Voli economici per Lisbona a giugno…',
  'Una settimana al mare sotto i 400€…',
  'Capitali europee weekend lungo a maggio…',
  'Cosa fare a Barcellona in 3 giorni…',
  'Voli low cost dal weekend prossimo…',
  'Capodanno in Asia entro 800€…',
  'Mete avventura per chi ama il trekking…',
];

const SUGGESTIONS = [
  { icon: '✈️', text: 'Voli economici da Catania' },
  { icon: '🏖️', text: 'Mete mare a maggio' },
  { icon: '🌍', text: 'Capitali sotto 100€' },
  { icon: '🎒', text: 'Solo bagaglio a mano' },
];

export default function HomeAIBar({ compact = false, noDivider = false }: { compact?: boolean; noDivider?: boolean } = {}) {
  const [input, setInput] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  // Ruota il placeholder finché l'utente non scrive
  useEffect(() => {
    if (input) return;
    const t = setInterval(() => {
      setPhraseIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 2800);
    return () => clearInterval(t);
  }, [input]);

  const openWith = (text: string) => {
    setSeedMessage(text);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    openWith(text);
  };

  const close = useCallback(() => {
    setModalOpen(false);
    setSeedMessage(null);
    setInput('');
  }, []);

  const barAndChips = (
    <>
      <form className={styles.barWrap} onSubmit={handleSubmit}>
        <span className={styles.barIcon} aria-hidden>✨</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={PLACEHOLDERS[phraseIdx]}
          className={styles.input}
          autoComplete="off"
          aria-label="Chiedi a Tips in Trip AI"
        />
        <button
          type="submit"
          className={styles.submit}
          disabled={!input.trim()}
          aria-label="Invia richiesta"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </form>

      <div className={styles.suggestions}>
        <span className={styles.suggLabel}>Prova:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s.text}
            type="button"
            onClick={() => openWith(s.text)}
            className={styles.chip}
          >
            <span aria-hidden>{s.icon}</span>
            {s.text}
          </button>
        ))}
      </div>
    </>
  );

  if (compact) {
    return (
      <>
        <div className={styles.compactWrap}>
          {!noDivider && (
            <div className={styles.compactDivider}>
              <span className={styles.compactDividerText}>
                <span aria-hidden>✨</span> Oppure chiedi in linguaggio naturale
              </span>
            </div>
          )}
          {barAndChips}
        </div>
        {modalOpen && <ChatModal seed={seedMessage} onClose={close} />}
      </>
    );
  }

  return (
    <>
      <section className={styles.section}>
        <div className={styles.inner}>
          <span className={styles.label}>— Tips in Trip AI</span>
          <h2 className={styles.title}>
            Chiedi e ti rispondo<br />
            <span className={styles.titleAccent}>con voli reali</span>
          </h2>
          <p className={styles.desc}>
            Scrivi cosa stai cercando come parleresti a un amico.
            La nostra AI cerca voli, hotel e itinerari su misura.
          </p>
          {barAndChips}
        </div>
      </section>

      {modalOpen && <ChatModal seed={seedMessage} onClose={close} />}
    </>
  );
}

// ─────────────────────────────────────────────────
// ChatModal — overlay con chat, gated dietro Clerk
// ─────────────────────────────────────────────────
function ChatModal({ seed, onClose }: { seed: string | null; onClose: () => void }) {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', k);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <button onClick={onClose} className={styles.close} aria-label="Chiudi chat">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        {!isLoaded ? (
          <div className={styles.loadingState}>
            <GlobeLoader size={80} />
          </div>
        ) : !isSignedIn ? (
          <AuthGateInline />
        ) : (
          <ChatBody seed={seed} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Auth gate compatto dentro al modal
// ─────────────────────────────────────────────────
function AuthGateInline() {
  return (
    <div className={styles.authGate}>
      <div className={styles.authIcon}>✨</div>
      <h3 className={styles.authTitle}>
        Registrati per usare<br />
        <span className={styles.titleAccent}>Tips in Trip AI</span>
      </h3>
      <p className={styles.authDesc}>
        Crea un account gratuito e ricevi 20 crediti per iniziare a chattare con la nostra AI di viaggio.
      </p>
      <ul className={styles.authFeatures}>
        <li><span aria-hidden>🗣️</span> Cerca voli in linguaggio naturale</li>
        <li><span aria-hidden>💡</span> Consigli personalizzati sul viaggio</li>
        <li><span aria-hidden>⚡</span> Prezzi reali in tempo reale</li>
      </ul>
      <SignInButton mode="modal">
        <button className={styles.authBtn}>Accedi o Registrati</button>
      </SignInButton>
      <p className={styles.authNote}>Login con Google o Email · Gratuito</p>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Chat — riusa ChatWindow + InputBar dell'app
// ─────────────────────────────────────────────────
function ChatBody({ seed }: { seed: string | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const next: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages([...next, { role: 'assistant', content: '' }]);
    setInput('');
    const queryTs = Date.now();
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: data.creditsExhausted ? `⚠️ ${data.error}` : `Ops, qualcosa è andato storto: ${data.error ?? 'errore sconosciuto'}` },
        ]);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let fullResponse = '';
      while (!done) {
        const { value, done: rDone } = await reader.read();
        done = rDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
          });
        }
      }

      // Salva conversazione completa a fine stream
      const completeMessages = [...next, { role: 'assistant' as const, content: fullResponse }];
      fetch('/api/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: trimmed, ts: queryTs, messages: completeMessages }) }).catch(() => {});
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

  // Manda il seed message al primo render se presente
  useEffect(() => {
    if (seed) sendMessage(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.chatBody}>
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderTitle}>
          <span className={styles.chatHeaderDot} />
          <span aria-hidden>✨</span>
          Tips in Trip AI
        </div>
      </div>
      <div className={styles.chatMessages}>
        <ChatWindow messages={messages} isLoading={isLoading} />
      </div>
      <div className={styles.chatInputWrap}>
        <InputBar
          value={input}
          onChange={setInput}
          onSend={() => sendMessage(input)}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
