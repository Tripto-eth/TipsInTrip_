'use client';

import { useState } from 'react';

const WHATSAPP_NUMBER = '393331234567'; // Sostituisci con il numero reale

export default function GuideApplyForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    languages: '',
    bio: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!formData.name || !formData.email || !formData.location) {
      alert('Per favore compila almeno Nome, Email e Dove operi.');
      return false;
    }
    return true;
  };

  const buildWhatsAppMessage = () =>
    encodeURIComponent(`Ciao TipsInTrip! Vorrei candidarmi come guida locale.

*Chi sono:*
Nome: ${formData.name}
Dove opero: ${formData.location}
Lingue: ${formData.languages || 'Non specificato'}

*Presentazione:*
${formData.bio || 'Nessuna nota aggiuntiva'}

*Email di contatto:* ${formData.email}`);

  const handleWhatsApp = () => {
    if (!validate()) return;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage()}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      const res = await fetch('/api/contact-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, guideName: 'Candidatura Guida', destination: formData.location, isApplication: true }),
      });
      setSubmitStatus(res.ok ? 'success' : 'error');
      if (res.ok) setFormData({ name: '', email: '', location: '', languages: '', bio: '' });
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '0.8rem 1rem',
    borderRadius: '10px',
    color: '#fff',
    outline: 'none',
    width: '100%',
    fontSize: '0.95rem',
  };

  return (
    <section style={{
      maxWidth: '680px',
      margin: '4rem auto 3rem',
      padding: '0 1rem',
    }}>
      {/* CTA header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌍</div>
        <h2 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 800, margin: '0 0 0.75rem', color: '#fff' }}>
          Sei una guida locale?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
          Entra nel nostro network di Local Expert. Aiuta i viaggiatori a scoprire il tuo Paese da dentro e guadagna facendo ciò che ami.
        </p>
      </div>

      {/* Form box */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      }}>
        {submitStatus === 'success' ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: '#4ade80' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
            <h4 style={{ margin: '0 0 0.5rem', color: '#fff' }}>Candidatura inviata!</h4>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>Ti contatteremo al più presto.</p>
            <button
              onClick={() => setSubmitStatus('idle')}
              style={{ marginTop: '1.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
            >
              Invia un'altra candidatura
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Il tuo Nome *</label>
                <input name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Mario Rossi" required style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>La tua Email *</label>
                <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="mario@example.com" required style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Dove operi (città / paese) *</label>
                <input name="location" type="text" value={formData.location} onChange={handleChange} placeholder="Es. Barcellona, Spagna" required style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Lingue parlate</label>
                <input name="languages" type="text" value={formData.languages} onChange={handleChange} placeholder="Es. Italiano, Inglese, Spagnolo" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Presentati brevemente</label>
              <textarea
                name="bio" value={formData.bio} onChange={handleChange} rows={4}
                placeholder="Chi sei, cosa offri, perché vuoi entrare nel network TipsInTrip..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {submitStatus === 'error' && (
              <div style={{ color: '#ef4444', fontSize: '0.9rem', textAlign: 'center' }}>
                Errore nell'invio. Riprova o usa WhatsApp.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={handleWhatsApp} style={{
                width: '100%', padding: '1rem', borderRadius: '12px',
                background: '#25D366', color: '#fff', fontSize: '1rem', fontWeight: 700,
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                Candidati su WhatsApp
              </button>

              <div style={{ display: 'flex', alignItems: 'center', opacity: 0.5 }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
                <span style={{ margin: '0 1rem', fontSize: '0.8rem', color: '#fff' }}>oppure</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
              </div>

              <button type="submit" disabled={isSubmitting} style={{
                width: '100%', padding: '0.9rem', borderRadius: '12px',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff', fontSize: '0.95rem', fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
              }}>
                {isSubmitting ? 'Invio in corso...' : 'Invia candidatura via Email'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
