'use client';
import styles from './PeriodHeader.module.css';

const periodMeta = {
  morning: { label: 'MANHÃ', emoji: '🌅', color: '#F59E0B' },
  afternoon: { label: 'TARDE', emoji: '☀️', color: '#3B82F6' },
  evening: { label: 'NOITE', emoji: '🌙', color: '#8B5CF6' },
};

export default function PeriodHeader({ period, timeRange }) {
  const meta = periodMeta[period] || { label: period.toUpperCase(), emoji: '🕐', color: '#6B7280' };

  return (
    <div className={`${styles.periodHeader} ${styles[`period-${period}`]}`}>
      <div className={styles.periodLine} />
      <div className={styles.periodContent}>
        <span className={styles.periodEmoji}>{meta.emoji}</span>
        <span className={styles.periodLabel}>{meta.label}</span>
        {timeRange && <span className={styles.periodTime}>{timeRange}</span>}
      </div>
      <div className={styles.periodLine} />
    </div>
  );
}
