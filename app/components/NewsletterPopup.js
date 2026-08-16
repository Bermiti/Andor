'use client';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from './ToastProvider';
import styles from './NewsletterPopup.module.css';

export default function NewsletterPopup() {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const closeButtonRef = useRef(null);

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

  useEffect(() => {
    if (!isOpen) return undefined;
    document.body.classList.add('modal-open');
    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') handleDismiss();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

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
          page: window.location.pathname,
          consent,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error?.message || 'Não foi possível concluir a subscrição.');
      }

      setIsSubscribed(true);
      localStorage.setItem('andor_newsletter_dismissed', 'true');
    } catch (error) {
      showToast(error.message || 'Não foi possível concluir a subscrição.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsletter-title"
      onClick={handleDismiss}
    >
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <button ref={closeButtonRef} className={styles.closeBtn} aria-label="Fechar newsletter" onClick={handleDismiss}>
          <X size={16} aria-hidden="true" />
        </button>

        {!isSubscribed ? (
          <div className={styles.content}>
            <div className={styles.imageHeader}>
              <div className={styles.overlayGradient}></div>
              <span className={styles.badge}>ANDOR INSIGHTS</span>
              <h3 id="newsletter-title" className={styles.modalTitle}>Recebe briefs de viagem selecionados</h3>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <p className={styles.desc}>
                Uma selecao curta de destinos, alertas sazonais e ideias de itinerario para quem planeia viagens com criterio.
              </p>

              <div className={styles.inputField}>
                <input
                  type="email"
                  aria-label="Email para newsletter"
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <label className={styles.consentRow}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  required
                />
                <span>
                  Aceito receber emails editoriais e de produto da Andor. Posso cancelar a qualquer momento.
                </span>
              </label>

              <button type="submit" className={styles.submitBtn} disabled={loading || !consent}>
                {loading ? 'A subscrever...' : 'Subscrever'}
              </button>

              <button type="button" className={styles.noThanks} onClick={handleDismiss}>
                Agora nao
              </button>
            </form>
          </div>
        ) : (
          <div className={styles.success}>
            <h3 className={styles.successTitle}>Subscrição registada</h3>
            <p className={styles.successDesc}>
              O email e o teu consentimento ficaram registados. Vais receber apenas atualizações relevantes da Andor.
            </p>
            <button type="button" className={styles.doneBtn} onClick={handleDismiss}>Fechar</button>
          </div>
        )}
      </div>
    </div>
  );
}
