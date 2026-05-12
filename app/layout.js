import { Inter, DM_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './context/AuthContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-heading' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body' });

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
    <html lang="en" className={`${inter.variable} ${dmSans.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0A1628" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
