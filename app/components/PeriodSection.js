'use client';
import styles from './PeriodSection.module.css';

/**
 * PERIOD SECTION
 * 
 * Groups activities by morning/afternoon/evening
 * with beautiful period-specific styling and
 * visual hierarchy
 */

export default function PeriodSection({
  period, // 'morning' | 'afternoon' | 'evening'
  activities = [],
  meals = {},
  children,
}) {
  if (activities.length === 0) return null;

  const periodConfig = {
    morning: {
      emoji: '🌅',
      title: 'Manhã',
      subtitle: 'Comece o dia com energia',
      color: '#F59E0B',
      bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(251, 191, 36, 0.04) 100%)',
      borderColor: '#F59E0B',
      icon: '☀️',
    },
    afternoon: {
      emoji: '☀️',
      title: 'Tarde',
      subtitle: 'Os momentos melhores do dia',
      color: '#3B82F6',
      bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(96, 165, 250, 0.04) 100%)',
      borderColor: '#3B82F6',
      icon: '🌞',
    },
    evening: {
      emoji: '🌙',
      title: 'Noite',
      subtitle: 'Descubra a alma da cidade',
      color: '#8B5CF6',
      bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(167, 139, 250, 0.04) 100%)',
      borderColor: '#8B5CF6',
      icon: '✨',
    },
  };

  const config = periodConfig[period] || periodConfig.afternoon;

  // Check if there's a meal for this period
  const mealForPeriod = {
    morning: meals?.breakfast,
    afternoon: meals?.lunch,
    evening: meals?.dinner,
  }[period];

  return (
    <section className={styles.periodSection} style={{ background: config.bgGradient }}>
      {/* PERIOD HEADER */}
      <div
        className={styles.periodHeader}
        style={{ borderLeftColor: config.color }}
      >
        <div className={styles.periodMeta}>
          <span className={styles.periodEmoji}>{config.emoji}</span>
          <div className={styles.periodTexts}>
            <h3 className={styles.periodTitle}>{config.title}</h3>
            <p className={styles.periodSubtitle}>{config.subtitle}</p>
          </div>
        </div>
        <div className={styles.activityCount}>{activities.length}</div>
      </div>

      {/* MEAL FOR PERIOD (if exists) */}
      {mealForPeriod && (
        <div
          className={styles.mealPreview}
          style={{ borderLeftColor: config.color }}
        >
          <div className={styles.mealIcon}>
            {period === 'morning' ? '🥐' : period === 'afternoon' ? '🍽️' : '🍷'}
          </div>
          <div className={styles.mealContent}>
            <div className={styles.mealName}>{mealForPeriod.name}</div>
            {mealForPeriod.cuisine && (
              <div className={styles.mealCuisine}>{mealForPeriod.cuisine}</div>
            )}
            <div className={styles.mealMeta}>
              {mealForPeriod.time && <span>🕐 {mealForPeriod.time}</span>}
              {mealForPeriod.cost && <span>💰 €{mealForPeriod.cost}</span>}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITIES */}
      <div className={styles.activitiesList}>
        {children}
      </div>
    </section>
  );
}
