import Link from 'next/link';
import { getSortedPostsData } from '../../lib/posts';
import { getSortedEssentialsData } from '../../lib/essentials';
import styles from './BlogPreview.module.css';

const TYPE_LABEL: Record<string, string> = {
  itinerario: '🗺️ Itinerario',
  consiglio: '💡 Consiglio',
  essenziale: '🧳 Essenziale',
};

export default function BlogPreview({ limit = 6 }: { limit?: number }) {
  const posts = getSortedPostsData().map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    coverImage: p.coverImage,
    date: p.date,
    type: p.type || 'consiglio',
    href: `/blog/${p.id}`,
  }));

  const essentials = getSortedEssentialsData().map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    coverImage: e.coverImage,
    date: e.date,
    type: 'essenziale',
    href: `/essentials/${e.id}`,
  }));

  const all = [...posts, ...essentials].slice(0, limit);
  if (all.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Consigli & Ispirazioni di viaggio</h2>
        <Link href="/blog" className={styles.allLink}>
          Vedi tutti →
        </Link>
      </div>

      <div className={styles.grid}>
        {all.map(({ id, title, description, coverImage, date, type, href }) => (
          <Link href={href} key={`${type}-${id}`} className={styles.card}>
            {coverImage && (
              <img src={coverImage} alt={title} className={styles.cardImage} />
            )}
            <div className={styles.cardBody}>
              {type && (
                <span style={{
                  display: 'inline-block',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '0.15rem 0.55rem',
                  borderRadius: '999px',
                  marginBottom: '0.5rem',
                  background: 'rgba(157,78,221,0.18)',
                  border: '1px solid rgba(157,78,221,0.4)',
                  color: '#c77dff',
                  letterSpacing: '0.03em',
                }}>
                  {TYPE_LABEL[type] || type}
                </span>
              )}
              <h3 className={styles.cardTitle}>{title}</h3>
              {description && <p className={styles.cardDesc}>{description}</p>}
              {date && (
                <small className={styles.cardDate}>
                  {new Date(date).toLocaleDateString('it-IT', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </small>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
