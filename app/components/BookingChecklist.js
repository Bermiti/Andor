'use client';

import { useState } from 'react';
import styles from './BookingChecklist.module.css';

/**
 * PHASE 11.3: BookingChecklist Component
 * Interactive checklist for booking-related tasks with priorities and deadlines
 */

export default function BookingChecklist({ bookingChecklist }) {
  const [completed, setCompleted] = useState({});

  if (!bookingChecklist || !bookingChecklist.items) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>✓</div>
        <p>Checklist a carregar...</p>
      </div>
    );
  }

  const items = bookingChecklist.items || [];
  const completedCount = Object.values(completed).filter(Boolean).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const handleToggle = (itemId) => {
    setCompleted(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return styles.critical;
      case 'high': return styles.high;
      case 'medium': return styles.medium;
      case 'low': return styles.low;
      default: return styles.medium;
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'critical': return 'Crítico';
      case 'high': return 'Alto';
      case 'medium': return 'Médio';
      case 'low': return 'Baixo';
      default: return priority;
    }
  };

  return (
    <div className={styles.section}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>
            <span className={styles.icon}>✓</span>
            Checklist de Reserva
          </h2>
          <p className={styles.subtitle}>Tarefas essenciais antes de viajar</p>
        </div>
        <div className={styles.progress}>
          <div className={styles.progressValue}>{progress}%</div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.progressText}>{completedCount}/{items.length}</div>
        </div>
      </div>

      {/* Items by Priority */}
      {['critical', 'high', 'medium', 'low'].map(priority => {
        const priorityItems = items.filter(item => (item.priority || 'medium') === priority);
        if (priorityItems.length === 0) return null;

        return (
          <div key={priority} className={styles.priorityGroup}>
            <div className={`${styles.priorityHeader} ${getPriorityColor(priority)}`}>
              <span className={styles.priorityDot}></span>
              <span className={styles.priorityLabel}>
                {getPriorityLabel(priority)} Prioridade ({priorityItems.length})
              </span>
            </div>

            <div className={styles.itemsList}>
              {priorityItems.map((item, idx) => {
                const itemId = `${priority}-${idx}`;
                const isCompleted = completed[itemId];

                return (
                  <div
                    key={itemId}
                    className={`${styles.item} ${isCompleted ? styles.completed : ''}`}
                  >
                    <div className={styles.itemContent}>
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => handleToggle(itemId)}
                        className={styles.checkbox}
                        aria-label={item.task}
                      />
                      <div className={styles.itemText}>
                        <div className={styles.itemTask}>{item.task}</div>
                        {item.description && (
                          <p className={styles.itemDescription}>{item.description}</p>
                        )}
                      </div>
                    </div>

                    {item.daysBeforeDeparture && (
                      <div className={styles.deadline}>
                        <span className={styles.deadlineIcon}>📅</span>
                        <span className={styles.deadlineText}>
                          {item.daysBeforeDeparture === 0
                            ? 'No dia'
                            : `${item.daysBeforeDeparture} dias antes`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Notes */}
      {bookingChecklist.notes && (
        <div className={styles.notes}>
          <span className={styles.notesIcon}>💡</span>
          <p>{bookingChecklist.notes}</p>
        </div>
      )}
    </div>
  );
}
