'use client';

import { useEffect, useId, useRef } from 'react';
import styles from './Modal.module.css';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  variant = 'dialog',
  labelledBy,
  className = '',
  closeLabel = 'Fechar',
}) {
  const generatedTitleId = useId();
  const titleId = labelledBy || generatedTitleId;
  const panelRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement;
    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll(focusableSelector);
    const firstFocusable = focusable?.[0];

    const timer = window.setTimeout(() => {
      if (firstFocusable) firstFocusable.focus();
      else panel?.focus();
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab' || !panel) return;
      const nodes = Array.from(panel.querySelectorAll(focusableSelector));
      if (nodes.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('modal-open');

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('modal-open');
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div
        ref={panelRef}
        className={`${styles.panel} ${styles[variant] || styles.dialog} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className={styles.closeButton} type="button" onClick={onClose} aria-label={closeLabel}>
          ×
        </button>
        {title && (
          <h2 className={styles.title} id={titleId}>
            {title}
          </h2>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}

export function BottomSheet(props) {
  return <Modal {...props} variant="bottomSheet" />;
}

export function Drawer(props) {
  return <Modal {...props} variant="drawer" />;
}
