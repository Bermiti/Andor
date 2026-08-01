'use client';

import styles from './TransportCard.module.css';
import { Plane, Train, Bus, ExternalLink } from 'lucide-react';

export default function TransportCard({ transportOption }) {
  if (!transportOption) return null;

  const { operator, type, timing, duration, stops, estimatedPrice, bookingUrl, source } = transportOption;

  const getTransportIcon = (tType) => {
    const t = String(tType || '').toLowerCase();
    if (t.includes('train') || t.includes('comboio')) return <Train size={16} />;
    if (t.includes('bus') || t.includes('autocarro')) return <Bus size={16} />;
    return <Plane size={16} />; // default to plane/flight
  };

  const getSourceBadgeClass = (src) => {
    if (src === 'amadeus') return styles.srcAmadeus;
    return styles.srcEstimated;
  };

  const getSourceLabel = (src) => {
    if (src === 'amadeus') return 'Amadeus';
    return 'Estimativa';
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.typeIcon}>
          {getTransportIcon(type)}
        </div>
        <div className={styles.operatorArea}>
          <div className={styles.operatorName}>{operator}</div>
          <span className={`${styles.sourceBadge} ${getSourceBadgeClass(source)}`}>
            {getSourceLabel(source)}
          </span>
        </div>
      </div>

      <div className={styles.timingArea}>
        <div className={styles.timingRow}>
          {timing && <span className={styles.time}>{timing}</span>}
          {duration && <span className={styles.duration}>{duration}</span>}
        </div>
        {stops !== undefined && stops !== null && stops !== '' && (
          <div className={styles.stopsRow}>
            <span className={styles.stops}>{stops === 0 ? 'Direto' : stops}</span>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.priceSection}>
          <span className={styles.price}>{estimatedPrice || 'Sob Consulta'}</span>
          <span className={styles.priceSub}>est.</span>
        </div>
        {bookingUrl && (
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.bookBtn}
          >
            Pesquisar no fornecedor <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}
