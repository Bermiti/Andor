'use client';

import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import ItineraryGenerator from './components/ItineraryGenerator';
import MapPreview from './components/MapPreview';
import QuickPlan from './components/QuickPlan';
import AiAssistant from './components/AiAssistant';
import Social from './components/Social';
import Pricing from './components/Pricing';
import Footer from './components/Footer';

export default function Home() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const sections = document.querySelectorAll('section');
    sections.forEach((section) => {
      section.classList.add('reveal-on-scroll');
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Navbar />
      <main className="overflow-hidden">
        <Hero />
        <Features />
        <ItineraryGenerator />
        <MapPreview />
        <QuickPlan />
        <AiAssistant />
        <Social />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
