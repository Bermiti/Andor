'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import styles from './TripHistory.module.css';
import { useTranslations } from '../context/LanguageContext';

const COUNTRY_NAMES = {
  argentina: '032',
  australia: '036',
  austria: '040',
  belgium: '056',
  brazil: '076',
  canada: '124',
  chile: '152',
  china: '156',
  colombia: '170',
  croatia: '191',
  czech: '203',
  denmark: '208',
  egypt: '818',
  finland: '246',
  france: '250',
  germany: '276',
  greece: '300',
  iceland: '352',
  india: '356',
  indonesia: '360',
  ireland: '372',
  italy: '380',
  japan: '392',
  kenya: '404',
  malaysia: '458',
  mexico: '484',
  morocco: '504',
  netherlands: '528',
  norway: '578',
  peru: '604',
  philippines: '608',
  poland: '616',
  portugal: '620',
  qatar: '634',
  romania: '642',
  singapore: '702',
  'south africa': '710',
  'south korea': '410',
  spain: '724',
  sweden: '752',
  switzerland: '756',
  thailand: '764',
  turkey: '792',
  uae: '784',
  'united arab emirates': '784',
  uk: '826',
  'united kingdom': '826',
  usa: '840',
  'united states': '840',
  vietnam: '704',
  azores: '620',
  lisbon: '620',
  lisboa: '620',
  porto: '620',
  barcelona: '724',
  madrid: '724',
  paris: '250',
  london: '826',
  rome: '380',
  roma: '380',
  berlin: '276',
  tokyo: '392',
  tóquio: '392',
  kyoto: '392',
  bangkok: '764',
  bali: '360',
  'new york': '840',
  nyc: '840',
};

function getCountryCodeFromDestination(destination) {
  if (!destination) return null;
  const lower = destination.toLowerCase();
  for (const [name, code] of Object.entries(COUNTRY_NAMES)) {
    if (lower.includes(name)) return code;
  }
  return null;
}

function TripCard({ trip, t }) {
  const viewHref = trip.viewHref || (trip.id ? `/itinerary/${trip.id}` : null);
  const daysCount = Array.isArray(trip.days) ? trip.days.length : trip.daysCount;
  const stopsLabel = (n) => `${n} ${t('stops')}`;
  const daysLabel = (n) => `${n} ${n === 1 ? t('day') : t('days')}`;

  return (
    <article className={styles.tripCard}>
      <div className={styles.tripCardHeader}>
        <div className={styles.tripDestination}>
          <span className={styles.destIcon} aria-hidden="true">•</span>
          <div>
            <h3 className={styles.destName}>{trip.destination || trip.title || 'Viagem'}</h3>
            {trip.savedAt && (
              <span className={styles.destDate}>
                {new Date(trip.savedAt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
        <div className={styles.tripMeta}>
          {daysCount ? (
            <span className={styles.metaTag}>📅 {daysLabel(daysCount)}</span>
          ) : null}
          {trip.totalCost ? <span className={styles.metaTag}>💰 {trip.totalCost}</span> : null}
          {trip.style ? <span className={styles.metaTag}>🎯 {trip.style}</span> : null}
        </div>
      </div>

      {trip.tripOverview && <p className={styles.tripOverview}>{trip.tripOverview}</p>}

      {Array.isArray(trip.days) && trip.days.length > 0 && (
        <div className={styles.daysList}>
          {trip.days.slice(0, 4).map((day, dayIndex) => (
            <details key={`${trip.id || trip.destination}-${dayIndex}`} className={styles.dayAccordion}>
              <summary className={styles.daySummary}>
                <span className={styles.dayDot}></span>
                <span className={styles.dayTitle}>{day.title || `${t('day')} ${dayIndex + 1}`}</span>
                <span className={styles.dayStopCount}>{stopsLabel(day.stops?.length || 0)}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.chevron}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>
              <div className={styles.dayContent}>
                {day.stops?.slice(0, 6).map((stop, stopIndex) => (
                  <div key={`${stop.name || stopIndex}-${stopIndex}`} className={styles.stop}>
                    <span className={styles.stopTime}>{stop.time || '--:--'}</span>
                    <div className={styles.stopLine}></div>
                    <div className={styles.stopInfo}>
                      <span className={styles.stopName}>{stop.name}</span>
                      <span className={styles.stopType}>{stop.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      {viewHref && (
        <div className={styles.tripActions}>
          <Link href={viewHref} className={styles.viewBtn}>
            {t('viewFullItinerary')}
          </Link>
        </div>
      )}
    </article>
  );
}

export default function TripHistory({ trips = [], visitedCountries = [] }) {
  const t = useTranslations('myTrips');

  const { completed, planned } = useMemo(() => {
    const grouped = { completed: [], planned: [] };

    trips.forEach((trip) => {
      const code = getCountryCodeFromDestination(trip.destination);
      if (code && visitedCountries.includes(code)) {
        grouped.completed.push(trip);
      } else {
        grouped.planned.push(trip);
      }
    });

    return grouped;
  }, [trips, visitedCountries]);

  if (trips.length === 0) {
    return (
      <section className={styles.section} id="journey-history">
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.badge}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.badgeIcon}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              {t('journalBadge')}
            </span>
            <h2 className={styles.title}>{t('journalTitle')}</h2>
            <p className={styles.subtitle}>{t('journalSubtitle')}</p>
          </div>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <MapPin size={48} strokeWidth={1.5} color="var(--gold)" />
          </div>
          <h3 className={styles.emptyTitle}>{t('noItineraries')}</h3>
          <p className={styles.emptyText}>
            {t('noItinerariesText')}
          </p>
          <Link href="/itineraries" className={styles.emptyAction}>
            Criar primeira viagem
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section} id="journey-history">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.badge}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.badgeIcon}>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            {t('journalBadge')}
          </span>
          <h2 className={styles.title}>{t('journalTitle')}</h2>
          <p className={styles.subtitle}>{t('journalSubtitle')}</p>
        </div>
      </div>

      <div className={styles.columns}>
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <span className={styles.columnIcon} aria-hidden="true">✓</span>
            <h3 className={styles.columnTitle}>{t('completed')}</h3>
            <span className={styles.columnCount}>{completed.length}</span>
          </div>
          <p className={styles.columnDesc}>{t('completedDesc')}</p>

          {completed.length === 0 ? (
            <div className={styles.columnEmpty}>
              <p>{t('completedEmpty')}</p>
            </div>
          ) : (
            <div className={styles.tripList}>
              {completed.map((trip, i) => (
                <TripCard key={trip.id || trip.destination || i} trip={trip} t={t} />
              ))}
            </div>
          )}
        </div>

        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <span className={styles.columnIcon} aria-hidden="true">→</span>
            <h3 className={styles.columnTitle}>{t('planned')}</h3>
            <span className={styles.columnCount}>{planned.length}</span>
          </div>
          <p className={styles.columnDesc}>{t('plannedDesc')}</p>

          {planned.length === 0 ? (
            <div className={styles.columnEmpty}>
              <p>{t('plannedEmpty')}</p>
            </div>
          ) : (
            <div className={styles.tripList}>
              {planned.map((trip, i) => (
                <TripCard key={trip.id || trip.destination || i} trip={trip} t={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
