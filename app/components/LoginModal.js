'use client';

import { useEffect, useId, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslations } from '../context/LanguageContext';
import { Modal } from './ui/Modal';
import styles from './LoginModal.module.css';

const PROVIDER_ERROR_KEYS = {
  google_cancelled: 'googleCancelled',
  google_not_configured: 'googleUnavailable',
  google_start_failed: 'googleFailed',
  google_missing_code: 'googleFailed',
  google_callback_failed: 'googleFailed',
  google_profile_failed: 'googleProfileFailed',
};

export default function LoginModal({
  isOpen,
  onClose,
  initialErrorCode = null,
  redirectPath = '/my-trips',
}) {
  const { login, register, loginWithGoogle } = useAuth();
  const t = useTranslations('auth');
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !initialErrorCode) return;
    const key = PROVIDER_ERROR_KEYS[initialErrorCode] || 'googleFailed';
    setError(t(key));
  }, [initialErrorCode, isOpen, t]);

  const closeModal = () => {
    if (loading || googleLoading) return;
    setError('');
    onClose();
  };

  const handleGoogleClick = async () => {
    setError('');
    setGoogleLoading(true);
    const result = await loginWithGoogle(redirectPath);
    if (result?.error) {
      setError(result.error);
      setGoogleLoading(false);
    } else if (result?.success && !result?.redirecting) {
      setGoogleLoading(false);
      onClose();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (isRegister && (!name.trim() || !email.trim() || !password)) {
      setError(t('allFieldsRequired'));
      return;
    }
    if (!isRegister && (!email.trim() || !password)) {
      setError(t('credentialsRequired'));
      return;
    }
    if (isRegister && password.length < 8) {
      setError(t('passwordLength'));
      return;
    }

    setLoading(true);
    const result = isRegister
      ? await register(name.trim(), email.trim(), password)
      : await login(email.trim(), password);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setName('');
    setEmail('');
    setPassword('');
    onClose();
  };

  const toggleMode = () => {
    setIsRegister((current) => !current);
    setError('');
  };

  const busy = loading || googleLoading;
  const title = isRegister ? t('registerTitle') : t('loginTitle');

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={title}
      closeLabel={t('close')}
      className={styles.modal}
    >
      <p className={styles.subtitle}>
        {isRegister ? t('registerSubtitle') : t('loginSubtitle')}
      </p>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        {isRegister && (
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor={nameId}>{t('name')}</label>
            <input
              id={nameId}
              name="name"
              type="text"
              autoComplete="name"
              placeholder={t('namePlaceholder')}
              className={styles.input}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              disabled={busy}
              aria-describedby={error ? errorId : undefined}
            />
          </div>
        )}

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor={emailId}>{t('email')}</label>
          <input
            id={emailId}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t('emailPlaceholder')}
            className={styles.input}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={busy}
            aria-describedby={error ? errorId : undefined}
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor={passwordId}>{t('password')}</label>
          <input
            id={passwordId}
            name="password"
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            placeholder={t('passwordPlaceholder')}
            className={styles.input}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={isRegister ? 8 : 1}
            required
            disabled={busy}
            aria-describedby={error ? errorId : undefined}
          />
        </div>

        {error && (
          <div id={errorId} className={styles.error} role="alert" aria-live="polite">
            {error}
          </div>
        )}

        <button type="submit" className={styles.loginBtn} disabled={busy}>
          {loading ? t('processing') : isRegister ? t('registerAction') : t('loginAction')}
        </button>
      </form>

      <div className={styles.divider} aria-hidden="true">
        <span>{t('divider')}</span>
      </div>

      <button
        type="button"
        className={styles.googleBtn}
        onClick={handleGoogleClick}
        disabled={busy}
        data-testid="google-login-button"
      >
        <svg className={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span>{googleLoading ? t('googleLoading') : t('googleAction')}</span>
      </button>

      <button type="button" className={styles.toggleBtn} onClick={toggleMode} disabled={busy}>
        {isRegister ? t('switchToLogin') : t('switchToRegister')}
      </button>
    </Modal>
  );
}
