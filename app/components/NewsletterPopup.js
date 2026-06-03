'use client';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from './ToastProvider';
import styles from './NewsletterPopup.module.css';

export default function NewsletterPopup() {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const hasSeen = localStorage.getItem('andor_newsletter_dismissed');
      const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
      if (!hasSeen && !isSmallScreen) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 30000);
        return () => clearTimeout(timer);
      }
    } catch (error) {
      setIsOpen(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      localStorage.setItem('andor_newsletter_dismissed', 'true');
    } catch (error) {}
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'newsletter_popup',
          metadata: { page: window.location.pathname },
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Nao foi possivel concluir a subscricao.');
      }

      setIsSubscribed(true);
      localStorage.setItem('andor_newsletter_dismissed', 'true');
    } catch (error) {
      showToast(error.message || 'Nao foi possivel concluir a subscricao.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleDismiss}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <button className={styles.closeBtn} aria-label="Fechar newsletter" onClick={handleDismiss}>
          <X size={16} aria-hidden="true" />
        </button>

        {!isSubscribed ? (
          <div className={styles.content}>
            <div className={styles.imageHeader}>
              <div className={styles.overlayGradient}></div>
              <span className={styles.badge}>ANDOR INSIGHTS</span>
              <h3 className={styles.modalTitle}>Recebe briefs de viagem selecionados</h3>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <p className={styles.desc}>
                Uma selecao curta de destinos, alertas sazonais e ideias de itinerario para quem planeia viagens com criterio.
              </p>

              <div className={styles.inputField}>
                <input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'A subscrever...' : 'Subscrever'}
              </button>

              <button type="button" className={styles.noThanks} onClick={handleDismiss}>
                Agora nao
              </button>
            </form>
          </div>
        ) : (
          <div className={styles.success}>
            <h3 className={styles.successTitle}>Subscricao confirmada</h3>
            <p className={styles.successDesc}>
              O email ficou registado. Vais receber apenas atualizacoes relevantes da Andor.
            </p>
            <button type="button" className={styles.doneBtn} onClick={handleDismiss}>Fechar</button>
          </div>
        )}
      </div>
    </div>
  );
}
