'use client';
import { useState, useEffect } from 'react';
import styles from './ReviewsCarousel.module.css';

const reviewsData = [
  {
    name: 'Eleanor Vance',
    role: 'Luxury Traveler',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
    rating: 5,
    text: 'Andor completely rebuilt how we plan family vacations. The customized Lisbon itinerary was spotless — every local secret tip was a home run! The map navigation made it effortless to get around.',
    location: 'Lisbon, Portugal'
  },
  {
    name: 'Marcus K.',
    role: 'Adventure Enthusiast',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&auto=format&fit=crop',
    rating: 5,
    text: 'The Azores adventure guide saved us hours of research. From coordinate markers for wild volcanic hot springs to booking code tips, everything was practical and functional. Will definitely buy again!',
    location: 'Azores, Portugal'
  },
  {
    name: 'Chloé Mercier',
    role: 'Food Blogger & Curator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
    rating: 5,
    text: 'A truly premium experience. The culinary guides in Tokyo led us to some of the most remarkable, unlisted izakayas. Highly recommend customizing itineraries — the AI adjustments are incredibly fast.',
    location: 'Tokyo, Japan'
  },
  {
    name: 'David Sterling',
    role: 'Solo Backpacker',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
    rating: 4.8,
    text: 'As a developer, I appreciate the design and seamlessness. The budget slider calculations were within 5% of my actual trip expenses! Andor makes exploring the world look beautiful.',
    location: 'Barcelona, Spain'
  }
];

export default function ReviewsCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev === reviewsData.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleNext = () => {
    setIndex((prev) => (prev === reviewsData.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setIndex((prev) => (prev === 0 ? reviewsData.length - 1 : prev - 1));
  };

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.header}>
        <span className={styles.sectionLabel}>⭐ Verified Stories</span>
        <h3 className={styles.title}>What our global travelers say</h3>
      </div>

      <div className={styles.slideArea}>
        <button className={styles.navBtn} onClick={handlePrev} aria-label="Previous review">‹</button>
        
        <div className={styles.card} key={index}>
          <div className={styles.ratingRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={styles.star}>
                {i < Math.floor(reviewsData[index].rating) ? '★' : '☆'}
              </span>
            ))}
            <span className={styles.ratingNum}>{reviewsData[index].rating} / 5</span>
          </div>

          <p className={styles.text}>"{reviewsData[index].text}"</p>

          <div className={styles.userRow}>
            <img 
              src={reviewsData[index].avatar} 
              alt={reviewsData[index].name} 
              className={styles.avatar} 
              loading="lazy"
            />
            <div className={styles.userInfo}>
              <h4 className={styles.userName}>{reviewsData[index].name}</h4>
              <p className={styles.userRole}>{reviewsData[index].role} • 📍 {reviewsData[index].location}</p>
            </div>
            <span className={styles.verifiedBadge}>✓ Verified Guest</span>
          </div>
        </div>

        <button className={styles.navBtn} onClick={handleNext} aria-label="Next review">›</button>
      </div>

      <div className={styles.dots}>
        {reviewsData.map((_, idx) => (
          <button 
            key={idx}
            className={`${styles.dot} ${index === idx ? styles.dotActive : ''}`}
            onClick={() => setIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
