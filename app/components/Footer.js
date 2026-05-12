'use client';
import styles from './Footer.module.css';
import AndorLogo from './AndorLogo';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>
                <AndorLogo size={36} />
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
            <a className={styles.socialLink} aria-label="Twitter" href="#">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a className={styles.socialLink} aria-label="Instagram" href="#">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a className={styles.socialLink} aria-label="TikTok" href="#">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.57 6.33 6.33 0 0 0 9.37 22a6.33 6.33 0 0 0 6.37-6.22V9.4a8.16 8.16 0 0 0 4.85 1.58V7.79a4.85 4.85 0 0 1-1-1.1z"/></svg>
            </a>
            <a className={styles.socialLink} aria-label="LinkedIn" href="#">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
