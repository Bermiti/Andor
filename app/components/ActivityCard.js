'use client';
import { useState } from 'react';
import Image from 'next/image';
import styles from './ActivityCard.module.css';
import { MapPin, Navigation, Lightbulb, Calendar, Bookmark } from 'lucide-react';

export default function ActivityCard({
  activity,
  index,
  period,
  onSave,
}) {
  const [expanded, setExpanded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const periodColors = {
    morning: '#F59E0B',
    afternoon: '#3B82F6',
    evening: '#8B5CF6',
  };

  const photoKeyword = [
    activity?.photoKeyword,
    activity?.name,
    activity?.address,
    activity?.category || activity?.type,
  ].filter(Boolean).join(' ').trim() || 'specific travel place';
  const imageQuery = encodeURIComponent(photoKeyword);
  const photoUrl = activity?.photo || `https://source.unsplash.com/400x200/?${imageQuery}&sig=${encodeURIComponent(activity?.id || activity?.name || index)}`;
  const photoFullUrl = activity?.photo || `https://source.unsplash.com/800x300/?${imageQuery}&sig=${encodeURIComponent(`${activity?.id || activity?.name || index}-full`)}`;

  const handleExpandClick = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <div
      className={`${styles.activityCard} ${expanded ? styles.expanded : ''}`}
      onClick={() => {
        setExpanded(!expanded);
      }}
    >
      {/* COLLAPSED STATE */}
      <div className={styles.activityCollapsed}>
        {/* Sequence number badge */}
        <div
          className={styles.sequenceBadge}
          style={{ background: periodColors[period] || '#6B7280' }}
        >
          {index + 1}
        </div>

        {/* Thumbnail */}
        <div className={styles.activityThumb}>
          {!imgLoaded && <div className={styles.shimmer} />}
          <Image
            src={photoUrl}
            alt={activity?.name || 'Activity'}
            width={48}
            height={48}
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
              <span className={styles.metaPill}>⏱ {activity.duration}</span>
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
          {activity?.transportFromPrevious && (
            <div className={styles.transportHint}>
              🚃 {activity.transportFromPrevious.duration} ·
              {activity.transportFromPrevious.mode}
            </div>
          )}
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
          <Image
            src={photoFullUrl}
            alt={activity?.name || 'Activity'}
            width={800}
            height={300}
            style={{
              width: '100%',
              height: 180,
              objectFit: 'cover',
            }}
          />
          <div className={styles.photoGradientOverlay} />
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

        {/* Address */}
        {activity?.address && (
          <p className={styles.activityAddress}>
            <MapPin size={12} style={{ marginRight: 4 }} />
            {activity.address}
          </p>
        )}

        {/* Info pills row */}
        <div className={styles.infoPills}>
          {activity?.duration && (
            <span className={styles.infoPill}>⏱ {activity.duration}</span>
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
          {activity?.crowd && (
            <span
              className={`${styles.infoPill} ${styles[`crowd-${activity.crowd}`]}`}
            >
              👥{' '}
              {activity.crowd === 'low'
                ? 'Tranquilo'
                : activity.crowd === 'medium'
                  ? 'Moderado'
                  : 'Movimentado'}
            </span>
          )}
        </div>

        {/* How to get there */}
        {activity?.transportFromPrevious && (
          <div className={styles.transportCard}>
            <div className={styles.transportCardTitle}>
              <Navigation size={14} style={{ marginRight: 6 }} />
              Como Chegar
            </div>
            <div className={styles.transportCardContent}>
              {activity.transportFromPrevious.mode}
              {activity.transportFromPrevious.line && ` · ${activity.transportFromPrevious.line}`}
              <br />
              {activity.transportFromPrevious.duration} ·{' '}
              {activity.transportFromPrevious.cost === 0 ||
              activity.transportFromPrevious.cost === '0'
                ? 'Grátis'
                : ` €${activity.transportFromPrevious.cost}`}
              {activity.transportFromPrevious.directions && (
                <div className={styles.transportDirections}>
                  {activity.transportFromPrevious.directions}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Andor Secret */}
        {activity?.insiderTip && (
          <div className={styles.secretCard}>
            <div className={styles.secretTitle}>
              <Lightbulb size={14} style={{ marginRight: 6 }} />
              Segredo do Andor
            </div>
            <p className={styles.secretContent}>"{activity.insiderTip}"</p>
          </div>
        )}

        {/* Skip if */}
        {activity?.skipIf && (
          <p className={styles.skipIf}>⚠️ Salta se: {activity.skipIf}</p>
        )}

        {/* Action buttons */}
        <div className={styles.activityActions}>
          {activity?.bookingRequired && activity?.bookingUrl && (
            <a
              href={activity.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnSecondary}
            >
              <Calendar size={14} style={{ marginRight: 6 }} />
              Reservar
            </a>
          )}
          <button
            className={styles.btnSecondary}
            onClick={() => onSave && onSave(activity)}
          >
            <Bookmark size={14} style={{ marginRight: 6 }} />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
