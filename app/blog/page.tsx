import Link from 'next/link';
import { getSortedPostsData } from '../../lib/posts';
import styles from './blog.module.css';
import PageHeader from '../components/PageHeader';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tipsintrip.com';

export const metadata = {
  title: 'Blog - TipsinTrip',
  description: 'Scopri i migliori trucchi, guide e segreti per viaggiare senza svuotare il portafoglio.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: 'Blog - TipsinTrip',
    description: 'Scopri i migliori trucchi, guide e segreti per viaggiare senza svuotare il portafoglio.',
    url: `${SITE_URL}/blog`,
    siteName: 'TipsinTrip',
    locale: 'it_IT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog - TipsinTrip',
    description: 'Scopri i migliori trucchi, guide e segreti per viaggiare senza svuotare il portafoglio.',
  },
};

export default function Blog() {
  const allPostsData = getSortedPostsData();

  return (
    <div className={styles.container}>
      {/* bgImage="/headers/blog.jpg" — aggiungi la tua immagine quando pronta */}
      <PageHeader
        title="Il Blog di TipsinTrip 🌍"
        description="Guide, segreti e trucchi nascosti per volare low-cost sfidando l'algoritmo."
      />

      <div className={styles.grid}>
        {allPostsData.map(({ id, date, title, description, coverImage }) => (
          <Link href={`/blog/${id}`} key={id} className={styles.postCard}>
            {coverImage && (
              <img src={coverImage} alt={title} className={styles.postImage} />
            )}
            <h2 className={styles.postTitle}>{title}</h2>
            {description && <p className={styles.postDesc}>{description}</p>}
            <small className={styles.postDate}>
              {new Date(date).toLocaleDateString('it-IT', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </small>
          </Link>
        ))}
      </div>
    </div>
  );
}
