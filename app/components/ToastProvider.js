'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import styles from './ToastProvider.module.css';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, isPaused: false }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pauseToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isPaused: true } : t))
    );
  }, []);

  const resumeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isPaused: false } : t))
    );
  }, []);

  return (
    <ToastContext.Provider value={{ showToast: addToast }}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
            onPause={() => pauseToast(toast.id)}
            onResume={() => resumeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose, onPause, onResume }) {
  const { id, message, type, isPaused } = toast;
  const timerRef = useRef(null);
  const timeLeftRef = useRef(4000);
  const startTimeRef = useRef(Date.now());

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onClose();
    }, timeLeftRef.current);
  }, [onClose]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  const handleMouseEnter = () => {
    onPause();
    clearTimer();
    const elapsed = Date.now() - startTimeRef.current;
    timeLeftRef.current = Math.max(0, timeLeftRef.current - elapsed);
  };

  const handleMouseLeave = () => {
    onResume();
    if (timeLeftRef.current > 0) {
      startTimer();
    }
  };

  // Icon chooser
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <span className={styles.toastIcon}>✅</span>;
      case 'error':
        return <span className={styles.toastIcon}>❌</span>;
      case 'info':
        return <span className={styles.toastIcon}>💡</span>;
      case 'premium':
        return <span className={styles.toastIcon}>⭐</span>;
      default:
        return <span className={styles.toastIcon}>🔔</span>;
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success':
        return styles.success;
      case 'error':
        return styles.error;
      case 'info':
        return styles.info;
      case 'premium':
        return styles.premium;
      default:
        return '';
    }
  };

  return (
    <div
      className={`${styles.toastItem} ${getTypeClass()}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
    >
      {getIcon()}
      <div className={styles.toastContent}>{message}</div>
      <button className={styles.toastCloseBtn} onClick={onClose} aria-label="Fechar">
        &times;
      </button>
      <div className={styles.progressBarWrapper}>
        <div 
          className={styles.progressBar} 
          style={{ 
            animationDuration: '4000ms',
            animationPlayState: isPaused ? 'paused' : 'running'
          }}
        />
      </div>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
