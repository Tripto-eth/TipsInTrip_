import { getSortedPostsData } from '../../lib/posts';
import { getSortedEssentialsData } from '../../lib/essentials';
import styles from './blog.module.css';
import PageHeader from '../components/PageHeader';
import BlogClient, { type BlogItem } from './BlogClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tipsintrip.com';

export const metadata = {
  title: 'Itinerari & Consigli - TipsinTrip',
  description: 'Itinerari, consigli e essenziali da viaggio: tutto quello che serve per volare low-cost e viaggiare sereni.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: 'Itinerari & Consigli - TipsinTrip',
    description: 'Itinerari, consigli e essenziali da viaggio.',
    url: `${SITE_URL}/blog`,
    siteName: 'TipsinTrip',
    locale: 'it_IT',
    type: 'website',
  },
};

export default function Blog() {
  const posts = getSortedPostsData();
  const essentials = getSortedEssentialsData();

  const items: BlogItem[] = [
    ...posts.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      coverImage: p.coverImage,
      date: p.date,
      type: (p.type || 'consiglio') as 'itinerario' | 'consiglio',
      href: `/blog/${p.id}`,
    })),
    ...essentials.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      coverImage: e.coverImage,
      date: e.date,
      type: 'essenziale' as const,
      href: `/essentials/${e.id}`,
      category: e.category,
      price: e.price,
      featured: e.featured,
    })),
  ];

  return (
    <>
      <PageHeader
        title="Itinerari & Consigli"
        description="Guide, itinerari, trucchi low-cost e tutti gli essenziali per viaggiare sereni."
        bgImage="https://giver.it/fileadmin/_processed_/3/e/csm_giver_crociere-antartide-esploratori_header_93c8fea40b.jpg"
      />
      <div className={styles.container}>
        <BlogClient items={items} />
      </div>
    </>
  );
}
