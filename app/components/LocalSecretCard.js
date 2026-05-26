'use client';
import styles from './LocalSecretCard.module.css';

export default function LocalSecretCard({ secret }) {
  if (!secret) return null;

  return (
    <div className={styles.secretCard}>
      <div className={styles.secretBadge}>
        <span className={styles.badgeIcon}>💎</span>
        <span className={styles.badgeText}>Segredo Local</span>
      </div>

      <h3 className={styles.secretTitle}>{secret.title || 'Descobre um segredo local'}</h3>

      <p className={styles.secretBody}>{secret.description}</p>

      {secret.why && (
        <div className={styles.whySection}>
          <span className={styles.whyLabel}>Por que?</span>
          <p className={styles.whyText}>{secret.why}</p>
        </div>
      )}

      {secret.howToGet && (
        <div className={styles.howSection}>
          <span className={styles.howLabel}>Como chegar?</span>
          <p className={styles.howText}>{secret.howToGet}</p>
        </div>
      )}

      {secret.bestTime && (
        <div className={styles.tipRow}>
          ⏰ Melhor hora: {secret.bestTime}
        </div>
      )}

      {secret.cost && (
        <div className={styles.tipRow}>
          💰 {secret.cost === 0 ? 'Grátis' : `€${secret.cost}`}
        </div>
      )}

      {secret.insider && (
        <div className={styles.insiderBox}>
          <p className={styles.insiderText}>"{secret.insider}"</p>
          {secret.insiderAttribution && (
            <p className={styles.attribution}>— {secret.insiderAttribution}</p>
          )}
        </div>
      )}
    </div>
  );
}
