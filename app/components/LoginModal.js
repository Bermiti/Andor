'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './LoginModal.module.css';

export default function LoginModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isRegister) {
      if (!name || !email || !password) {
        setError('Please fill in all fields.');
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        setLoading(false);
        return;
      }
      const result = await register(name, email, password);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
    } else {
      if (!email || !password) {
        setError('Please enter your email and password.');
        setLoading(false);
        return;
      }
      const result = await login(email, password);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    setName('');
    setEmail('');
    setPassword('');
    onClose();
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        
        <div className={styles.modalLogo}>A</div>
        <h2 className={styles.title}>
          {isRegister ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className={styles.subtitle}>
          {isRegister 
            ? 'Cria uma conta para guardar viagens e preferências.' 
            : 'Entra para continuar a planear com segurança.'}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {isRegister && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Name</label>
              <input
                type="text"
                placeholder="Your name"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Email</label>
            <input
              type="email"
              placeholder="email@example.com"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={isRegister ? 8 : 1}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.loginBtn} disabled={loading}>
            {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Log In'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <button className={styles.toggleBtn} onClick={toggleMode}>
          {isRegister 
            ? 'Already have an account? Log in' 
            : 'Don\'t have an account? Sign up for free'}
        </button>
      </div>
    </div>
  );
}
