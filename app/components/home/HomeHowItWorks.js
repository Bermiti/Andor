'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './HomeHowItWorks.module.css';

export default function HomeHowItWorks() {
  const sectionRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Start animating when top of section enters viewport, finish when middle of section hits middle of viewport
      const start = viewportHeight;
      const end = viewportHeight / 2;
      const current = rect.top;
      
      let progress = (start - current) / (start - end);
      progress = Math.min(Math.max(progress, 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // init
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const steps = [
    { 
      num: '01', 
      title: 'Partilha a tua visão', 
      desc: 'Diz-nos para onde queres ir, o teu orçamento e quem viaja contigo. A IA capta o teu estilo instantaneamente.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
    },
    { 
      num: '02', 
      title: 'A IA desenha a magia', 
      desc: 'Num piscar de olhos, recebes um itinerário premium dia-a-dia. Rotas otimizadas, restaurantes incríveis e segredos locais.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
    },
    { 
      num: '03', 
      title: 'Viaja sem atrito', 
      desc: 'Leva o teu roteiro interativo no telemóvel. Se chover ou acordares tarde, a IA recalcula tudo em tempo real.',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
    }
  ];

  const pathLength = 1000;
  const strokeDashoffset = pathLength - (scrollProgress * pathLength);

  return (
    <section ref={sectionRef} className="section" style={{ position: 'relative', background: 'var(--bg-0)' }}>
      <div className="container">
        <div className="text-center animate-fade-in-up" style={{ marginBottom: '80px' }}>
          <span className="section-label">Como Funciona</span>
          <h2 className="section-title">O teu roteiro em segundos</h2>
        </div>

        <div className={styles.stepsContainer}>
          {/* Animated SVG Line */}
          <div className={styles.lineWrapper}>
            <svg className={styles.svgLine} preserveAspectRatio="none" viewBox="0 0 2 1000">
              <line x1="1" y1="0" x2="1" y2="1000" stroke="var(--b-2)" strokeWidth="2" />
              <line 
                x1="1" y1="0" x2="1" y2="1000" 
                stroke="var(--gold)" 
                strokeWidth="2" 
                strokeDasharray={pathLength}
                strokeDashoffset={strokeDashoffset}
                className={styles.animatedPath}
              />
            </svg>
          </div>

          {steps.map((step, i) => (
            <div key={i} className={styles.stepItem}>
              <div className={styles.stepIconWrapper}>
                <div className={`${styles.stepIcon} ${scrollProgress > (i * 0.33) ? styles.iconActive : ''}`}>
                  {step.icon}
                </div>
              </div>
              <div className={styles.stepContent}>
                <div className={styles.stepNum}>{step.num}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
