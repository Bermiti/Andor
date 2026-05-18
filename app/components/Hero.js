'use client';
import styles from './Hero.module.css';

export default function Hero() {
  const handleScroll = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className={styles.hero} id="hero">
      {/* The Caravan Background — Restored from Prototype */}
      <div className={styles.heroBg}>
        <div className={styles.bgImage}></div>
        <div className={styles.bgOverlay}></div>
      </div>

      <div className={styles.content}>
        <div className={styles.textSide}>
          <div className={`${styles.badge} animate-fade-in-up`}>
            ✨ The World's First Autonomous AI Travel Agency
          </div>

          <h1 className={`${styles.title} animate-fade-in-up`}>
            Bespoke Journeys, <span className="gradient-text">AI Orchestrated.</span>
          </h1>

          <p className={`${styles.subtitle} animate-fade-in-up`}>
            Andor is your elite digital travel agent. We design, deploy, and manage 
            high-fidelity itineraries and group financials with autonomous precision.
          </p>

          <div className={styles.heroCtas}>
            <a href="#planner" onClick={(e) => handleScroll(e, 'planner')} className="btn btn-primary">
              Start Mission
            </a>
            <a href="#features" onClick={(e) => handleScroll(e, 'features')} className="btn btn-secondary">
              Explore Tech
            </a>
          </div>
        </div>

        <div className={styles.visualSide}>
          {/* Main Visual Image - Tilted Premium Look */}
          <div className={styles.imageStack}>
            <img 
              src="https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=1200" 
              alt="Van Life" 
              className={styles.mainVisual}
            />
            
            {/* Floating Interaction Cards */}
            <div className={`${styles.floatingCard} ${styles.card1}`}>
              <div className={styles.cardIcon}>🏞️</div>
              <div className={styles.cardText}>
                <span className={styles.cardTitle}>Swiss Alps</span>
                <span className={styles.cardSub}>Route optimized</span>
              </div>
            </div>

            <div className={`${styles.floatingCard} ${styles.card2}`}>
              <div className={styles.cardIcon}>⛽</div>
              <div className={styles.cardText}>
                <span className={styles.cardTitle}>Smart Fuel</span>
                <span className={styles.cardSub}>Next stop: 14km</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
