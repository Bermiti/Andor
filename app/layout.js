import './globals.css';
import { Outfit, Cormorant_Garamond, JetBrains_Mono } from 'next/font/google';
import dynamic from 'next/dynamic';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './components/ToastProvider';
import { ChatContextProvider } from './context/ChatContext';
import CommandCenter from './components/CommandCenter';
import CustomRequestModal from './components/CustomRequestModal';
import NewsletterPopup from './components/NewsletterPopup';
import EasterEgg from './components/EasterEgg';
import { ErrorBoundary } from './components/ErrorBoundary';
import SplashScreen from './components/SplashScreen';
import Script from 'next/script';
import FloatingAiWrapper from './components/FloatingAiWrapper';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://andor.travels'),
  title: {
    default: 'Andor — O Teu Concierge de Viagens AI',
    template: '%s · Andor'
  },
  description: 'Andor é um concierge de viagens inteligente com inteligência artificial. Planeia, adapta e guia a tua aventura em tempo real com itinerários premium e recomendações locais.',
  keywords: 'viagens, roteiro de viagem, planear viagem, inteligência artificial, itinerários personalizados, turismo de luxo',
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Andor — O Teu Concierge de Viagens AI',
    description: 'Planeia, adapta e explora com o planeador de viagens inteligente movido a IA.',
    url: '/',
    siteName: 'Andor Travels',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80&fit=crop',
        width: 1200,
        height: 630,
        alt: 'Andor Travels — Premium Travel Planner'
      }
    ],
    locale: 'pt-PT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Andor — O Teu Concierge de Viagens AI',
    description: 'Roteiros de viagens personalizados e recomendações exclusivas gerados por IA em segundos.',
    images: ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80&fit=crop'],
    creator: '@andortravels'
  }
};

const jsonLdData = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  "name": "Andor Travels",
  "description": "Concierge de viagens inteligente com inteligência artificial. Planeia itinerários de luxo personalizados em segundos.",
  "url": "https://andor.travels",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Lisboa",
    "addressCountry": "PT"
  },
  "sameAs": [
    "https://twitter.com/andortravels",
    "https://github.com/Bermiti/Andor"
  ]
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt" className={`${outfit.variable} ${cormorant.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0A1628" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preload" as="image" href="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800&auto=format&fit=crop" imagesrcset="" />
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
        <Script id="theme-script" strategy="beforeInteractive" dangerouslySetInnerHTML={{__html: `
          (function() {
            try {
              const theme = localStorage.getItem('andor_theme') || 'dark';
              document.documentElement.setAttribute('data-theme', theme);
            } catch(e) {}
          })();
        `}} />
      </head>
      <body>
        <LanguageProvider>
          <AuthProvider>
            <ToastProvider>
              <ChatContextProvider>
                <SplashScreen />
                <EasterEgg />
                <CommandCenter />
                <ErrorBoundary>
                  <FloatingAiWrapper />
                </ErrorBoundary>
                <CustomRequestModal />
                <NewsletterPopup />
                {children}
              </ChatContextProvider>
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
