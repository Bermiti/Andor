'use client';
import styles from './SkeletonLoader.module.css';

/**
 * SkeletonLoader — Elegant animated placeholder that mirrors content layout.
 * Use instead of simple spinners for a premium loading experience.
 *
 * Variants:
 *  - 'itinerary' — Full itinerary page skeleton
 *  - 'card' — Single destination card
 *  - 'text' — Text block placeholder
 *  - 'inline' — Compact inline skeleton
 */
export default function SkeletonLoader({ variant = 'card', count = 1 }) {
  if (variant === 'itinerary') {
    return (
      <div className={styles.itinerarySkeleton}>
        {/* Hero skeleton */}
        <div className={styles.heroSkel}>
          <div className={`${styles.skel} ${styles.skelBadge}`}></div>
          <div className={`${styles.skel} ${styles.skelTitle}`}></div>
          <div className={`${styles.skel} ${styles.skelSubtitle}`}></div>
          <div className={styles.skelMeta}>
            <div className={`${styles.skel} ${styles.skelMetaItem}`}></div>
            <div className={`${styles.skel} ${styles.skelMetaItem}`}></div>
            <div className={`${styles.skel} ${styles.skelMetaItem}`}></div>
          </div>
        </div>

        {/* Day tabs skeleton */}
        <div className={styles.skelDayTabs}>
          {[1, 2, 3].map(i => (
            <div key={i} className={`${styles.skel} ${styles.skelDayTab}`}></div>
          ))}
        </div>

        {/* Map skeleton */}
        <div className={`${styles.skel} ${styles.skelMap}`}></div>

        {/* Timeline skeleton */}
        <div className={styles.skelTimeline}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={styles.skelStop}>
              <div className={`${styles.skel} ${styles.skelDot}`}></div>
              <div className={styles.skelStopContent}>
                <div className={`${styles.skel} ${styles.skelStopTime}`}></div>
                <div className={`${styles.skel} ${styles.skelStopName}`}></div>
                <div className={`${styles.skel} ${styles.skelStopDesc}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={styles.cardSkeletons}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={styles.cardSkel}>
            <div className={`${styles.skel} ${styles.skelCardImage}`}></div>
            <div className={styles.skelCardBody}>
              <div className={`${styles.skel} ${styles.skelCardTitle}`}></div>
              <div className={`${styles.skel} ${styles.skelCardDesc}`}></div>
              <div className={`${styles.skel} ${styles.skelCardDesc2}`}></div>
              <div className={styles.skelCardMeta}>
                <div className={`${styles.skel} ${styles.skelCardAvatar}`}></div>
                <div className={`${styles.skel} ${styles.skelCardAuthor}`}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={styles.textSkel}>
        <div className={`${styles.skel} ${styles.skelTextLine}`} style={{ width: '90%' }}></div>
        <div className={`${styles.skel} ${styles.skelTextLine}`} style={{ width: '75%' }}></div>
        <div className={`${styles.skel} ${styles.skelTextLine}`} style={{ width: '85%' }}></div>
        <div className={`${styles.skel} ${styles.skelTextLine}`} style={{ width: '60%' }}></div>
      </div>
    );
  }

  // inline
  return <div className={`${styles.skel} ${styles.skelInline}`}></div>;
}
