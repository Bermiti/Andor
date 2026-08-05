'use client';

import { useState, useEffect } from 'react';
import { Sliders, X, Trash2, Check, RefreshCw, Info } from 'lucide-react';
import {
  getTravelPersona,
  updateTravelPersona,
  resetTravelPersona,
  summarizePersonaForUser,
} from '../lib/travel-persona';
import styles from './PreferencesDrawer.module.css';

export default function PreferencesDrawer({ isOpen, onClose }) {
  const [persona, setPersona] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setPersona(getTravelPersona());
    }
  }, [isOpen]);

  if (!isOpen || !persona) return null;

  const handlePaceChange = (pace) => {
    const next = updateTravelPersona({ pace });
    setPersona(next);
  };

  const handleBudgetChange = (budgetTier) => {
    const next = updateTravelPersona({ budgetTier });
    setPersona(next);
  };

  const handleStyleChange = (travelStyle) => {
    const next = updateTravelPersona({ travelStyle });
    setPersona(next);
  };

  const handleReset = () => {
    const next = resetTravelPersona();
    setPersona(next);
  };

  const summary = summarizePersonaForUser(persona);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <Sliders size={18} className={styles.icon} />
            <h3 className={styles.title}>As Minhas Preferências de Viagem</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <p className={styles.description}>
            A Andor aprende progressivamente com o teu estilo de viagem. Podes ajustar ou apagar o teu perfil a qualquer momento.
          </p>

          {/* Summary Bullets */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>O que a Andor sabe sobre ti:</div>
            <div className={styles.summaryList}>
              {summary.map((item, index) => (
                <div key={index} className={styles.summaryItem}>
                  <div className={styles.bulletDot} />
                  <span>{item.text}</span>
                  {item.isLearned && <span className={styles.learnedBadge}>Inferido</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Manual Preferences Controls */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Ritmo habitual:</div>
            <div className={styles.optionsGrid}>
              {[
                { id: 'relaxed', label: 'Tranquilo & Calmo' },
                { id: 'balanced', label: 'Equilibrado' },
                { id: 'fast', label: 'Intenso (Ver tudo)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  className={`${styles.optBtn} ${persona.pace === opt.id ? styles.activeOpt : ''}`}
                  onClick={() => handlePaceChange(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Nível de orçamento:</div>
            <div className={styles.optionsGrid}>
              {[
                { id: 'economic', label: 'Económico' },
                { id: 'moderate', label: 'Equilibrado' },
                { id: 'luxury', label: 'Conforto Superior' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  className={`${styles.optBtn} ${persona.budgetTier === opt.id ? styles.activeOpt : ''}`}
                  onClick={() => handleBudgetChange(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Estilo de Viagem:</div>
            <div className={styles.optionsGrid}>
              {[
                { id: 'local_authentic', label: 'Autêntico & Local' },
                { id: 'popular_highlights', label: 'Locais Icónicos' },
                { id: 'hidden_gems', label: 'Segredos Escondidos' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  className={`${styles.optBtn} ${persona.travelStyle === opt.id ? styles.activeOpt : ''}`}
                  onClick={() => handleStyleChange(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.resetBtn} onClick={handleReset}>
            <Trash2 size={14} />
            <span>Reiniciar Preferências</span>
          </button>
          <button className={styles.saveBtn} onClick={onClose}>
            <span>Guardar & Fechar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
