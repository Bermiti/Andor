'use client';
import styles from './Features.module.css';

const features = [
  {
    icon: '🧠',
    iconBg: '#FAFAFA',
    title: 'AI Itinerary Generator',
    desc: 'Input your budget, style, and interests. Get a fully optimized day-by-day plan in seconds.',
    highlight: true,
  },
  {
    icon: '⚡',
    iconBg: '#FAFAFA',
    title: 'Adaptive Engine',
    desc: 'Real-time adjustments for delays, weather, and fatigue. Your plan evolves with you.',
    highlight: true,
  },
  {
    icon: '🗺️',
    iconBg: '#FAFAFA',
    title: 'Smart Navigation',
    desc: 'GPS-guided routes between stops with turn-by-turn directions.',
  },
  {
    icon: '💬',
    iconBg: '#FAFAFA',
    title: 'AI Assistant',
    desc: 'Chat naturally: "Make today more relaxed" or "Add a beach nearby."',
  },
  {
    icon: '✨',
    iconBg: '#FAFAFA',
    title: '1-Click Planning',
    desc: '"3 days in Lisbon under €200" — instant itinerary, zero friction.',
    gold: true,
  },
  {
    icon: '👥',
    iconBg: '#FAFAFA',
    title: 'Group Planning',
    desc: 'Shared itineraries, voting on activities, and cost splitting.',
  },
  {
    icon: '💰',
    iconBg: '#FAFAFA',
    title: 'Budget Tracking',
    desc: 'Real-time spending vs. planned budget with smart alerts.',
  },
  {
    icon: '🌐',
    iconBg: '#FAFAFA',
    title: 'Community',
    desc: 'Share, browse, and remix trending itineraries from travelers worldwide.',
  },
  {
    icon: '🎨',
    iconBg: '#FAFAFA',
    title: 'Creator Economy',
    desc: 'Create and sell premium itineraries. Earn from your travel expertise.',
    gold: true,
  },
  {
    icon: '🏨',
    iconBg: '#FAFAFA',
    title: 'Smart Recommendations',
    desc: 'Curated flights, hotels, and restaurants tailored to your preferences.',
  },
];

export default function Features() {
  return (
    <section className={styles.features} id="features">
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
            <div className={styles.cardIcon} style={{ background: f.highlight ? 'rgba(30,111,217,0.15)' : f.iconBg }}>
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
