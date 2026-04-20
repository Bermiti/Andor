'use client';
import { useState, useEffect } from 'react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <a href="#" className={styles.logo}>
          <span className={styles.logoIcon}>
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4L8 32H14L20 18L26 32H32L20 4Z" fill="#1E6FD9"/>
              <path d="M12 28C12 28 16 24 20 24C24 24 28 28 28 28" stroke="#0A1628" strokeWidth="2" strokeLinecap="round"/>
              <path d="M20 4V18" stroke="#D4A853" strokeWidth="2" strokeLinecap="round"/>
              <path d="M10 34C10 34 15 31 20 31C25 31 30 34 30 34" stroke="#1E6FD9" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            </svg>
          </span>
          Andor
        </a>

        <div className={styles.links}>
          <a href="#features" className={styles.link}>Features</a>
          <a href="#planner" className={styles.link}>Plan a Trip</a>
          <a href="#explore" className={styles.link}>Explore</a>
          <a href="#community" className={styles.link}>Community</a>
          <a href="#pricing" className={styles.link}>Pricing</a>
        </div>

        <div className={styles.actions}>
          <button className={styles.loginBtn}>Log in</button>
          <button className={styles.ctaBtn}>Get Started</button>
          <button className={styles.mobileToggle} aria-label="Menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  );
}
