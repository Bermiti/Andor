'use client';

import styles from './FlightSection.module.css';

/**
 * PHASE 11.3: FlightSection Component
 * Displays 3-tier flight options (economical/balanced/comfortable)
 * with pricing, duration, airlines, and external booking links
 */

export default function FlightSection({ flights, destination }) {
  if (!flights || !flights.options) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>✈️</div>
        <p>Informações de voos a carregar...</p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>
            <span className={styles.icon}>✈️</span>
            Voos
          </h2>
          <p className={styles.subtitle}>{flights.overview}</p>
        </div>
        {flights.externalLinks && (
          <div className={styles.externalLinks}>
            {flights.externalLinks.googleFlights && (
              <a href={flights.externalLinks.googleFlights} target="_blank" rel="noopener noreferrer" className={styles.link}>
                Google Flights
              </a>
            )}
            {flights.externalLinks.skyscanner && (
              <a href={flights.externalLinks.skyscanner} target="_blank" rel="noopener noreferrer" className={styles.link}>
                Skyscanner
              </a>
            )}
            {flights.externalLinks.kayak && (
              <a href={flights.externalLinks.kayak} target="_blank" rel="noopener noreferrer" className={styles.link}>
                Kayak
              </a>
            )}
          </div>
        )}
      </div>

      <div className={styles.optionsGrid}>
        {flights.options.map((option, idx) => (
          <div key={idx} className={`${styles.card} ${styles[`tier_${option.tier}`]}`}>
            {/* Badge */}
            <div className={styles.cardBadge}>
              {option.tier === 'economical' && '💰 Económico'}
              {option.tier === 'balanced' && '⚖️ Equilibrado'}
              {option.tier === 'comfortable' && '✨ Confortável'}
            </div>

            {/* Price - Main Focus */}
            <div className={styles.priceSection}>
              <div className={styles.price}>
                €{option.estimatedCost}
                <span className={styles.priceSubtext}>por pessoa</span>
              </div>
            </div>

            {/* Key Details */}
            <div className={styles.details}>
              <div className={styles.detail}>
                <span className={styles.label}>Duração:</span>
                <span className={styles.value}>{option.duration}</span>
              </div>
              <div className={styles.detail}>
                <span className={styles.label}>Escalas:</span>
                <span className={styles.value}>{option.stops === 0 ? 'Direto' : `${option.stops} escala(s)`}</span>
              </div>
              {option.airlinesRecommended && (
                <div className={styles.detail}>
                  <span className={styles.label}>Companhias:</span>
                  <span className={styles.value}>{option.airlinesRecommended.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className={styles.description}>{option.description}</p>

            {/* Pros */}
            {option.advantages && option.advantages.length > 0 && (
              <div className={styles.section_}>
                <div className={styles.sectionTitle}>Vantagens</div>
                <ul className={styles.list}>
                  {option.advantages.slice(0, 3).map((adv, i) => (
                    <li key={i}>✓ {adv}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cons */}
            {option.disadvantages && option.disadvantages.length > 0 && (
              <div className={styles.section_}>
                <div className={styles.sectionTitle}>Desvantagens</div>
                <ul className={styles.list}>
                  {option.disadvantages.slice(0, 2).map((dis, i) => (
                    <li key={i}>⚠️ {dis}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Best For */}
            {option.bestFor && (
              <div className={styles.bestFor}>
                <strong>Melhor para:</strong> {option.bestFor}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      {flights.disclaimer && (
        <div className={styles.disclaimer}>
          <span>ℹ️</span>
          <p>{flights.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
