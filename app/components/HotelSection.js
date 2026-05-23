'use client';

import styles from './HotelSection.module.css';

/**
 * PHASE 11.3: HotelSection Component
 * Displays hotel recommendations by zone with alternatives and tiers
 */

export default function HotelSection({ accommodation, destination }) {
  if (!accommodation) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🏨</div>
        <p>Informações de hotéis a carregar...</p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>
            <span className={styles.icon}>🏨</span>
            Alojamento
          </h2>
          <p className={styles.subtitle}>{accommodation.overview}</p>
        </div>
        {accommodation.externalLinks && (
          <div className={styles.externalLinks}>
            {accommodation.externalLinks.booking && (
              <a href={accommodation.externalLinks.booking} target="_blank" rel="noopener noreferrer" className={styles.link}>
                Booking.com
              </a>
            )}
            {accommodation.externalLinks.googleHotels && (
              <a href={accommodation.externalLinks.googleHotels} target="_blank" rel="noopener noreferrer" className={styles.link}>
                Google Hotels
              </a>
            )}
            {accommodation.externalLinks.airbnb && (
              <a href={accommodation.externalLinks.airbnb} target="_blank" rel="noopener noreferrer" className={styles.link}>
                Airbnb
              </a>
            )}
          </div>
        )}
      </div>

      {/* Recommended Area */}
      {accommodation.recommendedArea && (
        <div className={styles.recommendedArea}>
          <div className={styles.areaHeader}>
            <h3 className={styles.areaTitle}>
              <span className={styles.badge}>⭐ Recomendado</span>
              {accommodation.recommendedArea}
            </h3>
            {accommodation.whyRecommended && (
              <p className={styles.areaWhy}>{accommodation.whyRecommended}</p>
            )}
          </div>
        </div>
      )}

      {/* Hotel Tiers Grid */}
      {accommodation.hotels && accommodation.hotels.length > 0 && (
        <div className={styles.tiersSection}>
          <h3 className={styles.tiersTitle}>Tipos de Alojamento</h3>
          <div className={styles.tiersGrid}>
            {accommodation.hotels.map((tier, idx) => (
              <div key={idx} className={`${styles.tierCard} ${styles[`tier_${tier.tier}`]}`}>
                {/* Tier Badge */}
                <div className={styles.tierBadge}>
                  {tier.tier === 'economical' && '💰'}
                  {tier.tier === 'boutique' && '✨'}
                  {tier.tier === 'premium' && '👑'}
                  {' '}
                  {tier.tier === 'economical' && 'Económico'}
                  {tier.tier === 'boutique' && 'Boutique'}
                  {tier.tier === 'premium' && 'Premium'}
                </div>

                {/* Price */}
                <div className={styles.tierPrice}>
                  €{tier.estimatedNightlyPrice || tier.pricePerNight}
                  <span className={styles.priceUnit}>/noite</span>
                </div>

                {/* Description */}
                {tier.description && (
                  <p className={styles.tierDescription}>{tier.description}</p>
                )}

                {/* Examples */}
                {(tier.exampleNames || tier.name) && (
                  <div className={styles.examples}>
                    <div className={styles.examplesLabel}>Exemplos:</div>
                    <div className={styles.examplesList}>
                      {tier.exampleNames ? tier.exampleNames.slice(0, 2).map((name, i) => (
                        <span key={i} className={styles.exampleTag}>{name}</span>
                      )) : <span className={styles.exampleTag}>{tier.name}</span>}
                    </div>
                  </div>
                )}

                {/* Best For */}
                {tier.bestFor && (
                  <div className={styles.bestFor}>
                    <strong>Melhor para:</strong>
                    <p>{tier.bestFor}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternative Areas */}
      {accommodation.alternativeAreas && accommodation.alternativeAreas.length > 0 && (
        <div className={styles.alternativesSection}>
          <h3 className={styles.alternativesTitle}>Zonas Alternativas</h3>
          <div className={styles.alternativesGrid}>
            {accommodation.alternativeAreas.slice(0, 3).map((area, idx) => (
              <div key={idx} className={styles.alternativeCard}>
                <div className={styles.altName}>{area.name}</div>
                {area.vibe && (
                  <div className={styles.altVibe}>Ambiente: {area.vibe}</div>
                )}
                {area.reason && (
                  <p className={styles.altReason}>{area.reason}</p>
                )}
                {area.distanceToCenter && (
                  <div className={styles.altDistance}>
                    📍 {area.distanceToCenter}
                  </div>
                )}
                {area.pros && (
                  <div className={styles.altPros}>
                    ✓ {area.pros.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      {accommodation.disclaimer && (
        <div className={styles.disclaimer}>
          <span>ℹ️</span>
          <p>{accommodation.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
