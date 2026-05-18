'use client';
import styles from './CommunityFeed.module.css';

const FEATURED_TRIPS = [
  {
    id: 1,
    title: 'Autumn in Kyoto',
    author: 'Hiroshi T.',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=1000',
    tags: ['Cultural', 'Temples', 'Food'],
    likes: 1240,
    days: 5
  },
  {
    id: 2,
    title: 'Icelandic Roadtrip',
    author: 'Bjorn S.',
    image: 'https://images.unsplash.com/photo-1504109586057-7a2ae83d1338?auto=format&fit=crop&q=80&w=1000',
    tags: ['Nature', 'Adventure', 'Photography'],
    likes: 3100,
    days: 7
  },
  {
    id: 3,
    title: 'Amalfi Coast Soul',
    author: 'Giulia R.',
    image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=1000',
    tags: ['Romantic', 'Luxury', 'Beach'],
    likes: 850,
    days: 4
  }
];

export default function CommunityFeed() {
  return (
    <section className={styles.community} id="community">
      <div className={styles.header}>
        <span className="section-label" style={{ color: '#00ffc8', background: 'rgba(0,255,200,0.1)' }}>🟢 LIVE HUB</span>
        <h2 className={styles.title}>Global <span className="gradient-text">Activity Stream</span></h2>
        <p className={styles.subtitle}>Intercept live deployments and trending missions from agents around the world.</p>
      </div>

      <div className={styles.grid}>
        {FEATURED_TRIPS.map(trip => (
          <div key={trip.id} className={styles.card}>
            <div className={styles.imageWrapper}>
              <img src={trip.image} alt={trip.title} className={styles.tripImage} />
              <div className={styles.overlay}>
                <div className={styles.authorBadge}>
                  <img src={`https://ui-avatars.com/api/?name=${trip.author}&background=00ffc8&color=000`} alt={trip.author} />
                  <span>{trip.author}</span>
                </div>
              </div>
            </div>
            <div className={styles.content}>
              <div className={styles.tags}>
                {trip.tags.map(tag => <span key={tag} className={styles.tag}>#{tag}</span>)}
              </div>
              <h3 className={styles.tripTitle}>{trip.title}</h3>
              <div className={styles.footer}>
                <div className={styles.stat}>
                  <span>🗓️ {trip.days} Days</span>
                </div>
                <div className={styles.stat}>
                  <span>❤️ {trip.likes}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.cta}>
        <button className="btn btn-secondary">Access Full Hub</button>
      </div>
    </section>
  );
}
