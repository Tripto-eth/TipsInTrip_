import Link from 'next/link';
import { getSortedGuidesData } from '../../lib/guides';
import styles from '../components/BlogPreview.module.css';
import PageHeader from '../components/PageHeader';
import PhotoCarousel from '../components/PhotoCarousel';
import GuideApplyForm from '../components/GuideApplyForm';
import GuideCyclingTitle from '../components/GuideCyclingTitle';
import GuideTourGuide from '../components/GuideTourGuide';

const TAG_COLORS = {
  'Tour':        { bg: 'rgba(157,78,221,0.18)', border: 'rgba(157,78,221,0.55)', color: '#c77dff' },
  'Guide':       { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.5)',  color: '#6ee7b7' },
  'Transfer':    { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.5)',  color: '#93c5fd' },
  'Local Vibes': { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.5)', color: '#fcd34d' },
};

const DEFAULT_TAG = { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' };

function TagBadge({ label }) {
  const c = TAG_COLORS[label] ?? DEFAULT_TAG;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 9px',
      borderRadius: '999px',
      fontSize: '0.7rem',
      fontWeight: 600,
      letterSpacing: '0.03em',
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.color,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

export default function GuidePage() {
  const guides = getSortedGuidesData();

  if (!guides || guides.length === 0) {
    return (
      <div className={styles.section} style={{ textAlign: 'center', padding: '50px' }}>
        <PageHeader title="I Nostri Local Experts" />
        <p>Stiamo preparando le schede dei nostri esperti. Torna presto!</p>
      </div>
    );
  }

  return (
    <>
      <GuideTourGuide />
      <PageHeader
        bgImage="https://a.storyblok.com/f/112937/3456x2304/7ee29c6511/pexels-belle-co-99483-1000445.jpg"
        title={<GuideCyclingTitle />}
        description="Perché accontentarsi di un'esperienza standard quando puoi avere le chiavi della città? Prenota un nostro Local Expert e crea un itinerario su misura per te. Ti faremo sedere ai tavoli dove mangia la gente del posto, ti guideremo nei mercati al giusto prezzo e ti faremo vivere la cultura locale senza filtri. Scegli il tuo alleato madrelingua ed entra nel cuore della tua destinazione."
      />
      <section className={styles.section}>
      <div className={styles.grid}>
        {guides.map(({ id, title, description, coverImage, images, price, lingue, tags }) => (
          <Link href={`/guide/${id}`} key={id} className={styles.card} id={id === 'boyka' ? 'tour-guide-card' : undefined}>
            {(images && images.length > 0) ? (
              <PhotoCarousel images={images} altTitle={title} />
            ) : coverImage ? (
              <PhotoCarousel images={[coverImage]} altTitle={title} />
            ) : null}

            <div className={styles.cardBody} style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1.25rem', background: 'rgba(36, 0, 70, 0.4)' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 id={id === 'boyka' ? 'tour-guide-name' : undefined} className={styles.cardTitle} style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{title}</h3>
                <span id={id === 'boyka' ? 'tour-guide-lingue' : undefined} style={{ fontSize: '1.1rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '8px' }}>
                  {lingue}
                </span>
              </div>

              {Array.isArray(tags) && tags.length > 0 && (
                <div id={id === 'boyka' ? 'tour-guide-tags' : undefined} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  {tags.map((tag) => <TagBadge key={tag} label={tag} />)}
                </div>
              )}

              {description && (
                <p className={styles.cardDesc} style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, marginBottom: '1rem', flex: 1 }}>
                  {description}
                </p>
              )}
              
              <div id={id === 'boyka' ? 'tour-guide-city' : undefined} style={{
                marginTop: 'auto',
                paddingTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.9)',
                borderTop: '1px dashed rgba(255,255,255,0.15)',
                fontWeight: 600
              }}>
                <span aria-hidden>📍</span>
                <span>{price}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
      <GuideApplyForm />
    </>
  );
}