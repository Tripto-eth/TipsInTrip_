'use client';

import { useState, useEffect } from 'react';
import pageStyles from '../page.module.css';
import styles from './PageHeader.module.css';

const PHRASES: { normal: string; accent?: string }[] = [
  { normal: 'Prenota il tuo Local Expert' },
  { normal: "Crea l'itinerario insieme" },
  { normal: 'Vivi il viaggio ', accent: 'senza pensieri' },
];

function AnimatedChars({ text, idxKey, color }: { text: string; idxKey: number; color?: string }) {
  return (
    <>
      {text.split('').map((char, i) => (
        <span
          key={`${idxKey}-${color ?? 'n'}-${i}`}
          className={pageStyles.letterAssemble}
          style={{ animationDelay: `${i * 0.04}s`, color }}
        >
          {char === ' ' ? ' ' : char}
        </span>
      ))}
    </>
  );
}

export default function GuideCyclingTitle() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % PHRASES.length), 4000);
    return () => clearInterval(t);
  }, []);

  const { normal, accent } = PHRASES[idx];

  return (
    <h1 className={styles.title}>
      <span className={pageStyles.rotatingTextWrapper}>
        <AnimatedChars text={normal} idxKey={idx} />
        {accent && <AnimatedChars text={accent} idxKey={idx} color="#c77dff" />}
      </span>
    </h1>
  );
}
