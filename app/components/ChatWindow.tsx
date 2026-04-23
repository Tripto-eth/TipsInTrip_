'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '../types/chat';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export default function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        gap: '0.5rem',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontSize: '1.05rem',
          fontWeight: 600,
          margin: 0,
          color: 'rgba(255,255,255,0.9)',
        }}>
          Dimmi il tuo viaggio
        </h2>
        <p style={{
          fontSize: '0.85rem',
          color: 'rgba(255,255,255,0.55)',
          margin: 0,
          maxWidth: '480px',
          lineHeight: 1.55,
        }}>
          Usa il form qui sotto oppure scrivi liberamente (es. &ldquo;da Napoli a Londra il 10 giugno, solo andata&rdquo;).
        </p>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      padding: '1rem',
    }}>
      {messages.map((m, i) => (
        <div
          key={i}
          style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: m.role === 'user' ? '85%' : '95%',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            background: m.role === 'user'
              ? 'var(--primary)'
              : 'rgba(255,255,255,0.06)',
            border: m.role === 'user'
              ? 'none'
              : '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            fontSize: '0.9rem',
            lineHeight: 1.5,
            wordBreak: 'break-word',
            textAlign: 'left',
          }}
        >
          {m.role === 'user' ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
          ) : (
            <div className="chat-md">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        background: 'var(--primary)',
                        color: '#fff',
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {children}
                    </a>
                  ),
                  table: ({ children }) => (
                    <div style={{ overflowX: 'auto', margin: '0.5rem 0' }}>
                      <table style={{
                        borderCollapse: 'collapse',
                        width: '100%',
                        fontSize: '0.82rem',
                      }}>
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th style={{
                      padding: '0.5rem 0.6rem',
                      textAlign: 'left',
                      fontWeight: 600,
                      background: 'rgba(255,255,255,0.08)',
                      borderBottom: '1px solid rgba(255,255,255,0.15)',
                      whiteSpace: 'nowrap',
                    }}>
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td style={{
                      padding: '0.5rem 0.6rem',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      verticalAlign: 'middle',
                      textAlign: 'left',
                    }}>
                      {children}
                    </td>
                  ),
                  p: ({ children }) => (
                    <p style={{ margin: '0.4rem 0' }}>{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul style={{ margin: '0.4rem 0', paddingLeft: '1.2rem' }}>{children}</ul>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ color: 'var(--secondary)' }}>{children}</strong>
                  ),
                }}
              >
                {m.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div style={{
          alignSelf: 'flex-start',
          padding: '0.75rem 1rem',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '0.85rem',
          display: 'flex',
          gap: '0.4rem',
          alignItems: 'center',
        }}>
          <span className="dot-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', opacity: 0.8 }} />
          <span className="dot-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', opacity: 0.6, animationDelay: '0.15s' }} />
          <span className="dot-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', opacity: 0.4, animationDelay: '0.3s' }} />
          <span style={{ marginLeft: '0.4rem' }}>Sto cercando voli…</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
