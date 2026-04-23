import PageHeader from '../components/PageHeader';
import styles from '../page.module.css';

export const metadata = {
  title: 'Privacy Policy & Cookie Policy | TipsinTrip',
  description: 'Informativa sulla privacy e sull\'uso dei cookie di TipsinTrip.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="animate-fade-in" style={{ width: '100%', paddingBottom: '4rem' }}>
      <PageHeader 
        title="Privacy & Cookie Policy" 
        description="Come gestiamo e proteggiamo i tuoi dati."
      />
      
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
        <article style={{ 
          background: 'rgba(255, 255, 255, 0.03)', 
          border: '1px solid rgba(255, 255, 255, 0.1)', 
          borderRadius: '24px', 
          padding: '2.5rem',
          color: 'rgba(255, 255, 255, 0.85)',
          lineHeight: '1.7',
          fontSize: '0.95rem'
        }}>
          
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>1. Titolare del Trattamento dei Dati</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            TipsInTrip (di seguito "noi", "nostro" o "TipsInTrip") si impegna a proteggere la privacy dei propri utenti. 
            Per qualsiasi domanda relativa al trattamento dei dati personali, puoi contattarci all'indirizzo email: <strong>info@tipsintrip.com</strong>.
          </p>

          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>2. Quali dati raccogliamo e perché</h2>
          <p style={{ marginBottom: '1rem' }}>Raccogliamo i tuoi dati solo per finalità strettamente necessarie al funzionamento del servizio e per migliorare la tua esperienza:</p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>Dati di navigazione e Ricerche:</strong> Quando cerchi un volo o un servizio, processiamo i dati di origine e destinazione per offrirti i risultati migliori tramite le API dei nostri partner.</li>
            <li><strong>Dati dell'Account:</strong> Se ti registri (tramite Clerk), conserviamo le informazioni di base del tuo profilo (email, nome) per gestire i tuoi crediti e le tue ricerche salvate.</li>
            <li><strong>Dati inviati volontariamente:</strong> Quando compili il modulo di contatto per un Local Expert, raccogliamo i dati inseriti (nome, email, date) per poterti rispondere. Se usi WhatsApp, i dati passano direttamente all'app.</li>
          </ul>

          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>3. Cookie Policy</h2>
          <p style={{ marginBottom: '1rem' }}>
            Il nostro sito web utilizza i cookie per funzionare correttamente e per offrire un'esperienza personalizzata. 
            Tramite l'apposito banner, hai la possibilità di gestire le tue preferenze.
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>Cookie Essenziali:</strong> Sono strettamente necessari per il funzionamento tecnico del sito (es. mantenere attiva la tua sessione o salvare la tua preferenza sul banner dei cookie). Non possono essere disattivati.</li>
            <li><strong>Cookie Analitici e di Prestazioni:</strong> Ci permettono di contare le visite e le fonti di traffico, per poter misurare e migliorare le prestazioni del nostro sito. Tutte le informazioni raccolte da questi cookie sono aggregate e quindi anonime.</li>
          </ul>

          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>4. Condivisione dei Dati con Terzi</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            TipsInTrip non vende i tuoi dati personali. I dati delle ricerche voli vengono trasmessi ai nostri partner affiliati (come Kiwi.com o Skyscanner) in forma anonimizzata al solo scopo di fornirti le tariffe. 
            Quando contatti una Guida/Local Expert, le informazioni fornite vengono condivise con l'esperto al solo scopo di organizzare l'itinerario richiesto.
          </p>

          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>5. I tuoi Diritti</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Ai sensi del GDPR, hai il diritto di accedere ai tuoi dati, chiederne la rettifica, la cancellazione ("diritto all'oblio"), la limitazione del trattamento o opporti al loro utilizzo. 
            Puoi esercitare questi diritti in qualsiasi momento contattandoci via email. Inoltre, se hai creato un account, puoi gestirne i dati direttamente dal tuo profilo.
          </p>

          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>6. Modifiche a questa Policy</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Ci riserviamo il diritto di aggiornare la presente Informativa in base a nuove normative o cambiamenti nei nostri servizi. Ti incoraggiamo a rivedere periodicamente questa pagina.
          </p>
          
          <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
            Ultimo aggiornamento: Maggio 2026
          </div>

        </article>
      </div>
    </div>
  );
}
