import Link from 'next/link';
import { getSortedPostsData } from '../../lib/posts';
import styles from './BlogPreview.module.css';

export default function BlogPreview({ limit = 3 }: { limit?: number }) {
  const posts = getSortedPostsData().slice(0, limit);
  if (posts.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Dal Blog</h2>
        <Link href="/blog" className={styles.allLink}>
          Vedi tutti →
        </Link>
      </div>

      <div className={styles.grid}>
        {posts.map(({ id, date, title, description, coverImage }) => (
          <Link href={`/blog/${id}`} key={id} className={styles.card}>
            {coverImage && (
              <img src={coverImage} alt={title} className={styles.cardImage} />
            )}
            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>{title}</h3>
              {description && <p className={styles.cardDesc}>{description}</p>}
              <small className={styles.cardDate}>
                {new Date(date).toLocaleDateString('it-IT', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </small>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
