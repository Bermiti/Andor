'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ActiveTravelers.module.css';

function getRandomInitial() {
  return Math.floor(Math.random() * 80) + 180;
}

export default function ActiveTravelers({ embedded = false }) {
  const [count, setCount] = useState(200); // Fixed value for SSR to prevent hydration mismatch
  const [visible, setVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const intervalRef = useRef(null);

  // Check sessionStorage and initialize random count on mount
  useEffect(() => {
    setCount(getRandomInitial());
    try {
      if (sessionStorage.getItem('andor_travelers_dismissed') === '1') {
        setVisible(false);
      }
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  // Fluctuate count every 8-15 seconds
  useEffect(() => {
    if (!visible) return;

    const scheduleNext = () => {
      const delay = Math.floor(Math.random() * 7000) + 8000; // 8-15s
      intervalRef.current = setTimeout(() => {
        setCount(prev => {
          const change = Math.floor(Math.random() * 21) - 10; // -10 to +10
          let newCount = prev + change;
          if (newCount < 150) newCount = 150;
          if (newCount > 400) newCount = 400;
          return newCount;
        });
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => clearTimeout(intervalRef.current);
  }, [visible]);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem('andor_travelers_dismissed', '1');
      } catch {
        // sessionStorage unavailable
      }
    }, 300);
  }, []);

  if (!visible) return null;

  return (
    <div className={`${embedded ? styles.embeddedBadge : styles.badge} ${isExiting ? styles.exiting : ''}`}>
      <span className={styles.dotWrapper}>
        <span className={styles.dot} />
        <span className={styles.dotPulse} />
      </span>
      <span>
        <span className={styles.count}>{count}</span>{' '}
        <span className={styles.text}>pessoas a explorar destinos agora</span>
      </span>
      {!embedded && (
        <button
          className={styles.closeBtn}
          onClick={handleDismiss}
          aria-label="Fechar"
        >
          ✕
        </button>
      )}
    </div>
  );
}
