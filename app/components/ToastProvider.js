'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  memo,
} from 'react';
import styles from './ToastProvider.module.css';

const ToastContext = createContext(null);

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 4000;

const ICON_MAP = {
  success: '✅',
  error: '❌',
  info: '💡',
  premium: '⭐',
  warning: '⚠️',
};

const TYPE_CLASS_MAP = {
  success: styles.success,
  error: styles.error,
  info: styles.info,
  premium: styles.premium,
  warning: styles.warning,
};

/* ─── Provider ─────────────────────────────────────────── */

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idCounter = useRef(0);

  const showToast = useCallback((message, type = 'info') => {
    const id = `toast-${++idCounter.current}-${Date.now()}`;
    setToasts((prev) => {
      const next = [...prev, { id, message, type, phase: 'entering' }];
      // If exceeding max, start exiting the oldest visible ones
      const visible = next.filter((t) => t.phase !== 'exiting');
      if (visible.length > MAX_VISIBLE) {
        const excess = visible.length - MAX_VISIBLE;
        let marked = 0;
        return next.map((t) => {
          if (marked < excess && t.phase !== 'exiting') {
            marked++;
            return { ...t, phase: 'exiting' };
          }
          return t;
        });
      }
      return next;
    });
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, phase: 'exiting' } : t))
    );
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markVisible = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id && t.phase === 'entering' ? { ...t, phase: 'visible' } : t))
    );
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className={styles.toastContainer}
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={dismiss}
            onRemove={remove}
            onEntered={markVisible}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ─── Toast Item ───────────────────────────────────────── */

const ToastItem = memo(function ToastItem({ toast, onDismiss, onRemove, onEntered }) {
  const { id, message, type, phase } = toast;
  const timerRef = useRef(null);
  const timeLeftRef = useRef(AUTO_DISMISS_MS);
  const startTimeRef = useRef(null);
  const itemRef = useRef(null);

  // Mark as visible after enter animation completes
  useEffect(() => {
    if (phase === 'entering') {
      const el = itemRef.current;
      if (!el) return;
      const handler = () => onEntered(id);
      el.addEventListener('animationend', handler, { once: true });
      return () => el.removeEventListener('animationend', handler);
    }
  }, [phase, id, onEntered]);

  // Remove from DOM after exit animation completes
  useEffect(() => {
    if (phase === 'exiting') {
      const el = itemRef.current;
      if (!el) {
        onRemove(id);
        return;
      }
      const handler = () => onRemove(id);
      el.addEventListener('animationend', handler, { once: true });
      // Fallback in case animationend doesn't fire
      const fallback = setTimeout(handler, 300);
      return () => {
        el.removeEventListener('animationend', handler);
        clearTimeout(fallback);
      };
    }
  }, [phase, id, onRemove]);

  // Auto-dismiss timer — only runs while phase === 'visible'
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onDismiss(id);
    }, timeLeftRef.current);
  }, [onDismiss, id]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (phase === 'visible') {
      startTimer();
      return clearTimer;
    }
  }, [phase, startTimer, clearTimer]);

  // Cleanup on unmount
  useEffect(() => clearTimer, [clearTimer]);

  const handleMouseEnter = () => {
    clearTimer();
    if (startTimeRef.current !== null) {
      const elapsed = Date.now() - startTimeRef.current;
      timeLeftRef.current = Math.max(0, timeLeftRef.current - elapsed);
    }
  };

  const handleMouseLeave = () => {
    if (phase === 'visible' && timeLeftRef.current > 0) {
      startTimer();
    }
  };

  const handleClose = () => {
    clearTimer();
    onDismiss(id);
  };

  const icon = ICON_MAP[type] || ICON_MAP.info;
  const typeClass = TYPE_CLASS_MAP[type] || '';

  const phaseClass =
    phase === 'entering'
      ? styles.entering
      : phase === 'exiting'
        ? styles.exiting
        : '';

  const isPaused = phase !== 'visible';

  return (
    <div
      ref={itemRef}
      className={`${styles.toastItem} ${typeClass} ${phaseClass}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseEnter}
      onTouchEnd={handleMouseLeave}
      role="alert"
      aria-atomic="true"
    >
      <span className={styles.toastIcon} aria-hidden="true">
        {icon}
      </span>
      <div className={styles.toastContent}>{message}</div>
      <button
        className={styles.toastCloseBtn}
        onClick={handleClose}
        aria-label="Dismiss notification"
        type="button"
      >
        &times;
      </button>
      <div className={styles.progressBarWrapper} aria-hidden="true">
        <div
          className={styles.progressBar}
          style={{
            animationDuration: `${AUTO_DISMISS_MS}ms`,
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        />
      </div>
    </div>
  );
});

/* ─── Hook ─────────────────────────────────────────────── */

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
