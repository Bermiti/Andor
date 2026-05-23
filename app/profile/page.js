'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Link from 'next/link';
import OnboardingModal from '../components/OnboardingModal';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('itineraries');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('andor_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setUser({ name: 'Traveler', persona: 'adventurer', budget: 'Moderate' });
    }
  }, []);

  const getPersonaLabel = (id) => {
    const map = {
      'adventurer': 'The Adventurer',
      'culture': 'Culture Vulture',
      'relaxer': 'The Relaxer',
      'foodie': 'The Foodie'
    };
    return map[id] || 'Explorer';
  };

  return (
    <div className={styles.container}>
      <OnboardingModal />
      
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.avatar}>
            {user?.name?.charAt(0).toUpperCase() || 'T'}
          </div>
          <div className={styles.userInfo}>
            <h1 className={styles.name}>{user?.name || 'Traveler'}</h1>
            <div className={styles.badges}>
              <span className={styles.badge}>{getPersonaLabel(user?.persona)}</span>
              <span className={styles.badge}>{user?.budget || 'Moderate'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* TABS */}
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'itineraries' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('itineraries')}
          >
            Itinerários
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'favorites' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            Favoritos
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'stats' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Stats & Map
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className={styles.content}>
          
          {activeTab === 'itineraries' && (
            <div className={styles.emptyState}>
              <svg className={styles.emptySvg} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="80" stroke="rgba(255,255,255,0.05)" strokeWidth="4"/>
                <path d="M70 120L100 80L130 120" stroke="var(--accent, #00ff88)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="100" cy="70" r="10" fill="var(--accent, #00ff88)"/>
                <path d="M50 150C70 140 130 140 150 150" stroke="rgba(255,255,255,0.2)" strokeWidth="4" strokeLinecap="round"/>
              </svg>
              <h2>No itineraries yet</h2>
              <p>Your journey begins with a single step (and a quick search).</p>
              <Link href="/" className={styles.primaryBtn}>Plan a Trip</Link>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className={styles.emptyState}>
              <svg className={styles.emptySvg} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="80" stroke="rgba(255,255,255,0.05)" strokeWidth="4"/>
                <path d="M100 130C100 130 65 100 65 75C65 60 75 50 90 50C97 50 100 55 100 55C100 55 103 50 110 50C125 50 135 60 135 75C135 100 100 130 100 130Z" stroke="var(--accent, #00ff88)" strokeWidth="4" fill="rgba(0,255,136,0.1)"/>
                <path d="M115 65C120 65 125 70 125 75" stroke="var(--accent, #00ff88)" strokeWidth="4" strokeLinecap="round"/>
              </svg>
              <h2>Your heart is empty</h2>
              <p>Save your favorite destinations here and start dreaming.</p>
              <Link href="/" className={styles.primaryBtn}>Explore Destinations</Link>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className={styles.statsLayout}>
              <div className={styles.statsCards}>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>0</div>
                  <div className={styles.statLabel}>Countries Visited</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>0</div>
                  <div className={styles.statLabel}>Cities Explored</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>0</div>
                  <div className={styles.statLabel}>Itineraries Planned</div>
                </div>
              </div>
              
              <div className={styles.mapContainer}>
                <h3>Your World Map</h3>
                <div className={styles.mapWrapper}>
                  <svg viewBox="0 0 800 400" className={styles.worldMap}>
                    {/* Simplified decorative world map paths */}
                    <path d="M 200 150 Q 250 100 300 150 T 400 200 T 500 150 T 600 200" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="5,5" />
                    <circle cx="200" cy="150" r="4" fill="var(--accent, #00ff88)" />
                    <circle cx="600" cy="200" r="4" fill="var(--accent, #00ff88)" />
                    <path d="M100 100 Q 150 120 180 80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="15" strokeLinecap="round"/>
                    <path d="M300 180 Q 350 220 400 150" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="20" strokeLinecap="round"/>
                    <path d="M500 120 Q 550 160 580 100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="15" strokeLinecap="round"/>
                    <text x="400" y="250" fill="rgba(255,255,255,0.3)" textAnchor="middle" fontSize="14">No travels logged yet</text>
                  </svg>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
