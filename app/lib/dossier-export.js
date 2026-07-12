function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return [];
}

function checklistItems(itinerary) {
  if (Array.isArray(itinerary?.bookingChecklist?.items)) return itinerary.bookingChecklist.items;
  if (Array.isArray(itinerary?.bookingChecklist)) return itinerary.bookingChecklist;
  return [];
}

function documentItems(itinerary) {
  if (Array.isArray(itinerary?.documentsChecklist?.items)) return itinerary.documentsChecklist.items;
  if (Array.isArray(itinerary?.documentsChecklist)) return itinerary.documentsChecklist;
  return [];
}

function backupItems(itinerary) {
  if (Array.isArray(itinerary?.backupPlans?.items)) return itinerary.backupPlans.items;
  if (Array.isArray(itinerary?.backupPlans)) return itinerary.backupPlans;

  const contingencies = itinerary?.contingencyPlans || {};
  return [
    contingencies.rainyDay && {
      id: 'bad_weather',
      trigger: 'Bad weather',
      replacementPlan: contingencies.rainyDay,
      clientFacing: contingencies.rainyDay,
    },
    contingencies.delayRecovery && {
      id: 'flight_delay',
      trigger: 'Delay recovery',
      replacementPlan: contingencies.delayRecovery,
      clientFacing: contingencies.delayRecovery,
    },
    contingencies.tiredDay && {
      id: 'tired_day',
      trigger: 'Tired day',
      replacementPlan: contingencies.tiredDay,
      clientFacing: contingencies.tiredDay,
    },
    contingencies.lowerBudget && {
      id: 'lower_budget',
      trigger: 'Lower budget',
      replacementPlan: contingencies.lowerBudget,
      clientFacing: contingencies.lowerBudget,
    },
  ].filter(Boolean);
}

function isDone(status) {
  return ['booked', 'confirmed', 'ready', 'uploaded_confirmed', 'not_applicable'].includes(status);
}

function audienceVisible(item, mode) {
  if (mode === 'internal') return true;
  return item?.audience !== 'internal' && item?.internalOnly !== true;
}

export function buildDossierExportContext(itinerary = {}, mode = 'client') {
  const exportMode = mode === 'internal' ? 'internal' : 'client';
  const includeInternal = exportMode === 'internal';
  const exportMetadata = itinerary.exportMetadata || {};
  const documents = documentItems(itinerary).filter((item) => audienceVisible(item, exportMode));
  const backups = backupItems(itinerary);
  const booking = checklistItems(itinerary);

  const openBookingItems = booking.filter((item) => !isDone(item.status));
  const openDocumentItems = documents.filter((item) => (
    item.importance === 'required' && !isDone(item.status)
  ));

  return {
    mode: exportMode,
    includeInternal,
    label: includeInternal ? 'Internal operating dossier' : 'Client-ready dossier',
    exportMetadata: {
      ...exportMetadata,
      internalNotes: includeInternal ? exportMetadata.internalNotes || '' : '',
    },
    clientFacingNotes: exportMetadata.clientFacingNotes || '',
    internalNotes: includeInternal ? exportMetadata.internalNotes || '' : '',
    documents,
    backupPlans: backups,
    bookingChecklist: booking,
    finalChecklist: [
      ...openBookingItems.slice(0, 8).map((item) => ({
        id: `booking-${item.id || item.task}`,
        label: item.task || item.title || 'Booking task',
        status: item.status || 'not_started',
        reason: item.priority || 'booking',
      })),
      ...openDocumentItems.slice(0, 6).map((item) => ({
        id: `document-${item.id || item.title}`,
        label: item.title || item.label || 'Required document',
        status: item.status || 'needed',
        reason: item.importance || 'document',
      })),
    ],
    warnings: asArray(itinerary.warnings),
  };
}

export default buildDossierExportContext;
