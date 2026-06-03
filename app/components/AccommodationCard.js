'use client';

import styles from './AccommodationCard.module.css';
import { Star, Hotel, ExternalLink } from 'lucide-react';

export default function AccommodationCard({ hotel, destination }) {
  if (!hotel) return null;

  const { name, stars, rating, pricePerNight, description, source, bookingUrl } = hotel;

  // Generate stars based on rating
  const renderStars = (starCount) => {
    const stars = [];
    const count = parseInt(starCount) || 4;
    for (let i = 1; i <= count; i++) {
      stars.push(<Star key={i} size={12} fill="var(--gold)" color="var(--gold)" />);
    }
    return stars;
  };

  const getSourceBadgeClass = (src) => {
    if (src === 'booking') return styles.srcBooking;
    return styles.srcEstimated;
  };

  const getSourceLabel = (src) => {
    if (src === 'booking') return 'Booking.com';
    return 'Estimativa';
  };

  const finalBookingUrl = bookingUrl || `https://www.booking.com/searchresults.pt-pt.html?ss=${encodeURIComponent(name + ' ' + (destination || ''))}`;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.hotelIcon}>
          <Hotel size={16} />
        </div>
        <div className={styles.nameArea}>
          <div className={styles.titleRow}>
            <h4 className={styles.name}>{name}</h4>
            <span className={`${styles.sourceBadge} ${getSourceBadgeClass(source)}`}>
              {getSourceLabel(source)}
            </span>
          </div>
          <div className={styles.ratingRow}>
            <div className={styles.stars}>{renderStars(stars)}</div>
            {rating && <span className={styles.ratingNumber}>★ {rating}/10</span>}
          </div>
        </div>
      </div>

      {description && <p className={styles.description}>{description}</p>}

      <div className={styles.footer}>
        <div className={styles.priceSection}>
          <span className={styles.price}>{pricePerNight || 'Sob Consulta'}</span>
          <span className={styles.priceSub}>/noite</span>
        </div>
        <a
          href={finalBookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.bookBtn}
        >
          Reservar <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
