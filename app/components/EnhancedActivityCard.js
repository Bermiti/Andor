'use client';

import { useEffect, useState } from 'react';
import styles from './EnhancedActivityCard.module.css';
import { MapPin, Navigation, Lightbulb, Calendar, Bookmark, Clock, Users, AlertCircle, Copy, CheckCircle2, StickyNote } from 'lucide-react';

const VERIFIED_LOCATION_SOURCES = new Set(['nominatim', 'curated']);
const AUTHORITATIVE_RATING_SOURCES = new Set([
  'booking',
  'booking.com',
  'foursquare',
  'google',
  'google places',
  'google_places',
  'tripadvisor',
  'yelp',
]);

function normalizeSource(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function formatSourceLabel(value) {
  return String(value || '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getSourcedRating(activity) {
  const rawRating = activity?.rating;
  const rating = typeof rawRating === 'number'
    ? rawRating
    : Number.parseFloat(String(rawRating || '').replace(',', '.'));
  const rawSource = activity?.ratingSource || activity?.reviewSource;
  const source = normalizeSource(rawSource);

  if (!Number.isFinite(rating) || rating <= 0 || rating > 10) return null;
  if (!AUTHORITATIVE_RATING_SOURCES.has(source)) return null;

  return {
    value: String(rawRating).trim().replace(',', '.'),
    source: formatSourceLabel(rawSource),
  };
}

function currencyLabel(currency) {
  if (typeof currency === 'string') return currency.trim();
  return String(currency?.symbol || currency?.code || '').trim();
}

function formatCost(value, currency) {
  if (value === null || value === undefined || value === '') return null;
  if (value === 0 || value === '0') return 'Grátis';
  if (typeof value === 'string' && /^(free|gr[aá]tis)$/i.test(value.trim())) return 'Grátis';
  if (typeof value === 'number') {
    const label = currencyLabel(currency);
    return Number.isFinite(value) && label ? `${label} ${value}` : null;
  }
  return String(value).trim() || null;
}

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
  onSave,
  onBook,
  onCopy,
  onUpdate,
  isSaved = false,
  isExpanded = false,
  onToggle,
  isDayHighlight = false,
}) {
  const [localExpanded, setLocalExpanded] = useState(false);
  const expanded = onToggle ? isExpanded : localExpanded;
  const setExpanded = onToggle ? onToggle : setLocalExpanded;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [noteDraft, setNoteDraft] = useState(activity?.userNotes || '');

  useEffect(() => {
    setNoteDraft(activity?.userNotes || '');
  }, [activity?.id, activity?.userNotes]);

  const periodColors = {
    morning: '#F59E0B',
    afternoon: '#3B82F6',
    evening: '#8B5CF6',
  };

  const hasVerifiedLocation = VERIFIED_LOCATION_SOURCES.has(normalizeSource(activity?.coordinateSource));
  const sourcedRating = getSourcedRating(activity);
  const costDisplay = formatCost(activity?.cost, activity?.currency);
  const transportCostDisplay = formatCost(
    activity?.transportFromPrevious?.cost,
    activity?.transportFromPrevious?.currency || activity?.currency
  );

  const buildImageQuery = () => {
    const raw = [
      activity?.photoKeyword,
      activity?.name,
      activity?.address,
      activity?.category || activity?.type,
    ].filter(Boolean).join(' ');
    const query = raw.trim() || 'specific travel place';
    return encodeURIComponent(query);
  };
  
  // Choose photo: enriched API image, custom photo, or destination/place-specific image search fallback.
  const imageQuery = buildImageQuery();
  const photoUrl = activity?.photo || `https://source.unsplash.com/500x300/?${imageQuery}&sig=${encodeURIComponent(activity?.id || activity?.name || index)}`;
  const photoFullUrl = activity?.photo || `https://source.unsplash.com/800x400/?${imageQuery}&sig=${encodeURIComponent(`${activity?.id || activity?.name || index}-full`)}`;

  const handleExpandClick = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  // Energy level indicator
  const getEnergyLevel = (act) => {
    const energyRequired = Number(act?.energyRequired);
    if (!Number.isFinite(energyRequired)) return null;
    if (energyRequired >= 75) return { label: 'Muito intenso', color: '#EF4444', icon: '⚡' };
    if (energyRequired >= 50) return { label: 'Activo', color: '#F59E0B', icon: '✨' };
    if (energyRequired >= 25) return { label: 'Moderado', color: '#3B82F6', icon: '😌' };
    return { label: 'Relaxado', color: '#8B5CF6', icon: '☕' };
  };

  const energy = getEnergyLevel(activity);

  // Crowd level
  const getCrowdLevel = (act) => {
    const crowd = act?.crowd || act?.crowdLevel;
    if (!crowd) return null;
    const c = String(crowd).toLowerCase();
    if (c.includes('low') || c.includes('baix')) return { label: 'Tranquilo', color: '#10B981' };
    if (c.includes('high') || c.includes('alt') || c.includes('muito')) return { label: 'Muito movimentado', color: '#EF4444' };
    return { label: 'Moderado', color: '#F59E0B' };
  };

  const crowd = getCrowdLevel(activity);
  const practicalDetails = [
    activity?.bestTime && { label: 'Melhor hora', value: activity.bestTime },
    (typeof activity?.bookingRequired === 'boolean' || activity?.bookingTip) && {
      label: 'Reserva',
      value: activity?.bookingRequired
        ? activity?.bookingTip || 'Recomendada antes de fechar o resto do dia.'
        : 'Nao obrigatoria; confirma horarios antes de sair.',
    },
    activity?.backupOption && { label: 'Plano B', value: activity.backupOption },
    activity?.practicalNote && { label: 'Nota pratica', value: activity.practicalNote },
  ].filter(Boolean);

  return (
    <div
      className={`${styles.activityCard} ${expanded ? styles.expanded : ''} ${isDayHighlight ? styles.highlight : ''}`}
      data-testid="activity-card"
      onClick={() => {
        setExpanded(!expanded);
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
            {['booked', 'confirmed'].includes(activity?.planningStatus) && (
              <span className={styles.confirmedMark} title="Atividade confirmada"><CheckCircle2 size={14} aria-hidden="true" /></span>
            )}
          </div>
          <div className={styles.activityMeta}>
            {activity?.duration && (
              <span className={styles.metaPill}>⏱️ {activity.duration}</span>
            )}
            {costDisplay && (
              <span className={styles.metaPill}>Custo estimado: {costDisplay}</span>
            )}
            {sourcedRating && (
              <span className={styles.metaPill}>⭐ {sourcedRating.value} ({sourcedRating.source})</span>
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
      {expanded && (
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
            <div
              className={styles.sourceTag}
              style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6 }}
            >
              {hasVerifiedLocation && (
                <span className={styles.tagReal}>Localização verificada</span>
              )}
              <span className={styles.tagEstimated}>Detalhes estimados</span>
            </div>
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

          {/* DESCRIPTION */}
          {activity?.description && (
            <div className={styles.descriptionSection}>
              <p className={styles.descriptionText}>{activity.description}</p>
              {activity?.wikipediaUrl && (
                <a
                  href={activity.wikipediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.wikiLink}
                >
                  Ler mais na Wikipedia →
                </a>
              )}
            </div>
          )}

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
            {costDisplay && (
              <span className={styles.infoPill}>Custo estimado: {costDisplay}</span>
            )}
            {sourcedRating && (
              <span className={styles.infoPill}>⭐ {sourcedRating.value} ({sourcedRating.source})</span>
            )}
            {crowd && (
              <span
                className={styles.infoPill}
                style={{ color: crowd.color, borderColor: crowd.color }}
              >
                <Users size={12} />
                {crowd.label}
              </span>
            )}
            {energy && (
              <span
                className={styles.infoPill}
                style={{ color: energy.color }}
              >
                {energy.icon} {energy.label}
              </span>
            )}
            {activity?.hours && (
              <span className={styles.infoPill}>
                🕐 {activity.hours}
              </span>
            )}
          </div>

          {practicalDetails.length > 0 && (
            <div className={styles.plannerNotes}>
              {practicalDetails.map((detail) => (
                <div key={detail.label} className={styles.plannerNote}>
                  <div className={styles.plannerNoteLabel}>
                    <AlertCircle size={12} />
                    {detail.label}
                  </div>
                  <p>{detail.value}</p>
                </div>
              ))}
            </div>
          )}

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
                  {transportCostDisplay && <span>Custo estimado: {transportCostDisplay}</span>}
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

          <div className={styles.activityPlanning} onClick={(event) => event.stopPropagation()}>
            <div className={styles.planningField}>
              <label htmlFor={`activity-status-${activity?.id || index}`}>Estado</label>
              <select
                id={`activity-status-${activity?.id || index}`}
                value={activity?.planningStatus || 'pending'}
                onChange={(event) => onUpdate?.({ planningStatus: event.target.value })}
              >
                <option value="pending">Pendente</option>
                <option value="booked">Reservado</option>
                <option value="confirmed">Confirmado</option>
                <option value="not_needed">Não é necessário</option>
              </select>
            </div>
            <div className={styles.planningField}>
              <label htmlFor={`activity-note-${activity?.id || index}`}><StickyNote size={13} aria-hidden="true" /> Nota pessoal</label>
              <textarea
                id={`activity-note-${activity?.id || index}`}
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                onBlur={() => onUpdate?.({ userNotes: noteDraft.trim() })}
                placeholder="Horário confirmado, ponto de encontro, preferência..."
                rows={2}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className={styles.activityActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={(e) => {
                e.stopPropagation();
                if (onCopy) onCopy(activity);
              }}
            >
              <Copy size={14} />
              Copiar
            </button>

            <button
              type="button"
              className={styles.btnSecondary}
              onClick={(e) => {
                e.stopPropagation();
                if (onBook) onBook(activity);
              }}
              data-testid="booking-button"
            >
              <Calendar size={14} />
              Reservar
            </button>

            <button
              type="button"
              className={`${styles.btnSecondary} ${isSaved ? styles.btnSaved : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (onSave) onSave(activity);
              }}
            >
              <Bookmark size={14} />
              {isSaved ? 'Guardado' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
