'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './Hero.module.css';

function AnimatedCounter({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = performance.now();
          const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function Hero() {
  const canvasRef = useRef(null);

  const handleScroll = (e, targetId) => {
    e.preventDefault();
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Particle star field
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const createParticles = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      particles = Array.from({ length: 40 }, () => ({ // Reduced from 60
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.4, // Slightly smaller
        dx: (Math.random() - 0.5) * 0.15, // Slower
        dy: (Math.random() - 0.5) * 0.15, // Slower
        opacity: Math.random() * 0.3 + 0.1, // Softer
        pulse: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        p.pulse += 0.015; // Slower pulsing
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        const o = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(58, 142, 246, ${o})`;
        ctx.fill();
      });
      animationId = requestAnimationFrame(draw);
    };

    resize();
    createParticles();
    draw();
    window.addEventListener('resize', () => { resize(); createParticles(); });
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <section className={styles.hero} id="hero">
      <div className={styles.heroBg}>
        <canvas ref={canvasRef} className={styles.particleCanvas} />
        <div className={`${styles.gradientOrb} ${styles.orb1}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb2}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb3}`}></div>
        <div className={styles.grid}></div>
      </div>

      <div className={styles.content}>
        <div className={styles.textSide}>
          <div className={`${styles.badge} animate-fade-in-up`}>
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1L10 5.5L15 6.5L11.5 10L12.5 15L8 12.5L3.5 15L4.5 10L1 6.5L6 5.5L8 1Z"/></svg>
            AI-Powered Travel Companion
          </div>

          <h1 className={`${styles.title} animate-fade-in-up animate-delay-1`}>
            Explore the world with{' '}
            <span className={styles.titleGradient}>Andor.</span>
          </h1>

          <p className={`${styles.subtitle} animate-fade-in-up animate-delay-2`}>
            Plan, adapt, and navigate your journey in real time. Andor is the smartest travel companion that creates personalized itineraries and guides you every step of the way.
          </p>

          <div className={`${styles.heroCtas} animate-fade-in-up animate-delay-3`}>
            <a href="#planner" onClick={(e) => handleScroll(e, 'planner')} className={`btn btn-primary btn-lg ${styles.ctaShimmer}`}>
              Start Planning
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 10H15M15 10L10 5M15 10L10 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a href="#features" onClick={(e) => handleScroll(e, 'features')} className="btn btn-secondary btn-lg" style={{background: 'rgba(255,255,255,0.08)', color: '#CBD5E1', border: '1px solid rgba(255,255,255,0.12)'}}>
              See How It Works
            </a>
          </div>

          <div className={`${styles.stats} animate-fade-in-up animate-delay-5`}>
            <div className={styles.stat}>
              <span className={styles.statValue}><AnimatedCounter end={50} suffix="K+" /></span>
              <span className={styles.statLabel}>Trips Planned</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}><AnimatedCounter end={120} suffix="+" /></span>
              <span className={styles.statLabel}>Countries</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                <AnimatedCounter end={49} suffix="" duration={2500} />
                <span style={{ fontSize: '0.6em', verticalAlign: 'super', marginLeft: '2px' }}>★</span>
              </span>
              <span className={styles.statLabel}>User Rating</span>
            </div>
          </div>
        </div>

        <div className={`${styles.visualSide} animate-fade-in-up animate-delay-3`}>
          <div className={styles.phoneMockup}>
            <div className={styles.phoneScreen}>
              <div className={styles.phoneHeader}>
                <span className={styles.phoneTime}>9:41</span>
                <div className={styles.phoneIcons}>
                  <span></span><span></span><span></span>
                </div>
              </div>
              <div className={styles.phoneGreeting}>Good morning! ☀️</div>
              <div className={styles.phoneSubtext}>Where shall we explore today?</div>
              <div className={styles.phoneSearch}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#64748B" strokeWidth="1.5"/><path d="M11 11L14 14" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <span>Search destinations...</span>
              </div>
              <div className={styles.phoneCards}>
                <div className={styles.phoneCard}>
                  <div className={styles.phoneCardImg} style={{background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)'}}></div>
                  <div className={styles.phoneCardInfo}>
                    <span className={styles.phoneCardTitle}>Lisbon, Portugal</span>
                    <span className={styles.phoneCardSub}>3 days • Cultural</span>
                    <span className={styles.phoneCardPrice}>From €89/day</span>
                  </div>
                </div>
                <div className={styles.phoneCard}>
                  <div className={styles.phoneCardImg} style={{background: 'linear-gradient(135deg, #4ECDC4, #7EDDD6)'}}></div>
                  <div className={styles.phoneCardInfo}>
                    <span className={styles.phoneCardTitle}>Barcelona, Spain</span>
                    <span className={styles.phoneCardSub}>5 days • Adventure</span>
                    <span className={styles.phoneCardPrice}>From €72/day</span>
                  </div>
                </div>
                <div className={styles.phoneCard}>
                  <div className={styles.phoneCardImg} style={{background: 'linear-gradient(135deg, #6C5CE7, #a085ed)'}}></div>
                  <div className={styles.phoneCardInfo}>
                    <span className={styles.phoneCardTitle}>Paris, France</span>
                    <span className={styles.phoneCardSub}>4 days • Romantic</span>
                    <span className={styles.phoneCardPrice}>From €110/day</span>
                  </div>
                </div>
              </div>
              <div className={styles.phoneLive}>
                <span className={styles.phoneLiveDot}></span>
                Live
              </div>
            </div>
          </div>

          <div className={`${styles.floatingCard} ${styles.floatingCard1}`}>
            <div className={styles.floatIcon} style={{background: '#EBF5FF'}}>🗺️</div>
            <div className={styles.floatText}>
              <span className={styles.floatTitle}>Route Optimized</span>
              <span className={styles.floatSub}>Saved 45 min</span>
            </div>
          </div>

          <div className={`${styles.floatingCard} ${styles.floatingCard2}`}>
            <div className={styles.floatIcon} style={{background: '#FFF7ED'}}>⚡</div>
            <div className={styles.floatText}>
              <span className={styles.floatTitle}>AI Adapted</span>
              <span className={styles.floatSub}>Rain → Indoor plan</span>
            </div>
          </div>

          <div className={`${styles.floatingCard} ${styles.floatingCard3}`}>
            <div className={styles.floatIcon} style={{background: '#F0FDF4'}}>💰</div>
            <div className={styles.floatText}>
              <span className={styles.floatTitle}>Budget: 68%</span>
              <span className={styles.floatSub}>On track</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.waveBottom}>
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0 40C240 10 480 70 720 40C960 10 1200 70 1440 40V80H0V40Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
}
