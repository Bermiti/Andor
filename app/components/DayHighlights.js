'use client';
import styles from './DayHighlights.module.css';

/**
 * DAY HIGHLIGHTS
 * 
 * Shows the 1-2 must-do moments of the day
 * with emotional + practical summary
 */

export default function DayHighlights({ 
  day, 
  dayIndex,
}) {
  if (!day || !day.stops || day.stops.length === 0) return null;

  // Find highlights - either from day.highlights or first and most interesting activity
  const highlights = day.highlights || [];
  
  // If no explicit highlights, derive from activities
  let highlightActivities = [];
  if (highlights.length > 0) {
    highlightActivities = highlights;
  } else if (day.stops.length > 0) {
    // Pick the first activity as highlight
    highlightActivities = [day.stops[0]];
    
    // Pick an interesting activity (museum, scenic view, etc.)
    const interestingActivity = day.stops.find(s => 
      (s.type && (
        s.type.toLowerCase().includes('museum') ||
        s.type.toLowerCase().includes('viewpoint') ||
        s.type.toLowerCase().includes('temple') ||
        s.type.toLowerCase().includes('nature') ||
        s.type.toLowerCase().includes('iconic')
      ))
    );
    if (interestingActivity && interestingActivity !== day.stops[0]) {
      highlightActivities.push(interestingActivity);
    }
  }

  if (highlightActivities.length === 0) return null;

  // Emotional summary of day
  const getEmotion = () => {
    const theme = (day.theme || '').toLowerCase();
    if (theme.includes('culture')) return '🏛️ Mergulha na cultura';
    if (theme.includes('nature')) return '🌿 Conecta com a natureza';
    if (theme.includes('food')) return '👨‍🍳 Saboreia sabores locais';
    if (theme.includes('relaxed') || theme.includes('leisure')) return '😌 Aproveita ao teu ritmo';
    if (theme.includes('intense')) return '⚡ Vive ao máximo';
    if (theme.includes('arrival') || theme.includes('arrival day')) return '🛬 Chega e integra-te';
    return '✨ Descobre o melhor';
  };

  return (
    <div className={styles.highlightsContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>Destaques do Dia</h3>
        <p className={styles.emotion}>{getEmotion()}</p>
      </div>

      <div className={styles.highlightsList}>
        {highlightActivities.slice(0, 2).map((activity, idx) => (
          <div key={idx} className={styles.highlightItem}>
            <div className={styles.highlightBadge}>✓</div>
            <div className={styles.highlightContent}>
              <div className={styles.highlightName}>
                {activity.emoji || '📍'} {activity.name}
              </div>
              <div className={styles.highlightType}>{activity.type}</div>
              {activity.whyMatters && (
                <div className={styles.highlightWhy}>{activity.whyMatters}</div>
              )}
              <div className={styles.highlightMeta}>
                {activity.duration && <span>⏱️ {activity.duration}</span>}
                {activity.rating && <span>⭐ {activity.rating}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {day.moodDescription && (
        <div className={styles.dayMood}>
          <div className={styles.moodIcon}>💭</div>
          <div className={styles.moodText}>{day.moodDescription}</div>
        </div>
      )}
    </div>
  );
}
