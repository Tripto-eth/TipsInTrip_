import { notFound } from 'next/navigation';
import { getDestinazioneDetail, getSortedDestinazioni } from '../../lib/destinazioni';
import ItineraryGate from '../../components/ItineraryGate';
import styles from '../../../app/blog/blog.module.css';

export const dynamicParams = true; // allow slugs not in generateStaticParams (Redis)

export async function generateStaticParams() {
  return getSortedDestinazioni().map((d) => ({ slug: d.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await getDestinazioneDetail(slug);
  if (!d) return {};
  return {
    title: d.title,
    description: `Guida completa per ${d.destination}: voli da €${d.flightPrice ?? '?'}, hotel, cosa fare e itinerario dettagliato.`,
  };
}

export default async function DestinazioneDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await getDestinazioneDetail(slug);
  if (!d) notFound();

  return (
    <main style={{ maxWidth: '780px', margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>

      {/* Back */}
      <a href="/destinazioni" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        ← Tutte le destinazioni
      </a>

      {/* Cover */}
      {d.coverImage && (
        <div style={{ borderRadius: '20px', overflow: 'hidden', marginBottom: '2rem', height: '320px' }}>
          <img src={d.coverImage} alt={d.destination} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
          {d.tags?.map((tag) => (
            <span key={tag} style={{
              fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '999px',
              background: 'rgba(157,78,221,0.2)', border: '1px solid rgba(157,78,221,0.4)', color: '#c77dff',
            }}>{tag}</span>
          ))}
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, margin: '0 0 0.5rem', lineHeight: 1.2 }}>
          {d.flag} {d.title}
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)' }}>
          <span>📅 {d.period}</span>
          <span>⏱ {d.duration}</span>
          {d.flightPrice && <span style={{ color: '#a78bfa', fontWeight: 700 }}>✈️ da €{d.flightPrice}</span>}
          {d.budgetMin && <span>💰 Budget €{d.budgetMin}–{d.budgetMax}</span>}
        </div>
      </div>

      {/* Contenuto pubblico */}
      <div
        className={styles.articleContent}
        dangerouslySetInnerHTML={{ __html: d.publicHtml }}
        style={{ lineHeight: 1.8, fontSize: '1rem' }}
      />

      {/* Sezione itinerario — bloccata o sbloccata */}
      {d.itineraryHtml && (
        <ItineraryGate
          slug={slug}
          itineraryCost={d.itineraryCost}
          itineraryHtml={d.itineraryHtml}
          destination={d.destination}
        />
      )}
    </main>
  );
}
