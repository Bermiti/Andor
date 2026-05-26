'use client';
import styles from './DayHeader.module.css';

export default function DayHeader({ day, dayNumber, totalDays, moodDescription }) {
  return (
    <div className={styles.dayHeader}>
      {/* Progress section */}
      <div className={styles.dayProgress}>
        <span className={styles.textLabel}>Dia {dayNumber} de {totalDays}</span>
        <div className={styles.progressDots}>
          {Array.from({ length: totalDays }, (_, i) => (
            <div
              key={i}
              className={`${styles.dot} ${i < dayNumber ? styles.filled : ''} ${i === dayNumber - 1 ? styles.active : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Day emoji + title */}
      <div className={styles.dayTitleArea}>
        <span className={styles.dayEmoji}>{day?.emoji || '📍'}</span>
        <h2 className={styles.dayTitle}>{day?.title || `Dia ${dayNumber}`}</h2>
      </div>

      {/* Mood description */}
      {(moodDescription || day?.mood) && (
        <p className={styles.dayMood}>
          {moodDescription || day.mood}
        </p>
      )}

      {/* Quick stats row */}
      {(day?.weather || day?.budgetEstimate || day?.transport) && (
        <div className={styles.dayStatsRow}>
          {day?.weather && (
            <span className={styles.stat}>
              ⛅ {day.weather.avgTemp}° · {day.weather.condition}
            </span>
          )}
          {day?.budgetEstimate && (
            <span className={styles.stat}>
              💰 ~€{day.budgetEstimate} estimado
            </span>
          )}
          {day?.transport?.mainMode && (
            <span className={styles.stat}>
              🚃 {day.transport.mainMode}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
