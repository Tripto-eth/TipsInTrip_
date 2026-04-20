'use client';

import Image from 'next/image';
import styles from './AnimatedLogo.module.css';

interface AnimatedLogoProps {
  size?: number;
}

export default function AnimatedLogo({ size = 48 }: AnimatedLogoProps) {
  return (
    <div 
      className={styles.container} 
      style={{ width: size, height: size }}
    >
      <Image 
        src="/1.png" 
        alt="TipsinTrip Logo Base" 
        width={size} 
        height={size} 
        className={styles.logoT} 
        priority
      />
      <Image 
        src="/2.png" 
        alt="TipsinTrip Logo Airplane" 
        width={size} 
        height={size} 
        className={styles.logoPlane} 
        priority
      />
    </div>
  );
}
