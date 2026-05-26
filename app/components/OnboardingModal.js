'use client';
import { useState, useEffect } from 'react';
import styles from './OnboardingModal.module.css';

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [persona, setPersona] = useState('');
  const [budget, setBudget] = useState('');

  useEffect(() => {
    try {
      const hasOnboarded = localStorage.getItem('andor_onboarded');
      const requested = new URLSearchParams(window.location.search).get('onboarding') === 'true';
      if (!hasOnboarded && requested) {
        setIsOpen(true);
      }
    } catch (error) {
      setIsOpen(false);
    }
  }, []);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else handleComplete();
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('andor_user', JSON.stringify({ name, persona, budget }));
      localStorage.setItem('andor_onboarded', 'true');
    } catch (error) {}
    setIsOpen(false);
  };

  const personas = [
    { id: 'adventurer', title: 'The Adventurer', icon: '🧗', desc: 'Thrill-seeker looking for action' },
    { id: 'culture', title: 'Culture Vulture', icon: '🏛️', desc: 'Deep dives into history & art' },
    { id: 'relaxer', title: 'The Relaxer', icon: '🏖️', desc: 'Chill vibes and luxury' },
    { id: 'foodie', title: 'The Foodie', icon: '🍝', desc: 'Traveling for the next great meal' }
  ];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.progress}>
          <div className={styles.progressBar} style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>

        {step === 1 && (
          <div className={styles.step}>
            <h2>Welcome to Andor</h2>
            <p>What should we call you?</p>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="Your name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {step === 2 && (
          <div className={styles.step}>
            <h2>Your Travel Persona</h2>
            <p>What kind of traveler are you, {name || 'friend'}?</p>
            <div className={styles.cards}>
              {personas.map(p => (
                <button 
                  key={p.id} 
                  className={`${styles.card} ${persona === p.id ? styles.cardActive : ''}`}
                  onClick={() => setPersona(p.id)}
                >
                  <span className={styles.cardIcon}>{p.icon}</span>
                  <span className={styles.cardTitle}>{p.title}</span>
                  <span className={styles.cardDesc}>{p.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.step}>
            <h2>Travel Budget</h2>
            <p>How do you typically spend?</p>
            <div className={styles.budgetOptions}>
              {['Shoestring', 'Moderate', 'Luxury', 'Whatever it takes'].map(b => (
                <button 
                  key={b} 
                  className={`${styles.budgetBtn} ${budget === b ? styles.budgetBtnActive : ''}`}
                  onClick={() => setBudget(b)}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.footer}>
          {step > 1 ? (
            <button className={styles.backBtn} onClick={() => setStep(step - 1)}>Back</button>
          ) : <div></div>}
          
          <button 
            className={styles.nextBtn} 
            onClick={handleNext}
            disabled={(step === 1 && !name) || (step === 2 && !persona) || (step === 3 && !budget)}
          >
            {step === 3 ? 'Start Exploring' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
