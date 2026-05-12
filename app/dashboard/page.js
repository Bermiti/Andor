'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import WorldMap from './components/WorldMap';
import TripsList from './components/TripsList';
import ExpenseSplitter from './components/ExpenseSplitter';
import TravelBuddies from './components/TravelBuddies';
import styles from './dashboard.module.css';

const tabs = [
  { id: 'map', label: '🗺️ World Map', icon: '🗺️' },
  { id: 'trips', label: '✈️ Trips', icon: '✈️' },
  { id: 'expenses', label: '💰 Expenses', icon: '💰' },
  { id: 'buddies', label: '🤝 Travel Buddies', icon: '🤝' },
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('map');

  useEffect(() => {
    if (window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (tabs.find(t => t.id === hash)) {
        setActiveTab(hash);
      }
    }
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className={styles.authRequired}>
          <div className={styles.authCard}>
            <div className={styles.authIcon}>🔒</div>
            <h2>Log in to access your Dashboard</h2>
            <p>Sign up or log in to view your trips, world map, and more.</p>
            <button className={styles.authBtn} onClick={() => window.dispatchEvent(new Event('open-auth-modal'))}>
              Log in / Sign up
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={styles.dashboard}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarProfile}>
            <div className={styles.avatar}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>{user.name}</div>
              <div className={styles.profileStat}>
                {user.visitedCountries?.length || 0} countries • {user.trips?.length || 0} trips
              </div>
            </div>
          </div>

          <nav className={styles.sidebarNav}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`${styles.navItem} ${activeTab === tab.id ? styles.navItemActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className={styles.navIcon}>{tab.icon}</span>
                <span className={styles.navLabel}>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <main className={styles.main}>
          <div className={styles.mainHeader}>
            <h1 className={styles.mainTitle}>
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
          </div>

          <div className={styles.mainContent}>
            {activeTab === 'map' && <WorldMap />}
            {activeTab === 'trips' && <TripsList />}
            {activeTab === 'expenses' && <ExpenseSplitter />}
            {activeTab === 'buddies' && <TravelBuddies />}
          </div>
        </main>
      </div>
    </>
  );
}
