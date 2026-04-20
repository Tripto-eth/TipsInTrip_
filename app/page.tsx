import styles from './page.module.css';
import HomeSearch from './components/HomeSearch';
import BlogPreview from './components/BlogPreview';
import NewsletterPopup from './components/NewsletterPopup';

export default function Home() {
  return (
    <main className={styles.main}>
      <HomeSearch />
      <BlogPreview limit={3} />
      <NewsletterPopup />
    </main>
  );
}
