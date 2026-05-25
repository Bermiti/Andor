'use client';

import { useState, useEffect } from 'react';
import styles from './SplashScreen.module.css';

export default function SplashScreen() {
  const [show, setShow] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('andor_splash_seen');
    if (!hasSeenSplash) {
      setShow(true);
      sessionStorage.setItem('andor_splash_seen', 'true');
      
      const fadeOutTimer = setTimeout(() => {
        setFadingOut(true);
      }, 2000); // Start fading out at 2s
      
      const hideTimer = setTimeout(() => {
        setShow(false);
      }, 2500); // Fully hide at 2.5s
      
      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(hideTimer);
      };
    }
  }, []);

  if (!show) return null;

  return (
    <div className={`${styles.splashContainer} ${fadingOut ? styles.fadeOut : ''}`}>
      <div className={styles.content}>
        <div className={styles.brand}>✦ ANDOR</div>
        <p className={styles.tagline}>O mundo está à tua espera</p>
      </div>
      <div className={styles.airplaneWrapper}>
        <svg className={styles.airplane} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 16.5161L12.5938 10.2258L12.5938 3.93548C12.5938 3.14516 11.9375 2.5 11.1562 2.5C10.375 2.5 9.71875 3.14516 9.71875 3.93548L9.71875 10.2258L0.3125 16.5161L0.3125 18.6694L9.71875 15.6129L9.71875 20.4516L7.15625 22.2581L7.15625 23.5L11.1562 22.4274L15.1562 23.5L15.1562 22.2581L12.5938 20.4516L12.5938 15.6129L22 18.6694L22 16.5161Z" fill="#D4AF37"/>
        </svg>
      </div>
    </div>
  );
}
