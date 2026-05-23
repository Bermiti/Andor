'use client';

import styles from './AlertsSection.module.css';

/**
 * PHASE 11.3: AlertsSection Component
 * Displays destination-specific warnings and practical alerts
 */

export default function AlertsSection({ warnings, destination }) {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  const alertsByType = {
    scams: [],
    safety: [],
    cultural: [],
    health: [],
    practical: [],
    weather: [],
    other: []
  };

  warnings.forEach(warning => {
    const type = warning.type || 'other';
    if (alertsByType[type]) {
      alertsByType[type].push(warning);
    } else {
      alertsByType.other.push(warning);
    }
  });

  const getAlertIcon = (type) => {
    switch (type) {
      case 'scams': return '🚨';
      case 'safety': return '⚠️';
      case 'cultural': return '🌍';
      case 'health': return '🏥';
      case 'practical': return '📋';
      case 'weather': return '🌦️';
      default: return 'ℹ️';
    }
  };

  const getAlertTitle = (type) => {
    switch (type) {
      case 'scams': return 'Fraudes Comuns';
      case 'safety': return 'Segurança';
      case 'cultural': return 'Dicas Culturais';
      case 'health': return 'Saúde';
      case 'practical': return 'Informações Práticas';
      case 'weather': return 'Clima';
      default: return 'Informações';
    }
  };

  return (
    <div className={styles.section}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.icon}>⚠️</span>
          Informações Importantes
        </h2>
        <p className={styles.subtitle}>Tudo o que precisa saber antes de viajar</p>
      </div>

      {/* Alerts by Type */}
      {Object.entries(alertsByType).map(([type, typeAlerts]) => {
        if (typeAlerts.length === 0) return null;

        return (
          <div key={type} className={`${styles.alertGroup} ${styles[`group_${type}`]}`}>
            <div className={styles.groupHeader}>
              <span className={styles.groupIcon}>{getAlertIcon(type)}</span>
              <span className={styles.groupTitle}>{getAlertTitle(type)}</span>
              <span className={styles.groupCount}>{typeAlerts.length}</span>
            </div>

            <div className={styles.alertsList}>
              {typeAlerts.map((alert, idx) => (
                <div key={idx} className={`${styles.alert} ${styles[`alert_${type}`]}`}>
                  <div className={styles.alertIcon}>{getAlertIcon(type)}</div>
                  <div className={styles.alertContent}>
                    {alert.title && (
                      <div className={styles.alertTitle}>{alert.title}</div>
                    )}
                    {alert.description && (
                      <p className={styles.alertDescription}>{alert.description}</p>
                    )}
                    {alert.advice && (
                      <div className={styles.alertAdvice}>
                        <strong>💡 Conselho:</strong> {alert.advice}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
