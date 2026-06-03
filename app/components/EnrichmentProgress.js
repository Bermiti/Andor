'use client';

import { useEffect, useState } from 'react';
import styles from './EnrichmentProgress.module.css';
import { Loader2, Sparkles, Check, Globe, Utensils, MapPin } from 'lucide-react';

export default function EnrichmentProgress({ status }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { key: 'geocode', label: 'Verificando coordenadas reais', icon: <MapPin size={14} /> },
    { key: 'activities', label: 'Enriquecendo detalhes culturais e horários', icon: <Globe size={14} /> },
    { key: 'restaurants', label: 'Sugerindo experiências gastronómicas locais', icon: <Utensils size={14} /> }
  ];

  const getStepStatus = (stepKey) => {
    if (status === 'complete') return 'done';
    if (status === 'error') return 'error';
    
    // Simple state sequence simulation or based on state
    if (stepKey === 'geocode') {
      return status === 'pending' || status === 'geocoding' ? 'loading' : 'done';
    }
    if (stepKey === 'activities') {
      return status === 'geocoding' ? 'pending' : status === 'activities' ? 'loading' : status === 'complete' ? 'done' : 'pending';
    }
    if (stepKey === 'restaurants') {
      return status === 'complete' ? 'done' : status === 'restaurants' ? 'loading' : 'pending';
    }
    return 'pending';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Sparkles size={18} className={styles.sparkleIcon} />
        <span className={styles.title}>Enriquecimento em Tempo Real{dots}</span>
      </div>
      <p className={styles.subtitle}>
        O Andor está a contactar parceiros locais (Wikipedia, Foursquare, OTM) para trazer informações reais para a sua viagem.
      </p>

      <div className={styles.steps}>
        {steps.map((step) => {
          const stepStatus = getStepStatus(step.key);
          return (
            <div key={step.key} className={`${styles.step} ${styles[stepStatus]}`}>
              <div className={styles.stepIconContainer}>
                {stepStatus === 'loading' ? (
                  <Loader2 size={14} className={styles.spinner} />
                ) : stepStatus === 'done' ? (
                  <Check size={12} className={styles.checkIcon} />
                ) : (
                  step.icon
                )}
              </div>
              <span className={styles.stepLabel}>{step.label}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.skeletons}>
        <div className={styles.skeletonCard}>
          <div className={styles.skeletonThumb}></div>
          <div className={styles.skeletonContent}>
            <div className={styles.skeletonTitle}></div>
            <div className={styles.skeletonMeta}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
