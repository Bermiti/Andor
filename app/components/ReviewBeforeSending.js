'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Send } from 'lucide-react';
import { getJson } from '../lib/storage';
import { hasInternalNotesLeakRisk } from '../lib/share-utils';
import styles from './ReviewBeforeSending.module.css';

const DONE_STATUSES = new Set(['booked', 'confirmed', 'ready', 'uploaded_confirmed', 'not_applicable']);

function arrayFromSection(section) {
  if (Array.isArray(section?.items)) return section.items;
  if (Array.isArray(section)) return section;
  return [];
}

function currentValue(item, state, field) {
  return state[item.id]?.[field] ?? item[field] ?? '';
}

function itemDone(item, state) {
  return DONE_STATUSES.has(currentValue(item, state, 'status'));
}

function severityIcon(severity) {
  if (severity === 'critical') return AlertTriangle;
  if (severity === 'warning') return Info;
  return CheckCircle2;
}

function severityLabel(severity) {
  if (severity === 'critical') return 'Critico';
  if (severity === 'warning') return 'Aviso';
  return 'Info';
}

function buildWarnings({
  itinerary,
  bookingItems,
  documents,
  backupPlans,
  bookingState,
  documentState,
  exportMode,
  companyMode,
}) {
  const warnings = [];
  const criticalBooking = bookingItems.filter((item) => (
    ['critical', 'high'].includes(item.priority) && !itemDone(item, bookingState)
  ));
  const requiredDocs = documents.filter((item) => item.importance === 'required' && !itemDone(item, documentState));
  const recommendedDocs = documents.filter((item) => item.importance === 'recommended' && !itemDone(item, documentState));
  const rentalRecommended = itinerary?.rentalCar?.recommended === true;
  const rentalDocIds = new Set(['driver_license', 'international_driving_permit', 'rental_car_confirmation', 'rental_car_insurance']);
  const openRentalDocs = documents.filter((item) => rentalDocIds.has(item.id) && !itemDone(item, documentState));

  criticalBooking.slice(0, 4).forEach((item) => {
    warnings.push({
      severity: 'critical',
      title: item.task || item.title || 'Tarefa de reserva pendente',
      detail: `Estado: ${currentValue(item, bookingState, 'status') || 'não iniciado'}. Confirma antes de enviar o dossier.`,
    });
  });

  requiredDocs.slice(0, 4).forEach((item) => {
    warnings.push({
      severity: 'critical',
      title: item.title || item.label || 'Documento obrigatório em falta',
      detail: `${item.whoNeedsIt || 'O viajante'} ainda precisa de marcar este item como pronto ou confirmado.`,
    });
  });

  if (rentalRecommended && openRentalDocs.length > 0) {
    warnings.push({
      severity: 'warning',
      title: 'Os documentos do rent-a-car ainda não estão prontos',
      detail: 'Carta, licença internacional, seguro, voucher, estacionamento e caução devem ser confirmados antes da entrega.',
    });
  }

  if (recommendedDocs.length > 0) {
    warnings.push({
      severity: 'warning',
      title: `${recommendedDocs.length} documento${recommendedDocs.length === 1 ? '' : 's'} recomendado${recommendedDocs.length === 1 ? '' : 's'} pendente${recommendedDocs.length === 1 ? '' : 's'}`,
      detail: 'Podem não impedir o envio, mas reduzem a preparação do dossier.',
    });
  }

  if (backupPlans.length < 8) {
    warnings.push({
      severity: 'warning',
      title: 'A cobertura de planos alternativos é insuficiente',
      detail: 'O dossier deve cobrir clima, atrasos, hotel, atividades, refeições, ritmo, orçamento, carro, transportes e agenda.',
    });
  }

  const hasBookedItems = bookingItems.some(item => ['booked', 'confirmed'].includes(currentValue(item, bookingState, 'status')));
  const approvalItem = documents.find(item => item.id === 'client_itinerary_approval' || item.id === 'client_approval');
  const hasApproval = approvalItem ? itemDone(approvalItem, documentState) : false;

  if (companyMode) {
    if (!hasApproval) {
      warnings.push({
        severity: 'warning',
        title: 'Aprovação do cliente pendente',
        detail: 'O modo de agência exige aprovação do cliente antes de confirmar reservas.',
      });
    }
    if (hasBookedItems && !hasApproval) {
      warnings.push({
        severity: 'critical',
        title: 'Reservas sem aprovação do cliente',
        detail: 'Existem itens marcados como reservados, mas o cliente ainda não aprovou o itinerário.',
      });
    }
  }

  if (exportMode === 'client') {
    if (itinerary?.exportMetadata?.internalNotes) {
      warnings.push({
        severity: 'info',
        title: 'Notas internas ocultas',
        detail: 'As notas internas não serão exportadas. Mude para o modo interno se desejar incluí-las.',
      });
    }
    
    if (hasInternalNotesLeakRisk(itinerary, exportMode)) {
      warnings.push({
        severity: 'critical',
        title: 'Risco de Fuga de Dados',
        detail: 'Existem notas internas associadas ao perfil do viajante que podem estar visíveis. Verifique antes de partilhar.',
      });
    }
  }

  if (warnings.length === 0) {
    warnings.push({
      severity: 'info',
      title: 'Pronto para a revisão humana final',
      detail: 'As reservas, documentos e alternativas visíveis estão coerentes. Confirma preços atuais e regras oficiais antes da compra.',
    });
  }

  return warnings;
}

