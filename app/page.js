'use client';

import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import DestinosAlta from './components/DestinosAlta';
import ComoFunciona from './components/ComoFunciona';
import ConciergeShowcase from './components/ConciergeShowcase';
import Testemunhos from './components/Testemunhos';
import CtaFinal from './components/CtaFinal';
import Footer from './components/Footer';
import OnboardingModal from './components/OnboardingModal';

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
      <OnboardingModal />
      <Navbar />
      <main className="overflow-hidden">
        <Hero />
        <DestinosAlta />
        <ComoFunciona />
        <ConciergeShowcase />
        <Testemunhos />
        <CtaFinal />
      </main>
      <Footer />
    </>
  );
}
