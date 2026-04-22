import Link from 'next/link';
import { getSortedGuidesData } from '../../lib/guides';
import styles from '../components/BlogPreview.module.css';
import PageHeader from '../components/PageHeader';

const TAG_COLORS = {
  'Tour':        { bg: 'rgba(157,78,221,0.18)', border: 'rgba(157,78,221,0.55)', color: '#c77dff' },
  'Guide':       { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.5)',  color: '#6ee7b7' },
  'Transfer':    { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.5)',  color: '#93c5fd' },
  'Local Vibes': { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.5)', color: '#fcd34d' },
};

const DEFAULT_TAG = { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' };

function TagBadge({ label }) {
  const c = TAG_COLORS[label] ?? DEFAULT_TAG;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 9px',
      borderRadius: '999px',
      fontSize: '0.7rem',
      fontWeight: 600,
      letterSpacing: '0.03em',
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.color,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

export default function GuidePage() {
  const guides = getSortedGuidesData();

  if (!guides || guides.length === 0) {
    return (
      <div className={styles.section} style={{ textAlign: 'center', padding: '50px' }}>
        <PageHeader title="I Nostri Local Experts" />
        <p>Stiamo preparando le schede dei nostri esperti. Torna presto!</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        bgImage="https://a.storyblok.com/f/112937/3456x2304/7ee29c6511/pexels-belle-co-99483-1000445.jpg"
        title="I Nostri Local Expert: Esplora il mondo con chi lo chiama Casa"
        description="Non ci affidiamo a 'turisti di passaggio' o accompagnatori in vacanza. Le nostre guide sono persone del posto, pronte a mostrarti l'anima vera del loro Paese. Avere un Local Expert al tuo fianco cambia le regole del viaggio: è il tuo 'scudo' madrelingua contro ogni imprevisto burocratico o medico, il tuo alleato infallibile per contrattare nei mercati evitando le classiche fregature per turisti, e la tua chiave d'accesso ai luoghi e ai sapori più autentici. Non limitarti a visitare un Paese: vivilo da dentro, in totale sicurezza."
      />
      <section className={styles.section}>
      <div className={styles.grid}>
        {guides.map(({ id, title, description, coverImage, price, lingue, tags }) => (
          <Link href={`/guide/${id}`} key={id} className={styles.card}>
            
            {/* INIZIO MODIFICA IMMAGINE VERTICALE NELLE CARD */}
            {coverImage && (
              <div style={{ overflow: 'hidden' }}>
                <img 
                  src={coverImage} 
                  alt={title} 
                  className={styles.cardImage} 
                  style={{
                    aspectRatio: '3/4',  /* Forza il formato verticale per la card */
                    objectFit: 'cover',  /* Ritaglia senza deformare */
                    width: '100%',
                    height: 'auto',      /* Annulla eventuali altezze fisse del CSS */
                    display: 'block'
                  }}
                />
              </div>
            )}
            {/* FINE MODIFICA */}
            
            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>{title}</h3>
              {Array.isArray(tags) && tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
                  {tags.map((tag) => <TagBadge key={tag} label={tag} />)}
                </div>
              )}

              {description && <p className={styles.cardDesc}>{description}</p>}
              
              <div style={{ 
                marginTop: 'auto', 
                paddingTop: '15px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '0.85rem', 
                color: '#666',
                borderTop: '1px solid #f0f0f0' 
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  📍 {price}
                </span>
                <span style={{ fontWeight: '600' }}>
                  {lingue}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
    </>
  );
}