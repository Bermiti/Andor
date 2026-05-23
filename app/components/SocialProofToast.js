'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import styles from './SocialProofToast.module.css';

const notifications = [
  { name: "João", city: "Lisboa", dest: "Tokyo 🇯🇵", time: "agora mesmo" },
  { name: "Sara", city: "Porto", dest: "Bali 🇮🇩", time: "há 2 min" },
  { name: "Rui", city: "Braga", dest: "Paris 🇫🇷", time: "há 3 min" },
  { name: "Marta", city: "Faro", dest: "Nova Iorque 🇺🇸", time: "há 5 min" },
  { name: "André", city: "Coimbra", dest: "Marrocos 🇲🇦", time: "há 7 min" },
  { name: "Catarina", city: "Aveiro", dest: "Maldivas 🇲🇻", time: "há 8 min" },
  { name: "Tiago", city: "Setúbal", dest: "Bangkok 🇹🇭", time: "há 10 min" },
  { name: "Beatriz", city: "Évora", dest: "Santorini 🇬🇷", time: "há 12 min" },
];

function getRandomInterval() {
  return (Math.random() * 15 + 35) * 1000; // 35-50 seconds
}

export default function SocialProofToast() {
  const pathname = usePathname();
  const [currentProof, setCurrentProof] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const indexRef = useRef(0);
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const mountedRef = useRef(true);

  // Check if current page is homepage or destination page
  const shouldShow = pathname === '/' || (pathname && pathname.startsWith('/destination/'));

  const hideToast = useCallback(() => {
    setIsExiting(true);
    hideTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setCurrentProof(null);
        setIsExiting(false);
      }
    }, 500); // match slideOut animation duration
  }, []);

  const showNextToast = useCallback(() => {
    if (!mountedRef.current) return;

    // Pick a notification
    const proof = notifications[indexRef.current % notifications.length];
    indexRef.current += 1;

    setCurrentProof(proof);
    setIsExiting(false);

    // Auto-hide after 4 seconds
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        hideToast();
      }
    }, 4000);

    // Schedule next toast
    clearTimeout(showTimerRef.current);
    showTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        showNextToast();
      }
    }, getRandomInterval());
  }, [hideToast]);

  useEffect(() => {
    mountedRef.current = true;

    if (!shouldShow) {
      setCurrentProof(null);
      clearTimeout(showTimerRef.current);
      clearTimeout(hideTimerRef.current);
      return;
    }

    // Initial delay before showing first toast (e.g. 10 seconds)
    const initialDelay = 10000;
    showTimerRef.current = setTimeout(showNextToast, initialDelay);

    return () => {
      mountedRef.current = false;
      clearTimeout(showTimerRef.current);
      clearTimeout(hideTimerRef.current);
    };
  }, [shouldShow, showNextToast]);

  if (!shouldShow || !currentProof) return null;

  return (
    <div className={styles.toastContainer}>
      <div className={`${styles.toast} ${isExiting ? styles.exiting : ''}`}>
        <span className={styles.pulseDot}>🟢</span>
        <div className={styles.content}>
          <span className={styles.mainText}>
            <strong>{currentProof.name}</strong> de {currentProof.city} acabou de planear{' '}
            <strong className={styles.destHighlight}>{currentProof.dest}</strong>
          </span>
          <span className={styles.separator}> · </span>
          <span className={styles.timeText}>{currentProof.time}</span>
        </div>
      </div>
    </div>
  );
}

