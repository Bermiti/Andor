'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './ComoFunciona.module.css';

const STEPS = [
  {
    icon: '1️⃣',
    title: 'Diz ao Andor para onde sonhas ir',
    desc: 'Escreve o destino dos teus sonhos, o estilo de viagem (aventura, cultura, romance) e o teu orçamento típico.'
  },
  {
    icon: '2️⃣',
    title: 'O AI planeia tudo em 30 segundos',
    desc: 'O nosso concierge cria um itinerário completo e otimizado com hotéis, voos reais e segredos locais.'
  },
  {
    icon: '3️⃣',
    title: 'Tu só tens de fazer as malas',
    desc: 'Exporta em PDF premium, partilha com amigos e começa a contagem decrescente para a tua aventura.'
  }
];

export default function ComoFunciona() {
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.section} id="como-funciona">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.label}>Simples & Rápido</span>
          <h2 className={styles.title}>Como funciona o Andor</h2>
          <p className={styles.subtitle}>
            Esquece semanas de planeamento e chatices. Cria a tua viagem de sonho em segundos.
          </p>
        </div>

        <div className={`${styles.stepsWrapper} ${inView ? styles.animated : ''}`}>
          {/* Connector Line using SVG dash offset animation */}
          <div className={styles.lineConnector}>
            <svg width="100%" height="4" viewBox="0 0 100 4" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '100%' }}>
              <path
                d="M 0,2 L 100,2"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="2"
                fill="none"
              />
              <path
                className={styles.svgPathProgress}
                d="M 0,2 L 100,2"
                stroke="var(--gold)"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </div>

          <div className={styles.grid}>
            {STEPS.map((step, idx) => (
              <div 
                key={idx} 
                className={`${styles.stepCard} ${inView ? styles.cardActive : ''}`}
                style={{ transitionDelay: `${idx * 200}ms` }}
              >
                <div className={styles.iconCircle}>
                  <span className={styles.icon}>{step.icon}</span>
                </div>
                <h3 className={styles.stepTitle}>
                  {step.title}
                </h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
