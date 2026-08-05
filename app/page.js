'use client';

import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import HomeHero from './components/home/HomeHero';
import InteractiveTripDemo from './components/home/InteractiveTripDemo';
import PreferencesDrawer from './components/PreferencesDrawer';
import CtaFinal from './components/CtaFinal';
import Footer from './components/Footer';

export default function Home() {
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = "Andor · Planeamento de Viagens Inteligente";
    }
  }, []);

  return (
    <>
      <Navbar onOpenPreferences={() => setIsPreferencesOpen(true)} />
      <main className="overflow-hidden" style={{ width: '100%', maxWidth: '100vw' }}>
        <HomeHero />
        <InteractiveTripDemo />
        <CtaFinal />
      </main>
      <Footer />
      <PreferencesDrawer
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />
    </>
  );
}
