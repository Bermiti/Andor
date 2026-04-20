'use client';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4L8 32H14L20 18L26 32H32L20 4Z" fill="#1E6FD9"/>
                  <path d="M12 28C12 28 16 24 20 24C24 24 28 28 28 28" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
                  <path d="M20 4V18" stroke="#D4A853" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </span>
              Andor
            </div>
            <p className={styles.brandDesc}>
              Your AI travel companion that plans, adapts, and guides your journey in real time. Discover the world, smarter.
            </p>
            <div className={styles.newsletter}>
              <input type="email" className={styles.newsletterInput} placeholder="Enter your email" />
              <button className={styles.newsletterBtn}>Subscribe</button>
            </div>
          </div>

          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Product</h4>
            <a className={styles.columnLink}>Features</a>
            <a className={styles.columnLink}>AI Planner</a>
            <a className={styles.columnLink}>Navigation</a>
            <a className={styles.columnLink}>Community</a>
            <a className={styles.columnLink}>Pricing</a>
          </div>

          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Company</h4>
            <a className={styles.columnLink}>About</a>
            <a className={styles.columnLink}>Blog</a>
            <a className={styles.columnLink}>Careers</a>
            <a className={styles.columnLink}>Press</a>
            <a className={styles.columnLink}>Contact</a>
          </div>

          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Legal</h4>
            <a className={styles.columnLink}>Privacy Policy</a>
            <a className={styles.columnLink}>Terms of Service</a>
            <a className={styles.columnLink}>Cookie Policy</a>
            <a className={styles.columnLink}>Licenses</a>
          </div>
        </div>

        <div className={styles.divider}></div>

        <div className={styles.bottom}>
          <span className={styles.copyright}>© 2026 Andor. All rights reserved.</span>
          <div className={styles.socialLinks}>
            <a className={styles.socialLink} aria-label="Twitter">𝕏</a>
            <a className={styles.socialLink} aria-label="Instagram">📷</a>
            <a className={styles.socialLink} aria-label="TikTok">🎵</a>
            <a className={styles.socialLink} aria-label="LinkedIn">in</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
