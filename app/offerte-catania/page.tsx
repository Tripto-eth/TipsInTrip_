import PageHeader from '../components/PageHeader';
import styles from '../page.module.css';
import { getOfferte } from '../lib/offerte';
import OffertaCard from '../components/OffertaCard';

export const metadata = {
  title: 'Offerte da Catania — TipsinTrip',
  description: 'Scopri le migliori offerte e i voli più economici in partenza dall\'aeroporto di Catania Fontanarossa.',
};

export const revalidate = 60; // ricarica dati ogni 60s

export default async function OfferteCataniaPage() {
  let offerte: Awaited<ReturnType<typeof getOfferte>> = [];
  try { offerte = await getOfferte(); } catch {}

  return (
    <main className={styles.main} style={{ justifyContent: 'flex-start' }}>
      <PageHeader
        title="🔥 Offerte da Catania"
        description="I voli più economici selezionati a mano, in partenza da Fontanarossa (CTA). Aggiornate quotidianamente."
        bgImage="https://images.pexels.com/photos/17650773/pexels-photo-17650773/free-photo-of-etna-over-catania-city.jpeg"
      />

      <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '2rem 1.25rem' }}>
        {offerte.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', opacity: 0.6 }}>
            <p style={{ fontSize: '1.1rem' }}>Nessuna offerta disponibile al momento.<br />Torna presto!</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}>
            {offerte.map((o) => <OffertaCard key={o.id} o={o} />)}
          </div>
        )}
      </div>
    </main>
  );
}
