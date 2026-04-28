'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './blog.module.css';

export type BlogItemType = 'itinerario' | 'consiglio' | 'essenziale';

export interface BlogItem {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  date?: string;
  type: BlogItemType;
  href: string;
  // solo per essenziali
  category?: string;
  price?: string;
  featured?: boolean;
}

type Filter = 'all' | BlogItemType;

const FILTER_LABELS: Record<Filter, string> = {
  all: 'Tutti',
  itinerario: 'Itinerari',
  consiglio: 'Consigli',
  essenziale: 'Essenziali',
};

const FILTER_EMOJI: Record<Filter, string> = {
  all: '✨',
  itinerario: '🗺️',
  consiglio: '💡',
  essenziale: '🧳',
};

export default function BlogClient({ items }: { items: BlogItem[] }) {
  const [filter, setFilter] = useState<Filter>('all');

  const essentials = items.filter((i) => i.type === 'essenziale');
  const visibleItems = items.filter((i) => {
    if (filter === 'all') return i.type !== 'essenziale'; // nella griglia principale escludiamo gli essenziali (sono nella riga in alto)
    return i.type === filter;
  });

  const filters: Filter[] = ['all', 'itinerario', 'consiglio', 'essenziale'];

  return (
    <>
      {/* Riga orizzontale Essenziali */}
      {essentials.length > 0 && (
        <section className={styles.essentialsRow}>
          <div className={styles.essentialsRowHeader}>
            <span>il tuo kit di sopravvivenza</span>
            <Link href="/blog?filter=essenziale" className={styles.essentialsRowSeeAll} onClick={(e) => { e.preventDefault(); setFilter('essenziale'); }}>
              Vedi tutti →
            </Link>
          </div>
          <div className={styles.essentialsScroller}>
            {essentials.map((item) => (
              <Link key={item.id} href={item.href} className={styles.essentialCard}>
                {item.featured && <span className={styles.featuredBadge}>Top pick</span>}
                {item.coverImage && <img src={item.coverImage} alt={item.title} className={styles.essentialImage} />}
                {item.category && <span className={styles.essentialCategory}>{item.category}</span>}
                <div className={styles.essentialTitle}>{item.title}</div>
                {item.price && <div className={styles.essentialPrice}>{item.price}</div>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Filter chips */}
      <div className={styles.filterChips}>
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`${styles.chip} ${filter === f ? styles.chipActive : ''}`}
          >
            <span aria-hidden>{FILTER_EMOJI[f]}</span>
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Griglia principale */}
      {visibleItems.length === 0 ? (
        <div style={{ textAlign: 'center', opacity: 0.6, padding: '3rem 1rem' }}>
          Nessun contenuto in questa categoria al momento.
        </div>
      ) : (
        <div className={styles.grid}>
          {visibleItems.map((item) => (
            <Link href={item.href} key={`${item.type}-${item.id}`} className={styles.postCard}>
              {item.coverImage && <img src={item.coverImage} alt={item.title} className={styles.postImage} />}
              <span className={styles.typeTag} data-type={item.type}>
                {FILTER_EMOJI[item.type as Filter]} {FILTER_LABELS[item.type as Filter]}
              </span>
              <h2 className={styles.postTitle}>{item.title}</h2>
              {item.description && <p className={styles.postDesc}>{item.description}</p>}
              {item.date && (
                <small className={styles.postDate}>
                  {new Date(item.date).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' })}
                </small>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
