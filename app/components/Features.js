'use client';
import styles from './Features.module.css';

const features = [
  {
    icon: '🧠',
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=800',
    title: 'AI Orchestrator',
    desc: 'Autonomous planning that learns from your behavior and preferences over time.',
  },
  {
    icon: '⚡',
    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=800',
    title: 'Live Adapt™',
    desc: 'Real-time itinerary shifts based on live weather and local traffic.',
  },
  {
    icon: '👥',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
    title: 'Buddy Matchmaker',
    desc: 'AI-driven discovery of travel partners with perfectly aligned interests.',
  },
  {
    icon: '✨',
    image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&q=80&w=800',
    title: 'Concierge Prime',
    desc: '24/7 dedicated AI assistant for restaurant bookings and local secrets.',
  },
  {
    icon: '💰',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&q=80&w=800',
    title: 'Expense Oracle',
    desc: 'Predictive budgeting and automated cost splitting for groups.',
  },
  {
    icon: '🛰️',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800',
    title: 'Tactical GPS',
    desc: 'High-fidelity route optimization between stops with AR potential.',
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
          <div key={i} className={styles.card}>
            <div className={styles.imageWrapper}>
              <img src={f.image} alt={f.title} className={styles.cardImage} />
              <div className={styles.iconOverlay}>{f.icon}</div>
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{f.title}</h3>
              <p className={styles.cardDesc}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
