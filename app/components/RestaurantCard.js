'use client';

import styles from './RestaurantCard.module.css';
import { MapPin, Utensils, Star, Bookmark } from 'lucide-react';

export default function RestaurantCard({ restaurant, onMapFocus }) {
  if (!restaurant) return null;

  const { name, cuisine, rating, priceLevel, address, hours, mustTry, source } = restaurant;

  // Generate stars based on rating
  const renderStars = (ratingVal) => {
    const num = parseFloat(ratingVal) || 0;
    const stars = [];
    const fullStars = Math.floor(num);
    const hasHalf = num % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} size={14} fill="var(--gold)" color="var(--gold)" />);
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(
          <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
            <Star size={14} color="var(--b-gold)" />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', overflow: 'hidden' }}>
              <Star size={14} fill="var(--gold)" color="var(--gold)" />
            </div>
          </div>
        );
      } else {
        stars.push(<Star key={i} size={14} color="var(--b-gold)" />);
      }
    }
    return stars;
  };

  const getSourceBadgeClass = (src) => {
    if (src === 'foursquare') return styles.srcFoursquare;
    if (src === 'opentripmap') return styles.srcOTM;
    return styles.srcEstimated;
  };

  const getSourceLabel = (src) => {
    if (src === 'foursquare') return 'Foursquare';
    if (src === 'opentripmap') return 'OpenTripMap';
    return 'Estimativa';
  };

  const handleOpenMap = (e) => {
    e.stopPropagation();
    if (onMapFocus && restaurant.coordinates) {
      onMapFocus(restaurant.coordinates);
    } else {
      // fallback: open google maps search
      const q = encodeURIComponent(`${name} ${address || ''}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.mainInfo}>
          <div className={styles.titleRow}>
            <h4 className={styles.name}>{name}</h4>
            <span className={`${styles.sourceBadge} ${getSourceBadgeClass(source)}`}>
              {getSourceLabel(source)}
            </span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.cuisine}>
              <Utensils size={12} /> {cuisine}
            </span>
            {priceLevel && <span className={styles.price}>{priceLevel}</span>}
          </div>
        </div>
      </div>

      <div className={styles.ratingRow}>
        <div className={styles.stars}>{renderStars(rating)}</div>
        <span className={styles.ratingNumber}>{rating || '4.5'}</span>
      </div>

      <div className={styles.body}>
        {address && (
          <div className={styles.infoLine}>
            <MapPin size={12} />
            <span>{address}</span>
          </div>
        )}
        {hours && (
          <div className={styles.infoLine}>
            <span>🕐 Horário: {hours}</span>
          </div>
        )}
        {mustTry && (
          <div className={styles.highlightBox}>
            <span className={styles.highlightLabel}>A não perder:</span>
            <p className={styles.highlightText}>"{mustTry}"</p>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button className={styles.btnSecondary} onClick={handleOpenMap}>
          <MapPin size={14} /> Ver no Mapa
        </button>
        <button className={styles.btnIcon} aria-label="Guardar restaurante">
          <Bookmark size={14} />
        </button>
      </div>
    </div>
  );
}
