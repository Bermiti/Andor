'use client';
import { useState } from 'react';
import Link from 'next/link';
import styles from './Social.module.css';

const tabs = ['🔥 Trending', '👥 Squad Formations', '⭐ Elite Rated', '🆕 New Protocols', '🌍 Europe', '🌏 Asia'];

const buddyRequests = [
  { name: 'Agent Sarah J.', destination: 'Lisbon, Portugal', date: 'June 15-22', interests: ['Photography', 'Food'], avatar: '👩‍🎨' },
  { name: 'Agent Mark T.', destination: 'Tokyo, Japan', date: 'July 1-10', interests: ['Tech', 'Nightlife'], avatar: '👨‍💻' },
  { name: 'Agent Elena R.', destination: 'Bali, Indonesia', date: 'August 5-20', interests: ['Nature', 'Beach'], avatar: '🧘‍♀️' },
];

const itineraries = [
  {
    slug: 'hidden-gems-lisbon',
    title: 'Lisbon Deep Dive',
    desc: '3-day cultural deep dive into Lisbon\'s lesser-known neighborhoods, local markets, and secret viewpoints.',
    badge: '🔥 Trending',
    image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&q=80&w=1000',
    author: 'PT', authorName: 'Maria S.', likes: '2.4K', saves: '890', price: 'Free', days: '3 days',
    categories: ['🔥 Trending', '🌍 Europe']
  },
  {
    slug: 'barcelona-budget',
    title: 'Barcelona Tactical',
    desc: 'Experience the best of Barcelona for under €50/day — free attractions, cheap eats, and local secrets.',
    badge: '⭐ Elite Rated',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&q=80&w=1000',
    author: 'ES', authorName: 'Carlos R.', likes: '1.8K', saves: '654', price: 'Free', days: '5 days',
    categories: ['⭐ Elite Rated', '🌍 Europe']
  },
  {
    slug: 'romantic-paris',
    title: 'Parisian Protocol',
    desc: 'The ultimate couple\'s guide — candlelit dinners, Seine river walks, and the most intimate spots in Paris.',
    badge: '💕 Popular',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1000',
    author: 'FR', authorName: 'Sophie L.', likes: '3.1K', saves: '1.2K', price: 'Free', days: '2 days',
    categories: ['🔥 Trending', '🌍 Europe']
  },
  {
    slug: 'swiss-alps-train',
    title: 'Swiss Alps Vector',
    desc: 'Glacier Express route and the most scenic mountain views in Switzerland.',
    badge: '🚂 Scenic',
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&q=80&w=1000',
    author: 'CH', authorName: 'Heidi L.', likes: '1.9K', saves: '800', price: 'Free', days: '5 days',
    categories: ['⭐ Elite Rated', '🌍 Europe', '🆕 New Protocols']
  },
  {
    slug: 'azores-adventure',
    title: 'Azores Extraction',
    desc: 'Volcanic lakes, whale watching, hot springs, and hiking trails across São Miguel island.',
    badge: '🌿 Nature',
    image: 'https://images.unsplash.com/photo-1585828419614-7cf6b8f39501?auto=format&fit=crop&q=80&w=1000',
    author: 'PT', authorName: 'João M.', likes: '1.2K', saves: '478', price: 'Free', days: '7 days',
    categories: ['🆕 New Protocols', '🌍 Europe']
  },
  {
    slug: 'tokyo-food',
    title: 'Tokyo Midnight Run',
    desc: 'From Tsukiji fish market to hidden ramen bars — a food lover\'s dream itinerary across Tokyo.',
    badge: '🍜 Food',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=1000',
    author: 'JP', authorName: 'Yuki T.', likes: '2.9K', saves: '1.1K', price: 'Free', days: '4 days',
    categories: ['🔥 Trending', '⭐ Elite Rated', '🌏 Asia']
  },
  {
    slug: 'bali-nomad',
    title: 'Bali Remote Base',
    desc: 'Work and surf in Canggu with the best cafes and co-working spaces.',
    badge: '💻 Remote',
    image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&q=80&w=1000',
    author: 'ID', authorName: 'Alex K.', likes: '5.2K', saves: '3K', price: 'Free', days: '30 days',
    categories: ['🆕 New Protocols', '🌏 Asia', '🔥 Trending']
  },
  {
    slug: 'nyc-3-days',
    title: 'NYC Recon',
    desc: 'Hit every iconic spot — Central Park, Brooklyn Bridge, Broadway, and the best pizza in Manhattan.',
    badge: '🗽 Classic',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=1000',
    author: 'US', authorName: 'Jake W.', likes: '4.5K', saves: '2.1K', price: 'Free', days: '3 days',
    categories: ['🗽 Americas', '⭐ Elite Rated']
  },
];

