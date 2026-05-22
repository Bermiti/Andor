'use client';
import { useState, useEffect } from 'react';
import styles from './BookStickyBar.module.css';

export default function BookStickyBar({ destination = '', price = '', daysCount = 3 }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar after scrolling down 400px
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBook = () => {
    // Fire event to open Custom Request (Bespoke) modal
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('open-custom-request'));
    }
  };

  return (
    <div className={`${styles.stickyBar} ${isVisible ? styles.visible : ''}`}>
      <div className={styles.container}>
        <div className={styles.left}>
          <div className={styles.badge}>Luxury AI Plan</div>
          <div>
            <h4 className={styles.title}>{destination}</h4>
            <p className={styles.meta}>{daysCount} Dias • Itinerário Personalizado</p>
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.priceContainer}>
            <span className={styles.priceLabel}>Preço Estimado</span>
            <span className={styles.priceValue}>{price || '€250'}</span>
          </div>
          <button className={styles.bookBtn} onClick={handleBook}>
            Reservar Viagem Bespoke ✨
          </button>
        </div>
      </div>
    </div>
  );
}
