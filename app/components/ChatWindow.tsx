'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '../types/chat';
import { LOADING_PHRASES, PHRASE_DELAY_MS } from '../lib/loadingPhrases';
import GlobeLoader from './GlobeLoader';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

interface FlightLeg { date: string; dep: string; arr: string; duration: string; stops: number; }
interface FlightResult {
  route: string; airline: string; price: number; currency: string; link: string;
  outbound: FlightLeg; inbound?: FlightLeg;
}

// ── Flight card ──────────────────────────────────────────────
function StopsBadge({ stops }: { stops: number }) {
  if (stops === 0) return (
    <span style={{ fontSize: '0.68rem', padding: '1px 7px', borderRadius: '999px', background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80', fontWeight: 600, whiteSpace: 'nowrap' }}>Diretto</span>
  );
  return (
    <span style={{ fontSize: '0.68rem', padding: '1px 7px', borderRadius: '999px', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', color: '#fbbf24', fontWeight: 600, whiteSpace: 'nowrap' }}>{stops} scalo</span>
  );
}

function LegRow({ label, leg }: { label: string; leg: FlightLeg }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', padding: '0.55rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', minWidth: '52px' }}>{label}</span>
      <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', minWidth: '72px' }}>{leg.date}</span>
      <span style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>{leg.dep}</span>
      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>→</span>
      <span style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>{leg.arr}</span>
      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginLeft: 'auto' }}>⏱ {leg.duration}</span>
      <StopsBadge stops={leg.stops} />
    </div>
  );
}

function FlightCard({ f }: { f: FlightResult }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '14px',
      overflow: 'hidden',
      marginBottom: '0.6rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 1rem', background: 'rgba(157,78,221,0.1)', borderBottom: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap', gap: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em' }}>✈ {f.route}</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '6px' }}>{f.airline}</span>
      </div>

      {/* Legs */}
      <div style={{ padding: '0 1rem' }}>
        <LegRow label="Andata" leg={f.outbound} />
        {f.inbound && <LegRow label="Ritorno" leg={f.inbound} />}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{f.currency}{f.price}</span>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.3rem' }}>a persona</span>
        </div>
        <a
          href={f.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.55rem 1.2rem', borderRadius: '999px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #b65cff 100%)',
            color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem',
            boxShadow: '0 4px 14px rgba(157,78,221,0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          Prenota <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}

function FlightCards({ raw }: { raw: string }) {
  try {
    const flights: FlightResult[] = JSON.parse(raw);
    if (!Array.isArray(flights) || flights.length === 0) return null;
    return (
      <div style={{ margin: '0.5rem 0' }}>
        {flights.map((f, i) => <FlightCard key={i} f={f} />)}
      </div>
    );
  } catch {
    return <pre style={{ fontSize: '0.75rem', opacity: 0.6, overflowX: 'auto' }}>{raw}</pre>;
  }
}

// ── Nasconde contenuto incompleto durante lo streaming ───────
function bufferIncomplete(content: string): string {
  // Code block aperto ma non chiuso → nascondi da ``` in poi
  const ticks = (content.match(/```/g) || []).length;
  if (ticks % 2 !== 0) {
    const lastOpen = content.lastIndexOf('```');
    const before = content.slice(0, lastOpen).trimEnd();
    return (before ? before + '\n\n' : '') + '*⏳ Sto preparando i risultati...*';
  }
  // Tabella markdown incompleta
  const lines = content.split('\n');
  let i = lines.length - 1;
  while (i >= 0 && lines[i].trim() === '') i--;
  if (i >= 0 && lines[i].trim().startsWith('|')) {
    let start = i;
    while (start > 0 && lines[start - 1].trim().startsWith('|')) start--;
    const before = lines.slice(0, start).join('\n').trimEnd();
    return (before ? before + '\n\n' : '') + '*⏳ Sto preparando i risultati...*';
  }
  return content;
}

// ── Main component ───────────────────────────────────────────
export default function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) { setPhraseIdx(0); return; }
    const id = setInterval(() => setPhraseIdx((i) => (i + 1) % LOADING_PHRASES.length), PHRASE_DELAY_MS);
    return () => clearInterval(id);
  }, [isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', gap: '0.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'rgba(255,255,255,0.9)' }}>Dimmi il tuo viaggio</h2>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', margin: 0, maxWidth: '480px', lineHeight: 1.55 }}>
          Usa il form qui sotto oppure scrivi liberamente (es. &ldquo;da Catania a Londra il 10 giugno, solo andata&rdquo;).
        </p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
      {messages.map((m, i) => {
        const isStreamingThis = isLoading && i === messages.length - 1 && m.role === 'assistant';
        const content = isStreamingThis ? bufferIncomplete(m.content) : m.content;

        return (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: m.role === 'user' ? '85%' : '100%',
              padding: m.role === 'user' ? '0.75rem 1rem' : '0.75rem 0',
              borderRadius: m.role === 'user' ? '12px' : '0',
              background: m.role === 'user' ? 'var(--primary)' : 'transparent',
              color: '#fff',
              fontSize: '0.9rem',
              lineHeight: 1.55,
              wordBreak: 'break-word',
              textAlign: 'left',
              width: m.role === 'assistant' ? '100%' : undefined,
            }}
          >
            {m.role === 'user' ? (
              <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
            ) : (
              <div className="chat-md">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children }) {
                      const lang = className?.replace('language-', '');
                      if (lang === 'flights') {
                        return <FlightCards raw={String(children).trim()} />;
                      }
                      return <code className={className}>{children}</code>;
                    },
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '0.25rem 0.6rem', borderRadius: '6px', background: 'var(--primary)', color: '#fff', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {children}
                      </a>
                    ),
                    table: ({ children }) => (
                      <div style={{ overflowX: 'auto', margin: '0.5rem 0' }}>
                        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.82rem' }}>{children}</table>
                      </div>
                    ),
                    th: ({ children }) => <th style={{ padding: '0.5rem 0.6rem', textAlign: 'left', fontWeight: 600, background: 'rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.15)', whiteSpace: 'nowrap' }}>{children}</th>,
                    td: ({ children }) => <td style={{ padding: '0.5rem 0.6rem', borderBottom: '1px solid rgba(255,255,255,0.06)', verticalAlign: 'middle', textAlign: 'left' }}>{children}</td>,
                    p: ({ children }) => <p style={{ margin: '0.4rem 0' }}>{children}</p>,
                    ul: ({ children }) => <ul style={{ margin: '0.4rem 0', paddingLeft: '1.2rem' }}>{children}</ul>,
                    strong: ({ children }) => <strong style={{ color: 'var(--secondary)' }}>{children}</strong>,
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        );
      })}

      {isLoading && (
        <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
          <GlobeLoader size={44} />
          <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)' }}>{LOADING_PHRASES[phraseIdx]}</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
