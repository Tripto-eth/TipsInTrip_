import Link from 'next/link';
import { getPostData, getAllPostIds } from '../../../lib/posts';
import styles from '../blog.module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tipsintrip.com';

export async function generateStaticParams() {
  const paths = getAllPostIds();
  return paths.map((path) => ({
    slug: path.params.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const postData = await getPostData(slug);
  const url = `${SITE_URL}/blog/${slug}`;
  const ogImage = postData.coverImage
    ? (postData.coverImage.startsWith('http') ? postData.coverImage : `${SITE_URL}${postData.coverImage}`)
    : undefined;

  return {
    title: `${postData.title} | TipsinTrip Blog`,
    description: postData.description,
    alternates: { canonical: url },
    openGraph: {
      title: postData.title,
      description: postData.description,
      url,
      type: 'article',
      publishedTime: postData.date,
      siteName: 'TipsinTrip',
      locale: 'it_IT',
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: postData.title,
      description: postData.description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const postData = await getPostData(slug);

  const url = `${SITE_URL}/blog/${slug}`;
  const image = postData.coverImage
    ? (postData.coverImage.startsWith('http') ? postData.coverImage : `${SITE_URL}${postData.coverImage}`)
    : undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: postData.title,
    description: postData.description,
    datePublished: postData.date,
    dateModified: postData.date,
    image,
    author: { '@type': 'Organization', name: 'TipsinTrip' },
    publisher: {
      '@type': 'Organization',
      name: 'TipsinTrip',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  return (
    <div className={styles.container}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link href="/blog" className={styles.backBtn}>
        <span className={styles.backIcon}>←</span> Torna al Blog
      </Link>

      <article className={styles.article}>
        {postData.coverImage && (
          <img src={postData.coverImage} alt={postData.title} className={styles.articleCover} />
        )}

        <header className={styles.articleHeader}>
          <h1 className={styles.articleTitle}>{postData.title}</h1>
          <div className={styles.articleMeta}>
            {new Date(postData.date).toLocaleDateString('it-IT', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </header>

        <div
          className={styles.articleContent}
          dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
        />
      </article>
    </div>
  );
}
