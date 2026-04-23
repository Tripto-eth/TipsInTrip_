'use client';

import { useState } from 'react';

interface GuideContactFormProps {
  guideName: string;
  destination: string;
}

const TRIP_TAGS = ['Relax', 'Avventura', 'Cultura', 'Vita Notturna', 'Altro'];
const DUMMY_WHATSAPP_NUMBER = '393331234567'; // Sostituisci con il numero reale

export default function GuideContactForm({ guideName, destination }: GuideContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dateStart: '',
    dateEnd: '',
    notes: '',
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const validateForm = () => {
    if (!formData.name || !formData.dateStart || !formData.dateEnd) {
      alert("Per favore, compila almeno il Nome e le Date del viaggio.");
      return false;
    }
    return true;
  };

  const buildMessage = () => {
    return `Ciao TipsInTrip! Vorrei richiedere informazioni per un tour a ${destination} con ${guideName}.
    
*Dettagli:*
Nome: ${formData.name}
Date: dal ${formData.dateStart || 'Non definito'} al ${formData.dateEnd || 'Non definito'}
Interessi: ${selectedTags.length > 0 ? selectedTags.join(', ') : 'Non specificati'}

*Note:*
${formData.notes || 'Nessuna nota aggiuntiva'}`;
  };

  const handleWhatsApp = () => {
    if (!validateForm()) return;
    const text = encodeURIComponent(buildMessage());
    window.open(`https://wa.me/${DUMMY_WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      alert("Per favore, inserisci un'email valida per farti ricontattare.");
      return;
    }
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const res = await fetch('/api/contact-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: selectedTags,
          guideName,
          destination
        })
      });

      if (res.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', dateStart: '', dateEnd: '', notes: '' });
        setSelectedTags([]);
      } else {
        setSubmitStatus('error');
      }
    } catch (err) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
      padding: '2rem',
      marginTop: '3rem',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
    }}>
      <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        Inizia a organizzare con {guideName}
      </h3>

      {submitStatus === 'success' ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: '#4ade80' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
          <h4>Richiesta inviata con successo!</h4>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem' }}>
            Ti risponderemo al più presto sulla tua email.
          </p>
          <button 
            onClick={() => setSubmitStatus('idle')}
            style={{ marginTop: '1.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
          >
            Invia un'altra richiesta
          </button>
        </div>
      ) : (
        <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {/* Nome */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="name" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Il tuo Nome</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Mario Rossi"
                required
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem 1rem', borderRadius: '10px', color: '#fff', outline: 'none' }}
              />
            </div>
            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="email" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>La tua Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="mario@example.com"
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem 1rem', borderRadius: '10px', color: '#fff', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.25rem' }}>
            {/* Arrivo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="dateStart" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Data di Arrivo</label>
              <input
                id="dateStart"
                name="dateStart"
                type="date"
                value={formData.dateStart}
                onChange={handleChange}
                required
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem 1rem', borderRadius: '10px', color: '#fff', outline: 'none', colorScheme: 'dark' }}
              />
            </div>
            {/* Partenza */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="dateEnd" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Data di Partenza</label>
              <input
                id="dateEnd"
                name="dateEnd"
                type="date"
                value={formData.dateEnd}
                onChange={handleChange}
                required
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem 1rem', borderRadius: '10px', color: '#fff', outline: 'none', colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Tags (Tipologia) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Cosa cerchi da questo viaggio?</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {TRIP_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '999px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: selectedTags.includes(tag) ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                    border: selectedTags.includes(tag) ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.2)',
                    color: selectedTags.includes(tag) ? '#fff' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <label htmlFor="notes" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Raccontaci di più (Opzionale)</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Es: Vorrei fare immersioni, siamo 2 adulti e 1 bambino..."
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem 1rem', borderRadius: '10px', color: '#fff', outline: 'none', resize: 'vertical' }}
            />
          </div>

          {submitStatus === 'error' && (
            <div style={{ color: '#ef4444', fontSize: '0.9rem', textAlign: 'center' }}>
              Si è verificato un errore durante l'invio. Riprova o usa WhatsApp.
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={handleWhatsApp}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '12px',
                background: '#25D366', // WhatsApp Green
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => (e.target as HTMLButtonElement).style.opacity = '0.9'}
              onMouseLeave={(e) => (e.target as HTMLButtonElement).style.opacity = '1'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              Richiedi su WhatsApp
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '0.5rem 0', opacity: 0.6 }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
              <span style={{ margin: '0 1rem', fontSize: '0.8rem' }}>oppure</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.9rem',
                borderRadius: '12px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if(!isSubmitting) (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                if(!isSubmitting) (e.target as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {isSubmitting ? 'Invio in corso...' : 'Invia Richiesta via Email'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
