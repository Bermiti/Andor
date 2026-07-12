'use client';
import styles from './MapPreview.module.css';

const stops = [
  { name: 'Pastéis de Belém', sub: 'Breakfast — Local pastry shop', time: '09:00', x: '15%', y: '55%', color: '#111111', emoji: '☕' },
  { name: 'Jerónimos Monastery', sub: 'UNESCO Heritage Site', time: '10:30', x: '22%', y: '45%', color: '#111111', emoji: '🏛️' },
  { name: 'Time Out Market', sub: 'Lunch — Gourmet food hall', time: '13:00', x: '38%', y: '35%', color: '#111111', emoji: '🍽️' },
  { name: 'Alfama District', sub: 'Cultural — Oldest neighborhood', time: '15:00', x: '58%', y: '42%', color: '#111111', emoji: '🚶' },
  { name: 'Miradouro da Graça', sub: 'Viewpoint — Sunset panorama', time: '17:00', x: '72%', y: '30%', color: '#111111', emoji: '🌅' },
  { name: 'Taberna da Rua das Flores', sub: 'Dinner — Traditional Portuguese', time: '20:00', x: '82%', y: '50%', color: '#333333', emoji: '🍷' },
];

export default function MapPreview() {
  return (
    <section className={styles.mapSection} id="explore">
      <div className={styles.header}>
        <span className="section-label">Day Planning</span>
        <h2 className="section-title">Your day, structured and easy to follow</h2>
        <p className="section-subtitle mx-auto">
          Turn a loose list of ideas into a realistic day with clear timing, nearby stops, and practical transitions.
        </p>
      </div>

      <div className={styles.mapContainer}>
        <div className={styles.map}>
          <div className={styles.mapOverlay}></div>
          <div className={styles.mapGrid}></div>

          <div className={styles.activeIndicator}>
            <span className={styles.activeDot}></span>
            <span className={styles.activeText}>Day Flow</span>
          </div>

          {/* Route line SVG */}
          <div className={styles.route}>
            <svg viewBox="0 0 800 500" fill="none" preserveAspectRatio="none">
              <path
                d="M120 275 C150 250, 170 230, 176 225 C185 215, 260 180, 304 175 C350 170, 430 195, 464 210 C500 225, 540 170, 576 150 C610 130, 640 230, 656 250"
                stroke="#1E6FD9"
                strokeWidth="3"
                strokeDasharray="8 4"
                fill="none"
                opacity="0.6"
              />
            </svg>
          </div>

          {/* Markers */}
          {stops.map((stop, i) => (
            <div
              key={i}
              className={styles.marker}
              style={{ left: stop.x, top: stop.y }}
            >
              {i === 0 && <div className={styles.markerPulse}></div>}
              <div className={styles.markerDot} style={{ background: stop.color }}>
                {stop.emoji}
              </div>
              <span className={styles.markerLabel}>{stop.name}</span>
            </div>
          ))}

          <div className={styles.mapControls}>
            <button className={styles.mapControlBtn}>+</button>
            <button className={styles.mapControlBtn}>−</button>
          </div>
        </div>

        <div className={styles.timeline}>
          <h3 className={styles.timelineTitle}>Today's Flow</h3>
          {stops.map((stop, i) => (
            <div key={i} className={styles.timelineItem}>
              <div className={styles.timelineLine}>
                <div className={`${styles.timelineDot} ${i === stops.length - 1 ? 'gold' : ''}`} style={{ background: stop.color, boxShadow: `0 0 0 2px ${stop.color}` }}></div>
                {i < stops.length - 1 && <div className={styles.timelineConnector}></div>}
              </div>
              <div className={styles.timelineContent}>
                <div className={styles.timelineItemTitle}>{stop.name}</div>
                <div className={styles.timelineItemSub}>{stop.sub}</div>
                <div className={styles.timelineItemTime}>{stop.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
