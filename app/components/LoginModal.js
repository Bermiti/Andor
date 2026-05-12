'use client';
import { useState } from 'react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isRegister) {
      if (!name || !email || !password) {
        setError('Preenche todos os campos.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('A palavra-passe deve ter pelo menos 6 caracteres.');
        setLoading(false);
        return;
      }
      const result = register(name, email, password);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
    } else {
      if (!email || !password) {
        setError('Preenche o email e a palavra-passe.');
        setLoading(false);
        return;
      }
      const result = login(email, password);
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
        
        <div className={styles.modalLogo}>🧭</div>
        <h2 className={styles.title}>
          {isRegister ? 'Cria a tua conta' : 'Bem-vindo de volta'}
        </h2>
        <p className={styles.subtitle}>
          {isRegister 
            ? 'Junta-te a milhares de viajantes inteligentes.' 
            : 'Inicia sessão para continuar as tuas aventuras.'}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {isRegister && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Nome</label>
              <input
                type="text"
                placeholder="O teu nome"
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
              placeholder="email@exemplo.com"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Palavra-passe</label>
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
            {loading ? 'A processar...' : isRegister ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>ou</span>
        </div>

        <button className={styles.toggleBtn} onClick={toggleMode}>
          {isRegister 
            ? 'Já tens conta? Inicia sessão' 
            : 'Não tens conta? Regista-te gratuitamente'}
        </button>
      </div>
    </div>
  );
}
