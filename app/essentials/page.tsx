import Link from 'next/link';
import { getSortedEssentialsData } from '../../lib/essentials';
import styles from './essentials.module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tipsintrip.com';

export const metadata = {
  title: 'Essenziali — TipsinTrip',
  description: 'Servizi e prodotti indispensabili per viaggiare sereni: eSIM, assicurazioni, noleggi auto, gadget.',
  alternates: { canonical: `${SITE_URL}/essentials` },
  openGraph: {
    title: 'Essenziali — TipsinTrip',
    description: 'Servizi e prodotti indispensabili per viaggiare sereni.',
    url: `${SITE_URL}/essentials`,
    siteName: 'TipsinTrip',
    locale: 'it_IT',
    type: 'website',
  },
};

export default function Essentials() {
  const items = getSortedEssentialsData();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Essenziali da viaggio ✨</h1>
        <p>eSIM, assicurazioni, noleggi, gadget — selezionati e testati per chi viaggia spesso.</p>
      </header>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', opacity: 0.6, padding: '3rem 1rem' }}>
          Nessun servizio disponibile al momento. Torna presto!
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map(({ id, title, description, coverImage, category, price, featured }) => (
            <Link href={`/essentials/${id}`} key={id} className={styles.card}>
              {featured && <span className={styles.featuredBadge}>Top pick</span>}
              {coverImage && <img src={coverImage} alt={title} className={styles.cardImage} />}
              {category && <span className={styles.category}>{category}</span>}
              <h2 className={styles.cardTitle}>{title}</h2>
              {description && <p className={styles.cardDesc}>{description}</p>}
              <div className={styles.cardFooter}>
                {price && <span className={styles.price}>{price}</span>}
                <span className={styles.cta}>Scopri →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
