import { buildDossierExportContext } from './dossier-export';

const INTERNAL_SHARE_FIELDS = new Set([
  'internalnote',
  'internalnotes',
  'agencynote',
  'agencynotes',
  'suppliernote',
  'suppliernotes',
  'commission',
  'margin',
  'markup',
  'netrate',
  'costprice',
]);

function sanitizeClientValue(value) {
  if (Array.isArray(value)) {
    return value
      .filter((item) => !(item && typeof item === 'object' && (item.audience === 'internal' || item.internalOnly === true)))
      .map(sanitizeClientValue);
  }
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !INTERNAL_SHARE_FIELDS.has(key.toLowerCase()))
      .map(([key, nestedValue]) => [key, sanitizeClientValue(nestedValue)])
  );
}

export function encodeSharePayload(payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

export function decodeSharePayload(encoded) {
  if (!encoded) return null;
  try {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (error) {
    return null;
  }
}

const formatCurrencyAmount = (value, currencyContext) => {
  if (value === undefined || value === null || value === '') return 'Por confirmar';
  if (typeof value === 'string') {
    if (/free|gr[aá]tis/i.test(value)) return 'Grátis';
    if (/[€$£¥]|JPY|USD|GBP|EUR|IDR|MAD/i.test(value)) return value;
    const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
    if (!Number.isFinite(parsed)) return value;
    value = parsed;
  }
  
  try {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: currencyContext?.code || 'EUR',
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currencyContext?.symbol || '€'}${value}`;
  }
};

const getCurrencyContext = (itinerary) => {
  const dest = typeof itinerary?.destination === 'string'
    ? {}
    : (itinerary?.destination || {});
  const trip = itinerary?.trip || {};
  const code = dest.currency?.code || trip.budgetBreakdown?.currency || dest.currency || 'EUR';
  
  const symbols = { EUR: '€', USD: '$', GBP: '£', JPY: '¥' };
  
  return {
    code: typeof code === 'string' ? code.toUpperCase() : 'EUR',
    symbol: symbols[code] || code,
  };
};

export function buildClientShareSummary(itinerary) {
  if (!itinerary) return '';
  const dossier = buildDossierExportContext(itinerary, 'client');
  const dest = typeof itinerary.destination === 'string' ? itinerary.destination : (itinerary.destination?.city || itinerary.destination?.name || 'Destino');
  const days = itinerary.trip?.totalDays || itinerary.days?.length || 0;
  
  let summary = `Plano de Viagem: ${dest} (${days} dias)\n`;
  summary += `Gerado por Andor Travels\n\n`;
  
  if (dossier.exportMetadata?.clientFacingNotes) {
    summary += `Notas: ${dossier.exportMetadata.clientFacingNotes}\n\n`;
  }
  
  summary += `Resumo:\n`;
  summary += (itinerary.tripOverview || 'Plano de viagem prático e organizado.') + '\n\n';
  
  summary += `Itinerário:\n`;
  (itinerary.days || []).forEach(day => {
    summary += `Dia ${day.dayNumber}: ${day.title}\n`;
  });
  
  return summary;
}

export function buildInternalShareSummary(itinerary) {
  if (!itinerary) return '';
  const dossier = buildDossierExportContext(itinerary, 'internal');
  const dest = typeof itinerary.destination === 'string' ? itinerary.destination : (itinerary.destination?.city || itinerary.destination?.name || 'Destino');
  
  let summary = `[INTERNO] Ops Summary: ${dest}\n\n`;
  
  if (dossier.exportMetadata?.clientName) {
    summary += `Cliente: ${dossier.exportMetadata.clientName}\n`;
  }
  
  if (dossier.exportMetadata?.internalNotes) {
    summary += `Notas Internas: ${dossier.exportMetadata.internalNotes}\n`;
  }
  
  summary += `\nEstado de Reservas:\n`;
  const checklist = dossier.bookingChecklist || [];
  const booked = checklist.filter(i => ['booked', 'confirmed'].includes(i.status)).length;
  summary += `${booked}/${checklist.length} concluídas\n`;
  
  return summary;
}

export function buildBookingChecklistSummary(itinerary) {
  if (!itinerary) return '';
  const checklist = itinerary.bookingChecklist?.items || [];
  
  let summary = `Checklist de Reservas:\n`;
  checklist.forEach(item => {
    const statusMap = {
      not_started: 'Por iniciar',
      searching: 'Em pesquisa',
      selected: 'Selecionado',
      booked: 'Reservado',
      confirmed: 'Confirmado'
    };
    summary += `- [${statusMap[item.status] || item.status}] ${item.task}\n`;
  });
  
  return summary;
}

export function buildMinimalItinerarySummary(itinerary) {
  if (!itinerary) return '';
  const dest = typeof itinerary.destination === 'string' ? itinerary.destination : (itinerary.destination?.city || itinerary.destination?.name || 'Destino');
  const days = itinerary.trip?.totalDays || itinerary.days?.length || 0;
  
  return `Viagem para ${dest} (${days} dias)\nOrganizado via Andor Travels.`;
}

export function buildSharePayload(itinerary, mode = 'client') {
  // Filters out internal properties for public API sharing
  if (!itinerary) return null;
  const dossier = buildDossierExportContext(itinerary, mode);
  const payload = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    mode,
    destination: itinerary.destination,
    trip: itinerary.trip,
    days: itinerary.days,
    exportMetadata: dossier.exportMetadata,
    // Provide safe copies of checklists
    bookingChecklist: dossier.bookingChecklist,
    documentsChecklist: dossier.documents,
    backupPlans: dossier.backupPlans
  };

  return mode === 'internal' ? payload : sanitizeClientValue(payload);
}

export function hasInternalNotesLeakRisk(itinerary, mode) {
  if (mode === 'internal') return false;

  const containsInternalData = (value) => {
    if (Array.isArray(value)) return value.some(containsInternalData);
    if (!value || typeof value !== 'object') return false;
    if (value.audience === 'internal' || value.internalOnly === true) return true;
    return Object.entries(value).some(([key, nestedValue]) => (
      INTERNAL_SHARE_FIELDS.has(key.toLowerCase()) || containsInternalData(nestedValue)
    ));
  };

  return containsInternalData(buildSharePayload(itinerary, 'client'));
}
