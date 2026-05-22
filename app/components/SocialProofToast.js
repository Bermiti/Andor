'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './SocialProofToast.module.css';

const proofData = [
  { name: 'João M.', city: 'Lisboa', dest: 'Tokyo', flag: '🇯🇵', time: '2 min atrás' },
  { name: 'Sarah K.', city: 'London', dest: 'Bali', flag: '🇮🇩', time: '5 min atrás' },
  { name: 'Maria S.', city: 'Porto', dest: 'Barcelona', flag: '🇪🇸', time: '8 min atrás' },
  { name: 'Carlos R.', city: 'Madrid', dest: 'Maldivas', flag: '🇲🇻', time: '12 min atrás' },
  { name: 'Ana L.', city: 'São Paulo', dest: 'Paris', flag: '🇫🇷', time: '15 min atrás' },
  { name: 'Marco V.', city: 'Roma', dest: 'Santorini', flag: '🇬🇷', time: '3 min atrás' },
  { name: 'Sophie B.', city: 'Paris', dest: 'Lisboa', flag: '🇵🇹', time: '7 min atrás' },
  { name: 'Yuki T.', city: 'Tokyo', dest: 'Nova York', flag: '🇺🇸', time: '1 min atrás' },
  { name: 'Pedro A.', city: 'Faro', dest: 'Suíça', flag: '🇨🇭', time: '10 min atrás' },
  { name: 'Emma W.', city: 'Berlin', dest: 'Açores', flag: '🇵🇹', time: '4 min atrás' },
];

const DISMISS_KEY = 'andor_toast_dismissed';
const MAX_DISMISSALS = 3;

function getRandomInterval() {
  return (Math.random() * 15 + 30) * 1000; // 30-45 seconds
}

export default function SocialProofToast() {
  const [currentProof, setCurrentProof] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const indexRef = useRef(0);
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const mountedRef = useRef(true);

  // Check localStorage dismissal count on mount
  useEffect(() => {
    try {
      const count = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
      if (count >= MAX_DISMISSALS) {
        setDismissed(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const hideToast = useCallback(() => {
    setIsExiting(true);
    hideTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setCurrentProof(null);
        setIsExiting(false);
      }
    }, 400); // match slideOut duration
  }, []);

  const showNextToast = useCallback(() => {
    if (!mountedRef.current) return;

    const proof = proofData[indexRef.current % proofData.length];
    indexRef.current += 1;

    setCurrentProof(proof);
    setIsExiting(false);

    // Auto-hide after 5 seconds
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        hideToast();
      }
    }, 5000);

    // Schedule next toast
    clearTimeout(showTimerRef.current);
    showTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        showNextToast();
      }
    }, getRandomInterval());
  }, [hideToast]);

  useEffect(() => {
    if (dismissed) return;

    mountedRef.current = true;

    // Show first toast after a short initial delay (8-12s)
    const initialDelay = (Math.random() * 4 + 8) * 1000;
    showTimerRef.current = setTimeout(showNextToast, initialDelay);

    return () => {
      mountedRef.current = false;
      clearTimeout(showTimerRef.current);
      clearTimeout(hideTimerRef.current);
    };
  }, [dismissed, showNextToast]);

  const handleDismiss = useCallback(() => {
    hideToast();
    try {
      const current = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
      const newCount = current + 1;
      localStorage.setItem(DISMISS_KEY, String(newCount));
      if (newCount >= MAX_DISMISSALS) {
        setDismissed(true);
        clearTimeout(showTimerRef.current);
      }
    } catch {
      // localStorage unavailable
    }
  }, [hideToast]);

  if (dismissed || !currentProof) return null;

  const initial = currentProof.name.charAt(0).toUpperCase();

  return (
    <div className={styles.toastContainer}>
      <div className={`${styles.toast} ${isExiting ? styles.exiting : ''}`}>
        <div className={styles.avatar}>{initial}</div>
        <div className={styles.content}>
          <div className={styles.mainText}>
            <strong>{currentProof.name}</strong> de {currentProof.city} acabou de reservar{' '}
            <span className={styles.destHighlight}>{currentProof.dest} {currentProof.flag}</span>
          </div>
          <div className={styles.timeText}>{currentProof.time}</div>
        </div>
        <button
          className={styles.closeBtn}
          onClick={handleDismiss}
          aria-label="Fechar notificação"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
