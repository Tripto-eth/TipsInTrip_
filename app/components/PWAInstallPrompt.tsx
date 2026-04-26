'use client';

import { useEffect } from 'react';

export default function PWAInstallPrompt() {
  useEffect(() => {
    import('@khmyznikov/pwa-install').catch(() => {});
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PwaInstall = 'pwa-install' as any;

  return (
    <PwaInstall
      manifest-url="/manifest.json"
      name="TipsinTrip"
      description="Cerca voli economici e flessibili a basso prezzo."
      icon-url="/baselogo.jpg"
    />
  );
}
