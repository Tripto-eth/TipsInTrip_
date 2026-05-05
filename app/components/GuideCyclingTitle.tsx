'use client';

import { useState, useEffect } from 'react';
import pageStyles from '../page.module.css';
import styles from './PageHeader.module.css';

const PHRASES = [
  'Prenota il tuo Local Expert',
  'Crea l\'itinerario insieme',
  'Vivi il viaggio senza pensieri',
];

export default function GuideCyclingTitle() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % PHRASES.length), 3000);
    return () => clearInterval(t);
  }, []);

  const phrase = PHRASES[idx];

  return (
    <h1 className={styles.title}>
      <span className={pageStyles.rotatingTextWrapper}>
        {phrase.split('').map((char, i) => (
          <span
            key={`${idx}-${i}`}
            className={pageStyles.letterAssemble}
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            {char === ' ' ? ' ' : char}
          </span>
        ))}
      </span>
    </h1>
  );
}
