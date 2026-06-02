'use client';
import { useState } from 'react';
import Image from 'next/image';
import styles from './PremiumDayCard.module.css';
import { ChevronDown, Zap, Cloud, TrendingUp } from 'lucide-react';

/**
 * PREMIUM DAY CARD
 * 
 * Transforms the day view into something truly premium:
 * - Hero image with Ken Burns effect
 * - Day theme prominent and beautiful
 * - Energy curve visualization
 * - Quick stats without clutter
 * - Time period breakdown (morning/afternoon/evening)
 * - Day highlights
 * - Smooth expansion to reveal activities
 */

export default function PremiumDayCard({
  day,
  dayIndex,
  isExpanded,
  onToggle,
  dayImage,
  energyData = [],
  highlights = [],
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!day) return null;

  // Calculate totals
  const activityCount = day.stops?.length || 0;
  const mealCount = Object.keys(day.meals || {}).length;
  const totalDuration = day.stops?.reduce((sum, s) => {
    const duration = s.duration || '0h';
    const hours = parseInt(duration) || 0;
    return sum + hours;
  }, 0) || 0;

  // Energy level (0-100)
  const avgEnergy = energyData.length > 0 
    ? Math.round(energyData.reduce((a, b) => a + b, 0) / energyData.length)
    : 75;

  // Energy label and color
  const getEnergyLabel = (level) => {
    if (level >= 80) return { label: 'Muito intenso', color: '#EF4444', icon: '⚡' };
    if (level >= 60) return { label: 'Activo', color: '#F59E0B', icon: '✨' };
    if (level >= 40) return { label: 'Moderado', color: '#3B82F6', icon: '😌' };
    return { label: 'Relaxado', color: '#8B5CF6', icon: '☕' };
  };

  const energy = getEnergyLabel(avgEnergy);

  // Period times
  const periodCount = {
    morning: day.stops?.filter(s => s.period === 'morning')?.length || 0,
    afternoon: day.stops?.filter(s => s.period === 'afternoon')?.length || 0,
    evening: day.stops?.filter(s => s.period === 'evening')?.length || 0,
  };

  return (
    <div className={`${styles.dayCard} ${isExpanded ? styles.expanded : ''}`}>
      {/* HERO IMAGE SECTION */}
      <div className={styles.heroSection}>
        {dayImage && (
          <div className={styles.heroImage}>
            {!imageLoaded && <div className={styles.shimmer} />}
            <img
              src={dayImage}
              alt={`${day.title} - Day ${dayIndex + 1}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              className={styles.image}
              style={{ opacity: imageLoaded ? 1 : 0 }}
            />
            <div className={styles.heroGradient} />
          </div>
        )}

        {/* OVERLAY CONTENT */}
        <div className={styles.heroContent}>
          <div className={styles.dayLabel}>
            <span className={styles.dayNumber}>Dia {dayIndex + 1}</span>
            <span className={styles.dayEmoji}>{day.emoji || '📍'}</span>
          </div>

          <h2 className={styles.dayTitle}>{day.title || 'Dia sem título'}</h2>

          {day.moodDescription && (
            <p className={styles.dayMood}>{day.moodDescription}</p>
          )}

          {/* DAY HIGHLIGHTS */}
          {highlights && highlights.length > 0 && (
            <div className={styles.highlights}>
              {highlights.map((h, i) => (
                <div key={i} className={styles.highlight}>
                  <span className={styles.highlightDot}>•</span>
                  <span className={styles.highlightText}>{h}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TOGGLE BUTTON */}
        <button
          className={styles.toggleButton}
          onClick={() => onToggle?.()}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Colapsar dia' : 'Expandir dia'}
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {/* QUICK STATS BAR */}
      <div className={styles.statsBar}>
        {/* Activities */}
        <div className={styles.stat}>
          <div className={styles.statIcon}>📍</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{activityCount}</div>
            <div className={styles.statLabel}>
              {activityCount === 1 ? 'atividade' : 'atividades'}
            </div>
          </div>
        </div>

        {/* Meals */}
        {mealCount > 0 && (
          <div className={styles.stat}>
            <div className={styles.statIcon}>🍽️</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{mealCount}</div>
              <div className={styles.statLabel}>
                {mealCount === 1 ? 'refeição' : 'refeições'}
              </div>
            </div>
          </div>
        )}

        {/* Duration */}
        <div className={styles.stat}>
          <div className={styles.statIcon}>⏱️</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{totalDuration}h</div>
            <div className={styles.statLabel}>em atividades</div>
          </div>
        </div>

        {/* Energy Level */}
        <div className={styles.stat}>
          <div className={styles.statIcon}>{energy.icon}</div>
          <div className={styles.statContent}>
            <div className={styles.statValue} style={{ color: energy.color }}>
              {energy.label}
            </div>
            <div className={styles.statLabel}>nível de energia</div>
          </div>
        </div>
      </div>

      {/* ENERGY VISUALIZATION */}
      {energyData.length > 0 && (
        <div className={styles.energyVisualization}>
          <div className={styles.energyLabel}>Energia durante o dia</div>
          <div className={styles.energyChart}>
            {energyData.map((level, i) => (
              <div
                key={i}
                className={styles.energyBar}
                style={{
                  height: `${Math.max(20, level)}%`,
                  backgroundColor:
                    level >= 70
                      ? '#F59E0B'
                      : level >= 50
                      ? '#3B82F6'
                      : level >= 30
                      ? '#8B5CF6'
                      : '#EF4444',
                }}
                title={`${level}% energia`}
              />
            ))}
          </div>
          <div className={styles.energyMeta}>
            <span>Manhã</span>
            <span>Tarde</span>
            <span>Noite</span>
          </div>
        </div>
      )}

      {/* PERIOD BREAKDOWN */}
      {isExpanded && (
        <div className={styles.periodBreakdown}>
          {periodCount.morning > 0 && (
            <div className={styles.periodItem} style={{ borderLeftColor: '#F59E0B' }}>
              <div className={styles.periodIcon}>🌅</div>
              <div className={styles.periodInfo}>
                <div className={styles.periodTitle}>Manhã</div>
                <div className={styles.periodCount}>
                  {periodCount.morning} {periodCount.morning === 1 ? 'atividade' : 'atividades'}
                </div>
              </div>
            </div>
          )}
          {periodCount.afternoon > 0 && (
            <div className={styles.periodItem} style={{ borderLeftColor: '#3B82F6' }}>
              <div className={styles.periodIcon}>☀️</div>
              <div className={styles.periodInfo}>
                <div className={styles.periodTitle}>Tarde</div>
                <div className={styles.periodCount}>
                  {periodCount.afternoon} {periodCount.afternoon === 1 ? 'atividade' : 'atividades'}
                </div>
              </div>
            </div>
          )}
          {periodCount.evening > 0 && (
            <div className={styles.periodItem} style={{ borderLeftColor: '#8B5CF6' }}>
              <div className={styles.periodIcon}>🌙</div>
              <div className={styles.periodInfo}>
                <div className={styles.periodTitle}>Noite</div>
                <div className={styles.periodCount}>
                  {periodCount.evening} {periodCount.evening === 1 ? 'atividade' : 'atividades'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
