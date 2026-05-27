'use client';

import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HomeHowItWorks from '../components/home/HomeHowItWorks';

export default function FeaturesPage() {
  useEffect(() => {
    document.title = "Funcionalidades · Andor Travels";
  }, []);

  return (
    <>
      <Navbar />
      <main className="overflow-hidden" style={{ width: '100%', maxWidth: '100vw', paddingTop: '80px' }}>
        <HomeHowItWorks />
      </main>
      <Footer />
    </>
  );
}
