'use client';

import { useEffect } from 'react';

export default function OneSignalInit() {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId) return;

    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isStandalone =
      ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true) ||
      window.matchMedia('(display-mode: standalone)').matches;

    // Su iOS le notifiche push funzionano solo se l'app è installata sulla home.
    // Su Android funzionano anche dal browser, quindi mostriamo sempre il prompt.
    if (isIOS && !isStandalone) return;

    import('react-onesignal').then(({ default: OneSignal }) => {
      OneSignal.init({
        appId,
        safari_web_id: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID,
        allowLocalhostAsSecureOrigin: true,
        promptOptions: {
          slidedown: {
            prompts: [
              {
                type: 'push',
                autoPrompt: true,
                text: {
                  actionMessage: isStandalone
                    ? '✈️ Attiva le notifiche per ricevere le offerte di volo più convenienti in tempo reale!'
                    : '✈️ Vuoi ricevere le offerte di volo più convenienti direttamente sul telefono?',
                  acceptButton: 'Sì, attiva',
                  cancelButton: 'No grazie',
                },
                delay: {
                  pageViews: 1,
                  timeDelay: 10,
                },
              },
            ],
          },
        },
      }).catch(() => {});
    });
  }, []);

  return null;
}
