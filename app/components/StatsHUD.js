'use client';
import styles from './StatsHUD.module.css';

export default function StatsHUD({ visitedCount = 0 }) {
  const percentage = Math.round((visitedCount / 195) * 100);
  const level = Math.floor(visitedCount / 5) + 1;
  const nextMilestone = (Math.floor(visitedCount / 10) + 1) * 10;

  return (
    <div className={styles.container}>
      <div className={styles.passportCard}>
        <div className={styles.passportHeader}>
          <div className={styles.passportTitle}>GLOBAL PASSPORT</div>
          <div className={styles.passportChip}></div>
        </div>
        
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>RANK</div>
            <div className={styles.statValue}>LVL {level} {level > 5 ? 'ELITE' : 'EXPLORER'}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>CONQUEST</div>
            <div className={styles.statValue}>{percentage}%</div>
          </div>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${(visitedCount % 10) * 10}%` }}></div>
          </div>
          <div className={styles.progressLabel}>
            {nextMilestone - visitedCount} more countries to next milestone
          </div>
        </div>
      </div>

      <div className={styles.optimizerCard}>
        <div className={styles.optimizerHeader}>
          <div className={styles.optimizerDot}></div>
          <span>NEURAL ROUTE OPTIMIZER</span>
        </div>
        <div className={styles.optimizerContent}>
          <div className={styles.aiThinking}>
            <div className={styles.wave}></div>
            <div className={styles.wave}></div>
            <div className={styles.wave}></div>
          </div>
          <p className={styles.optimizerText}>
            Analyzing your travel patterns... Ready to suggest your next 3 destination clusters.
          </p>
          <button className={styles.optimizerBtn}>Run Optimization</button>
        </div>
      </div>
    </div>
  );
}
