'use client';
import { useEffect, useRef } from 'react';
import styles from './Features.module.css';

const features = [
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
    iconBg: 'linear-gradient(135deg, #EBF5FF, #DBEAFE)',
    iconColor: '#1E6FD9',
    title: 'AI Itinerary Generator',
    desc: 'Input your budget and style. Get a fully optimized, high-fidelity day-by-day plan in seconds.',
    highlight: true,
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    iconBg: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
    iconColor: '#D97706',
    title: 'Live AI Adaptation',
    desc: 'The plan evolves with you. Magic Adapt reshuffles your day based on weather, energy, or delays.',
    highlight: true,
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
    iconBg: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
    iconColor: '#059669',
    title: 'Smart Navigation',
    desc: 'GPS-guided routes between stops with turn-by-turn directions.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    iconBg: 'linear-gradient(135deg, #F0F0FF, #E0E7FF)',
    iconColor: '#6366F1',
    title: 'AI Assistant',
    desc: 'Chat naturally: "Make today more relaxed" or "Add a beach nearby."',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h10"/></svg>,
    iconBg: 'linear-gradient(135deg, #F0F0FF, #E0E7FF)',
    iconColor: '#4F46E5',
    title: 'Command Center',
    desc: 'Power-user productivity with Cmd+K. Search destinations, trips, and settings in a heartbeat.',
    gold: true,
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    iconBg: 'linear-gradient(135deg, #F0FDFA, #CCFBF1)',
    iconColor: '#0D9488',
    title: 'Group Planning',
    desc: 'Shared itineraries, voting on activities, and cost splitting.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    iconBg: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
    iconColor: '#16A34A',
    title: 'Budget Tracking',
    desc: 'Real-time spending vs. planned budget with smart alerts.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    iconBg: 'linear-gradient(135deg, #EBF5FF, #DBEAFE)',
    iconColor: '#2563EB',
    title: 'Community',
    desc: 'Share, browse, and remix trending itineraries from travelers worldwide.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>,
    iconBg: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
    iconColor: '#D4A853',
    title: 'Creator Economy',
    desc: 'Create and sell premium itineraries. Earn from your travel expertise.',
    gold: true,
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    iconBg: 'linear-gradient(135deg, #FFF1F2, #FFE4E6)',
    iconColor: '#E11D48',
    title: 'Smart Recommendations',
    desc: 'Curated flights, hotels, and restaurants tailored to your preferences.',
  },
];

export default function Features() {
  const featuresRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const el = featuresRef.current;
      if (el) {
        const scrolled = window.scrollY;
        const offsetTop = el.offsetTop;
        const delta = scrolled - offsetTop;
        el.style.setProperty('--scroll-features', `${delta}px`);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section ref={featuresRef} className={styles.features} id="features">
      {/* Decorative Parallax Blobs */}
      <div className={styles.decorBlob1} style={{ transform: 'translateY(calc(var(--scroll-features, 0px) * -0.15))' }} />
      <div className={styles.decorBlob2} style={{ transform: 'translateY(calc(var(--scroll-features, 0px) * 0.12))' }} />

      <div className={styles.header}>
        <span className="section-label">✦ Features</span>
        <h2 className="section-title">Everything you need to travel smarter</h2>
        <p className="section-subtitle mx-auto">
          From AI-powered planning to real-time navigation, Andor handles every aspect of your journey.
        </p>
      </div>

      <div className={styles.grid}>
        {features.map((f, i) => (
          <div
            key={i}
            className={`${styles.card} ${f.highlight ? styles.highlight : ''} ${f.gold ? styles.goldBorder : ''}`}
          >
            <div className={styles.cardIcon} style={{ background: f.iconBg, color: f.iconColor }}>
              {f.icon}
            </div>
            <h3 className={styles.cardTitle}>{f.title}</h3>
            <p className={styles.cardDesc}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
