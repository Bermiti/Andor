'use client';

import { useState, useEffect } from 'react';
import styles from './OnboardingModal.module.css';

export default function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [travelerType, setTravelerType] = useState('');
  const [budgetRange, setBudgetRange] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDone = localStorage.getItem('firstVisitDone');
      if (!isDone) {
        setShow(true);
      }
    }
  }, []);

  if (!show) return null;

  const handleNext = () => {
    if (step === 1 && !name.trim()) {
      alert("Por favor, introduz o teu nome.");
      return;
    }
    if (step === 2 && !travelerType) {
      alert("Por favor, escolhe o teu perfil de viajante.");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleFinish = (selectedBudget) => {
    const finalBudget = selectedBudget || budgetRange;
    if (!finalBudget) {
      alert("Por favor, escolhe o teu orçamento típico.");
      return;
    }

    const profile = {
      name,
      travelerType,
      budgetRange: finalBudget,
      createdDate: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('userProfile', JSON.stringify(profile));
      localStorage.setItem('firstVisitDone', 'true');
    }

    setShow(false);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Progress Bar */}
        <div className={styles.progressBar}>
          <div className={`${styles.progressSegment} ${step >= 1 ? styles.active : ''}`} />
          <div className={`${styles.progressSegment} ${step >= 2 ? styles.active : ''}`} />
          <div className={`${styles.progressSegment} ${step >= 3 ? styles.active : ''}`} />
        </div>

        {step === 1 && (
          <div className={styles.stepContent}>
            <span className={styles.badge}>Passo 1 de 3</span>
            <h2 className={styles.title}>Como te chamas?</h2>
            <p className={styles.subtitle}>Queremos personalizar a tua experiência ao detalhe.</p>
            <input
              type="text"
              placeholder="O teu nome..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.textInput}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            />
            <button onClick={handleNext} className={styles.actionBtn}>
              Continuar →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className={styles.stepContent}>
            <span className={styles.badge}>Passo 2 de 3</span>
            <h2 className={styles.title}>Que tipo de viajante és?</h2>
            <p className={styles.subtitle}>Escolhe o estilo que melhor te descreve.</p>
            <div className={styles.optionsGrid}>
              {[
                { key: 'Aventureiro', label: 'Aventureiro', emoji: '🏔️', desc: 'Trilhos, natureza e adrenalina' },
                { key: 'Gourmet', label: 'Gourmet', emoji: '🍽️', desc: 'Mercados locais e alta gastronomia' },
                { key: 'Cultural', label: 'Cultural', emoji: '🏛️', desc: 'Museus, história e monumentos' },
                { key: 'Relaxar', label: 'Relaxar', emoji: '🏖️', desc: 'Praias, spas e slow living' }
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setTravelerType(opt.key)}
                  className={`${styles.optionCard} ${travelerType === opt.key ? styles.selectedCard : ''}`}
                >
                  <span className={styles.optionEmoji}>{opt.emoji}</span>
                  <div className={styles.optionInfo}>
                    <span className={styles.optionLabel}>{opt.label}</span>
                    <span className={styles.optionDesc}>{opt.desc}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className={styles.btnRow}>
              <button onClick={() => setStep(1)} className={styles.backBtn}>Voltar</button>
              <button onClick={handleNext} className={styles.actionBtn}>Continuar →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.stepContent}>
            <span className={styles.badge}>Passo 3 de 3</span>
            <h2 className={styles.title}>Qual é o teu orçamento típico?</h2>
            <p className={styles.subtitle}>Ajudar-nos-á a desenhar as melhores experiências para a tua carteira.</p>
            <div className={styles.budgetList}>
              {[
                { key: '0-500', label: '€0 - 500', desc: 'Viajante Económico (Restrições criativas)' },
                { key: '500-1500', label: '€500 - 1500', desc: 'Viajante Moderado (Melhor relação custo-benefício)' },
                { key: '1500-4000', label: '€1500 - 4000', desc: 'Viajante Premium (Hotéis boutique e experiências ricas)' },
                { key: '4000+', label: '€4000+', desc: 'Viajante de Luxo (Conforto absoluto e exclusividade)' }
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleFinish(opt.key)}
                  className={styles.budgetCard}
                >
                  <div className={styles.budgetHeader}>
                    <span className={styles.budgetValue}>{opt.label}</span>
                    <span className={styles.budgetDesc}>{opt.desc}</span>
                  </div>
                  <span className={styles.arrowIcon}>→</span>
                </button>
              ))}
            </div>
            <div className={styles.btnRow}>
              <button onClick={() => setStep(2)} className={styles.backBtn}>Voltar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
