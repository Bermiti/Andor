'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './ComoFunciona.module.css';

const STEPS = [
  {
    icon: '✦',
    title: 'Diz-nos o que sonhas',
    desc: 'Descreve o teu destino, estilo de viagem, orçamento ou restrições alimentares. O Andor entende tudo.'
  },
  {
    icon: '⚡',
    title: 'O Andor planeia tudo',
    desc: 'O nosso concierge de inteligência sobre-humana gera itinerários completos hora-a-hora em segundos.'
  },
  {
    icon: '✈️',
    title: 'Tu só tens de partir',
    desc: 'Guarda nos teus favoritos, envia para os teus amigos, exporta para PDF e começa a viver a aventura.'
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
            Esquece semanas de pesquisa e chatices. Planeia a tua viagem ideal em apenas três passos.
          </p>
        </div>

        <div className={`${styles.stepsWrapper} ${inView ? styles.animated : ''}`}>
          {/* Connector Line */}
          <div className={styles.lineConnector}>
            <div className={styles.lineProgress} />
          </div>

          <div className={styles.grid}>
            {STEPS.map((step, idx) => (
              <div 
                key={idx} 
                className={`${styles.stepCard} ${inView ? styles.cardActive : ''}`}
                style={{ transitionDelay: `${idx * 250}ms` }}
              >
                <div className={styles.iconCircle}>
                  <span className={styles.icon}>{step.icon}</span>
                </div>
                <h3 className={styles.stepTitle}>
                  <span className={styles.stepNumber}>0{idx + 1}.</span> {step.title}
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
