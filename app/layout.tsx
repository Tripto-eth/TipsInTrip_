import type { Metadata } from 'next';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tipsintrip.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Tips in Trip — Voli economici e flessibili',
    template: '%s | TipsinTrip',
  },
  description: 'Cerca voli economici e flessibili a basso prezzo. Algoritmo eluso, prezzi imbattibili, zero sovrapprezzi.',
  openGraph: {
    title: 'Tips in Trip — Voli economici e flessibili',
    description: 'Cerca voli economici e flessibili a basso prezzo.',
    url: SITE_URL,
    siteName: 'TipsinTrip',
    locale: 'it_IT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tips in Trip',
    description: 'Cerca voli economici e flessibili a basso prezzo.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>
        <div className="glow"></div>
        {children}
      </body>
    </html>
  );
}
