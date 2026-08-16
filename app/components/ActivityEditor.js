'use client';
import { useState, useEffect, useRef } from 'react';
import styles from './ActivityEditor.module.css';
import { X, Trash2, Info } from 'lucide-react';

export default function ActivityEditor({ activity, currency, onSave, onDelete, onCancel, isOpen }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    time: '',
    duration: '',
    cost: '',
    notes: '',
    bookingStatus: 'not_booked'
  });
  
  const [errors, setErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const panelRef = useRef(null);
  
  useEffect(() => {
    if (activity && isOpen) {
      setFormData({
        name: activity.name || '',
        category: activity.category || activity.type || '',
        time: activity.time || activity.startTime || '',
        duration: activity.duration ? parseInt(activity.duration) : '',
        cost: activity.cost || '',
        notes: activity.userNotes || activity.notes || '',
        bookingStatus: activity.planningStatus || 'not_booked'
      });
      setErrors({});
      setShowDeleteConfirm(false);
    }
  }, [activity, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
      if (e.key === 'Enter' && e.ctrlKey) {
         handleSave();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    const inputs = panelRef.current?.querySelectorAll('input, select, textarea, button');
    if (inputs && inputs.length > 0) {
      inputs[1]?.focus();
    }
    
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (formData.cost !== '' && Number(formData.cost) < 0) newErrors.cost = 'Cost cannot be negative';
    if (formData.duration !== '' && Number(formData.duration) <= 0) newErrors.duration = 'Duration must be > 0';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave({
        ...activity,
        name: formData.name,
        category: formData.category,
        time: formData.time,
        duration: formData.duration ? `${formData.duration}m` : undefined,
        cost: formData.cost ? Number(formData.cost) : 0,
        userNotes: formData.notes,
        planningStatus: formData.bookingStatus
      });
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
    }}>
      <div className={styles.panel} ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <div className={styles.header}>
          <h2 id="editor-title" className={styles.title}>Edit Activity</h2>
          <button className={styles.closeBtn} onClick={onCancel} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">Name *</label>
            <input 
              id="name" name="name" className={styles.input} 
              value={formData.name} onChange={handleChange} 
              placeholder="e.g. Louvre Museum"
            />
            {errors.name && <span className={styles.errorText}>{errors.name}</span>}
          </div>
          
          <div className={styles.field}>
            <label className={styles.label} htmlFor="category">Category</label>
            <select id="category" name="category" className={styles.select} value={formData.category} onChange={handleChange}>
              <option value="">Select a category</option>
              <option value="culture">Culture & Museums</option>
              <option value="food">Food & Dining</option>
              <option value="nature">Nature & Outdoors</option>
              <option value="shopping">Shopping</option>
              <option value="entertainment">Entertainment</option>
            </select>
          </div>
          
          <div className={styles.field}>
            <label className={styles.label} htmlFor="time">Time</label>
            <input 
              type="time" id="time" name="time" className={styles.input} 
              value={formData.time} onChange={handleChange}
            />
          </div>
          
          <div className={styles.field}>
            <label className={styles.label} htmlFor="duration">Duration (minutes)</label>
            <input 
              type="number" id="duration" name="duration" className={styles.input} 
              value={formData.duration} onChange={handleChange} min="1"
            />
            {errors.duration && <span className={styles.errorText}>{errors.duration}</span>}
          </div>
          
          <div className={styles.field}>
            <label className={styles.label} htmlFor="cost">Cost ({currency || '€'})</label>
            <input 
              type="number" id="cost" name="cost" className={styles.input} 
              value={formData.cost} onChange={handleChange} min="0" step="0.01"
            />
            {errors.cost && <span className={styles.errorText}>{errors.cost}</span>}
          </div>
          
          <div className={styles.field}>
            <label className={styles.label} htmlFor="bookingStatus">Booking Status</label>
            <select id="bookingStatus" name="bookingStatus" className={styles.select} value={formData.bookingStatus} onChange={handleChange}>
              <option value="not_booked">Not Booked</option>
              <option value="reserved">Reserved</option>
              <option value="confirmed">Confirmed</option>
              <option value="not_needed">Not Needed</option>
            </select>
          </div>
          
          <div className={styles.field}>
            <label className={styles.label} htmlFor="notes">Notes</label>
            <textarea 
              id="notes" name="notes" className={styles.textarea} 
              value={formData.notes} onChange={handleChange}
              placeholder="Add personal notes here..."
            />
          </div>
          
          {activity?.provenance && (
            <div className={styles.provenance}>
              <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px'}}>
                <Info size={14} /> <strong>Source Info</strong>
              </div>
              <div>Source: {activity.provenance.provider || activity.provenance.sourceType}</div>
              {activity.provenance.confidence && <div>Confidence: {Math.round(activity.provenance.confidence * 100)}%</div>}
            </div>
          )}
        </div>
        
        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            {!showDeleteConfirm ? (
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 size={16} />
              </button>
            ) : (
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => onDelete(activity.id)}>
                Confirm Delete
              </button>
            )}
          </div>
          <div className={styles.footerRight}>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onCancel}>Cancel</button>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
