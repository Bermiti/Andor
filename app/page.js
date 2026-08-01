'use client';

import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import HomeHero from './components/home/HomeHero';
import CtaFinal from './components/CtaFinal';
import Footer from './components/Footer';
import OnboardingModal from './components/OnboardingModal';
import CreationWizard from './components/CreationWizard';

export default function Home() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDestination, setWizardDestination] = useState('');
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardDefaults, setWizardDefaults] = useState({});

  const openWizard = (destination = '', step = 1, defaults = {}) => {
    setWizardDestination(destination);
    setWizardStep(step);
    setWizardDefaults(defaults || {});
    setIsWizardOpen(true);
  };

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = "Andor · Planeador de Viagens com IA";
      const params = new URLSearchParams(window.location.search);
      if (params.get('wizard') === 'true') {
        const dest = params.get('dest') || '';
        const step = parseInt(params.get('step') || '1', 10);
        openWizard(dest, step);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, []);

  return (
    <>
      <OnboardingModal />
      <Navbar />
      <main className="overflow-hidden" style={{ width: '100%', maxWidth: '100vw' }}>
        <HomeHero onOpenWizard={openWizard} />
        <CtaFinal />
      </main>
      <Footer />
      <CreationWizard 
        isOpen={isWizardOpen} 
        onClose={() => setIsWizardOpen(false)} 
        initialDestination={wizardDestination}
        initialStep={wizardStep}
        initialDates={wizardDefaults.dates}
        initialTravelers={wizardDefaults.travelers}
      />
    </>
  );
}
