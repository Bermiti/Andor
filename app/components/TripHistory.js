'use client';
import { useMemo } from 'react';
import styles from './TripHistory.module.css';
import { useTranslations } from '../context/LanguageContext';

// Country name to code mapping (subset for matching trip destinations)
const COUNTRY_NAMES = {
  'afghanistan': '004', 'albania': '008', 'algeria': '012', 'angola': '024',
  'argentina': '032', 'armenia': '051', 'australia': '036', 'austria': '040',
  'azerbaijan': '031', 'bahamas': '044', 'bangladesh': '050', 'belarus': '112',
  'belgium': '056', 'belize': '084', 'benin': '204', 'bhutan': '064',
  'bolivia': '068', 'bosnia': '070', 'botswana': '072', 'brazil': '076',
  'brunei': '096', 'bulgaria': '100', 'cambodia': '116', 'cameroon': '120',
  'canada': '124', 'chad': '148', 'chile': '152', 'china': '156',
  'colombia': '170', 'congo': '178', 'costa rica': '188', 'croatia': '191',
  'cuba': '192', 'cyprus': '196', 'czech': '203', 'denmark': '208',
  'ecuador': '218', 'egypt': '818', 'el salvador': '222', 'eritrea': '232',
  'estonia': '233', 'ethiopia': '231', 'fiji': '242', 'finland': '246',
  'france': '250', 'gabon': '266', 'georgia': '268', 'germany': '276',
  'ghana': '288', 'greece': '300', 'guatemala': '320', 'guinea': '324',
  'guyana': '328', 'haiti': '332', 'honduras': '340', 'hungary': '348',
  'iceland': '352', 'india': '356', 'indonesia': '360', 'iran': '364',
  'iraq': '368', 'ireland': '372', 'israel': '376', 'italy': '380',
  'jamaica': '388', 'japan': '392', 'jordan': '400', 'kazakhstan': '398',
  'kenya': '404', 'kuwait': '414', 'laos': '418', 'latvia': '428',
  'lebanon': '422', 'libya': '434', 'lithuania': '440', 'luxembourg': '442',
  'madagascar': '450', 'malaysia': '458', 'mali': '466', 'mexico': '484',
  'moldova': '498', 'mongolia': '496', 'montenegro': '499', 'morocco': '504',
  'mozambique': '508', 'myanmar': '104', 'namibia': '516', 'nepal': '524',
  'netherlands': '528', 'new zealand': '554', 'nicaragua': '558', 'niger': '562',
  'nigeria': '566', 'norway': '578', 'oman': '512', 'pakistan': '586',
  'panama': '591', 'paraguay': '600', 'peru': '604', 'philippines': '608',
  'poland': '616', 'portugal': '620', 'qatar': '634', 'romania': '642',
  'russia': '643', 'rwanda': '646', 'saudi arabia': '682', 'senegal': '686',
  'serbia': '688', 'singapore': '702', 'slovakia': '703', 'slovenia': '705',
  'somalia': '706', 'south africa': '710', 'south korea': '410', 'spain': '724',
  'sri lanka': '144', 'sudan': '729', 'sweden': '752', 'switzerland': '756',
  'syria': '760', 'taiwan': '158', 'tanzania': '834', 'thailand': '764',
  'tunisia': '788', 'turkey': '792', 'uganda': '800', 'ukraine': '804',
  'united arab emirates': '784', 'uae': '784', 'united kingdom': '826', 'uk': '826',
  'united states': '840', 'usa': '840', 'uruguay': '858', 'uzbekistan': '860',
  'venezuela': '862', 'vietnam': '704', 'yemen': '887', 'zambia': '894',
  'zimbabwe': '716', 'azores': '620', 'lisbon': '620', 'porto': '620',
  'barcelona': '724', 'madrid': '724', 'paris': '250', 'london': '826',
  'rome': '380', 'berlin': '276', 'tokyo': '392', 'kyoto': '392',
  'bangkok': '764', 'bali': '360', 'new york': '840', 'nyc': '840',
  'los angeles': '840', 'san francisco': '840',
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
  const stopsLabel = (n) => `${n} ${t('stops')}`;
  const daysLabel = (n) => `${n} ${n === 1 ? t('day') : t('days')}`;

  return (
    <div className={styles.tripCard}>
      <div className={styles.tripCardHeader}>
        <div className={styles.tripDestination}>
          <span className={styles.destIcon}>📍</span>
          <div>
            <h3 className={styles.destName}>{trip.destination || trip.title || 'Trip'}</h3>
            {trip.savedAt && (
              <span className={styles.destDate}>
                {new Date(trip.savedAt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
        <div className={styles.tripMeta}>
          {trip.days && (
            <span className={styles.metaTag}>📅 {daysLabel(trip.days.length)}</span>
          )}
          {trip.totalCost && (
            <span className={styles.metaTag}>💰 {trip.totalCost}</span>
          )}
          {trip.style && (
            <span className={styles.metaTag}>🎯 {trip.style}</span>
          )}
        </div>
      </div>

      {trip.tripOverview && (
        <p className={styles.tripOverview}>{trip.tripOverview}</p>
      )}

      {trip.days && trip.days.length > 0 && (
        <div className={styles.daysList}>
          {trip.days.map((day, di) => (
            <details key={di} className={styles.dayAccordion}>
              <summary className={styles.daySummary}>
                <span className={styles.dayDot}></span>
                <span className={styles.dayTitle}>{day.title}</span>
                <span className={styles.dayStopCount}>{stopsLabel(day.stops?.length || 0)}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.chevron}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>
              <div className={styles.dayContent}>
                {day.stops?.map((stop, si) => (
                  <div key={si} className={styles.stop}>
                    <span className={styles.stopTime}>{stop.time}</span>
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

      {trip.id && (
        <div className={styles.tripActions}>
          <a href={`/itinerary/${trip.id}`} className={styles.viewBtn}>
            {t('viewFullItinerary')}
          </a>
        </div>
      )}
    </div>
  );
}

export default function TripHistory({ trips = [], visitedCountries = [] }) {
  const t = useTranslations('myTrips');

  const { completed, planned } = useMemo(() => {
    const completed = [];
    const planned = [];

    trips.forEach(trip => {
      const code = getCountryCodeFromDestination(trip.destination);
      if (code && visitedCountries.includes(code)) {
        completed.push(trip);
      } else {
        planned.push(trip);
      }
    });

    return { completed, planned };
  }, [trips, visitedCountries]);

  if (trips.length === 0) {
    return (
      <section className={styles.section}>
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
          <div className={styles.emptyIcon}>✈️</div>
          <h3 className={styles.emptyTitle}>{t('noItineraries')}</h3>
          <p className={styles.emptyText}>
            {t('noItinerariesText')}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
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
        {/* Completed Trips */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <span className={styles.columnIcon}>✅</span>
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
                <TripCard key={trip.id || i} trip={trip} t={t} />
              ))}
            </div>
          )}
        </div>

        {/* Planned Trips */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <span className={styles.columnIcon}>📋</span>
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
                <TripCard key={trip.id || i} trip={trip} t={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
