'use client';
import styles from './Pricing.module.css';

const freeFeatures = [
  { text: 'AI itinerary generator', included: true },
  { text: '1-Click planning', included: true },
  { text: 'Basic navigation mode', included: true },
  { text: 'Community access', included: true },
  { text: 'Share & remix itineraries', included: true },
  { text: 'Up to 3 saved trips', included: true },
  { text: 'Offline mode', included: false },
  { text: 'Adaptive itinerary engine', included: false },
  { text: 'Advanced AI assistant', included: false },
  { text: 'Priority support', included: false },
];

const premiumFeatures = [
  { text: 'Everything in Free', included: true },
  { text: 'Unlimited saved trips', included: true },
  { text: 'Adaptive itinerary engine', included: true },
  { text: 'Advanced AI assistant', included: true },
  { text: 'Offline mode & audio guides', included: true },
  { text: 'Smart budget tracking', included: true },
  { text: 'Group planning tools', included: true },
  { text: 'Creator marketplace access', included: true },
  { text: 'Priority support', included: true },
  { text: 'Early access to new features', included: true },
];

export default function Pricing() {
  return (
    <section className={styles.pricing} id="pricing">
      <div className={styles.header}>
        <span className="section-label">💎 Pricing</span>
        <h2 className="section-title">Start exploring for free</h2>
        <p className="section-subtitle mx-auto">
          Get started with powerful AI planning at no cost. Upgrade to unlock the full Andor experience.
        </p>
      </div>

      <div className={styles.grid}>
        {/* Free */}
        <div className={styles.card}>
          <div className={styles.cardPlan}>Free</div>
          <div className={styles.cardPrice}>
            <span className={styles.priceAmount}>€0</span>
            <span className={styles.pricePeriod}>/ forever</span>
          </div>
          <p className={styles.cardDesc}>Perfect for casual travelers who want smart planning.</p>
          <div className={styles.featureList}>
            {freeFeatures.map((f, i) => (
              <div key={i} className={`${styles.feature} ${!f.included ? styles.featureDisabled : ''}`}>
                {f.included ? (
                  <span className={styles.featureCheck}>✓</span>
                ) : (
                  <span className={styles.featureCross}>×</span>
                )}
                {f.text}
              </div>
            ))}
          </div>
          <button className={`${styles.cardBtn} ${styles.btnFree}`} onClick={() => window.dispatchEvent(new Event('open-auth-modal'))}>Get Started Free</button>
        </div>

        {/* Premium */}
        <div className={`${styles.card} ${styles.cardPremium}`}>
          <span className={styles.popularBadge}>⭐ Most Popular</span>
          <div className={styles.cardPlan}>Premium</div>
          <div className={styles.cardPrice}>
            <span className={styles.priceAmount}>€7</span>
            <span className={styles.pricePeriod}>/ month</span>
          </div>
          <p className={styles.cardDesc}>For serious travelers who want the full AI companion experience.</p>
          <div className={styles.featureList}>
            {premiumFeatures.map((f, i) => (
              <div key={i} className={styles.feature}>
                <span className={styles.featureCheck}>✓</span>
                {f.text}
              </div>
            ))}
          </div>
          <button className={`${styles.cardBtn} ${styles.btnPremium}`} onClick={() => window.dispatchEvent(new Event('open-auth-modal'))}>Start 7-Day Free Trial</button>
        </div>
      </div>
    </section>
  );
}
