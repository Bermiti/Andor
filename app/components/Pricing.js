'use client';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
  const { user } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [successPlan, setSuccessPlan] = useState(null);

  const handleSelectPlan = (plan) => {
    if (!user) {
      window.dispatchEvent(new Event('open-auth-modal'));
      return;
    }
    
    setLoadingPlan(plan);
    // Simulate payment process
    setTimeout(() => {
      setLoadingPlan(null);
      setSuccessPlan(plan);
      setTimeout(() => setSuccessPlan(null), 3500);
    }, 1800);
  };

  return (
    <section className={styles.pricing} id="pricing">
      {successPlan && (
        <div className={styles.successOverlay}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>✨</div>
            <h3>{successPlan} Tier Activated</h3>
            <p>Your account has been upgraded. Neural Link established.</p>
          </div>
        </div>
      )}

      <div className={styles.header}>
        <span className="section-label">💎 Premium Membership</span>
        <h2 className="section-title">Invest in your perspective</h2>
        <p className="section-subtitle mx-auto">
          Start for free, upgrade whenever you're ready for the full autonomous experience.
        </p>
      </div>

      <div className={styles.toggle}>
        <span className={!isYearly ? styles.toggleActive : ''}>Monthly</span>
        <button className={styles.toggleSwitch} onClick={() => setIsYearly(!isYearly)} aria-label="Toggle billing period">
          <span className={`${styles.toggleKnob} ${isYearly ? styles.toggleKnobRight : ''}`}></span>
        </button>
        <span className={isYearly ? styles.toggleActive : ''}>
          Yearly
          <span className={styles.saveBadge}>-30%</span>
        </span>
      </div>

      <div className={styles.grid}>
        {/* Free */}
        <div className={styles.card}>
          <div className={styles.cardPlan}>Standard</div>
          <div className={styles.cardPrice}>
            <span className={styles.priceAmount}>€0</span>
            <span className={styles.pricePeriod}>/ forever</span>
          </div>
          <p className={styles.cardDesc}>Essential AI travel planning for casual explorers.</p>
          <div className={styles.featureList}>
            {freeFeatures.map((f, i) => (
              <div key={i} className={`${styles.feature} ${!f.included ? styles.featureDisabled : ''}`}>
                <span className={styles.featureCheck}>{f.included ? '✓' : '×'}</span>
                {f.text}
              </div>
            ))}
          </div>
          <button 
            className={`${styles.cardBtn} ${styles.btnFree}`} 
            onClick={() => handleSelectPlan('Standard')}
          >
            {user ? 'Current Plan' : 'Get Started Free'}
          </button>
        </div>

        {/* Premium */}
        <div className={`${styles.card} ${styles.cardPremium}`}>
          <span className={styles.popularBadge}>⭐ RECOMMENDED</span>
          <div className={styles.cardPlan}>Elite</div>
          <div className={styles.cardPrice}>
            <span className={styles.priceAmount}>{isYearly ? '€4.90' : '€7'}</span>
            <span className={styles.pricePeriod}>/ month</span>
          </div>
          {isYearly && <div className={styles.yearlyNote}>Billed €58.80 annually</div>}
          <p className={styles.cardDesc}>Full autonomous itinerary engine & pro tools.</p>
          <div className={styles.featureList}>
            {premiumFeatures.map((f, i) => (
              <div key={i} className={styles.feature}>
                <span className={styles.featureCheck}>✓</span>
                {f.text}
              </div>
            ))}
          </div>
          <button 
            className={`${styles.cardBtn} ${styles.btnPremium}`} 
            onClick={() => handleSelectPlan('Elite')}
          >
            {loadingPlan === 'Elite' ? 'Establishing Link...' : 'Start 7-Day Trial'}
          </button>
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
