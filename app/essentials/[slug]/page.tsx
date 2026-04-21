import Link from 'next/link';
import { getEssentialData, getAllEssentialIds } from '../../../lib/essentials';
import styles from '../essentials.module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tipsintrip.com';

export async function generateStaticParams() {
  const paths = getAllEssentialIds();
  return paths.map((path) => ({ slug: path.params.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getEssentialData(slug);
  const url = `${SITE_URL}/essentials/${slug}`;
  const ogImage = data.coverImage
    ? (data.coverImage.startsWith('http') ? data.coverImage : `${SITE_URL}${data.coverImage}`)
    : undefined;

  return {
    title: `${data.title} | TipsinTrip`,
    description: data.description,
    alternates: { canonical: url },
    openGraph: {
      title: data.title,
      description: data.description,
      url,
      siteName: 'TipsinTrip',
      locale: 'it_IT',
      type: 'article',
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function EssentialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getEssentialData(slug);

  return (
    <div className={styles.container}>
      <Link href="/essentials" className={styles.backBtn}>
        <span className={styles.backIcon}>←</span> Torna agli Essenziali
      </Link>

      <article className={styles.article}>
        {data.coverImage && (
          <img src={data.coverImage} alt={data.title} className={styles.articleCover} />
        )}

        <header className={styles.articleHeader}>
          {data.category && <span className={styles.category}>{data.category}</span>}
          <h1 className={styles.articleTitle}>{data.title}</h1>
          {data.description && (
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.05rem', margin: '0.5rem 0 0' }}>
              {data.description}
            </p>
          )}
          <div className={styles.articleMeta}>
            {data.price && <span className={styles.price}>{data.price}</span>}
          </div>
        </header>

        <div
          className={styles.articleContent}
          dangerouslySetInnerHTML={{ __html: data.contentHtml }}
        />

        {data.affiliateUrl && (
          <div className={styles.ctaBox}>
            <div style={{ fontWeight: 600 }}>Pronto a provare {data.title}?</div>
            <a
              href={data.affiliateUrl}
              target="_blank"
              rel="nofollow sponsored noopener"
              className={styles.ctaBtn}
            >
              Vai al sito →
            </a>
            <div className={styles.disclaimer}>
              Link affiliato: acquistando tramite questo link potremmo ricevere una commissione
              senza alcun costo aggiuntivo per te.
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
