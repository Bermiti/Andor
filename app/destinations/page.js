'use client';

import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AiAssistant from '../components/AiAssistant';

export default function DestinationsPage() {
  useEffect(() => {
    document.title = "Destinos · Andor Travels";
  }, []);

  return (
    <>
      <Navbar />
      <main className="overflow-hidden" style={{ width: '100%', maxWidth: '100vw', paddingTop: '100px', paddingBottom: '40px', minHeight: '80vh', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '900px' }}>
          <AiAssistant />
        </div>
      </main>
      <Footer />
    </>
  );
}
