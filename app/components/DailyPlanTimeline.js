'use client';

import { useState } from 'react';
import styles from './DailyPlanTimeline.module.css';

/**
 * PHASE 11.3: DailyPlanTimeline Component
 * Visual timeline of each day with morning/afternoon/evening periods
 */

export default function DailyPlanTimeline({ dailyPlans, destination }) {
  const [expandedDay, setExpandedDay] = useState(0);

  if (!dailyPlans || dailyPlans.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>PL</div>
        <p>Planos diários a carregar...</p>
      </div>
    );
  }

  const renderPeriod = (period) => {
    if (!period) return null;

    return (
      <div className={styles.periodBlock}>
        {period.title && (
          <div className={styles.periodTitle}>{period.title}</div>
        )}
        {period.description && (
          <p className={styles.periodDescription}>{period.description}</p>
        )}
        {period.activities && period.activities.length > 0 && (
          <ul className={styles.activitiesList}>
            {period.activities.map((activity, idx) => (
              <li key={idx}>{activity}</li>
            ))}
          </ul>
        )}
        {period.duration && (
          <div className={styles.duration}>{period.duration}</div>
        )}
        {period.neighborhood && (
          <div className={styles.location}>{period.neighborhood}</div>
        )}
        {period.tips && (
          <div className={styles.tips}>Nota: {period.tips}</div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.section}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          Plano Diário
        </h2>
        <p className={styles.subtitle}>Itinerário completo dia a dia</p>
      </div>

      {/* Days Timeline */}
      <div className={styles.timeline}>
        {dailyPlans.map((day, dayIdx) => (
          <div
            key={dayIdx}
            className={`${styles.dayCard} ${expandedDay === dayIdx ? styles.expanded : ''}`}
          >
            {/* Day Header */}
            <button
              className={styles.dayHeader}
              onClick={() => setExpandedDay(expandedDay === dayIdx ? -1 : dayIdx)}
              aria-expanded={expandedDay === dayIdx}
            >
              <div className={styles.dayNumber}>Dia {dayIdx + 1}</div>
              <div className={styles.dayTitle}>{day.title || day.date}</div>
              <div className={styles.toggleIcon}>
                {expandedDay === dayIdx ? '−' : '+'}
              </div>
            </button>

            {/* Day Content */}
            {expandedDay === dayIdx && (
              <div className={styles.dayContent}>
                {/* Morning */}
                {(day.morning || day.periods?.morning) && (
                  <div className={styles.period}>
                    <div className={styles.periodHeader}>
                      <span className={styles.periodIcon}>AM</span>
                      <span className={styles.periodLabel}>Manhã</span>
                    </div>
                    {renderPeriod(day.morning || day.periods?.morning)}
                  </div>
                )}

                {/* Afternoon */}
                {(day.afternoon || day.periods?.afternoon) && (
                  <div className={styles.period}>
                    <div className={styles.periodHeader}>
                      <span className={styles.periodIcon}>PM</span>
                      <span className={styles.periodLabel}>Tarde</span>
                    </div>
                    {renderPeriod(day.afternoon || day.periods?.afternoon)}
                  </div>
                )}

                {/* Evening */}
                {(day.evening || day.periods?.evening) && (
                  <div className={styles.period}>
                    <div className={styles.periodHeader}>
                      <span className={styles.periodIcon}>EV</span>
                      <span className={styles.periodLabel}>Noite</span>
                    </div>
                    {renderPeriod(day.evening || day.periods?.evening)}
                  </div>
                )}

                {/* Day Summary */}
                {day.summary && (
                  <div className={styles.daySummary}>
                    <strong>Resumo:</strong> {day.summary}
                  </div>
                )}

                {/* Weather or Special Notes */}
                {day.notes && (
                  <div className={styles.dayNotes}>
                    {day.notes}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overall Itinerary Summary */}
      {dailyPlans.length > 0 && (
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryIcon}>TR</span>
            <span className={styles.summaryText}>
              {dailyPlans.length} dias em {destination}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
