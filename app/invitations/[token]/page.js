'use client';

import { CheckCircle2, LogIn, UsersRound } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import LoginModal from '../../components/LoginModal';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import styles from './page.module.css';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const token = useMemo(
    () => (typeof params?.token === 'string' ? params.token : ''),
    [params],
  );
  const tokenIsValid = TOKEN_PATTERN.test(token);

  const acceptInvitation = async () => {
    if (!user || !tokenIsValid || status === 'accepting') return;
    setStatus('accepting');
    setMessage('');

    try {
      const response = await fetch(`/api/invitations/${encodeURIComponent(token)}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.tripId) {
        throw new Error(
          payload?.error?.message
          || 'Não foi possível aceitar este convite. Pede um novo link ao organizador.',
        );
      }

      setStatus('accepted');
      setMessage('Convite aceite. A abrir a viagem…');
      router.replace(`/itinerary/${payload.tripId}`);
    } catch (error) {
      setStatus('error');
      setMessage(error?.message || 'Não foi possível aceitar este convite.');
    }
  };

  return (
    <main className={styles.page}>
      <Navbar />
      <section className={styles.card} aria-labelledby="invitation-title">
        <span className={styles.icon} aria-hidden="true"><UsersRound size={28} /></span>
        <p className={styles.eyebrow}>Planeamento em grupo</p>
        <h1 id="invitation-title">Junta-te a esta viagem na Andor</h1>
        <p className={styles.description}>
          O teu acesso e permissões foram definidos pelo organizador. A Andor só
          ativa o convite na conta correspondente ao email convidado.
        </p>

        {!tokenIsValid && (
          <div className={styles.error} role="alert">
            Este link de convite é inválido. Pede um novo link ao organizador.
          </div>
        )}

        {tokenIsValid && !loading && !user && (
          <>
            <p className={styles.hint}>Inicia sessão com o email que recebeu o convite.</p>
            <button className={styles.primary} type="button" onClick={() => setIsLoginOpen(true)}>
              <LogIn size={18} aria-hidden="true" /> Iniciar sessão para continuar
            </button>
          </>
        )}

        {tokenIsValid && !loading && user && status !== 'accepted' && (
          <>
            <p className={styles.account}>
              Conta atual: <strong>{user.email}</strong>
            </p>
            <button
              className={styles.primary}
              type="button"
              onClick={acceptInvitation}
              disabled={status === 'accepting'}
            >
              {status === 'accepting' ? 'A aceitar convite…' : 'Aceitar e abrir a viagem'}
            </button>
          </>
        )}

        {loading && <p className={styles.hint} aria-live="polite">A verificar a sessão…</p>}
        {message && (
          <div
            className={status === 'error' ? styles.error : styles.success}
            role={status === 'error' ? 'alert' : 'status'}
          >
            {status === 'accepted' && <CheckCircle2 size={18} aria-hidden="true" />}
            {message}
          </div>
        )}
      </section>

      <LoginModal
        isOpen={isLoginOpen}
        redirectPath={`/invitations/${token}`}
        onClose={() => setIsLoginOpen(false)}
      />
    </main>
  );
}
