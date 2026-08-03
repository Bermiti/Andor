'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './LoginModal.module.css';

export default function LoginModal({ isOpen, onClose }) {
  const { login, register, loginWithGoogle } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleGoogleClick = async () => {
    setError('');
    setGoogleLoading(true);
    const res = await loginWithGoogle();
    if (res?.error) {
      setError(res.error);
      setGoogleLoading(false);
    } else if (res?.success && !res?.redirecting) {
      setGoogleLoading(false);
      onClose();
    }
  };

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

        <button
          type="button"
          className={styles.googleBtn}
          onClick={handleGoogleClick}
          disabled={googleLoading || loading}
          data-testid="google-login-button"
        >
          <svg className={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>{googleLoading ? 'A ligar à Google...' : 'Continuar com o Google'}</span>
        </button>

        <div className={styles.divider}>
          <span>ou com email</span>
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
