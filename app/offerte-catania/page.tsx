import PageHeader from '../components/PageHeader';
import styles from '../page.module.css';

export const metadata = {
  title: 'Offerte da Catania — TipsinTrip',
  description: 'Scopri le migliori offerte e i voli più economici in partenza dall\'aeroporto di Catania Fontanarossa.',
};

export default function OfferteCataniaPage() {
  return (
    <main className={styles.main} style={{ justifyContent: 'flex-start' }}>
      <PageHeader
        title="🔥 Offerte da Catania"
        description="I voli più economici in partenza da Fontanarossa (CTA)."
      />
      <div style={{ textAlign: 'center', padding: '4rem 1rem', opacity: 0.7, maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'rgba(255,255,255,0.9)' }}>
          Stiamo preparando questa sezione!
        </h2>
        <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
          Presto troverai qui le migliori rotte, le offerte selezionate e i consigli per viaggiare low cost partendo dal nostro aeroporto preferito. Torna a trovarci a breve.
        </p>
      </div>
    </main>
  );
}
