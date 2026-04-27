import { getSortedDestinazioniAll } from '../lib/destinazioni';
import PageHeader from '../components/PageHeader';
import DestinazioneCard from '../components/DestinazioneCard';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tipsintrip.com';

export const metadata = {
  title: 'Destinazioni — TipsinTrip',
  description: 'Guide di viaggio complete: voli, hotel e itinerari dettagliati per ogni destinazione.',
  alternates: { canonical: `${SITE_URL}/destinazioni` },
};

export const revalidate = 60;

export default async function DestinazioniPage() {
  const destinazioni = await getSortedDestinazioniAll();

  return (
    <>
      <PageHeader
        title="Destinazioni ✈️"
        description="Guide complete con voli, hotel e itinerari. Sblocca il piano giorno per giorno."
      />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.25rem' }}>
        {destinazioni.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.5, padding: '4rem 0' }}>
            Nessuna destinazione disponibile al momento. Torna presto!
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}>
            {destinazioni.map((d) => (
              <DestinazioneCard key={d.id} d={d} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
