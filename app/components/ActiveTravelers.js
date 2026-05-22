'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ActiveTravelers.module.css';

function getRandomCount() {
  return Math.floor(Math.random() * 151) + 200; // 200-350
}

export default function ActiveTravelers() {
  const [count, setCount] = useState(247);
  const [visible, setVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const intervalRef = useRef(null);

  // Check sessionStorage on mount
  useEffect(() => {
    try {
      if (sessionStorage.getItem('andor_travelers_dismissed') === '1') {
        setVisible(false);
      }
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  // Fluctuate count every 10 seconds
  useEffect(() => {
    if (!visible) return;

    intervalRef.current = setInterval(() => {
      setCount(getRandomCount());
    }, 10000);

    return () => clearInterval(intervalRef.current);
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
    <div className={`${styles.badge} ${isExiting ? styles.exiting : ''}`}>
      <span className={styles.dotWrapper}>
        <span className={styles.dot} />
        <span className={styles.dotPulse} />
      </span>
      <span>
        <span className={styles.count}>{count}</span>{' '}
        <span className={styles.text}>pessoas a explorar destinos agora</span>
      </span>
      <button
        className={styles.closeBtn}
        onClick={handleDismiss}
        aria-label="Fechar"
      >
        ✕
      </button>
    </div>
  );
}
