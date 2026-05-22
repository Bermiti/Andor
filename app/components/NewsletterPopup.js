'use client';
import { useState, useEffect } from 'react';
import styles from './NewsletterPopup.module.css';

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user already dismissed or subscribed
    const hasSeen = localStorage.getItem('andor_newsletter_dismissed');
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 5000); // 5 seconds delay
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem('andor_newsletter_dismissed', 'true');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // Simulate API subscription
    setTimeout(() => {
      setLoading(false);
      setIsSubscribed(true);
      localStorage.setItem('andor_newsletter_dismissed', 'true');
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleDismiss}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} aria-label="Close newsletter popup" onClick={handleDismiss}>✕</button>
        
        {!isSubscribed ? (
          <div className={styles.content}>
            <div className={styles.imageHeader}>
              <div className={styles.overlayGradient}></div>
              <span className={styles.badge}>SPECIAL OFFER</span>
              <h3 className={styles.modalTitle}>Unlock 10% Off Your First Journey</h3>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <p className={styles.desc}>
                Join the Andor Circle. Subscribe to our newsletter to receive curated destination guides, secret itineraries, and a 10% welcome discount voucher.
              </p>
              
              <div className={styles.inputField}>
                <input 
                  type="email" 
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
              
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Subscribing...' : 'Claim 10% Discount ✨'}
              </button>
              
              <button type="button" className={styles.noThanks} onClick={handleDismiss}>
                No thanks, I prefer paying full price
              </button>
            </form>
          </div>
        ) : (
          <div className={styles.success}>
            <div className={styles.giftIcon}>🎁</div>
            <h3 className={styles.successTitle}>Welcome to the Circle!</h3>
            <p className={styles.successDesc}>
              Use the promo code below at checkout to redeem your 10% discount on any premium itinerary guide.
            </p>
            
            <div className={styles.voucherBox}>
              <span className={styles.voucherCode}>WELCOME10</span>
              <button 
                type="button"
                className={styles.copyBtn} 
                onClick={() => {
                  navigator.clipboard.writeText('WELCOME10');
                  alert('Code copied to clipboard!');
                }}
              >
                Copy Code
              </button>
            </div>
            
            <p className={styles.voucherExpiry}>Valid for 30 days. Sent to: {email}</p>
            
            <button type="button" className={styles.doneBtn} onClick={handleDismiss}>Start Exploring</button>
          </div>
        )}
      </div>
    </div>
  );
}
