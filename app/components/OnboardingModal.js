'use client';

import { useState, useEffect } from 'react';
import styles from './OnboardingModal.module.css';
import { useToast } from './ToastProvider';

export default function OnboardingModal() {
  const { showToast } = useToast();
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
      showToast("Por favor, introduz o teu nome.", "info");
      return;
    }
    if (step === 2 && !travelerType) {
      showToast("Por favor, escolhe o teu perfil de viajante.", "info");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleFinish = (selectedBudget) => {
    const finalBudget = selectedBudget || budgetRange;
    if (!finalBudget) {
      showToast("Por favor, seleciona o teu orçamento.", "info");
      return;
    }

    const profile = {
      name,
      travelerType,
      budgetRange: finalBudget,
      createdDate: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      const email = `${name.toLowerCase().replace(/\s+/g, '')}@andortravels.com`;
      const newUser = {
        name,
        email,
        trips: [],
        role: 'user',
        profile
      };
      localStorage.setItem('andor_user', JSON.stringify(newUser));
      localStorage.setItem('userProfile', JSON.stringify(profile));
      localStorage.setItem('firstVisitDone', 'true');
      
      // Dispatch authentication change event and reload to propagate user info
      window.dispatchEvent(new Event('auth-state-change'));
      window.location.reload();
    }

    setShow(false);
  };

  if (!show) return null;

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
            <h2 className={styles.title}>Bem-vindo ao Andor 👋</h2>
            <p className={styles.subtitle}>O teu concierge de viagens pessoal. Antes de começar, diz-nos o teu nome.</p>
            <input
              type="text"
              placeholder="O teu nome"
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
            <h2 className={styles.title}>Que tipo de viajante és, {name}?</h2>
            <p className={styles.subtitle}>Escolhe o estilo que melhor te descreve.</p>
            <div className={styles.optionsGrid}>
              {[
                { key: 'Urbano', label: 'Explorador Urbano', emoji: '🏙️', desc: 'Cidades, cultura e gastronomia' },
                { key: 'Espirito', label: 'Espírito Livre', emoji: '🧘', desc: 'Natureza, aventura e experiências únicas' },
                { key: 'Curado', label: 'Viajante Curado', emoji: '💎', desc: 'Qualidade, conforto e momentos especiais' },
                { key: 'Eficiente', label: 'Nómada Eficiente', emoji: '⚡', desc: 'Muito mundo, orçamento inteligente' }
              ].map((opt) => (
                <button
                  type="button"
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
            <h2 className={styles.title}>Qual é o teu orçamento típico por viagem?</h2>
            <p className={styles.subtitle}>Seleciona o nível de investimento habitual para as tuas escapadelas.</p>
            <div className={styles.budgetList}>
              {[
                { key: '€', desc: 'Até €800' },
                { key: '€€', desc: '€800-2.000' },
                { key: '€€€', desc: '€2.000-5.000' },
                { key: '€€€€', desc: '€5.000+' }
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => setBudgetRange(opt.key)}
                  className={`${styles.budgetCard} ${budgetRange === opt.key ? styles.selectedCard : ''}`}
                >
                  <div className={styles.budgetHeader}>
                    <span className={styles.budgetValue}>{opt.key}</span>
                    <span className={styles.budgetDesc}>{opt.desc}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className={styles.btnRow}>
              <button onClick={() => setStep(2)} className={styles.backBtn}>Voltar</button>
              <button onClick={() => handleFinish(budgetRange)} className={styles.actionBtn}>
                Começar a Explorar →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
