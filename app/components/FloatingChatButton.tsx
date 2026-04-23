'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function FloatingChatButton() {
  const pathname = usePathname();

  // Non mostriamo il pulsante flottante se siamo già nella pagina della chat
  if (pathname === '/chat') return null;

  return (
    <Link 
      href="/chat"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9998,
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--primary) 0%, #c77dff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 30px rgba(157, 78, 221, 0.5), 0 0 0 1px rgba(255,255,255,0.2) inset',
        cursor: 'pointer',
        transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease',
        textDecoration: 'none',
        animation: 'bounceIn 1s cubic-bezier(0.16, 1, 0.3, 1) 2s backwards, pulseGlow 3s infinite',
      }}
      className="floating-chat-btn"
      aria-label="Apri Chat AI"
    >
      <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>✨</span>

      <style dangerouslySetInnerHTML={{__html: `
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
        .floating-chat-btn:hover {
          transform: scale(1.1) translateY(-4px);
          box-shadow: 0 12px 40px rgba(157, 78, 221, 0.7), 0 0 0 1px rgba(255,255,255,0.3) inset;
        }
        @media (max-width: 768px) {
          .floating-chat-btn {
            bottom: 20px !important;
            right: 20px !important;
            width: 56px !important;
            height: 56px !important;
          }
        }
      `}} />
    </Link>
  );
}
