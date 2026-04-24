'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function FloatingChatButton() {
  const pathname = usePathname();
  const [bubbleDismissed, setBubbleDismissed] = useState(false);

  // Non mostriamo il pulsante flottante se siamo già nella pagina della chat
  if (pathname === '/chat') return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
      className="floating-chat-wrapper"
    >
      {/* Speech bubble / popup */}
      {!bubbleDismissed && (
        <div className="floating-chat-bubble" role="tooltip">
          <button
            type="button"
            className="floating-chat-bubble-close"
            aria-label="Chiudi messaggio"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setBubbleDismissed(true);
            }}
          >
            ×
          </button>
          <span className="floating-chat-bubble-text">Chatta con l&apos;IA</span>
        </div>
      )}

      {/* Pulsante tondo con logo */}
      <Link
        href="/chat"
        className="floating-chat-btn"
        aria-label="Apri Chat AI"
      >
        <Image
          src="/baselogo.jpg"
          alt=""
          width={60}
          height={60}
          priority
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
      </Link>

      <style dangerouslySetInnerHTML={{__html: `
        .floating-chat-btn {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary) 0%, #c77dff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 30px rgba(157, 78, 221, 0.5), 0 0 0 2px rgba(255,255,255,0.25) inset;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
          text-decoration: none;
          animation: bounceIn 1s cubic-bezier(0.16, 1, 0.3, 1) 2s backwards, pulseGlow 3s infinite;
          overflow: hidden;
          padding: 3px;
          box-sizing: border-box;
        }
        .floating-chat-btn:hover {
          transform: scale(1.1) translateY(-4px);
          box-shadow: 0 12px 40px rgba(157, 78, 221, 0.7), 0 0 0 2px rgba(255,255,255,0.4) inset;
        }

        .floating-chat-bubble {
          position: relative;
          background: #fff;
          color: #1a1a2e;
          padding: 0.75rem 2rem 0.75rem 1rem;
          border-radius: 16px;
          font-size: 0.9rem;
          font-weight: 600;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
          white-space: nowrap;
          animation: bubbleSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 3s backwards, bubbleBob 2.5s ease-in-out 3.6s infinite;
          transform-origin: right center;
        }
        .floating-chat-bubble::after {
          content: '';
          position: absolute;
          right: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-top: 8px solid transparent;
          border-bottom: 8px solid transparent;
          border-left: 10px solid #fff;
        }
        .floating-chat-bubble-text {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }
        .floating-chat-bubble-close {
          position: absolute;
          top: 4px;
          right: 6px;
          background: transparent;
          border: none;
          font-size: 1.1rem;
          line-height: 1;
          color: rgba(26, 26, 46, 0.45);
          cursor: pointer;
          padding: 2px 5px;
          border-radius: 50%;
          transition: color 0.15s, background 0.15s;
        }
        .floating-chat-bubble-close:hover {
          color: #1a1a2e;
          background: rgba(0, 0, 0, 0.06);
        }

        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 8px 30px rgba(157, 78, 221, 0.5), 0 0 0 0 rgba(157, 78, 221, 0.6); }
          70% { box-shadow: 0 8px 30px rgba(157, 78, 221, 0.5), 0 0 0 15px rgba(157, 78, 221, 0); }
          100% { box-shadow: 0 8px 30px rgba(157, 78, 221, 0.5), 0 0 0 0 rgba(157, 78, 221, 0); }
        }
        @keyframes bubbleSlideIn {
          0% { transform: translateX(20px) scale(0.8); opacity: 0; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes bubbleBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @media (max-width: 768px) {
          .floating-chat-wrapper {
            bottom: 20px !important;
            right: 20px !important;
            gap: 8px !important;
          }
          .floating-chat-btn {
            width: 56px !important;
            height: 56px !important;
          }
          .floating-chat-bubble {
            font-size: 0.82rem;
            padding: 0.6rem 1.8rem 0.6rem 0.85rem;
          }
        }

        @media (max-width: 420px) {
          .floating-chat-bubble {
            display: none;
          }
        }
      `}} />
    </div>
  );
}