export default function Social() {
  const [activeTab, setActiveTab] = useState('🔥 Trending');

  const filteredItineraries = itineraries.filter(item => item.categories.includes(activeTab));

  return (
    <section className={styles.social} id="community">
      <div className={styles.header}>
        <span className={styles.sectionLabel}>🟢 LIVE HUB</span>
        <h2 className={styles.title}>Global <span className={styles.gradientText}>Activity Stream</span></h2>
        <p className={styles.subtitle}>
          Intercept live deployments, squad formations, and elite itineraries shared by agents worldwide. Completely free.
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

        {activeTab === '👥 Squad Formations' ? (
          <div className={styles.buddySection}>
            <div className={styles.buddyGrid}>
              {buddyRequests.map((buddy, i) => (
                <div key={i} className={styles.buddyCard}>
                  <div className={styles.buddyAvatar}>{buddy.avatar}</div>
                  <div className={styles.buddyInfo}>
                    <h4 className={styles.buddyName}>{buddy.name}</h4>
                    <p className={styles.buddyDest}>📍 Target: {buddy.destination}</p>
                    <p className={styles.buddyDate}>📅 {buddy.date}</p>
                    <div className={styles.buddyTags}>
                      {buddy.interests.map(tag => <span key={tag} className={styles.buddyTag}>{tag}</span>)}
                    </div>
                  </div>
                  <button className={styles.buddyAction}>Establish Uplink</button>
                </div>
              ))}
            </div>
            <div className={styles.buddyPromo}>
              <h3>Looking for a squad? 🤝</h3>
              <p>Andor matches you with agents sharing your exact mission parameters and travel dates.</p>
              <button className={styles.btnPrimary}>Broadcast Signal</button>
            </div>
          </div>
        ) : (
          <div className={`${styles.grid} animate-fade-in-up`} key={activeTab}>
            {filteredItineraries.length > 0 ? (
              filteredItineraries.map((item, i) => (
                <Link key={i} href={`/itinerary/${item.slug}`} className={styles.card}>
                  <div className={styles.cardImage}>
                    <div 
                      className={styles.cardBg} 
                      style={{ backgroundImage: `url(${item.image})` }}
                    ></div>
                    <div className={styles.cardOverlay}></div>
                    <span className={styles.cardBadge}>{item.badge}</span>
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <p className={styles.cardDesc}>{item.desc}</p>
                    <div className={styles.cardMeta}>
                      <div className={styles.cardAuthor}>
                        <div className={styles.cardAuthorAvatar}>{item.author}</div>
                        <span className={styles.cardAuthorName}>{item.authorName} • {item.days}</span>
                      </div>
                      <div className={styles.cardStats}>
                        <span className={styles.cardStat}>❤️ {item.likes}</span>
                        <span className={styles.cardStat}>📌 {item.saves}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No intercepts found for this category.</p>
              </div>
            )}
          </div>
        )}

        <div className={`${styles.creatorBanner} animate-fade-in-up animate-delay-2`}>
          <div className={styles.creatorBannerBg}></div>
          <div className={styles.creatorBannerContent}>
            <div className={styles.creatorText}>
              <h3 className={styles.creatorTitle}>SHARE YOUR MISSION ✨</h3>
              <p className={styles.creatorDesc}>
                Help other agents by uploading your successful itineraries to the global network. It's completely free and helps build a stronger community. Join 1,000+ elite agents already sharing their intel.
              </p>
            </div>
            <button className={styles.btnGold} onClick={() => window.dispatchEvent(new Event('open-auth-modal'))}>Upload Intel</button>
          </div>
        </div>
      </div>
    </section>
  );
}
