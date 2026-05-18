'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import styles from './LoginModal.module.css';

export default function LoginModal({ isOpen, onClose }) {
  const { login, register, loginAsGuest } = useAuth();
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleGuestLogin = () => {
    setError('');
    setLoading(true);
    loginAsGuest();
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
      router.push('/my-trips');
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!name || !email || !password) throw new Error('All fields are required.');
        if (password.length < 6) throw new Error('Password must be 6+ chars.');
        const result = register(name, email, password);
        if (result?.error) throw new Error(result.error);
      } else {
        if (!email || !password) throw new Error('Email and password required.');
        const result = login(email, password);
        if (result?.error) throw new Error(result.error);
      }
      
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setName('');
        setEmail('');
        setPassword('');
        router.push('/my-trips');
      }, 1500);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
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
        
        <div className={styles.modalLogo}>
          {success ? '✓' : '🧭'}
        </div>
        <h2 className={styles.title}>
          {success ? 'Success!' : isRegister ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className={styles.subtitle}>
          {success 
            ? 'Redirecting to your dashboard...'
            : isRegister 
              ? 'Join thousands of smart travelers.' 
              : 'Log in to continue your adventures.'}
        </p>

        {!success && (
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
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.loginBtn} disabled={loading}>
              {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Log In'}
            </button>
          </form>
        )}

        {!success && (
          <>
            <div className={styles.divider}>
              <span>or</span>
            </div>

            <button className={styles.guestBtn} onClick={handleGuestLogin}>
              ⚡ Continue as Guest (Instant Access)
            </button>

            <button className={styles.toggleBtn} onClick={toggleMode}>
              {isRegister 
                ? 'Already have an account? Log in' 
                : 'Don\'t have an account? Sign up for free'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
