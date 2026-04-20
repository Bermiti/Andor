'use client';
import { useState } from 'react';
import styles from './Social.module.css';

const itineraries = [
  {
    title: 'Hidden Gems of Lisbon',
    desc: '3-day cultural deep dive into Lisbon\'s lesser-known neighborhoods, local markets, and secret viewpoints.',
    badge: '🔥 Trending',
    image: 'https://images.unsplash.com/photo-1548705085-101177834f47?q=80&w=600&auto=format&fit=crop', // Lisbon
    author: '🇵🇹',
    authorName: 'Maria S.',
    likes: '2.4K',
    saves: '890',
    price: '€4.99',
    days: '3 days',
  },
  {
    title: 'Barcelona on a Budget',
    desc: 'Experience the best of Barcelona for under €50/day — free attractions, cheap eats, and local secrets.',
    badge: '⭐ Top Rated',
    image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?q=80&w=600&auto=format&fit=crop', // Barcelona
    author: '🇪🇸',
    authorName: 'Carlos R.',
    likes: '1.8K',
    saves: '654',
    price: '€3.99',
    days: '5 days',
  },
  {
    title: 'Romantic Paris Weekend',
    desc: 'The ultimate couple\'s guide — candlelit dinners, Seine river walks, and the most intimate spots in Paris.',
    badge: '💕 Popular',
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=600&auto=format&fit=crop', // Paris
    author: '🇫🇷',
    authorName: 'Sophie L.',
    likes: '3.1K',
    saves: '1.2K',
    price: '€5.99',
    days: '2 days',
  },
  {
    title: 'Azores Adventure Week',
    desc: 'Volcanic lakes, whale watching, hot springs, and hiking trails across São Miguel island.',
    badge: '🌿 Nature',
    image: 'https://images.unsplash.com/photo-1582885938164-1af58ee6effa?q=80&w=600&auto=format&fit=crop', // Azores
    author: '🇵🇹',
    authorName: 'João M.',
    likes: '1.2K',
    saves: '478',
    price: '€6.99',
    days: '7 days',
  },
  {
    title: 'Tokyo Food Tour',
    desc: 'From Tsukiji fish market to hidden ramen bars — a food lover\'s dream itinerary across Tokyo.',
    badge: '🍜 Food',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=600&auto=format&fit=crop', // Tokyo
    author: '🇯🇵',
    authorName: 'Yuki T.',
    likes: '2.9K',
    saves: '1.1K',
    price: '€4.99',
    days: '4 days',
  },
  {
    title: 'NYC in 3 Days',
    desc: 'Hit every iconic spot — Central Park, Brooklyn Bridge, Broadway, and the best pizza in Manhattan.',
    badge: '🗽 Classic',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=600&auto=format&fit=crop', // NYC
    author: '🇺🇸',
    authorName: 'Jake W.',
    likes: '4.5K',
    saves: '2.1K',
    price: 'Free',
    days: '3 days',
  },
];

const tabs = ['🔥 Trending', '⭐ Top Rated', '🆕 New', '💰 Free', '🌍 Europe', '🌏 Asia'];

export default function Social() {
  const [activeTab, setActiveTab] = useState('🔥 Trending');

  return (
    <section className={styles.social} id="community">
      <div className={styles.header}>
        <span className="section-label">🌐 Community</span>
        <h2 className="section-title">Discover and share amazing trips</h2>
        <p className="section-subtitle mx-auto">
          Browse trending itineraries from travelers worldwide, or create and sell your own travel guides.
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.tabs}>
          {tabs.map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          {itineraries.map((item, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.cardImage}>
                <div 
                  className={styles.cardBg} 
                  style={{ backgroundImage: `url(${item.image})` }}
                ></div>
                <div className={styles.cardOverlay}></div>
                <span className={styles.cardBadge}>{item.badge}</span>
                {item.price !== 'Free' && <span className={styles.cardPrice}>{item.price}</span>}
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardDesc}>{item.desc}</p>
                <div className={styles.cardMeta}>
                  <div className={styles.cardAuthor}>
                    <div className={styles.cardAuthorAvatar} style={{ background: '#F0F0F0' }}>{item.author}</div>
                    <span className={styles.cardAuthorName}>{item.authorName} • {item.days}</span>
                  </div>
                  <div className={styles.cardStats}>
                    <span className={styles.cardStat}>❤️ {item.likes}</span>
                    <span className={styles.cardStat}>📌 {item.saves}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.creatorBanner}>
          <div className={styles.creatorBannerBg}></div>
          <div className={styles.creatorBannerContent}>
            <div className={styles.creatorText}>
              <h3 className={styles.creatorTitle}>Become a travel creator ✨</h3>
              <p className={styles.creatorDesc}>
                Share your unique travel expertise. Create premium itineraries and earn €2–€10 per sale. Join 1,000+ creators already on Andor.
              </p>
            </div>
            <button className="btn btn-gold btn-lg">Start Creating</button>
          </div>
        </div>
      </div>
    </section>
  );
}
