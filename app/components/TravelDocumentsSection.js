'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, FileCheck2, Info, ShieldCheck } from 'lucide-react';
import { getJson, setJson } from '../lib/storage';
import { updateSavedTrip } from '../lib/itinerary-store';
import { DOCUMENT_STATUS_OPTIONS, documentImportanceLabel } from '../lib/planning-labels';
import styles from './TravelDocumentsSection.module.css';

const READY_STATUSES = new Set(['ready', 'uploaded_confirmed', 'not_applicable']);
const IMPORTANCE_ORDER = ['required', 'recommended', 'optional'];

function normalizeImportance(value, required) {
  if (IMPORTANCE_ORDER.includes(value)) return value;
  if (required === true) return 'required';
  if (required === false) return 'optional';
  return 'recommended';
}

function normalizeItem(item, index) {
  const importance = normalizeImportance(item?.importance, item?.required);
  const title = item?.title || item?.label || item?.task || `Documento ${index + 1}`;
  return {
    id: item?.id || `document-${index + 1}`,
    category: item?.category || 'general',
    title,
    label: title,
    description: item?.description || item?.notes || '',
    importance,
    whoNeedsIt: item?.whoNeedsIt || 'Todos os viajantes',
    timing: item?.timing || 'Antes da partida',
    status: item?.status || (importance === 'required' ? 'needed' : 'not_started'),
    notes: item?.notes || '',
    sourceReason: item?.sourceReason || item?.reason || '',
    audience: item?.audience || 'client',
  };
}

export default function TravelDocumentsSection({ documentsChecklist, storageKey, mode = 'client', tripId }) {
  const items = useMemo(() => (
    (Array.isArray(documentsChecklist) ? documentsChecklist : documentsChecklist?.items || []).map(normalizeItem)
  ), [documentsChecklist]);
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
      window.dispatchEvent(new CustomEvent('andor-documents-updated', { detail: { storageKey, itemState } }));
    }
  }, [itemState, storageKey]);

  if (!documentsChecklist || items.length === 0) {
    return (
      <section className={styles.empty} aria-label="Documentos de viagem">
        <FileCheck2 size={22} aria-hidden="true" />
        <p>Documentos a preparar...</p>
      </section>
    );
  }

  const visibleItems = mode === 'internal'
    ? items
    : items.filter((item) => item.audience !== 'internal');

  const getValue = (item, field) => itemState[item.id]?.[field] ?? item[field] ?? '';
  const readyCount = visibleItems.filter((item) => READY_STATUSES.has(getValue(item, 'status'))).length;
  const progress = visibleItems.length ? Math.round((readyCount / visibleItems.length) * 100) : 0;
  const updateItem = (itemId, patch) => {
    setItemState((prev) => {
      const nextState = {
        ...prev,
        [itemId]: {
          ...(prev[itemId] || {}),
          ...patch,
        },
      };

      if (tripId) {
        updateSavedTrip(tripId, (trip) => {
          if (!trip.documentsChecklist) trip.documentsChecklist = { items: [] };
          const idx = trip.documentsChecklist.items.findIndex(i => i.id === itemId);
          if (idx !== -1) {
            trip.documentsChecklist.items[idx] = { ...trip.documentsChecklist.items[idx], ...nextState[itemId] };
          }
          return trip;
        });
      }

      return nextState;
    });
  };

  return (
    <section className={styles.section} aria-label="Documentos de viagem">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            <FileCheck2 size={22} aria-hidden="true" />
            Documentos de viagem
          </h2>
          <p className={styles.subtitle}>Identidade, entrada, confirmações, seguros e aprovação.</p>
        </div>
        <div className={styles.progress} aria-label={`${progress}% dos documentos prontos`}>
          <strong>{progress}%</strong>
          <span>{readyCount}/{visibleItems.length}</span>
        </div>
      </div>

      {IMPORTANCE_ORDER.map((importance) => {
        const groupItems = visibleItems.filter((item) => item.importance === importance);
        if (groupItems.length === 0) return null;

        return (
          <div key={importance} className={styles.group}>
            <div className={`${styles.groupHeader} ${styles[importance]}`}>
              <ShieldCheck size={15} aria-hidden="true" />
              <span>{documentImportanceLabel(importance)}</span>
              <small>{groupItems.length}</small>
            </div>

            <div className={styles.items}>
              {groupItems.map((item) => {
                const status = getValue(item, 'status');
                const ready = READY_STATUSES.has(status);
                return (
                  <article key={item.id} className={`${styles.item} ${ready ? styles.ready : ''}`}>
                    <div className={styles.itemTop}>
                      <div className={styles.itemText}>
                        <div className={styles.itemTitleRow}>
                          <h3>{item.title}</h3>
                          {item.audience === 'internal' && <span className={styles.internalBadge}>Interno</span>}
                        </div>
                        {item.description && <p>{item.description}</p>}
                      </div>
                      <div className={styles.statusActions}>
                        <select
                          className={styles.statusSelect}
                          value={status}
                          onChange={(event) => updateItem(item.id, { status: event.target.value })}
                          aria-label={`Estado de ${item.title}`}
                        >
                          {DOCUMENT_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className={styles.detailsButton}
                          onClick={() => setExpandedItems((current) => ({ ...current, [item.id]: !current[item.id] }))}
                          aria-expanded={!!expandedItems[item.id]}
                          aria-label={`${expandedItems[item.id] ? 'Ocultar' : 'Editar'} detalhes de ${item.title}`}
                        >
                          <ChevronDown size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {expandedItems[item.id] && <><dl className={styles.metaGrid}>
                      <div>
                        <dt>Quem</dt>
                        <dd>{item.whoNeedsIt}</dd>
                      </div>
                      <div>
                        <dt>Timing</dt>
                        <dd>{item.timing}</dd>
                      </div>
                    </dl>

                    <label className={styles.notesField}>
                      <span>Notas</span>
                      <input
                        value={getValue(item, 'notes')}
                        onChange={(event) => updateItem(item.id, { notes: event.target.value })}
                        placeholder="Referência, link ou local onde está guardado"
                      />
                    </label>

                    {item.sourceReason && (
                      <p className={styles.source}>
                        <Info size={13} aria-hidden="true" />
                        {item.sourceReason}
                      </p>
                    )}
                    </>}
                  </article>
                );
              })}
            </div>
          </div>
        );
      })}

      <p className={styles.note}>
        {documentsChecklist.notes || 'Requisitos legais, vistos e saúde devem ser verificados em fontes oficiais antes de pagar reservas não reembolsáveis.'}
      </p>
    </section>
  );
}
