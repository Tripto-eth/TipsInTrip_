import Link from 'next/link';
import { Suspense } from 'react';
import styles from './page.module.css';
import HomeSearch from './components/HomeSearch';
import BlogPreview from './components/BlogPreview';
import NewsletterPopup from './components/NewsletterPopup';
import NewsletterForm from './components/NewsletterForm';
import PacchettoCard from './components/PacchettoCard';
import OffertaCard from './components/OffertaCard';
import { getSortedDestinazioniAll } from './lib/destinazioni';
import { getOfferte } from './lib/offerte';
import { getSortedGuidesData } from '../lib/guides';

export const revalidate = 60;

function parseDays(duration: string): number {
  const n = parseInt(duration);
  return isNaN(n) ? 5 : n;
}

async function PacchettiSection() {
  const destinazioni = await getSortedDestinazioniAll().catch(() => []);
  const topDest = destinazioni.slice(0, 6);

  if (topDest.length === 0) return null;

  return (
        <section className={styles.landingSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>— Pacchetti pronti</span>
            <h2 className={styles.sectionTitle}>
              Le tue prossime mete<br />
              <span className={styles.sectionTitleAccent}>volo + hotel inclusi</span>
            </h2>
            <p className={styles.sectionDesc}>
              Itinerari pronti da Catania verso le mete più amate. Voli, hotel e cose da fare in un unico clic.
            </p>
          </div>
          <div className={styles.grid3}>
            {topDest.map((d) => (
              <PacchettoCard
                key={d.id}
                id={d.id}
                flag={d.flag}
                destination={d.destination}
                coverImage={d.coverImage}
                flightPrice={d.flightPrice}
                hotelPerNight={d.hotelPerNight}
                days={parseDays(d.duration)}
                tags={d.tags}
                itineraryCost={d.itineraryCost}
                featured={d.featured}
              />
            ))}
          </div>
          <div className={styles.sectionFooter}>
            <Link href="/destinazioni" className={styles.sectionCtaPrimary}>
              Vedi tutte le destinazioni
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
  );
}

async function OfferteSection() {
  const offerte = await getOfferte().catch(() => []);
  const topOff = offerte.slice(0, 4);

  if (topOff.length === 0) return null;

  return (
        <section className={`${styles.landingSection} ${styles.altBg}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>— Voli del momento</span>
            <h2 className={styles.sectionTitle}>
              Offerte lampo<br />
              <span className={styles.sectionTitleAccent}>da Catania</span>
            </h2>
            <p className={styles.sectionDesc}>
              Prezzi reali aggiornati. Prenota prima che spariscano.
            </p>
          </div>
          <div className={styles.grid4}>
            {topOff.map((o) => (
              <OffertaCard key={o.id} o={o} />
            ))}
          </div>
          <div className={styles.sectionFooter}>
            <Link href="/offerte-catania" className={styles.sectionCtaSecondary}>
              Tutte le offerte
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
  );
}

export default async function Home() {
  let guides: ReturnType<typeof getSortedGuidesData> = [];
  try { guides = getSortedGuidesData(); } catch { guides = []; }

  return (
    <main className={styles.main}>
      <HomeSearch />

      {/* ─── Pacchetti Volo + Hotel ──────────────────────────────── */}
      <Suspense fallback={<div style={{ padding: '6rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>Caricamento pacchetti in corso...</div>}>
        <PacchettiSection />
      </Suspense>

      {/* ─── Offerte Lampo ───────────────────────────────────────── */}
      <Suspense fallback={<div style={{ padding: '6rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>Ricerca offerte lampo...</div>}>
        <OfferteSection />
      </Suspense>

      {/* ─── Strumenti smart ─────────────────────────────────────── */}
      <section className={styles.landingSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>— Più di un motore di ricerca</span>
          <h2 className={styles.sectionTitle}>
            Strumenti<br />
            <span className={styles.sectionTitleAccent}>smart per viaggiatori</span>
          </h2>
          <p className={styles.sectionDesc}>
            Tre modi diversi di cercare il prossimo viaggio: parla con l&apos;AI, ispirati guardando il mondo, oppure parti dovunque ti convenga di più.
          </p>
        </div>
        <div className={styles.toolsGrid}>
          <Link href="/chat" className={`${styles.toolCard} ${styles.toolCardAi}`}>
            <div className={styles.toolIcon}>✨</div>
            <h3 className={styles.toolTitle}>Chat AI</h3>
            <p className={styles.toolDesc}>
              Chiedi in italiano: &quot;Voli economici per Lisbona a giugno&quot;. Trova voli reali in chat.
            </p>
            <span className={styles.toolArrow}>Apri la chat →</span>
          </Link>

          <Link href="/globe" className={`${styles.toolCard} ${styles.toolCardGlobe}`}>
            <div className={styles.toolIcon}>🌍</div>
            <h3 className={styles.toolTitle}>Ispirami</h3>
            <p className={styles.toolDesc}>
              Ruota il globo, scopri dove andare e con quanto budget. Esplora il mondo prima di decidere.
            </p>
            <span className={styles.toolArrow}>Apri il globo →</span>
          </Link>

          <Link href="/multi-partenze" className={`${styles.toolCard} ${styles.toolCardMulti}`}>
            <div className={styles.toolIcon}>🛫</div>
            <h3 className={styles.toolTitle}>Multi-Partenze</h3>
            <p className={styles.toolDesc}>
              Confronta più aeroporti contemporaneamente. Trova la rotta più conveniente per te.
            </p>
            <span className={styles.toolArrow}>Confronta partenze →</span>
          </Link>
        </div>
      </section>

      {/* ─── Guide Tips in Trip ─────────────────────────────────── */}
      {guides.length > 0 && (
        <section className={styles.landingSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>— Local Experts</span>
            <h2 className={styles.sectionTitle}>
              Le guide di<br />
              <span className={styles.sectionTitleAccent}>Tips in Trip</span>
            </h2>
            <p className={styles.sectionDesc}>
              Non semplici accompagnatori: persone del posto che ti aprono le porte dell'autenticità. Al tuo fianco per ogni imprevisto.
            </p>
          </div>
          <div className={styles.guidesGrid}>
            {guides.map(({ id, title, description, coverImage, price, lingue, tags }) => (
              <Link href={`/guide/${id}`} key={id} className={styles.guideCard}>
                <div className={styles.guideCardImg}>
                  {coverImage && <img src={coverImage} alt={title} />}
                </div>
                <div className={styles.guideCardBody}>
                  <div className={styles.guideCardTags}>
                    {tags?.map((tag) => (
                      <span key={tag} className={styles.guideCardTag}>{tag}</span>
                    ))}
                  </div>
                  <h3 className={styles.guideCardName}>{title}</h3>
                  {description && <p className={styles.guideCardDesc}>{description}</p>}
                  <div className={styles.guideCardMeta}>
                    {price && <span className={styles.guideCardLocation}>📍 {price}</span>}
                    {lingue && <span className={styles.guideCardLingue}>{lingue}</span>}
                  </div>
                  <span className={styles.guideCardCta}>Scopri →</span>
                </div>
              </Link>
            ))}
          </div>
          <div className={styles.sectionFooter}>
            <Link href="/guide" className={styles.sectionCtaSecondary}>
              Tutte le guide <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      )}

      {/* ─── Itinerari & Consigli ───────────────────────────────── */}
      <BlogPreview limit={6} />

      {/* ─── CTA Banner finale ───────────────────────────────────── */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaBannerInner}>
          <div className={styles.ctaBannerText}>
            <span className={styles.sectionLabel}>— Resta sintonizzato</span>
            <h2 className={styles.ctaTitle}>
              Le offerte migliori<br />
              <span className={styles.sectionTitleAccent}>direttamente nella tua inbox</span>
            </h2>
            <p className={styles.sectionDesc}>
              Ricevi prezzi imbattibili, itinerari curati e dritte di viaggio una volta a settimana. Niente spam.
            </p>
          </div>
          <div className={styles.ctaBannerActions}>
            <NewsletterForm />
          </div>
        </div>
      </section>

      <NewsletterPopup />
    </main>
  );
}
