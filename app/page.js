'use client';
import dynamic from 'next/dynamic';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Pricing from './components/Pricing';
import VisualWall from './components/VisualWall';
import Footer from './components/Footer';

// Dynamic imports for heavy components
const ItineraryGenerator = dynamic(() => import('./components/ItineraryGenerator'), { ssr: false });
const MapPreview = dynamic(() => import('./components/MapPreview'), { ssr: false });

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        {/* The Agency Entrance */}
        <Hero />
        
        <section id="planner">
          <ItineraryGenerator />
          <MapPreview />
        </section>

        <VisualWall 
          image="https://images.unsplash.com/photo-1504109586057-7a2ae83d1338?auto=format&fit=crop&q=80&w=2000"
          title="Untamed Landscapes"
          subtitle="Deploy your curiosity into the heart of the world's most remote territories."
        />

        <section id="features">
          <Features />
        </section>

        <VisualWall 
          image="https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=2000"
          title="Elite Travel Engineering"
          subtitle="Every mission is a masterpiece of logistics and aesthetic perfection."
        />

        {/* Subscription Models */}
        <section id="pricing">
          <Pricing />
        </section>
      </main>
      <Footer />
    </>
  );
}
