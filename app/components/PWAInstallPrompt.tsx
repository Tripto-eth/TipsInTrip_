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
      description="Aggiungi TipsinTrip alla schermata Home per ricevere le offerte di volo direttamente sul telefono — anche con l'app chiusa. Gratis, nessuna registrazione."
      icon-url="/baselogo.jpg"
    />
  );
}
