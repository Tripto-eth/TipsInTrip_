import PageHeader from '../components/PageHeader';
import styles from '../page.module.css';
import { getOfferte } from '../lib/offerte';
import { getSortedDestinazioniAll } from '../lib/destinazioni';
import OffertaCard from '../components/OffertaCard';
import PacchettoCard from '../components/PacchettoCard';

export const metadata = {
  title: 'Offerte da Catania — TipsinTrip',
  description: 'Voli, pacchetti volo+hotel e guide complete in partenza da Catania Fontanarossa.',
};

export const revalidate = 60;

// Estrae i giorni da stringhe tipo "5 giorni", "7 notti", "10 giorni"
function parseDays(duration: string): number {
  const n = parseInt(duration);
  return isNaN(n) ? 5 : n;
}

export default async function OfferteCataniaPage() {
  let offerte: Awaited<ReturnType<typeof getOfferte>> = [];
  try { offerte = await getOfferte(); } catch {}

  let destinazioni: Awaited<ReturnType<typeof getSortedDestinazioniAll>> = [];
  try { destinazioni = await getSortedDestinazioniAll(); } catch {}

  const hasContent = offerte.length > 0 || destinazioni.length > 0;

  return (
    <main className={styles.main} style={{ justifyContent: 'flex-start' }}>
      <PageHeader
        title="🔥 Offerte da Catania"
        description="Voli, pacchetti volo+hotel e guide complete. Tutto in partenza da Fontanarossa (CTA)."
        bgImage="https://images.pexels.com/photos/17650773/pexels-photo-17650773/free-photo-of-etna-over-catania-city.jpeg"
      />

      <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '2rem 1.25rem' }}>
        {!hasContent ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', opacity: 0.6 }}>
            <p style={{ fontSize: '1.1rem' }}>Nessuna offerta disponibile al momento.<br />Torna presto!</p>
          </div>
        ) : (
          <>
            {/* ── Pacchetti Volo + Hotel (da guide markdown) ── */}
            {destinazioni.length > 0 && (
              <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '1.1rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  ✈️ + 🏨 Pacchetti Volo &amp; Hotel
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {destinazioni.map((d) => (
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
              </section>
            )}

            {/* ── Voli singoli (da Redis / admin) ── */}
            {offerte.length > 0 && (
              <section>
                <h2 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '1.1rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  ✈️ Voli selezionati
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                  {offerte.map((o) => <OffertaCard key={o.id} o={o} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
