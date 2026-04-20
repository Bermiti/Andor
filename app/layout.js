import './globals.css';

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0A1628" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
