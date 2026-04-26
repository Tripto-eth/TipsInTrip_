'use client';

import { useEffect } from 'react';

export default function OneSignalInit() {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId) return;

    import('react-onesignal').then(({ default: OneSignal }) => {
      OneSignal.init({
        appId,
        safari_web_id: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID,
        // usiamo il nostro UI, non il campanellino di OneSignal
        allowLocalhostAsSecureOrigin: true, // utile in dev
      }).catch(() => {});
    });
  }, []);

  return null;
}
