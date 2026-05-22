'use client';
import { useState, useEffect } from 'react';
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
      alert('Please fill out all required fields.');
      return;
    }
    setLoading(true);
    // Simulate API submission
    setTimeout(() => {
      setLoading(false);
      setIsSubmitted(true);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={() => setIsOpen(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} aria-label="Close modal" onClick={() => setIsOpen(false)}>✕</button>
        
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.header}>
              <span className={styles.icon}>✨</span>
              <h3 className={styles.title}>Bespoke Travel Request</h3>
              <p className={styles.subtitle}>Let our destination experts design a tailor-made luxury journey for you.</p>
            </div>
            
            <div className={styles.field}>
              <label className={styles.label}>Where would you like to go? *</label>
              <input 
                type="text" 
                placeholder="e.g. Amalfi Coast, Japan, Patagonia"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className={styles.input}
                required
              />
            </div>
            
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Start Date *</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>End Date *</label>
                <input 
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
                <label className={styles.label}>Estimated Budget (€) *</label>
                <input 
                  type="number" 
                  placeholder="e.g. 5000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Number of Guests *</label>
                <select 
                  value={travelers}
                  onChange={(e) => setTravelers(e.target.value)}
                  className={styles.select}
                  required
                >
                  <option value="1">1 Person (Solo)</option>
                  <option value="2">2 People (Couple)</option>
                  <option value="3">3 People</option>
                  <option value="4">4 People</option>
                  <option value="5+">5+ Group</option>
                </select>
              </div>
            </div>
            
            <div className={styles.field}>
              <label className={styles.label}>Special Requirements or Interests</label>
              <textarea 
                placeholder="e.g. Vegetarian dining, heli-skiing, romantic sunset dinners, accessible hotels..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={styles.textarea}
                rows={3}
              />
            </div>
            
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Submitting Request...' : 'Send Bespoke Request ✨'}
            </button>
          </form>
        ) : (
          <div className={styles.success}>
            <div className={styles.successIcon}>🌴</div>
            <h3 className={styles.successTitle}>Request Submitted!</h3>
            <p className={styles.successDesc}>
              Thank you for trusting Andor. Our elite concierge team will curate a personalized travel proposal for you and contact you within 24 hours.
            </p>
            <div className={styles.summaryBox}>
              <div className={styles.summaryItem}><strong>Destination:</strong> {destination}</div>
              <div className={styles.summaryItem}><strong>Dates:</strong> {startDate} to {endDate}</div>
              <div className={styles.summaryItem}><strong>Travelers:</strong> {travelers} people</div>
              <div className={styles.summaryItem}><strong>Budget:</strong> €{budget}</div>
            </div>
            <button className={styles.doneBtn} onClick={() => setIsOpen(false)}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
