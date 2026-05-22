'use client';
import { useState, useEffect } from 'react';
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
  const [isYearly, setIsYearly] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 12 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 2, minutes: 45, seconds: 12 };
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (val) => String(val).padStart(2, '0');

  return (
    <section className={styles.pricing} id="pricing">
      <div className={styles.header}>
        <span className="section-label">💎 Pricing</span>
        <h2 className="section-title">Start exploring for free</h2>
        <p className="section-subtitle mx-auto">
          Get started with powerful AI planning at no cost. Upgrade to unlock the full Andor experience.
        </p>
        <div className={styles.countdownContainer}>
          <span className={styles.countdownBadge}>⚡ OFERTA DE LANÇAMENTO</span>
          <span className={styles.countdownText}>
            A promoção de lançamento termina em: <strong>{formatTime(timeLeft.hours)}h {formatTime(timeLeft.minutes)}m {formatTime(timeLeft.seconds)}s</strong>
          </span>
        </div>
      </div>

      <div className={styles.toggle}>
        <span className={!isYearly ? styles.toggleActive : ''}>Monthly</span>
        <button className={styles.toggleSwitch} onClick={() => setIsYearly(!isYearly)} aria-label="Toggle billing period">
          <span className={`${styles.toggleKnob} ${isYearly ? styles.toggleKnobRight : ''}`}></span>
        </button>
        <span className={isYearly ? styles.toggleActive : ''}>
          Yearly
          <span className={styles.saveBadge}>Save 30%</span>
        </span>
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
            <span className={styles.priceAmount}>{isYearly ? '€4.90' : '€7'}</span>
            <span className={styles.priceAmountOld}>{isYearly ? '€7.00' : '€12.00'}</span>
            <span className={styles.pricePeriod}>/ month</span>
          </div>
          {isYearly && <div className={styles.yearlyNote}>Billed €58.80/year</div>}
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

      <div className={styles.testimonial}>
        <p className={styles.testimonialQuote}>"Andor completely changed how I plan trips. The AI itinerary saved me hours of research and found spots I never would've discovered."</p>
        <div className={styles.testimonialAuthor}>
          <div className={styles.testimonialAvatar}>M</div>
          <div>
            <div className={styles.testimonialName}>Maria Santos</div>
            <div className={styles.testimonialRole}>Premium user · 23 trips planned</div>
          </div>
        </div>
      </div>
    </section>
  );
}
