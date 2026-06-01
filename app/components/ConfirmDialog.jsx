'use client';

import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import styles from './ConfirmDialog.module.css';

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  const titleId = useId();
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement;
    const timer = window.setTimeout(() => cancelRef.current?.focus(), 0);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isLoading) {
        event.preventDefault();
        onCancel?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onCancel]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className={styles.overlay} role="presentation" onMouseDown={onCancel}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id={titleId}>{title}</h2>
        {description && <p>{description}</p>}
        <div className={styles.actions}>
          <button ref={cancelRef} type="button" className={styles.cancelBtn} onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`${styles.confirmBtn} ${destructive ? styles.destructive : ''}`}
            onClick={onConfirm}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
          >
            {isLoading && <Loader2 size={16} className={styles.spinner} style={{ animation: 'spin 1s linear infinite' }} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
