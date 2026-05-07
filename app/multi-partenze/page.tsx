import MultiDepartureSearch from '../components/MultiDepartureSearch';
import MultiTourGuide from '../components/MultiTourGuide';
import styles from '../page.module.css';

export default function MultiDeparturePage() {
  return (
    <main className={styles.main}>
      <MultiTourGuide />
      <MultiDepartureSearch />
    </main>
  );
}
