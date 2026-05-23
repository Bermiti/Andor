'use client';

import { useState, useEffect } from 'react';
import { trackEvent } from '../lib/analytics';
import styles from './CustomRequestModal.module.css';

export default function CustomRequestModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [travelers, setTravelers] = useState('2');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setIsSubmitted(false);
    };
    window.addEventListener('open-custom-request', handleOpen);
    return () => window.removeEventListener('open-custom-request', handleOpen);
  }, []);

  // Close modal when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!destination || !startDate || !endDate || !budget) {
      return;
    }
    setLoading(true);
    
    // Simulate API submission
    setTimeout(() => {
      setLoading(false);
      setIsSubmitted(true);
      
      try {
        const stored = localStorage.getItem('andor_custom_requests');
        const reqs = stored ? JSON.parse(stored) : [];
        const newRequest = {
          id: `req-${Date.now()}`,
          destination,
          startDate,
          endDate,
          budget,
          travelers,
          notes,
          status: 'Pendente',
          dateSubmitted: new Date().toLocaleDateString('pt-PT')
        };
        localStorage.setItem('andor_custom_requests', JSON.stringify([newRequest, ...reqs]));
        
        // Track the submission event
        trackEvent('custom_request_submitted', {
          destination,
          startDate,
          endDate,
          budget: parseFloat(budget),
          travelers,
          hasNotes: notes ? true : false
        });
      } catch (err) {
        // ignore
      }
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={() => setIsOpen(false)}>
      <div 
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button 
          className={styles.closeBtn} 
          aria-label="Fechar modal" 
          onClick={() => setIsOpen(false)}
        >
          ✕
        </button>
        
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.header}>
              <span className={styles.icon}>✨</span>
              <h3 id="modal-title" className={styles.title}>Viagem Personalizada Bespoke</h3>
              <p className={styles.subtitle}>Deixa os nossos especialistas desenharem um itinerário de luxo à tua medida.</p>
            </div>
            
            <div className={styles.field}>
              <label htmlFor="destination-input" className={styles.label}>Para onde gostarias de ir? *</label>
              <input 
                id="destination-input"
                type="text" 
                placeholder="ex. Costa Amalfitana, Japão, Patagónia"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className={styles.input}
                required
              />
            </div>
            
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="start-date-input" className={styles.label}>Data de Início *</label>
                <input 
                  id="start-date-input"
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="end-date-input" className={styles.label}>Data de Fim *</label>
                <input 
                  id="end-date-input"
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
            </div>
            
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="budget-input" className={styles.label}>Orçamento Estimado (€) *</label>
                <input 
                  id="budget-input"
                  type="number" 
                  placeholder="ex. 5000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="travelers-select" className={styles.label}>Número de Acompanhantes *</label>
                <select 
                  id="travelers-select"
                  value={travelers}
                  onChange={(e) => setTravelers(e.target.value)}
                  className={styles.select}
                  required
                >
                  <option value="1">1 Pessoa (Mochileiro/Solo)</option>
                  <option value="2">2 Pessoas (Casal)</option>
                  <option value="3">3 Pessoas</option>
                  <option value="4">4 Pessoas</option>
                  <option value="5+">Grupo de 5+ Pessoas</option>
                </select>
              </div>
            </div>
            
            <div className={styles.field}>
              <label htmlFor="notes-textarea" className={styles.label}>Requisitos Especiais ou Interesses</label>
              <textarea 
                id="notes-textarea"
                placeholder="ex. Alimentação vegetariana, heli-ski, jantares românticos ao pôr do sol, hotéis com acessibilidade..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={styles.textarea}
                rows={3}
              />
            </div>
            
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'A Submeter Pedido...' : 'Enviar Pedido Bespoke ✨'}
            </button>
          </form>
        ) : (
          <div className={styles.success}>
            <div className={styles.successIcon}>🌴</div>
            <h3 className={styles.successTitle}>Pedido Enviado!</h3>
            <p className={styles.successDesc}>
              Obrigado por confiares no Andor. A nossa equipa de concierge de elite vai desenhar a tua proposta de viagem exclusiva e contactar-te-á nas próximas 24 horas.
            </p>
            <div className={styles.summaryBox}>
              <div className={styles.summaryItem}><strong>Destino:</strong> {destination}</div>
              <div className={styles.summaryItem}><strong>Datas:</strong> {startDate} a {endDate}</div>
              <div className={styles.summaryItem}><strong>Viajantes:</strong> {travelers} pessoas</div>
              <div className={styles.summaryItem}><strong>Orçamento:</strong> €{budget}</div>
            </div>
            <button className={styles.doneBtn} onClick={() => setIsOpen(false)}>Fechar</button>
          </div>
        )}
      </div>
    </div>
  );
}
