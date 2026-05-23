'use client';

import { useParams } from 'next/navigation';
import styles from './page.module.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DestinationPage() {
  const params = useParams();
  const slug = params?.slug || 'unknown';
  
  // Mock data fetching based on slug
  const [data, setData] = useState(null);

  useEffect(() => {
    // Simulated data based on destination
    const mockData = {
      name: slug.charAt(0).toUpperCase() + slug.slice(1).replace('-', ' '),
      score: 9.4,
      image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=2000&q=80',
      verdict: "A symphony of cobblestones and golden hour light, where every corner whispers secrets of ancient artisans and modern lovers. It's not just a place you visit; it's a feeling that lingers long after you've left.",
      bestTime: ['Apr', 'May', 'Sep', 'Oct'],
      highlights: [
        { title: 'The Grand Piazza', desc: 'Sip espresso while watching the world go by.' },
        { title: 'Hidden Alleyways', desc: 'Get lost in the maze of vibrant colors.' },
        { title: 'Sunset Viewpoint', desc: 'The most breathtaking golden hour.' }
      ],
      skipList: [
        { title: 'The Main Museum at noon', reason: 'Overcrowded and stuffy.' },
        { title: 'Tourist Trap Restaurants', reason: 'Overpriced and underwhelming.' }
      ],
      budget: {
        category: 'Moderate',
        daily: '$120 - $200',
        tips: 'Book trains in advance to save 40%.'
      },
      practical: {
        language: 'Local & English widely spoken',
        currency: 'Local Currency (Card accepted everywhere)',
        transport: 'Highly walkable, great metro.'
      },
      nearby: [
        { name: 'Coastal Gem', distance: '2 hrs by train' },
        { name: 'Mountain Retreat', distance: '3 hrs by bus' }
      ]
    };
    
    setData(mockData);
  }, [slug]);

  if (!data) return <div className={styles.loading}>Loading magic...</div>;

  return (
    <div className={styles.container}>
      {/* HERO SECTION */}
      <section className={styles.hero} style={{ backgroundImage: `url(${data.image})` }}>
        <div className={styles.heroOverlay}>
          <div className={styles.heroContent}>
            <div className={styles.scoreBadge}>
              <span className={styles.scoreValue}>{data.score}</span>
              <span className={styles.scoreLabel}>Andor Score</span>
            </div>
            <h1 className={styles.title}>{data.name}</h1>
            <p className={styles.verdict}>"{data.verdict}"</p>
          </div>
        </div>
      </section>

      <main className={styles.main}>
        {/* BEST TIME CALENDAR */}
        <section className={styles.section}>
          <h2>Best Time to Visit</h2>
          <div className={styles.calendar}>
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
              <div 
                key={month} 
                className={`${styles.month} ${data.bestTime.includes(month) ? styles.monthBest : ''}`}
              >
                {month}
              </div>
            ))}
          </div>
        </section>

        {/* HIGHLIGHTS & SKIP LIST */}
        <div className={styles.grid2}>
          <section className={styles.section}>
            <h2>Top Highlights</h2>
            <ul className={styles.highlightsList}>
              {data.highlights.map((h, i) => (
                <li key={i} className={styles.highlightItem}>
                  <div className={styles.highlightIcon}>✨</div>
                  <div>
                    <h3>{h.title}</h3>
                    <p>{h.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Honest Skip List</h2>
            <ul className={styles.skipList}>
              {data.skipList.map((s, i) => (
                <li key={i} className={styles.skipItem}>
                  <div className={styles.skipIcon}>🚫</div>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* BUDGET & PRACTICAL INFO */}
        <div className={styles.grid2}>
          <section className={styles.section}>
            <h2>Budget Guide</h2>
            <div className={styles.budgetCard}>
              <div className={styles.budgetMain}>
                <span className={styles.budgetCategory}>{data.budget.category}</span>
                <span className={styles.budgetDaily}>{data.budget.daily} <small>/ day</small></span>
              </div>
              <p className={styles.budgetTip}>💡 {data.budget.tips}</p>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Practical Info</h2>
            <div className={styles.practicalCard}>
              <div className={styles.practicalItem}>
                <span className={styles.pIcon}>🗣️</span>
                <span>{data.practical.language}</span>
              </div>
              <div className={styles.practicalItem}>
                <span className={styles.pIcon}>💳</span>
                <span>{data.practical.currency}</span>
              </div>
              <div className={styles.practicalItem}>
                <span className={styles.pIcon}>🚇</span>
                <span>{data.practical.transport}</span>
              </div>
            </div>
          </section>
        </div>

        {/* NEARBY ESCAPES */}
        <section className={styles.section}>
          <h2>Nearby Escapes</h2>
          <div className={styles.nearbyGrid}>
            {data.nearby.map((n, i) => (
              <div key={i} className={styles.nearbyCard}>
                <h3>{n.name}</h3>
                <p>📍 {n.distance}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* STICKY CTA */}
      <div className={styles.stickyCta}>
        <div className={styles.ctaContent}>
          <div>
            <div className={styles.ctaTitle}>Ready for {data.name}?</div>
            <div className={styles.ctaSub}>Build your dream itinerary in seconds.</div>
          </div>
          <button className={styles.ctaButton}>Plan My Trip</button>
        </div>
      </div>
    </div>
  );
}
