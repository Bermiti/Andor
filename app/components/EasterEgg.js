'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import styles from './EasterEgg.module.css';

/**
 * EasterEgg — Type "wanderlust" on the keyboard to trigger a
 * confetti explosion of ✈️ emojis and a surprise message.
 */

const TRIGGER_WORD = 'wanderlust';
const CONFETTI_COUNT = 50;
const EMOJIS = ['✈️', '🌍', '🗺️', '🏖️', '⛩️', '🏔️', '🌴', '🎒', '🧳', '🌅'];

export default function EasterEgg() {
  const [isActive, setIsActive] = useState(false);
  const [particles, setParticles] = useState([]);
  const bufferRef = useRef('');
  const timeoutRef = useRef(null);

  const triggerConfetti = useCallback(() => {
    const newParticles = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 2 + Math.random() * 2,
      rotation: Math.random() * 720 - 360,
      scale: 0.6 + Math.random() * 0.8,
    }));
    setParticles(newParticles);
    setIsActive(true);

    // Auto-dismiss after 5 seconds
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsActive(false);
      setParticles([]);
    }, 5000);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.target.isContentEditable) return;

      const key = e.key.toLowerCase();
      if (key.length !== 1) return;

      bufferRef.current += key;

      // Keep only the last N characters where N = trigger word length
      if (bufferRef.current.length > TRIGGER_WORD.length) {
        bufferRef.current = bufferRef.current.slice(-TRIGGER_WORD.length);
      }

      if (bufferRef.current === TRIGGER_WORD) {
        bufferRef.current = '';
        triggerConfetti();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [triggerConfetti]);

  if (!isActive) return null;

  return (
    <div className={styles.overlay}>
      {/* Confetti particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className={styles.particle}
          style={{
            left: `${p.x}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--rotation': `${p.rotation}deg`,
            '--scale': p.scale,
            fontSize: `${20 + p.scale * 12}px`,
          }}
        >
          {p.emoji}
        </span>
      ))}

      {/* Central message */}
      <div className={styles.message}>
        <div className={styles.messageIcon}>✈️</div>
        <h2 className={styles.messageTitle}>Wanderlust Activated!</h2>
        <p className={styles.messageText}>
          O mundo está à tua espera. Cada viagem é uma nova história por contar. 🌍
        </p>
        <button className={styles.dismissBtn} onClick={() => { setIsActive(false); setParticles([]); }}>
          Continuar a explorar →
        </button>
      </div>
    </div>
  );
}
