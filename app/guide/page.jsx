import Link from 'next/link';
// Esci da 'guide' e 'app' per andare nella cartella 'lib' alla radice
import { getSortedGuidesData } from '../../lib/guides'; 
// Assicurati che questo percorso sia corretto per il tuo progetto
import styles from '../components/BlogPreview.module.css'; 

export default function GuidePage() {
  const guides = getSortedGuidesData();

  if (!guides || guides.length === 0) {
    return (
      <div className={styles.section} style={{ textAlign: 'center', padding: '50px' }}>
        <h1 className={styles.title}>I Nostri Local Experts</h1>
        <p>Stiamo preparando le schede dei nostri esperti. Torna presto!</p>
      </div>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h1 className={styles.title}>I Nostri Local Experts</h1>
        <p className={styles.cardDesc} style={{ fontSize: '1.1rem', marginTop: '10px' }}>
          Scopri il mondo attraverso gli occhi di chi ci vive. Vivi esperienze autentiche, sicure e indimenticabili.
        </p>
      </div>

      <div className={styles.grid}>
        {guides.map(({ id, title, description, coverImage, price, lingue }) => (
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
  );
}