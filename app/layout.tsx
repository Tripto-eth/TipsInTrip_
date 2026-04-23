import type { Metadata } from 'next';
import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';
import FloatingChatButton from './components/FloatingChatButton';
import { LanguageProvider } from './context/LanguageContext';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

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
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="it">
        <body suppressHydrationWarning>
          <LanguageProvider>
            <div className="glow"></div>
            <Navbar />
            {children}
            <Footer />
            <FloatingChatButton />
            <CookieBanner />
          </LanguageProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
