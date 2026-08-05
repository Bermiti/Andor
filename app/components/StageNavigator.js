'use client';
import { useRef, useEffect } from 'react';
import styles from './StageNavigator.module.css';
import { MapPin, ArrowRight, Train, Plane, Car, Ship } from 'lucide-react';

export default function StageNavigator({ stages = [], transfers = [], activeStageId, onStageSelect }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (activeStageId && containerRef.current) {
      const activeEl = containerRef.current.querySelector(`[data-stage-id="${activeStageId}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeStageId]);

  const getTransferIcon = (mode) => {
    switch (mode) {
      case 'train': return <Train size={14} />;
      case 'flight': return <Plane size={14} />;
      case 'car': return <Car size={14} />;
      case 'ferry':
      case 'ship': return <Ship size={14} />;
      default: return <ArrowRight size={14} />;
    }
  };

  const formatDateRange = (arrival, departure) => {
    if (!arrival && !departure) return null;
    const formatStr = (d) => {
        if (!d) return '';
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return '';
        return dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    }
    const arr = formatStr(arrival);
    const dep = formatStr(departure);
    if (arr && dep) return `${arr} - ${dep}`;
    if (arr) return `From ${arr}`;
    if (dep) return `Until ${dep}`;
    return null;
  };

  return (
    <div className={styles.container} ref={containerRef} role="tablist">
      {stages.map((stage, index) => {
        const isActive = stage.id === activeStageId;
        const transfer = transfers.find(t => t.fromStageId === stage.id);
        const dateRange = formatDateRange(stage.arrivalDate, stage.departureDate);

        return (
          <div key={stage.id} className={styles.stageWrapper}>
            <button
              className={`${styles.stagePill} ${isActive ? styles.active : ''}`}
              onClick={() => onStageSelect && onStageSelect(stage.id)}
              data-stage-id={stage.id}
              role="tab"
              aria-selected={isActive}
            >
              <div className={styles.destination}>
                <MapPin size={14} />
                {stage.destination?.canonicalName || stage.destination?.displayName || 'Unknown'}
              </div>
              <div className={styles.meta}>
                {stage.nights} {stage.nights === 1 ? 'night' : 'nights'}
                {dateRange && ` • ${dateRange}`}
              </div>
            </button>
            {transfer && (
              <div className={styles.transfer} title={`Transfer to next stage by ${transfer.mode}`}>
                {getTransferIcon(transfer.mode)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
