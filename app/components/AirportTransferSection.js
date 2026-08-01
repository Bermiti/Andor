'use client';

import styles from './AirportTransferSection.module.css';

/**
 * PHASE 11.3: AirportTransferSection Component
 * Displays 3 airport transfer options with cost/time comparison
 */

export default function AirportTransferSection({ airportTransfer }) {
  if (!airportTransfer) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>TR</div>
        <p>Sem dados de fornecedor para o transfer. Confirma opções e horários numa fonte oficial.</p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>
            Transfer Aeroporto
          </h2>
          <p className={styles.subtitle}>{airportTransfer.overview}</p>
        </div>
        {airportTransfer.externalLinks && (
          <div className={styles.externalLinks}>
            {airportTransfer.externalLinks.uber && (
              <a href={airportTransfer.externalLinks.uber} target="_blank" rel="noopener noreferrer" className={styles.link}>
                Uber
              </a>
            )}
            {airportTransfer.externalLinks.local && (
              <a href={airportTransfer.externalLinks.local} target="_blank" rel="noopener noreferrer" className={styles.link}>
                Local
              </a>
            )}
            {airportTransfer.externalLinks.website && (
              <a href={airportTransfer.externalLinks.website} target="_blank" rel="noopener noreferrer" className={styles.link}>
                Reservar
              </a>
            )}
          </div>
        )}
      </div>

      {/* Options Grid */}
      {airportTransfer.options && airportTransfer.options.length > 0 && (
        <div className={styles.optionsGrid}>
          {airportTransfer.options.map((option, idx) => (
            <div key={idx} className={`${styles.card} ${styles[`tier_${option.tier}`]}`}>
              {/* Tier Badge */}
              <div className={styles.cardBadge}>
                {option.tier === 'budget' && 'Económico'}
                {option.tier === 'standard' && 'Padrão'}
                {option.tier === 'premium' && 'Premium'}
              </div>

              {/* Title */}
              {option.name && (
                <div className={styles.name}>{option.name}</div>
              )}

              {/* Description */}
              {option.description && (
                <p className={styles.description}>{option.description}</p>
              )}

              {/* Key Details */}
              <div className={styles.details}>
                {option.estimatedCost && (
                  <div className={styles.detail}>
                    <span className={styles.label}>Custo</span>
                    <span className={styles.value}>€{option.estimatedCost}</span>
                  </div>
                )}
                {option.estimatedDuration && (
                  <div className={styles.detail}>
                    <span className={styles.label}>Duração</span>
                    <span className={styles.value}>{option.estimatedDuration}</span>
                  </div>
                )}
                {option.duration && (
                  <div className={styles.detail}>
                    <span className={styles.label}>Tempo</span>
                    <span className={styles.value}>{option.duration}</span>
                  </div>
                )}
              </div>

              {/* Pros */}
              {option.pros && option.pros.length > 0 && (
                <div className={styles.section_}>
                  <div className={styles.sectionTitle}>Vantagens</div>
                  <ul className={styles.list}>
                    {option.pros.map((pro, i) => (
                      <li key={i}>{pro}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cons */}
              {option.cons && option.cons.length > 0 && (
                <div className={styles.section_}>
                  <div className={styles.sectionTitle}>Desvantagens</div>
                  <ul className={styles.list}>
                    {option.cons.map((con, i) => (
                      <li key={i}>{con}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Best For */}
              {option.bestFor && (
                <div className={styles.bestFor}>
                  <strong>Melhor para:</strong>
                  <p>{option.bestFor}</p>
                </div>
              )}

              {/* Warnings */}
              {option.warnings && option.warnings.length > 0 && (
                <div className={styles.warnings}>
                  <span className={styles.warningIcon}>Atenção</span>
                  <div className={styles.warningContent}>
                    {option.warnings.map((warning, i) => (
                      <div key={i} className={styles.warning}>{warning}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      {airportTransfer.tips && airportTransfer.tips.length > 0 && (
        <div className={styles.tips}>
          <div className={styles.tipsTitle}>Dicas</div>
          <ul className={styles.tipsList}>
            {airportTransfer.tips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
