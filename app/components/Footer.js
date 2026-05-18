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
                <AndorLogo size={32} />
              </span>
              Andor
            </div>
            <p className={styles.brandDesc}>
              The elite travel orchestrator for the modern explorer. Redefining how the world moves with professional-grade AI precision.
            </p>
          </div>

          <div className={styles.linksGrid}>
            <div className={styles.column}>
              <h4 className={styles.columnTitle}>Product</h4>
              <a href="#features" className={styles.columnLink}>Intelligence</a>
              <a href="#planner" className={styles.columnLink}>Orchestrator</a>
              <a href="#pricing" className={styles.columnLink}>Enterprise</a>
            </div>

            <div className={styles.column}>
              <h4 className={styles.columnTitle}>Company</h4>
              <a className={styles.columnLink}>Manifesto</a>
              <a className={styles.columnLink}>Press Kit</a>
              <a className={styles.columnLink}>Join Us</a>
            </div>

            <div className={styles.column}>
              <h4 className={styles.columnTitle}>Newsletter</h4>
              <p className={styles.newsletterDesc}>Get weekly AI travel insights.</p>
              <div className={styles.newsletterBox}>
                <input type="email" placeholder="email@andor.ai" className={styles.newsletterInput} />
                <button className={styles.newsletterBtn}>→</button>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <div className={styles.legal}>
            <span>© 2026 ANDOR SYSTEMS.</span>
            <a className={styles.legalLink} href="#">PRIVACY</a>
            <a className={styles.legalLink} href="#">TERMS</a>
          </div>
          
          <div className={styles.socialLinks}>
            <a className={styles.socialLink} href="#">TWITTER</a>
            <a className={styles.socialLink} href="#">INSTAGRAM</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
