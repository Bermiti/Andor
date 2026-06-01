'use client';

import { createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ToastProvider.module.css';

const ToastContext = createContext(null);
const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 4000;
const TYPES = new Set(['success', 'error', 'warning', 'info']);

const ICONS = {
  success: 'OK',
  error: '!',
  warning: '!',
  info: 'i',
};

export function ToastProvider({ children }) {
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState([]);
  const idCounter = useRef(0);

  useEffect(() => setMounted(true), []);

  const promoteNext = useCallback((items) => {
    const activeCount = items.filter((toast) => toast.phase !== 'queued' && toast.phase !== 'exiting').length;
    if (activeCount >= MAX_VISIBLE) return items;

    let promoted = false;
    return items.map((toast) => {
      if (!promoted && toast.phase === 'queued') {
        promoted = true;
        return { ...toast, phase: 'entering' };
      }
      return toast;
    });
  }, []);

  const showToast = useCallback((message, type = 'info', options = {}) => {
    if (!message) return null;
    if (typeof type === 'object') {
      options = type;
      type = 'info';
    }

    const normalizedType = TYPES.has(type) ? type : 'info';
    const duration = Number.isFinite(options.duration) ? options.duration : DEFAULT_DURATION;
    const id = `toast-${Date.now()}-${++idCounter.current}`;

    setToasts((previous) => {
      const activeCount = previous.filter((toast) => toast.phase !== 'queued' && toast.phase !== 'exiting').length;
      const phase = activeCount < MAX_VISIBLE ? 'entering' : 'queued';
      return [...previous, { id, message, type: normalizedType, duration, phase }];
    });

    return id;
  }, []);

  const markVisible = useCallback((id) => {
    setToasts((previous) =>
      previous.map((toast) => (toast.id === id && toast.phase === 'entering' ? { ...toast, phase: 'visible' } : toast))
    );
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((previous) =>
      previous.map((toast) => (toast.id === id ? { ...toast, phase: 'exiting' } : toast))
    );
  }, []);

  const remove = useCallback((id) => {
    setToasts((previous) => promoteNext(previous.filter((toast) => toast.id !== id)));
  }, [promoteNext]);

  const helpers = useMemo(() => ({
    success: (message, options) => showToast(message, 'success', options),
    error: (message, options) => showToast(message, 'error', options),
    warning: (message, options) => showToast(message, 'warning', options),
    info: (message, options) => showToast(message, 'info', options),
  }), [showToast]);

  const value = useMemo(() => ({
    showToast,
    toast: helpers,
    ...helpers,
  }), [helpers, showToast]);

  const visibleToasts = toasts.filter((toast) => toast.phase !== 'queued');

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted && createPortal(
        <div className={styles.toastContainer} aria-live="polite" aria-label="Notifications">
          {visibleToasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={dismiss}
              onEntered={markVisible}
              onRemove={remove}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

const ToastItem = memo(function ToastItem({ toast, onDismiss, onEntered, onRemove }) {
  const timerRef = useRef(null);
  const itemRef = useRef(null);
  const { id, message, type, duration, phase } = toast;

  useEffect(() => {
    if (phase !== 'entering') return undefined;
    const timer = window.setTimeout(() => onEntered(id), 220);
    return () => window.clearTimeout(timer);
  }, [id, onEntered, phase]);

  useEffect(() => {
    if (phase !== 'visible') return undefined;
    timerRef.current = window.setTimeout(() => onDismiss(id), duration);
    return () => window.clearTimeout(timerRef.current);
  }, [duration, id, onDismiss, phase]);

  useEffect(() => {
    if (phase !== 'exiting') return undefined;
    const timer = window.setTimeout(() => onRemove(id), 220);
    return () => window.clearTimeout(timer);
  }, [id, onRemove, phase]);

  const close = () => {
    window.clearTimeout(timerRef.current);
    onDismiss(id);
  };

  return (
    <div
      ref={itemRef}
      className={`${styles.toastItem} ${styles[type]} ${styles[phase] || ''}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-atomic="true"
    >
      <span className={styles.toastIcon} aria-hidden="true">{ICONS[type]}</span>
      <p className={styles.toastContent}>{message}</p>
      <button className={styles.toastCloseBtn} type="button" onClick={close} aria-label="Dismiss notification">
        &times;
      </button>
    </div>
  );
});

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
