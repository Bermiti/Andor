'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import { useToast } from './ToastProvider';
import styles from './CustomRequestModal.module.css';

export default function CustomRequestModal() {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [travelers, setTravelers] = useState('2');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setIsSubmitted(false);
      setSubmittedRequest(null);
    };
    window.addEventListener('open-custom-request', handleOpen);
    return () => window.removeEventListener('open-custom-request', handleOpen);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!destination || !startDate || !endDate || !budget || loading) return;

    setLoading(true);
    try {
      const response = await fetch('/api/custom-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          startDate,
          endDate,
          budget,
          travelers,
          notes,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error?.message || 'Não foi possível enviar o pedido.');
      }

      setSubmittedRequest(body.request || null);
      setIsSubmitted(true);
      trackEvent('custom_request_submitted', {
        destination,
        startDate,
        endDate,
        budget: parseFloat(budget),
        travelers,
        hasNotes: Boolean(notes),
        provider: body.provider,
      });
    } catch (error) {
      showToast(error.message || 'Não foi possível enviar o pedido.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={() => setIsOpen(false)}>
      <div
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button
          className={styles.closeBtn}
          aria-label="Fechar modal"
          onClick={() => setIsOpen(false)}
        >
          <X size={16} aria-hidden="true" />
        </button>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.header}>
              <h3 id="modal-title" className={styles.title}>Pedido de viagem personalizada</h3>
              <p className={styles.subtitle}>Envia os detalhes essenciais para a equipa preparar uma proposta estruturada.</p>
            </div>

            <div className={styles.field}>
              <label htmlFor="destination-input" className={styles.label}>Destino *</label>
              <input
                id="destination-input"
                type="text"
                placeholder="ex. Costa Amalfitana, Japao, Patagonia"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="start-date-input" className={styles.label}>Data de inicio *</label>
                <input
                  id="start-date-input"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="end-date-input" className={styles.label}>Data de fim *</label>
                <input
                  id="end-date-input"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="budget-input" className={styles.label}>Orcamento estimado (EUR) *</label>
                <input
                  id="budget-input"
                  type="number"
                  placeholder="ex. 5000"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="travelers-select" className={styles.label}>Viajantes *</label>
                <select
                  id="travelers-select"
                  value={travelers}
                  onChange={(event) => setTravelers(event.target.value)}
                  className={styles.select}
                  required
                >
                  <option value="1">1 pessoa</option>
                  <option value="2">2 pessoas</option>
                  <option value="3">3 pessoas</option>
                  <option value="4">4 pessoas</option>
                  <option value="5+">Grupo de 5+ pessoas</option>
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="notes-textarea" className={styles.label}>Preferencias e requisitos</label>
              <textarea
                id="notes-textarea"
                placeholder="ex. restaurantes especificos, acessibilidade, ritmo calmo, hoteis preferidos..."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className={styles.textarea}
                rows={3}
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'A enviar pedido...' : 'Enviar pedido'}
            </button>
          </form>
        ) : (
          <div className={styles.success}>
            <CheckCircle2 size={44} aria-hidden="true" />
            <h3 className={styles.successTitle}>Pedido recebido</h3>
            <p className={styles.successDesc}>
              A equipa Andor recebeu os detalhes e pode acompanhar o pedido com a referencia abaixo.
            </p>
            <div className={styles.summaryBox}>
              {submittedRequest?.id && <div className={styles.summaryItem}><strong>Referencia:</strong> {submittedRequest.id}</div>}
              <div className={styles.summaryItem}><strong>Destino:</strong> {destination}</div>
              <div className={styles.summaryItem}><strong>Datas:</strong> {startDate} a {endDate}</div>
              <div className={styles.summaryItem}><strong>Viajantes:</strong> {travelers}</div>
              <div className={styles.summaryItem}><strong>Orcamento:</strong> EUR {budget}</div>
            </div>
            <button className={styles.doneBtn} onClick={() => setIsOpen(false)}>Fechar</button>
          </div>
        )}
      </div>
    </div>
  );
}
