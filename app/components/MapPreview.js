'use client';
import { useState, useEffect } from 'react';
import styles from './MapPreview.module.css';

const stops = [
  { name: 'Pastéis de Belém', sub: 'Breakfast — Local pastry shop', time: '09:00', x: '15%', y: '55%', emoji: '☕' },
  { name: 'Jerónimos Monastery', sub: 'UNESCO Heritage Site', time: '10:30', x: '22%', y: '45%', emoji: '🏛️' },
  { name: 'Time Out Market', sub: 'Lunch — Gourmet food hall', time: '13:00', x: '38%', y: '35%', emoji: '🍽️' },
  { name: 'Alfama District', sub: 'Cultural — Oldest neighborhood', time: '15:00', x: '58%', y: '42%', emoji: '🚶' },
  { name: 'Miradouro da Graça', sub: 'Viewpoint — Sunset panorama', time: '17:00', x: '72%', y: '30%', emoji: '🌅' },
  { name: 'Taberna da Rua das Flores', sub: 'Dinner — Traditional Portuguese', time: '20:00', x: '82%', y: '50%', emoji: '🍷' },
];

import dynamic from 'next/dynamic';

const RealMap = dynamic(() => import('./RealMap'), { ssr: false });

export default function MapPreview({ itineraryStops, center }) {
  const [activeStop, setActiveStop] = useState(0);

  // Use passed stops or fallback
  const displayStops = itineraryStops || stops;

  return (
    <section className={styles.mapSection} id="explore">
      <div className={styles.header}>
        <span className="section-label">📡 Live Mission Control</span>
        <h2 className="section-title">GPS Intelligence Layer</h2>
        <p className="section-subtitle mx-auto">
          Autonomous navigation with real-time route optimization and tactical audio guides.
        </p>
      </div>

      <div className={styles.hudContainer}>
        <div className={styles.mainDisplay}>
          <div className={styles.mapContainer}>
            <RealMap stops={displayStops} center={center} />
            
            <div className={styles.mapOverlay} style={{ pointerEvents: 'none' }}>
              {/* Scanner HUD */}
              <div className={styles.scannerLine}></div>
              <div className={styles.hologramGrid}></div>
              
              {/* GPS Stats */}
              <div className={styles.gpsStats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>SIGNAL</span>
                  <span className={styles.statValue}>MAX</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>LATENCY</span>
                  <span className={styles.statValue}>12ms</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>COMPUTE</span>
                  <span className={styles.statValue}>QUANTUM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sideDisplay}>
          <div className={styles.missionLog}>
            <h3 className={styles.logTitle}>MISSION LOG</h3>
            <div className={styles.logList}>
              {stops.map((stop, i) => (
                <div 
                  key={i} 
                  className={`${styles.logItem} ${activeStop === i ? styles.logActive : ''}`}
                  onMouseEnter={() => setActiveStop(i)}
                >
                  <div className={styles.logTime}>{stop.time}</div>
                  <div className={styles.logContent}>
                    <div className={styles.logName}>{stop.name}</div>
                    <div className={styles.logSub}>{stop.sub}</div>
                  </div>
                  <button className={styles.audioBtn}>🔊</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
