'use client';
import styles from './RecommendationCard.module.css';
import { Bookmark, X, Clock, MapPin, Map, Utensils, ShoppingBag, Music, Eye } from 'lucide-react';

export default function RecommendationCard({
  recommendation,
  currency = '€',
  onAdd,
  onReplace,
  onSave,
  onReject
}) {
  if (!recommendation) return null;

  const getCategoryIcon = (category) => {
    const cat = String(category).toLowerCase();
    if (cat.includes('food') || cat.includes('restaurant') || cat.includes('dining')) return <Utensils size={16} />;
    if (cat.includes('shop')) return <ShoppingBag size={16} />;
    if (cat.includes('music') || cat.includes('entertainment')) return <Music size={16} />;
    if (cat.includes('museum') || cat.includes('culture') || cat.includes('art')) return <Map size={16} />;
    return <Eye size={16} />;
  };

  const formatCost = (cost) => {
    if (cost === 0 || cost === '0') return 'Free';
    if (!cost) return null;
    return `${currency}${cost}`;
  };

  const costDisplay = formatCost(recommendation.cost);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.iconWrapper}>
            {getCategoryIcon(recommendation.category)}
          </div>
          <div>
            <h4 className={styles.name}>{recommendation.name}</h4>
            {recommendation.context && (
              <span className={styles.badge}>{recommendation.context}</span>
            )}
          </div>
        </div>
      </div>
      
      {recommendation.justification && (
        <p className={styles.justification}>"{recommendation.justification}"</p>
      )}
      
      <div className={styles.metaRow}>
        {recommendation.duration && (
          <span className={styles.metaPill}>
            <Clock size={12} /> {recommendation.duration}
          </span>
        )}
        {costDisplay && (
          <span className={styles.metaPill}>
            💰 {costDisplay}
          </span>
        )}
        {recommendation.distance && (
          <span className={styles.metaPill}>
            <MapPin size={12} /> {recommendation.distance} away
          </span>
        )}
      </div>
      
      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={() => onAdd && onAdd(recommendation)}>
          Add to period
        </button>
        <button className={styles.btnSecondary} onClick={() => onReplace && onReplace(recommendation)}>
          Replace activity
        </button>
        <button className={styles.iconBtn} onClick={() => onSave && onSave(recommendation)} aria-label="Save for later" title="Save for later">
          <Bookmark size={16} />
        </button>
        <button className={`${styles.iconBtn} ${styles.iconBtnReject}`} onClick={() => onReject && onReject(recommendation)} aria-label="Not interested" title="Not interested">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
