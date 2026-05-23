'use client';

import styles from './LocalTransportSection.module.css';

/**
 * PHASE 11.3: LocalTransportSection Component
 * Displays local transport recommendations (passes, apps, tips)
 */

export default function LocalTransportSection({ localTransport }) {
  if (!localTransport) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🚇</div>
        <p>Informações de transportes a carregar...</p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>
            <span className={styles.icon}>🚇</span>
            Transportes Locais
          </h2>
          <p className={styles.subtitle}>{localTransport.overview}</p>
        </div>
      </div>

      {/* Transport Passes */}
      {localTransport.passes && localTransport.passes.length > 0 && (
        <div className={styles.passesSection}>
          <h3 className={styles.sectionTitle}>Cartões e Passes</h3>
          <div className={styles.passesGrid}>
            {localTransport.passes.map((pass, idx) => (
              <div key={idx} className={styles.passCard}>
                <div className={styles.passName}>{pass.name}</div>
                {pass.cost && (
                  <div className={styles.passCost}>€{pass.cost}</div>
                )}
                {pass.validity && (
                  <div className={styles.passValidity}>{pass.validity}</div>
                )}
                {pass.includes && (
                  <div className={styles.passIncludes}>
                    <div className={styles.includesLabel}>Inclui:</div>
                    <ul className={styles.includesList}>
                      {pass.includes.map((inc, i) => (
                        <li key={i}>{inc}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {pass.recommendation && (
                  <div className={styles.recommendation}>
                    💡 {pass.recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Apps */}
      {localTransport.apps && localTransport.apps.length > 0 && (
        <div className={styles.appsSection}>
          <h3 className={styles.sectionTitle}>Apps Recomendadas</h3>
          <div className={styles.appsList}>
            {localTransport.apps.map((app, idx) => (
              <div key={idx} className={styles.appCard}>
                <div className={styles.appName}>{app.name}</div>
                {app.purpose && (
                  <div className={styles.appPurpose}>{app.purpose}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transport Tips */}
      {localTransport.tips && localTransport.tips.length > 0 && (
        <div className={styles.tipsSection}>
          <h3 className={styles.sectionTitle}>Dicas Úteis</h3>
          <ul className={styles.tipsList}>
            {localTransport.tips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Modes Available */}
      {localTransport.modes && localTransport.modes.length > 0 && (
        <div className={styles.modesSection}>
          <h3 className={styles.sectionTitle}>Meios de Transporte</h3>
          <div className={styles.modesList}>
            {localTransport.modes.map((mode, idx) => (
              <div key={idx} className={styles.modeTag}>{mode}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
