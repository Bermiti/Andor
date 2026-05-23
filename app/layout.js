import { Playfair_Display, DM_Sans, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './components/ToastProvider';
import CommandCenter from './components/CommandCenter';
import FloatingAi from './components/FloatingAi';
import CustomRequestModal from './components/CustomRequestModal';
import NewsletterPopup from './components/NewsletterPopup';
import SocialProofToast from './components/SocialProofToast';
import ActiveTravelers from './components/ActiveTravelers';
import EasterEgg from './components/EasterEgg';

const playfair = Playfair_Display({ 
  subsets: ['latin'], 
  variable: '--font-heading',
  weight: ['400', '500', '600', '700', '800', '900'] 
});
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body' });
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic']
});

export const metadata = {
  title: 'Andor — Your AI Travel Companion',
  description: 'Andor is an AI-powered travel platform that plans, adapts, and guides your journey in real time. Discover smarter travel with personalized itineraries, real-time navigation, and an intelligent assistant.',
  keywords: 'AI travel, travel planner, itinerary generator, smart travel, travel companion',
  openGraph: {
    title: 'Andor — Your AI Travel Companion',
    description: 'Plan, adapt, and explore with the smartest travel platform powered by AI.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${cormorant.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0A1628" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{__html: `
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
              <EasterEgg />
              <CommandCenter />
              <FloatingAi />
              <CustomRequestModal />
              <NewsletterPopup />
              <SocialProofToast />
              <ActiveTravelers />
              {children}
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}


