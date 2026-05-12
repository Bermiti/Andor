'use client';
import styles from './LiveMap.module.css';

export default function LiveMap({ stops = [] }) {
  // Generate random positions if none provided (for mock visual effect)
  const mapStops = stops.map((stop, i) => ({
    ...stop,
    x: `${15 + (i * 70) / stops.length}%`,
    y: `${30 + Math.sin(i) * 20}%`
  }));

  return (
    <div className={styles.mapContainer}>
      <div className={styles.map}>
        <div className={styles.mapGrid}></div>
        
        {/* Route Line */}
        <svg viewBox="0 0 100 100" className={styles.routeSvg} preserveAspectRatio="none">
          <polyline
            points={mapStops.map(s => `${parseFloat(s.x)},${parseFloat(s.y)}`).join(' ')}
            className={styles.routeLine}
          />
        </svg>

        {mapStops.map((stop, i) => (
          <div
            key={i}
            className={styles.marker}
            style={{ left: stop.x, top: stop.y }}
          >
            <div className={styles.markerDot}>
              {i + 1}
            </div>
            <div className={styles.tooltip}>
              <div className={styles.tooltipName}>{stop.name}</div>
              <div className={styles.tooltipTime}>{stop.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
