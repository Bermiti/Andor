'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronDown, ExternalLink, Info } from 'lucide-react';
import { getJson, setJson } from '../lib/storage';
import { updateSavedTrip } from '../lib/itinerary-store';
import { BOOKING_STATUS_OPTIONS, priorityLabel } from '../lib/planning-labels';
import styles from './BookingChecklist.module.css';

const COMPLETE_STATUSES = new Set(['booked', 'confirmed']);

function normalizePriority(priority) {
  if (['critical', 'high', 'medium', 'low'].includes(priority)) return priority;
  if (priority === 1 || priority === '1') return 'critical';
  if (priority === 2 || priority === '2') return 'high';
  if (priority === 3 || priority === '3') return 'medium';
  return 'medium';
}

function normalizeItem(item, index) {
  return {
    id: item?.id || `${item?.category || 'task'}-${index + 1}`,
    category: item?.category || 'general',
    task: item?.task || item?.title || 'Tarefa de reserva',
    description: item?.description || item?.note || '',
    priority: normalizePriority(item?.priority),
    status: item?.status || 'not_started',
    daysBeforeDeparture: item?.daysBeforeDeparture ?? null,
    searchUrl: item?.searchUrl || item?.url || '',
    reference: item?.reference || item?.confirmationNumber || '',
    price: item?.price || item?.selectedPrice || '',
    notes: item?.notes || '',
  };
}

export default function BookingChecklist({ bookingChecklist, storageKey, tripId }) {
  const items = useMemo(() => (
    (Array.isArray(bookingChecklist) ? bookingChecklist : bookingChecklist?.items || []).map(normalizeItem)
  ), [bookingChecklist]);
  const [itemState, setItemState] = useState({});
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    if (!storageKey) return;
    setItemState(getJson(storageKey, {}, 'local') || {});
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    setJson(storageKey, itemState, 'local');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('andor-bookings-updated', { detail: { storageKey, itemState } }));
    }
  }, [itemState, storageKey]);

  if (!bookingChecklist || items.length === 0) {
    return (
      <div className={styles.empty}>
        <CheckCircle2 className={styles.emptyIcon} size={44} aria-hidden="true" />
        <p>Checklist a carregar...</p>
      </div>
    );
  }

  const getValue = (item, field) => itemState[item.id]?.[field] ?? item[field] ?? '';
  const completedCount = items.filter((item) => COMPLETE_STATUSES.has(getValue(item, 'status'))).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const updateItem = (itemId, patch) => {
    setItemState((prev) => {
      const nextState = {
        ...prev,
        [itemId]: {
          ...(prev[itemId] || {}),
          ...patch,
        },
      };

      // Sync to the main trip object for operational status tracking
      if (tripId) {
        updateSavedTrip(tripId, (trip) => {
          if (!trip.bookingChecklist) trip.bookingChecklist = { items: [] };
          const idx = trip.bookingChecklist.items.findIndex(i => i.id === itemId);
          if (idx !== -1) {
            trip.bookingChecklist.items[idx] = { ...trip.bookingChecklist.items[idx], ...nextState[itemId] };
          }
          return trip;
        });
      }

      return nextState;
    });
  };

  const handleToggle = (item) => {
    const current = getValue(item, 'status') || 'not_started';
    updateItem(item.id, {
      status: COMPLETE_STATUSES.has(current) ? 'not_started' : 'confirmed',
    });
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

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>
            <CheckCircle2 className={styles.icon} size={30} aria-hidden="true" />
            Checklist de reservas
          </h2>
          <p className={styles.subtitle}>Pesquisa, seleção, referências e confirmações manuais.</p>
        </div>
        <div className={styles.progress}>
          <div className={styles.progressValue}>{progress}%</div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.progressText}>{completedCount}/{items.length}</div>
        </div>
      </div>

      {['critical', 'high', 'medium', 'low'].map(priority => {
        const priorityItems = items.filter(item => (item.priority || 'medium') === priority);
        if (priorityItems.length === 0) return null;

        return (
          <div key={priority} className={styles.priorityGroup}>
            <div className={`${styles.priorityHeader} ${getPriorityColor(priority)}`}>
              <span className={styles.priorityDot}></span>
              <span className={styles.priorityLabel}>
                Prioridade {priorityLabel(priority).toLowerCase()} ({priorityItems.length})
              </span>
            </div>

            <div className={styles.itemsList}>
              {priorityItems.map((item) => {
                const status = getValue(item, 'status') || 'not_started';
                const isCompleted = COMPLETE_STATUSES.has(status);

                return (
                  <div
                    key={item.id}
                    className={`${styles.item} ${isCompleted ? styles.completed : ''}`}
                  >
                    <div className={styles.itemTop}>
                      <div className={styles.itemContent}>
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={() => handleToggle(item)}
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

                      <div className={styles.statusCluster}>
                        {item.daysBeforeDeparture !== null && item.daysBeforeDeparture !== undefined && (
                          <div className={styles.deadline}>
                            <CalendarDays className={styles.deadlineIcon} size={13} aria-hidden="true" />
                            <span className={styles.deadlineText}>
                              {item.daysBeforeDeparture === 0
                                ? 'No dia'
                                : `${item.daysBeforeDeparture} dias antes`}
                            </span>
                          </div>
                        )}
                        <select
                          className={styles.statusSelect}
                          value={status}
                          onChange={(event) => updateItem(item.id, { status: event.target.value })}
                          aria-label={`Estado de ${item.task}`}
                        >
                          {BOOKING_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className={styles.detailsButton}
                          onClick={() => setExpandedItems((current) => ({ ...current, [item.id]: !current[item.id] }))}
                          aria-expanded={!!expandedItems[item.id]}
                          aria-label={`${expandedItems[item.id] ? 'Ocultar' : 'Editar'} detalhes de ${item.task}`}
                        >
                          <ChevronDown size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {expandedItems[item.id] && <div className={styles.bookingFields}>
                      <label>
                        <span>Referência</span>
                        <input
                          value={getValue(item, 'reference')}
                          onChange={(event) => updateItem(item.id, { reference: event.target.value })}
                          placeholder="PNR, reserva, voucher"
                        />
                      </label>
                      <label>
                        <span>Preço</span>
                        <input
                          value={getValue(item, 'price')}
                          onChange={(event) => updateItem(item.id, { price: event.target.value })}
                          placeholder="Ex: EUR 420"
                        />
                      </label>
                      <label className={styles.notesField}>
                        <span>Notas</span>
                        <input
                          value={getValue(item, 'notes')}
                          onChange={(event) => updateItem(item.id, { notes: event.target.value })}
                          placeholder="Regras, cancelamento, contacto"
                        />
                      </label>
                      {item.searchUrl && (
                        <a className={styles.searchLink} href={item.searchUrl} target="_blank" rel="noopener noreferrer">
                          Abrir pesquisa <ExternalLink size={12} aria-hidden="true" />
                        </a>
                      )}
                    </div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className={styles.notes}>
        <Info className={styles.notesIcon} size={18} aria-hidden="true" />
        <p>{bookingChecklist.notes || 'Andor prepara links e tarefas. Nenhuma compra ou reserva e feita automaticamente.'}</p>
      </div>
    </div>
  );
}
