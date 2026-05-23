'use client';

import { useState, useEffect } from 'react';
import styles from './SplashScreen.module.css';

export default function SplashScreen() {
  const [show, setShow] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const splashDone = sessionStorage.getItem('andor_splash_done');
      if (!splashDone) {
        setShow(true);
        // Fade out transition after 2.2 seconds
        const exitTimer = setTimeout(() => {
          setIsExiting(true);
        }, 2200);

        // Completely hide and set session storage after 2.5 seconds
        const hideTimer = setTimeout(() => {
          setShow(false);
          sessionStorage.setItem('andor_splash_done', 'true');
        }, 2500);

        return () => {
          clearTimeout(exitTimer);
          clearTimeout(hideTimer);
        };
      }
    }
  }, []);

  if (!show) return null;

  return (
    <div className={`${styles.splashContainer} ${isExiting ? styles.fadeOut : ''}`}>
      <div className={styles.content}>
        {/* Logo */}
        <h1 className={styles.logo}>
          <span className={styles.logoSpark}>✦</span> Andor
        </h1>
        {/* Tagline */}
        <p className={styles.tagline}>O mundo está à tua espera</p>

        {/* Plane SVG Traversal */}
        <div className={styles.planeContainer}>
          <svg
            className={styles.planeSvg}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17.8 20.19 14 16h-3l-2.43 4.25a.8.8 0 0 1-1.37-.58V16H4.8a1 1 0 0 1-1-1v-1.5a1 1 0 0 1 1-1h2.4V6.33a.8.8 0 0 1 1.37-.58L11 10h3l3.8-4.19a1 1 0 0 1 1.48 1.34L16.2 12l3.08 4.85a1 1 0 0 1-1.48 1.34z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
