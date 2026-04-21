import Link from 'next/link';
import { getGuideData, getAllGuideIds } from '../../../lib/guides';
// Puoi usare lo stesso CSS del blog se vuoi mantenere la grafica identica
import styles from '../../blog/blog.module.css'; 

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tipsintrip.com';

// 1. Genera i percorsi statici per la build di Vercel
export async function generateStaticParams() {
  const paths = getAllGuideIds();
  return paths.map((path) => ({
    slug: path.params.slug,
  }));
}

// 2. Genera la SEO dinamicamente per ogni guida
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guideData = await getGuideData(slug);
  const url = `${SITE_URL}/guide/${slug}`;
  const ogImage = guideData.coverImage
    ? (guideData.coverImage.startsWith('http') ? guideData.coverImage : `${SITE_URL}${guideData.coverImage}`)
    : undefined;

  return {
    title: `${guideData.title} - Local Expert | TipsinTrip`,
    description: guideData.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${guideData.title} - Local Expert al ${guideData.price}`,
      description: guideData.description,
      url,
      type: 'profile',
      siteName: 'TipsinTrip',
      locale: 'it_IT',
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: guideData.title,
      description: guideData.description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

// 3. La pagina vera e propria
export default async function GuideProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guideData = await getGuideData(slug);

  const url = `${SITE_URL}/guide/${slug}`;
  const image = guideData.coverImage
    ? (guideData.coverImage.startsWith('http') ? guideData.coverImage : `${SITE_URL}${guideData.coverImage}`)
    : undefined;

  // Dati strutturati per Google (Schema.org)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: guideData.title,
      description: guideData.description,
      image: image,
      knowsLanguage: guideData.lingue,
    }
  };

  return (
    <div className={styles.container}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link href="/guide" className={styles.backBtn}>
        <span className={styles.backIcon}>←</span> Tutti gli Esperti
      </Link>

      <article className={styles.article}>
        
        {/* INIZIO MODIFICA IMMAGINE VERTICALE */}
        {guideData.coverImage && (
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <img 
              src={guideData.coverImage} 
              alt={guideData.title} 
              className={styles.articleCover}
              style={{ 
                aspectRatio: '3/4',  /* Forza il formato verticale */
                objectFit: 'cover',  /* Riempie lo spazio senza deformare */
                width: '100%',
                maxWidth: '400px',   /* Limita la larghezza su schermi grandi */
                margin: '0 auto',    /* Centra l'immagine */
                borderRadius: '15px' /* Mantiene gli angoli arrotondati */
              }} 
            />
          </div>
        )}
        {/* FINE MODIFICA IMMAGINE VERTICALE */}

        <header className={styles.articleHeader}>
          <h1 className={styles.articleTitle}>{guideData.title}</h1>
          
          {/* Posizione e lingue */}
          <div className={styles.articleMeta} style={{ display: 'flex', gap: '20px', fontWeight: 'bold' }}>
            <span>📍 {guideData.price}</span>
            <span>🗣️ {guideData.lingue}</span>
          </div>
        </header>

        <div
          className={styles.articleContent}
          dangerouslySetInnerHTML={{ __html: guideData.contentHtml }}
        />

        {/* Pulsante Call to Action personalizzato */}
        <div style={{ marginTop: '50px', textAlign: 'center' }}>
            <a 
              href={`mailto:tuamail@tipsintrip.com?subject=Richiesta info per tour con ${guideData.title}`}
              style={{ display: 'inline-block', backgroundColor: '#0070f3', color: 'white', padding: '15px 30px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none' }}
            >
              Richiedi un itinerario con {guideData.title}
            </a>
        </div>
      </article>
    </div>
  );
}