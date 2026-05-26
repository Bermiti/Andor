'use client';
import { useState } from 'react';
import styles from './EnhancedActivityCard.module.css';
import { MapPin, Navigation, Lightbulb, Calendar, Bookmark, Map, Clock, Users, Cloud, AlertCircle } from 'lucide-react';

/**
 * ENHANCED ACTIVITY CARD
 * 
 * Elevates activities from functional to inspiring:
 * - Large hero photo
 * - Rich context about WHY this matters
 * - Clear practical information
 * - Local insider tips
 * - Transport & logistics
 * - Energy & crowd indicators
 * - Weather & alternatives
 * - Booking & saving
 */

export default function EnhancedActivityCard({
  activity,
  index,
  period,
  onMapFocus,
  onSave,
  isDayHighlight = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const periodColors = {
    morning: '#F59E0B',
    afternoon: '#3B82F6',
    evening: '#8B5CF6',
  };

  const photoKeyword = activity?.photoKeyword || activity?.type || 'travel';
  const photoUrl = `https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=500&h=300&auto=format&fit=crop&q=80`;
  const photoFullUrl = `https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=800&h=400&auto=format&fit=crop&q=80`;

  const handleExpandClick = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
    if (!expanded && onMapFocus && activity?.coordinates) {
      onMapFocus(activity.coordinates);
    }
  };

  // Energy level indicator
  const getEnergyLevel = (activity) => {
    const energyRequired = activity.energyRequired || 50;
    if (energyRequired >= 75) return { label: 'Muito intenso', color: '#EF4444', icon: '⚡' };
    if (energyRequired >= 50) return { label: 'Activo', color: '#F59E0B', icon: '✨' };
    if (energyRequired >= 25) return { label: 'Moderado', color: '#3B82F6', icon: '😌' };
    return { label: 'Relaxado', color: '#8B5CF6', icon: '☕' };
  };

  const energy = getEnergyLevel(activity);

  // Crowd level
  const getCrowdLevel = (activity) => {
    const crowd = activity.crowd || 'medium';
    if (crowd === 'low') return { label: 'Tranquilo', color: '#10B981' };
    if (crowd === 'high') return { label: 'Muito movimentado', color: '#EF4444' };
    return { label: 'Moderado', color: '#F59E0B' };
  };

  const crowd = getCrowdLevel(activity);

  return (
    <div
      className={`${styles.activityCard} ${expanded ? styles.expanded : ''} ${isDayHighlight ? styles.highlight : ''}`}
      onClick={() => {
        setExpanded(!expanded);
        if (!expanded && onMapFocus && activity?.coordinates) {
          onMapFocus(activity.coordinates);
        }
      }}
    >
      {/* COLLAPSED STATE */}
      <div className={styles.activityCollapsed}>
        {/* Sequence badge */}
        <div
          className={styles.sequenceBadge}
          style={{ background: periodColors[period] || '#6B7280' }}
        >
          {index + 1}
        </div>

        {/* Thumbnail */}
        <div className={styles.activityThumb}>
          {!imgLoaded && <div className={styles.shimmer} />}
          <img
            src={photoUrl}
            alt={activity?.name || 'Activity'}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            style={{
              opacity: imgLoaded ? 1 : 0,
              transition: 'opacity 200ms',
              objectFit: 'cover',
              borderRadius: 8,
              width: '100%',
              height: '100%',
            }}
          />
        </div>

        {/* Content */}
        <div className={styles.activityInfo}>
          <div className={styles.activityName}>
            {activity?.emoji || '📍'} {activity?.name || 'Activity'}
          </div>
          <div className={styles.activityMeta}>
            {activity?.duration && (
              <span className={styles.metaPill}>⏱️ {activity.duration}</span>
            )}
            <span className={styles.metaPill}>
              💰{' '}
              {activity?.cost === 0 || activity?.cost === '0'
                ? 'Grátis'
                : `€${activity.cost || 0}`}
            </span>
            {activity?.rating && (
              <span className={styles.metaPill}>⭐ {activity.rating}</span>
            )}
          </div>
        </div>

        {/* Expand button */}
        <button
          className={styles.expandBtn}
          aria-label={expanded ? 'Colapsar actividade' : 'Expandir actividade'}
          onClick={handleExpandClick}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 300ms',
            }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>

      {/* EXPANDED STATE */}
      <div className={styles.activityExpandedContent}>
        {/* Full photo */}
        <div className={styles.activityFullPhoto}>
          <img
            src={photoFullUrl}
            alt={activity?.name || 'Activity'}
            loading="lazy"
            style={{
              width: '100%',
              height: 200,
              objectFit: 'cover',
            }}
          />
          <div className={styles.photoGradient} />
          {isDayHighlight && (
            <div className={styles.highlightBadge}>⭐ Destaque do dia</div>
          )}
        </div>

        {/* Activity title in expanded */}
        <div className={styles.expandedHeader}>
          <h3 className={styles.activityHeading}>
            {activity?.emoji || '📍'} {activity?.name || 'Activity'}
          </h3>
          {activity?.type && (
            <span className={styles.typeTag}>{activity.type}</span>
          )}
        </div>

        {/* WHY THIS MATTERS */}
        {activity?.whyMatters && (
          <div className={styles.whyMatters}>
            <div className={styles.whyMatterTitle}>
              <Lightbulb size={14} />
              Por que é importante
            </div>
            <p className={styles.whyMatterText}>{activity.whyMatters}</p>
          </div>
        )}

        {/* Address & Location */}
        {activity?.address && (
          <p className={styles.activityAddress}>
            <MapPin size={12} style={{ marginRight: 6 }} />
            {activity.address}
          </p>
        )}

        {/* Quick Info Pills */}
        <div className={styles.infoPills}>
          {activity?.duration && (
            <span className={styles.infoPill}>
              <Clock size={12} />
              {activity.duration}
            </span>
          )}
          <span className={styles.infoPill}>
            💰{' '}
            {activity?.cost === 0 || activity?.cost === '0'
              ? 'Grátis'
              : `€${activity.cost || 0}`}
          </span>
          <span className={styles.infoPill}>
            ⭐ {activity?.rating || '4.8'}
          </span>
          <span
            className={styles.infoPill}
            style={{ color: crowd.color, borderColor: crowd.color }}
          >
            <Users size={12} />
            {crowd.label}
          </span>
          <span
            className={styles.infoPill}
            style={{ color: energy.color }}
          >
            {energy.icon} {energy.label}
          </span>
        </div>

        {/* HOW TO GET THERE */}
        {activity?.transportFromPrevious && (
          <div className={styles.transportCard}>
            <div className={styles.transportCardTitle}>
              <Navigation size={14} />
              Como chegar
            </div>
            <div className={styles.transportCardContent}>
              <div className={styles.transportMode}>
                {activity.transportFromPrevious.mode}
                {activity.transportFromPrevious.line && ` • ${activity.transportFromPrevious.line}`}
              </div>
              <div className={styles.transportMeta}>
                <span>{activity.transportFromPrevious.duration}</span>
                <span>
                  {activity.transportFromPrevious.cost === 0 ||
                  activity.transportFromPrevious.cost === '0'
                    ? 'Grátis'
                    : `€${activity.transportFromPrevious.cost}`}
                </span>
              </div>
              {activity.transportFromPrevious.directions && (
                <div className={styles.transportDirections}>
                  {activity.transportFromPrevious.directions}
                </div>
              )}
            </div>
          </div>
        )}

        {/* INSIDER TIP */}
        {activity?.insiderTip && (
          <div className={styles.secretCard}>
            <div className={styles.secretTitle}>
              <Lightbulb size={14} />
              Dica do Andor
            </div>
            <p className={styles.secretContent}>"{activity.insiderTip}"</p>
          </div>
        )}

        {/* CROWD TIMING */}
        {activity?.crowdPeakTime && (
          <div className={styles.crowdCard}>
            <div className={styles.crowdTitle}>
              <Users size={14} />
              Melhor altura para visitar
            </div>
            <p className={styles.crowdContent}>
              Muito movimentado entre {activity.crowdPeakTime}. Chegue mais cedo ou mais tarde para evitar multidões.
            </p>
          </div>
        )}

        {/* WEATHER CONCERNS */}
        {activity?.weatherConcern === 'rainy_risky' && (
          <div className={styles.warningCard}>
            <div className={styles.warningTitle}>
              <Cloud size={14} />
              Cuidado com chuva
            </div>
            <p className={styles.warningContent}>
              Esta atividade é outdoor. Verifique a previsão antes de ir.
            </p>
          </div>
        )}

        {/* RAIN ALTERNATIVES */}
        {activity?.rainAlternative && (
          <div className={styles.alternativeCard}>
            <div className={styles.alternativeTitle}>
              <AlertCircle size={14} />
              Se chover, considere
            </div>
            <div className={styles.alternativeContent}>
              <div className={styles.altName}>{activity.rainAlternative.name}</div>
              <div className={styles.altMeta}>
                {activity.rainAlternative.type} • {activity.rainAlternative.duration}
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className={styles.activityActions}>
          {activity?.coordinates && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${activity.coordinates[0]},${activity.coordinates[1]}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.btnSecondary}`}
            >
              <Map size={14} />
              Ver no Mapa
            </a>
          )}
          {activity?.bookingRequired && activity?.bookingUrl && (
            <a
              href={activity.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnSecondary}
            >
              <Calendar size={14} />
              Reservar
            </a>
          )}
          <button
            className={styles.btnSecondary}
            onClick={() => onSave && onSave(activity)}
          >
            <Bookmark size={14} />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
