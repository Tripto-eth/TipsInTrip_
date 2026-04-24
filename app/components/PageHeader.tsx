import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  description?: string | ReactNode;
  /** Path to a background image, e.g. '/headers/blog.jpg'. Leave empty to keep the default gradient. */
  bgImage?: string;
  children?: ReactNode;
}

export default function PageHeader({ title, description, bgImage, children }: PageHeaderProps) {
  const bgStyle = bgImage
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(36,0,70,0.25) 0%, rgba(36,0,70,0.65) 75%, #120023 100%), url('${bgImage}')`,
      }
    : undefined;

  return (
    <>
      <div className={styles.header} style={bgStyle}>
        <div className={styles.inner}>
          <h1 className={styles.title}>{title}</h1>
          {children}
        </div>
      </div>
      {description && (
        <div className={styles.subheader}>
          <p className={styles.desc}>{description}</p>
        </div>
      )}
    </>
  );
}
