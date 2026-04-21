import Link from 'next/link';
// Importa la nuova funzione che hai creato
import { getSortedGuidesData } from '../../lib/guides'; 
// IMPORTANTE: Importa lo STESSO file CSS del blog per avere lo stesso design
import styles from '../components/BlogPreview.module.css'; 

export default function GuidePage() {
  const guides = getSortedGuidesData();

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h1 className={styles.title}>I Nostri Local Experts</h1>
        <p style={{ color: '#666', marginTop: '10px' }}>
          Scopri il mondo attraverso gli occhi di chi ci vive.
        </p>
      </div>

      <div className={styles.grid}>
        {guides.map(({ id, title, description, coverImage, price, lingue }) => (
          <Link href={`/guide/${id}`} key={id} className={styles.card}>
            {/* Foto della Guida */}
            {coverImage && (
              <img src={coverImage} alt={title} className={styles.cardImage} />
            )}
            
            {/* Corpo della Card */}
            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>{title}</h3>
              {description && <p className={styles.cardDesc}>{description}</p>}
              
              {/* Usiamo lo spazio della data per mostrare posizione e lingue */}
              <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#888' }}>
                <span>📍 {price} {/* price nel tuo md era la posizione */}</span>
                <span>{lingue}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}