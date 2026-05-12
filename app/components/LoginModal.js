'use client';
import styles from './LoginModal.module.css';

export default function LoginModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        <h2>Login</h2>
        <p>This is a placeholder for the login modal.</p>
        <button className={styles.actionBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