export default function ReviewBeforeSending({
  itinerary,
  exportMode = 'client',
  bookingStorageKey,
  documentsStorageKey,
  companyMode = false,
}) {
  const [bookingState, setBookingState] = useState({});
  const [documentState, setDocumentState] = useState({});

  useEffect(() => {
    if (bookingStorageKey) setBookingState(getJson(bookingStorageKey, {}, 'local') || {});
    if (documentsStorageKey) setDocumentState(getJson(documentsStorageKey, {}, 'local') || {});
  }, [bookingStorageKey, documentsStorageKey]);

  useEffect(() => {
    const handler = (event) => {
      if (!bookingStorageKey || event.detail?.storageKey !== bookingStorageKey) return;
      setBookingState(event.detail.itemState || {});
    };
    window.addEventListener('andor-bookings-updated', handler);
    return () => window.removeEventListener('andor-bookings-updated', handler);
  }, [bookingStorageKey]);

  useEffect(() => {
    const handler = (event) => {
      if (!documentsStorageKey || event.detail?.storageKey !== documentsStorageKey) return;
      setDocumentState(event.detail.itemState || {});
    };
    window.addEventListener('andor-documents-updated', handler);
    return () => window.removeEventListener('andor-documents-updated', handler);
  }, [documentsStorageKey]);

  const bookingItems = useMemo(() => arrayFromSection(itinerary?.bookingChecklist), [itinerary]);
  const documents = useMemo(() => (
    arrayFromSection(itinerary?.documentsChecklist).filter((item) => (
      exportMode === 'internal' || (item.audience !== 'internal' && item.internalOnly !== true)
    ))
  ), [itinerary, exportMode]);
  const backupPlans = useMemo(() => arrayFromSection(itinerary?.backupPlans), [itinerary]);

  const totalReviewItems = bookingItems.length + documents.length;
  const completeReviewItems = [
    ...bookingItems.filter((item) => itemDone(item, bookingState)),
    ...documents.filter((item) => itemDone(item, documentState)),
  ].length;
  const readiness = totalReviewItems ? Math.round((completeReviewItems / totalReviewItems) * 100) : 0;
  const warnings = buildWarnings({
    itinerary,
    bookingItems,
    documents,
    backupPlans,
    bookingState,
    documentState,
    exportMode,
    companyMode,
  });
  const criticalCount = warnings.filter((item) => item.severity === 'critical').length;

  return (
    <section className={styles.section} aria-label="Revisao antes de enviar">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            <Send size={22} aria-hidden="true" />
            Rever antes de enviar
          </h2>
          <p className={styles.subtitle}>Última leitura antes de partilhar o dossier ou exportar o PDF.</p>
        </div>
        <div className={`${styles.score} ${criticalCount > 0 ? styles.scoreBlocked : styles.scoreClear}`}>
          <strong>{readiness}%</strong>
          <span>{exportMode === 'internal' ? 'interno' : 'cliente'}</span>
        </div>
      </div>

      <div className={styles.warningList}>
        {warnings.map((warning, index) => {
          const Icon = severityIcon(warning.severity);
          return (
            <article key={`${warning.severity}-${index}`} className={`${styles.warning} ${styles[warning.severity]}`}>
              <Icon size={17} aria-hidden="true" />
              <div>
                <div className={styles.warningTitleRow}>
                  <span>{severityLabel(warning.severity)}</span>
                  <h3>{warning.title}</h3>
                </div>
                <p>{warning.detail}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
