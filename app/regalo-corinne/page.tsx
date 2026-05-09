'use client';

import { useState, useEffect } from 'react';

type Phase = 'idle' | 'opening' | 'open';
type LPage = 'welcome' | 'redpill' | 'intro' | 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'letter' | 'ticket';

const ROSE   = '#8a3555';
const CREAM  = '#3a2028';
const PINKBG = 'linear-gradient(135deg, #c4507a, #8a2a50)';

const UNLOCK = new Date(2026, 4, 13, 0, 0, 0); // 13 Maggio 2026 00:00

function getTimeLeft() {
  const diff = UNLOCK.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000)  / 60000),
    seconds: Math.floor((diff % 60000)    / 1000),
  };
}

export default function RegaloCorinne() {
  const [phase,         setPhase]         = useState<Phase>('idle');
  const [clipped,       setClipped]       = useState(true);
  const [lpage,         setLpage]         = useState<LPage>('welcome');
  const [q3Text,        setQ3Text]        = useState('');
  const [q3Done,        setQ3Done]        = useState(false);
  const [rejected,      setRejected]      = useState(false);
  const [ending,        setEnding]        = useState(false);
  const [pageKey,       setPageKey]       = useState(0);
  const [exitPage,      setExitPage]      = useState<LPage | null>(null);
  const [exitKey,       setExitKey]       = useState(0);
  const [mounted,       setMounted]       = useState(false);
  const [timeLeft,      setTimeLeft]      = useState(getTimeLeft);
  const [showCountdown, setShowCountdown] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const isLocked  = timeLeft !== null;
  const isOpening = phase === 'opening' || phase === 'open';

  const openEnv = () => {
    if (phase !== 'idle') return;
    if (isLocked) { setShowCountdown(true); return; }
    setClipped(false);
    setPhase('opening');
    setTimeout(() => setPhase('open'), 950);
  };

  const go = (p: LPage) => {
    setExitPage(lpage);
    setExitKey(pageKey);
    setPageKey(k => k + 1);
    setLpage(p);
    setTimeout(() => setExitPage(null), 480);
  };

  const handleReject = () => {
    go('welcome');
    setPhase('idle');
    setClipped(true);
    setTimeout(() => setRejected(true), 1350);
  };

  const handleEnding = () => {
    go('welcome');
    setPhase('idle');
    setClipped(true);
    setTimeout(() => setEnding(true), 1350);
  };

  const reopenFromReject = () => {
    setRejected(false);
    setClipped(false);
    setLpage('welcome');
    setPageKey(k => k + 1);
    setPhase('opening');
    setTimeout(() => setPhase('open'), 950);
  };

  const q1 = (i: number) => { if (i === 1) go('q2'); else handleReject(); };
  const q2 = (i: number) => { if (i === 2) go('q3'); else handleReject(); };
  const q4 = (i: number) => { if (i === 1) go('q5'); else handleReject(); };
  const q5 = (i: number) => { if (i === 1) go('letter'); else handleReject(); };

  const submitQ3 = () => {
    if (!q3Text.trim()) return;
    setQ3Done(true);
    // Fetch e timer partono in parallelo — non si aspetta la risposta
    fetch('/api/regalo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: q3Text.trim() }),
    }).catch(() => {});
    setTimeout(() => go('q4'), 1900);
  };

  if (!mounted) return null;

  // ── Shared button styles ──────────────────────────────────────
  const optBtn = (wrong: boolean): React.CSSProperties => ({
    width: '100%', padding: '0.58rem 0.85rem', borderRadius: 10,
    border: wrong ? '1px solid rgba(248,113,113,0.5)' : '1px solid rgba(180,90,110,0.2)',
    background: wrong ? 'rgba(248,113,113,0.08)' : 'rgba(180,90,110,0.06)',
    color: wrong ? '#b05060' : CREAM, fontSize: '0.83rem', fontWeight: 500,
    cursor: 'pointer', fontFamily: 'Georgia, serif', textAlign: 'left',
    display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.15s',
  });
  const circle: React.CSSProperties = {
    width: 20, height: 20, borderRadius: '50%',
    background: 'rgba(180,90,110,0.12)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: '0.68rem', fontWeight: 700, flexShrink: 0, color: ROSE,
  };
  const nextBtn: React.CSSProperties = {
    width: '100%', padding: '0.68rem', borderRadius: 10, border: 'none',
    background: PINKBG, color: '#fff', fontWeight: 700, fontSize: '0.88rem',
    cursor: 'pointer', fontFamily: 'Georgia, serif',
    boxShadow: '0 4px 14px rgba(180,50,90,0.28)',
  };
  const pgBase: React.CSSProperties = {
    height: '100%', display: 'flex', flexDirection: 'column',
  };
  const label: React.CSSProperties = {
    fontSize: '0.67rem', color: ROSE, fontStyle: 'italic',
    marginBottom: '0.45rem', display: 'block',
  };

  // ── Letter pages ──────────────────────────────────────────────
  const renderLetter = (page: LPage = lpage) => {
    switch (page) {

      case 'welcome': return (
        <div key={pageKey} style={pgBase}>
          <div style={{ textAlign: 'center', marginBottom: '0.65rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🎁</div>
            <div style={{ color: ROSE, fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontStyle: 'italic' }}>per Corinne, con amore</div>
          </div>
          <p style={{ color: CREAM, fontSize: '0.9rem', lineHeight: 1.85, textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 0 0.75rem', padding: '0 0.4rem', fontStyle: 'italic' }}>
            Tanti auguri Piccoletta,<br />pronta a scoprire il regalo? 🎀
          </p>
          <button onClick={() => go('redpill')} style={nextBtn}>Sì, sono pronta! →</button>
        </div>
      );

      case 'redpill': return (
        <div key={pageKey} style={pgBase}>
          <div style={{ textAlign: 'center', marginBottom: '0.35rem', fontSize: '1.5rem' }}>💊</div>
          <p style={{ ...label, textAlign: 'center' }}>una scelta importante</p>
          <p style={{ color: CREAM, fontSize: '0.84rem', lineHeight: 1.78, flex: 1, margin: '0 0 0.65rem' }}>
            Hai scelto la pillola rossa. In un certo senso hai scelto tu il regalo — o lui ha scelto te.
            <br /><br />
            <em style={{ color: ROSE }}>Te ne sei pentita?</em>
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleReject} style={{ flex: 1, padding: '0.62rem', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.35)', color: '#a03545', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
              Sì 😬
            </button>
            <button onClick={() => go('intro')} style={{ flex: 1, padding: '0.62rem', borderRadius: 10, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.35)', color: '#265a38', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
              No ❤️
            </button>
          </div>
        </div>
      );

      case 'intro': return (
        <div key={pageKey} style={pgBase}>
          <div style={{ textAlign: 'center', marginBottom: '0.35rem', fontSize: '1.4rem' }}>🔐</div>
          <p style={{ ...label, textAlign: 'center' }}>verifica identità</p>
          <p style={{ color: CREAM, fontSize: '0.84rem', lineHeight: 1.78, flex: 1, margin: '0 0 0.65rem' }}>
            Dobbiamo essere sicuri che solo <em>tu</em> la apra.
            <br /><br />
            Risponderai a qualche domanda prima di scoprire il regalo 🕵️‍♀️
          </p>
          <button onClick={() => go('q1')} style={nextBtn}>Iniziamo →</button>
        </div>
      );

      case 'q1': return (
        <div key={pageKey} style={pgBase}>
          <span style={label}>Domanda 1 di 5</span>
          <p style={{ color: CREAM, fontSize: '0.84rem', lineHeight: 1.65, fontStyle: 'italic', margin: '0 0 0.65rem', flex: 1 }}>
            Qual è stato il nostro primo viaggio insieme?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
            {['Vienna 🏰', 'Tirana 🇦🇱', 'Cairo 🏺'].map((o, i) => (
              <button key={i} onClick={() => q1(i)} style={optBtn(false)}>
                <span style={circle}>{['A','B','C'][i]}</span>{o}
              </button>
            ))}
          </div>
        </div>
      );

      case 'q2': return (
        <div key={pageKey} style={pgBase}>
          <span style={label}>Domanda 2 di 5</span>
          <p style={{ color: CREAM, fontSize: '0.84rem', lineHeight: 1.65, fontStyle: 'italic', margin: '0 0 0.65rem', flex: 1 }}>
            Qual è il nostro bacio segreto?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
            {['Sul naso 👃', 'Sulla guancia 😊', 'Tra il naso e la guancia 🥰'].map((o, i) => (
              <button key={i} onClick={() => q2(i)} style={optBtn(false)}>
                <span style={circle}>{['A','B','C'][i]}</span>{o}
              </button>
            ))}
          </div>
        </div>
      );

      case 'q3': return (
        <div key={pageKey} style={pgBase}>
          <span style={label}>Domanda 3 di 5</span>
          <p style={{ color: CREAM, fontSize: '0.84rem', lineHeight: 1.65, fontStyle: 'italic', margin: `0 0 ${q3Done ? '0.4rem' : '0.6rem'}`, flex: q3Done ? 0 : 1 }}>
            Cosa non sopporti di me?
          </p>
          {!q3Done ? (
            <>
              <textarea
                value={q3Text}
                onChange={e => setQ3Text(e.target.value)}
                placeholder="Scrivi qui..."
                rows={3}
                style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(180,90,110,0.25)', background: 'rgba(180,90,110,0.05)', color: CREAM, fontFamily: 'Georgia, serif', fontSize: '0.82rem', padding: '0.5rem 0.7rem', resize: 'none', outline: 'none', marginBottom: '0.5rem', boxSizing: 'border-box' }}
              />
              <button
                onClick={submitQ3}
                disabled={!q3Text.trim()}
                style={{ ...nextBtn, background: q3Text.trim() ? PINKBG : 'rgba(180,90,110,0.15)', color: q3Text.trim() ? '#fff' : 'rgba(100,50,70,0.45)', cursor: q3Text.trim() ? 'pointer' : 'default', boxShadow: 'none' }}
              >
                Invia →
              </button>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <div style={{ fontSize: '1.6rem' }}>💌</div>
              <p style={{ color: ROSE, fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center', margin: 0 }}>
                Questa me la leggo con calma 😏<br />Domanda successiva...
              </p>
            </div>
          )}
        </div>
      );

      case 'q4': return (
        <div key={pageKey} style={pgBase}>
          <span style={label}>Domanda 4 di 5</span>
          <p style={{ color: CREAM, fontSize: '0.82rem', lineHeight: 1.65, fontStyle: 'italic', margin: '0 0 0.65rem', flex: 1 }}>
            Qual è quella piccola cosa che faccio e che ti fa salire il nervoso istantaneamente?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
            {['Toccarti la pancia 🫃', 'Botte in testa 👊', 'Solletico 🤣'].map((o, i) => (
              <button key={i} onClick={() => q4(i)} style={optBtn(false)}>
                <span style={circle}>{['A','B','C'][i]}</span>{o}
              </button>
            ))}
          </div>
        </div>
      );

      case 'q5': return (
        <div key={pageKey} style={pgBase}>
          <span style={label}>Domanda 5 di 5</span>
          <p style={{ color: CREAM, fontSize: '0.84rem', lineHeight: 1.65, fontStyle: 'italic', margin: '0 0 0.65rem', flex: 1 }}>
            Quando è il nostro anniversario? 🗓️
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
            {['23 Novembre 🍂', '22 Novembre ❤️', '21 Novembre 🍁'].map((o, i) => (
              <button key={i} onClick={() => q5(i)} style={optBtn(false)}>
                <span style={circle}>{['A','B','C'][i]}</span>{o}
              </button>
            ))}
          </div>
        </div>
      );

      case 'letter': return (
        <div key={pageKey} style={{ ...pgBase, overflowY: 'auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.45rem', marginBottom:'0.65rem' }}>
            <div style={{ flex:1, height:1, background:'linear-gradient(90deg,transparent,rgba(180,90,110,0.35))' }} />
            <span style={{ color:'#b8607a', fontSize:'0.85rem' }}>❧</span>
            <div style={{ flex:1, height:1, background:'linear-gradient(90deg,rgba(180,90,110,0.35),transparent)' }} />
          </div>
          <p style={{ color: ROSE, fontSize: '0.84rem', fontStyle: 'italic', textAlign: 'center', marginBottom: '0.7rem' }}>Amore mio,</p>
          <p style={{ color: CREAM, fontSize: '0.83rem', lineHeight: 1.85, marginBottom: '0.6rem' }}>
            Lo sai che con le lettere sono un disastro, quindi invece del solito papiro ho messo mano al codice per crearti questo quiz. È un'idea un po' fuori dagli schemi, una cosa mai vista, per dirti semplicemente quanto amo la nostra complicità e quanto stiamo bene insieme.
          </p>
          <p style={{ color: CREAM, fontSize: '0.83rem', lineHeight: 1.85, marginBottom: '0.6rem' }}>
            Sai anche come la penso sui regali: odio comprare oggetti fisici, quelli che prima o poi si rompono, passano di moda o finiscono a prendere polvere su una mensola. Preferisco di gran lunga regalarti qualcosa che ci rimarrà in testa per tutta la vita. Voglio regalarti dei ricordi, delle avventure e delle esperienze da vivere fianco a fianco.
          </p>
          <p style={{ color: CREAM, fontSize: '0.83rem', lineHeight: 1.85, marginBottom: '0.6rem' }}>
            E qui arriviamo al momento clou del tuo gioco. Ti ho fatto scegliere alla cieca tra il Rosso e il Blu, e tu hai scelto il Rosso.
          </p>
          <p style={{ color: CREAM, fontSize: '0.83rem', lineHeight: 1.85, marginBottom: '0.7rem' }}>
            Devi sapere che non era un colore a caso. Quel rosso è il colore principale della bandiera del posto in cui stiamo per andare... <strong style={{ color: ROSE }}>prepara la valigia, perché ti porto in Montenegro! 🇲🇪</strong>
          </p>
          <p style={{ color: CREAM, fontSize: '0.83rem', lineHeight: 1.85, marginBottom: '0.7rem' }}>
            Non vedo l'ora di partire e di aggiungere questo nuovo capitolo alla nostra storia.
          </p>
          <p style={{ color: ROSE, fontSize: '0.83rem', fontStyle: 'italic', textAlign: 'right', marginBottom: '0.65rem' }}>
            Ti amo.<br />
            <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>Trip ❤️</span>
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:'0.45rem', marginBottom: '0.7rem' }}>
            <div style={{ flex:1, height:1, background:'linear-gradient(90deg,transparent,rgba(180,90,110,0.35))' }} />
            <span style={{ color:'#b8607a', fontSize:'0.85rem' }}>❧</span>
            <div style={{ flex:1, height:1, background:'linear-gradient(90deg,rgba(180,90,110,0.35),transparent)' }} />
          </div>
          <button onClick={() => go('ticket')} style={{ ...nextBtn, flexShrink: 0 }}>Continua →</button>
        </div>
      );

      case 'ticket': return (
        <div key={pageKey} style={{ ...pgBase }}>
          {/* Boarding pass */}
          <div style={{
            flex: 1,
            background: 'linear-gradient(160deg, #fff9f0, #fff4e8)',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 6px 24px rgba(0,0,0,0.13)',
            border: '1px solid rgba(180,90,110,0.18)',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{ background: PINKBG, padding: '0.6rem 0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Biglietto di viaggio</div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.78rem' }}>TipsinTrip ✈️</div>
              </div>
              <div style={{ fontSize: '1.4rem' }}>🇲🇪</div>
            </div>

            {/* Route */}
            <div style={{ padding: '0.75rem 0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: CREAM, lineHeight: 1 }}>CTA</div>
                <div style={{ fontSize: '0.6rem', color: 'rgba(100,50,70,0.55)', marginTop: 2 }}>Catania</div>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 0.5rem' }}>
                <div style={{ flex: 1, borderTop: '1.5px dashed rgba(180,90,110,0.28)' }} />
                <span style={{ margin: '0 0.3rem', fontSize: '1rem' }}>✈️</span>
                <div style={{ flex: 1, borderTop: '1.5px dashed rgba(180,90,110,0.28)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: CREAM, lineHeight: 1 }}>TGD</div>
                <div style={{ fontSize: '0.6rem', color: 'rgba(100,50,70,0.55)', marginTop: 2 }}>Podgorica</div>
              </div>
            </div>

            {/* Perforated divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '0 -1px' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fffdf8', border: '1px solid rgba(180,90,110,0.15)', flexShrink: 0, marginLeft: -6 }} />
              <div style={{ flex: 1, borderTop: '2px dashed rgba(180,90,110,0.2)' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fffdf8', border: '1px solid rgba(180,90,110,0.15)', flexShrink: 0, marginRight: -6 }} />
            </div>

            {/* Details grid */}
            <div style={{ padding: '0.65rem 0.9rem 0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 0.6rem' }}>
              {[
                ['Partenza', '30 Luglio', 'CTA → TGD'],
                ['Ritorno',  '4 Agosto',  'TGD → CTA'],
              ].map(([lbl, date, route]) => (
                <div key={lbl}>
                  <div style={{ fontSize: '0.55rem', color: 'rgba(100,50,70,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{lbl}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: CREAM }}>{date}</div>
                  <div style={{ fontSize: '0.6rem', color: 'rgba(100,50,70,0.5)' }}>{route}</div>
                </div>
              ))}
              <div>
                <div style={{ fontSize: '0.55rem', color: 'rgba(100,50,70,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Passeggera</div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: ROSE }}>Corinne ❤️</div>
              </div>
              <div>
                <div style={{ fontSize: '0.55rem', color: 'rgba(100,50,70,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Durata</div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: CREAM }}>5 notti 🌙</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '0.55rem', color: 'rgba(100,50,70,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Posto</div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: CREAM }}>Al tuo fianco ♾️</div>
              </div>
            </div>
          </div>

          <button onClick={handleEnding} style={{ ...nextBtn, marginTop: '0.65rem', flexShrink: 0 }}>
            Continua →
          </button>
        </div>
      );

      default: return null;
    }
  };

  // ── Main render ──────────────────────────────────────────────
  return (
    <main style={{
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse at 50% 20%, rgba(110,20,70,0.5) 0%, transparent 60%), linear-gradient(160deg, #080010 0%, #130020 55%, #0a0015 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem 1rem', overflow: 'hidden', position: 'relative',
      fontFamily: 'Georgia, "Times New Roman", serif',
    }}>
      <style>{`
        @keyframes heartRise {
          0%   { opacity:0; transform:translateY(0) rotate(-8deg) scale(1); }
          10%  { opacity:0.7; }
          85%  { opacity:0.35; }
          100% { opacity:0; transform:translateY(-105vh) rotate(10deg) scale(0.7); }
        }
        @keyframes twinkle {
          0%,100% { opacity:0.12; transform:scale(0.8); }
          50%     { opacity:0.85; transform:scale(1.3); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes sealPulse {
          0%,100% { box-shadow:0 10px 30px rgba(100,5,30,0.8),0 4px 10px rgba(0,0,0,0.55),0 0 0 0 rgba(200,50,100,0.5),0 0 0 0 rgba(200,50,100,0.25); }
          55%     { box-shadow:0 10px 30px rgba(100,5,30,0.8),0 4px 10px rgba(0,0,0,0.55),0 0 0 8px rgba(200,50,100,0.15),0 0 0 16px rgba(200,50,100,0); }
        }
        @keyframes tapHint {
          0%,100% { opacity:0.38; transform:translateY(0); }
          50%     { opacity:0.75; transform:translateY(-5px); }
        }
        @keyframes pageFlipOut {
          0%   { transform: translateX(0%) scale(1);    opacity: 1; }
          100% { transform: translateX(-105%) scale(0.94); opacity: 0; }
        }
        @keyframes pageFlipIn {
          0%   { transform: translateX(105%) scale(0.94); opacity: 0; }
          100% { transform: translateX(0%) scale(1);    opacity: 1; }
        }
        @keyframes rejectedIn {
          from { opacity:0; transform:scale(0.94); }
          to   { opacity:1; transform:scale(1); }
        }
        @keyframes letterCardIn {
          from { opacity:0; transform:translate(-50%,-50%) scale(0.96); }
          to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
        }
        .heart { position:absolute; pointer-events:none; animation:heartRise linear infinite; bottom:-40px; }
        .star  { position:absolute; pointer-events:none; border-radius:50%; animation:twinkle ease-in-out infinite; background:#fff; }
      `}</style>

      {/* Stars */}
      {[...Array(20)].map((_, i) => (
        <div key={i} className="star" style={{
          width: i % 4 === 0 ? 3 : 2, height: i % 4 === 0 ? 3 : 2,
          top:  `${(Math.sin(i * 2.4) * 0.5 + 0.5) * 92 + 4}%`,
          left: `${(Math.cos(i * 1.7) * 0.5 + 0.5) * 94 + 3}%`,
          animationDuration: `${2.2 + (i % 6) * 0.55}s`,
          animationDelay:    `${(i % 8) * 0.3}s`,
        }} />
      ))}

      {/* Floating hearts */}
      {['❤️','💜','❤️','✨','💕','❤️','✨','💜','❤️'].map((h, i) => (
        <div key={i} className="heart" style={{
          left: `${6 + i * 11}%`,
          fontSize: i % 3 === 0 ? '1.35rem' : '0.8rem',
          animationDuration: `${7 + i * 1.25}s`,
          animationDelay:    `${i * 1.05}s`,
        }}>{h}</div>
      ))}

      {/* Heading */}
      {!isOpening && !rejected && (
        <p style={{ color:'rgba(255,170,200,0.6)', fontSize:'0.72rem', letterSpacing:'0.22em', textTransform:'uppercase', margin:'0 0 2.2rem', animation:'fadeUp 1.2s ease both' }}>
          per te, con amore 💕
        </p>
      )}

      {/* ── OUTER: shifts down on open ─────────────────────────── */}
      <div style={{
        transform: isOpening ? 'translateY(60px)' : 'translateY(0)',
        transition: isOpening ? 'transform 1.1s cubic-bezier(0.4,0,0.2,1) 0.12s' : 'none',
      }}>
      {/* ── INNER: fade-in on mount + click handler ────────────── */}
      <div
        onClick={openEnv}
        style={{
          position: 'relative',
          width: 'min(320px, calc(100vw - 2rem))',
          cursor: phase === 'idle' ? 'pointer' : 'default',
          animation: 'fadeUp 1.4s ease 0.3s both',
          userSelect: 'none', WebkitUserSelect: 'none',
          overflow: clipped ? 'hidden' : 'visible',
        }}
      >
        {/* ── LETTER ─────────────────────────────────────────────── */}
        <div style={{
          position: 'absolute', left: 10, right: 10, bottom: 0,
          height: 370,
          background: 'linear-gradient(180deg, #fffdf8 0%, #fff9ef 100%)',
          borderRadius: '3px 3px 0 0',
          zIndex: isOpening ? 8 : 1,
          transform: isOpening ? 'translateY(-60px)' : 'translateY(0)',
          transition: 'transform 1.5s cubic-bezier(0.34, 1.04, 0.64, 1) 0.38s',
          boxShadow: isOpening ? '0 -16px 50px rgba(0,0,0,0.55), 0 0 0 1px rgba(200,140,100,0.25)' : 'none',
          overflow: 'hidden',
        }}>
          {phase === 'open' && (
            <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
              {exitPage && (
                <div key={`out-${exitKey}`} style={{
                  position: 'absolute', inset: 0, zIndex: 2,
                  animation: 'pageFlipOut 0.38s cubic-bezier(0.4,0,0.6,1) forwards',
                }}>
                  <div style={{ padding: '1.4rem 1.35rem 1.3rem', height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                    {renderLetter(exitPage)}
                  </div>
                </div>
              )}
              <div key={pageKey} style={{
                position: 'absolute', inset: 0, zIndex: 1,
                animation: exitPage ? 'pageFlipIn 0.38s cubic-bezier(0.4,0,0.6,1) both' : 'none',
              }}>
                <div style={{ padding: '1.4rem 1.35rem 1.3rem', height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                  {renderLetter()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── ENVELOPE BODY ──────────────────────────────────────── */}
        <div style={{
          position: 'relative', width: '100%', paddingBottom: '63%',
          background: '#f5e5cc', borderRadius: 6, zIndex: 5,
          boxShadow: '0 24px 70px rgba(0,0,0,0.6), 0 6px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
        }}>
          <svg viewBox="0 0 320 200" preserveAspectRatio="none" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
            <line x1="0"   y1="0" x2="160" y2="108" stroke="#d4b490" strokeWidth="1.2" />
            <line x1="320" y1="0" x2="160" y2="108" stroke="#c8a880" strokeWidth="1.2" />
            <polygon points="0,200 160,108 320,200" fill="#e8d2b0" />
          </svg>
        </div>

        {/* ── FLAP ───────────────────────────────────────────────── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          zIndex: isOpening ? 3 : 7,
          transformOrigin: '50% 0%',
          transform: isOpening ? 'perspective(900px) rotateX(-178deg)' : 'perspective(900px) rotateX(0deg)',
          transition: 'transform 0.85s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <svg viewBox="0 0 320 128" style={{ width:'100%', display:'block' }}>
            <defs>
              <filter id="flapShadow">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.18" />
              </filter>
            </defs>
            <polygon points="0,0 320,0 160,114" fill="#ecd9b8" filter="url(#flapShadow)" />
            <line x1="0"   y1="0" x2="160" y2="114" stroke="#d4b490" strokeWidth="1" />
            <line x1="320" y1="0" x2="160" y2="114" stroke="#c8a880" strokeWidth="1" />
          </svg>

          {/* ── SEAL ─────────────────────────────────────────────── */}
          <div style={{
            position: 'absolute', top: 38, left: '50%',
            transform: 'translateX(-50%)',
            width: 60, height: 60, borderRadius: '50%',
            background: `
              radial-gradient(circle at 36% 28%, rgba(255,180,200,0.55) 0%, transparent 38%),
              radial-gradient(circle at 65% 72%, rgba(0,0,0,0.38) 0%, transparent 40%),
              radial-gradient(circle at 35% 28%, #d94070 0%, #b02550 22%, #88103a 48%, #620828 72%, #3e0418 100%)
            `,
            boxShadow: `0 10px 30px rgba(100,5,30,0.8), 0 4px 10px rgba(0,0,0,0.55), 0 0 0 1.5px rgba(255,120,150,0.22), inset 0 2px 5px rgba(255,200,215,0.35), inset 0 -3px 7px rgba(0,0,0,0.5)`,
            animation: phase === 'idle' ? 'sealPulse 2.4s ease-in-out infinite' : 'none',
            zIndex: 10, overflow: 'hidden',
          }}>
            {/* Specular highlight */}
            <div style={{ position:'absolute', top:7, left:9, width:22, height:13, borderRadius:'50%', background:'rgba(255,230,235,0.5)', filter:'blur(3.5px)', transform:'rotate(-25deg)', pointerEvents:'none', zIndex:3 }} />
            {/* Inner ring */}
            <div style={{ position:'absolute', inset:4, borderRadius:'50%', border:'1.5px solid rgba(255,150,170,0.22)', pointerEvents:'none', zIndex:2 }} />
            {/* Logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/LOGO.png" alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%', filter:'brightness(1.15) contrast(1.05) drop-shadow(0 1.5px 2px rgba(0,0,0,0.55))', zIndex:1 }} />
          </div>
        </div>
      </div>
      </div>{/* /outer */}

      {/* Tap hint */}
      {phase === 'idle' && !rejected && (
        <p style={{ marginTop:'2rem', textAlign:'center', color:'rgba(255,165,195,0.48)', fontSize:'0.78rem', letterSpacing:'0.1em', animation:'tapHint 2.2s ease-in-out infinite, fadeUp 1s ease 1.2s both', fontFamily:'Georgia, serif' }}>
          {isLocked ? '🔒 tocca per scoprire quando' : 'tocca per aprire ↑'}
        </p>
      )}

      {/* ── COUNTDOWN OVERLAY ─────────────────────────────────── */}
      {showCountdown && timeLeft && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(8,0,18,0.96)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '2rem', textAlign: 'center',
          fontFamily: 'Georgia, serif',
          animation: 'rejectedIn 0.5s ease both',
        }}>
          <p style={{ color: 'rgba(255,170,200,0.6)', fontSize: '0.82rem', fontStyle: 'italic', margin: '0 0 2rem' }}>
            Bisogna ancora aspettare un pò per aprirmi 💕
          </p>

          {/* Countdown digits */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '2.2rem' }}>
            {[
              { v: timeLeft.days,    l: 'giorni' },
              { v: timeLeft.hours,   l: 'ore' },
              { v: timeLeft.minutes, l: 'min' },
              { v: timeLeft.seconds, l: 'sec' },
            ].map(({ v, l }, i) => (
              <div key={l} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                {i > 0 && <span style={{ color: 'rgba(255,170,200,0.5)', fontSize: '1.6rem', fontWeight: 700, marginTop: '0.1rem', lineHeight: 1 }}>:</span>}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                  <div style={{
                    background: 'rgba(180,50,90,0.2)',
                    border: '1px solid rgba(200,80,120,0.35)',
                    borderRadius: 10, padding: '0.5rem 0.75rem',
                    minWidth: 52, textAlign: 'center',
                  }}>
                    <span style={{ color: '#fff', fontSize: '1.7rem', fontWeight: 800, fontFamily: 'monospace', lineHeight: 1 }}>
                      {String(v).padStart(2, '0')}
                    </span>
                  </div>
                  <span style={{ color: 'rgba(255,170,200,0.5)', fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {l}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowCountdown(false)}
            style={{ padding: '0.75rem 2rem', borderRadius: 999, background: PINKBG, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.88rem', boxShadow: '0 6px 20px rgba(180,50,90,0.4)' }}
          >
            Ok, aspetto ❤️
          </button>
        </div>
      )}

      {/* ── REJECTED OVERLAY ──────────────────────────────────── */}
      {rejected && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(8,0,18,0.95)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '2rem', textAlign: 'center',
          fontFamily: 'Georgia, serif',
          animation: 'rejectedIn 0.7s ease both',
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>💔</div>
          <p style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
            Mi dispiace...
          </p>
          <p style={{ color: 'rgba(255,180,210,0.65)', fontSize: '0.9rem', lineHeight: 1.7, margin: '0 0 2rem' }}>
            Niente regalo 😢
          </p>
          <button
            onClick={reopenFromReject}
            style={{ padding: '0.8rem 2.2rem', borderRadius: 999, background: PINKBG, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.9rem', boxShadow: '0 6px 20px rgba(180,50,90,0.4)' }}
          >
            Scherzo! Torna indietro ❤️
          </button>
        </div>
      )}

      {/* ── ENDING OVERLAY ─────────────────────────────────────── */}
      {ending && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(8,0,18,0.96)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '2rem', textAlign: 'center',
          fontFamily: 'Georgia, serif',
          animation: 'rejectedIn 0.7s ease both',
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>😂</div>
          <p style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
            Cos'altro volevi?
          </p>
          <p style={{ color: 'rgba(255,180,210,0.65)', fontSize: '1.2rem', margin: '0 0 2rem' }}>
            😂😂😂
          </p>
          <button
            onClick={() => setEnding(false)}
            style={{ padding: '0.8rem 2.2rem', borderRadius: 999, background: PINKBG, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.9rem', boxShadow: '0 6px 20px rgba(180,50,90,0.4)' }}
          >
            ❤️ Ti amo!
          </button>
        </div>
      )}
    </main>
  );
}
