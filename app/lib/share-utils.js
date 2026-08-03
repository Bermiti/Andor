import { buildDossierExportContext } from './dossier-export';

const MAX_PUBLIC_DAYS = 45;
const MAX_PUBLIC_STOPS_PER_DAY = 30;
const MAX_PUBLIC_CHECKLIST_ITEMS = 40;

function cleanText(value, maxLength = 2_000) {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function cleanNumber(value, min = -1_000_000_000, max = 1_000_000_000) {
  if ((typeof value !== 'number' && typeof value !== 'string') || value === '') return undefined;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return undefined;
  return Math.min(max, Math.max(min, numeric));
}

function definedEntries(entries) {
  return Object.fromEntries(entries.filter(([, value]) => value !== undefined));
}

function publicCurrency(value) {
  if (typeof value === 'string') return cleanText(value, 12);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return definedEntries([
    ['code', cleanText(value.code, 8)],
    ['symbol', cleanText(value.symbol, 8)],
  ]);
}

function publicDestination(value) {
  if (typeof value === 'string') return cleanText(value, 160);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Destino';
  return definedEntries([
    ['entityId', cleanText(value.entityId, 64)],
    ['canonicalName', cleanText(value.canonicalName, 100)],
    ['displayName', cleanText(value.displayName, 160)],
    ['entityType', cleanText(value.entityType, 40)],
    ['city', cleanText(value.city || value.canonicalName, 100)],
    ['name', cleanText(value.name || value.canonicalName, 100)],
    ['region', cleanText(value.region, 100)],
    ['regionCode', cleanText(value.regionCode, 20)],
    ['country', cleanText(value.country, 100)],
    ['countryCode', cleanText(value.countryCode, 3)],
    ['timezone', cleanText(value.timezone, 60)],
    ['currencyCodes', Array.isArray(value.currencyCodes) ? value.currencyCodes.map(c => cleanText(c, 8)).filter(Boolean) : undefined],
    ['currency', publicCurrency(value.currency)],
    ['resolutionStatus', cleanText(value.resolutionStatus, 40)],
    ['provenance', value.provenance && typeof value.provenance === 'object' ? definedEntries([
      ['sourceType', cleanText(value.provenance.sourceType, 40)],
      ['provider', cleanText(value.provenance.provider, 60)],
      ['confidence', cleanNumber(value.provenance.confidence, 0, 1)],
      ['attribution', cleanText(value.provenance.attribution, 200)],
    ]) : undefined],
  ]);
}

function publicTrip(value) {
  const trip = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return definedEntries([
    ['totalDays', cleanNumber(trip.totalDays, 0, MAX_PUBLIC_DAYS)],
    ['travelers', cleanNumber(trip.travelers, 0, 100)],
    ['numberOfTravelers', cleanNumber(trip.numberOfTravelers, 0, 100)],
    ['summary', cleanText(trip.summary, 2_000)],
    ['tripOverview', cleanText(trip.tripOverview, 2_000)],
    ['travelStyle', cleanText(trip.travelStyle, 80)],
    ['groupType', cleanText(trip.groupType, 80)],
    ['startDate', cleanText(trip.startDate, 40)],
    ['endDate', cleanText(trip.endDate, 40)],
    // Keep the legacy shape stable without copying any profile attributes.
    ['travelerProfile', trip.travelerProfile && typeof trip.travelerProfile === 'object' ? {} : undefined],
  ]);
}

function publicStop(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return definedEntries([
    ['id', cleanText(value.id, 120)],
    ['time', cleanText(value.time, 40)],
    ['name', cleanText(value.name, 240)],
    ['title', cleanText(value.title, 240)],
    ['description', cleanText(value.description, 3_000)],
    ['type', cleanText(value.type, 80)],
    ['duration', cleanText(value.duration, 100)],
    ['estimatedCost', typeof value.estimatedCost === 'number'
      ? cleanNumber(value.estimatedCost)
      : cleanText(value.estimatedCost, 100)],
    ['cost', typeof value.cost === 'number' ? cleanNumber(value.cost) : cleanText(value.cost, 100)],
    ['category', cleanText(value.category, 80)],
  ]);
}

function publicDay(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return definedEntries([
    ['id', cleanText(value.id, 120)],
    ['dayNumber', cleanNumber(value.dayNumber, 1, MAX_PUBLIC_DAYS)],
    ['title', cleanText(value.title, 240)],
    ['date', cleanText(value.date, 40)],
    ['summary', cleanText(value.summary, 2_000)],
    ['stops', Array.isArray(value.stops)
      ? value.stops.slice(0, MAX_PUBLIC_STOPS_PER_DAY).map(publicStop).filter(Boolean)
      : []],
  ]);
}

function publicChecklistItem(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (value.audience === 'internal' || value.internalOnly === true) return null;
  return definedEntries([
    ['id', cleanText(value.id, 120)],
    ['task', cleanText(value.task, 240)],
    ['title', cleanText(value.title, 240)],
    ['label', cleanText(value.label, 240)],
    ['status', cleanText(value.status, 60)],
    ['priority', cleanText(value.priority, 60)],
    ['importance', cleanText(value.importance, 60)],
    ['audience', value.audience === 'client' ? 'client' : undefined],
    ['daysBeforeDeparture', cleanNumber(value.daysBeforeDeparture, 0, 10_000)],
  ]);
}

function publicBackup(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (value.audience === 'internal' || value.internalOnly === true) return null;
  return definedEntries([
    ['id', cleanText(value.id, 120)],
    ['trigger', cleanText(value.trigger, 240)],
    ['title', cleanText(value.title, 240)],
    ['clientFacing', cleanText(value.clientFacing, 2_000)],
    ['replacementPlan', cleanText(value.replacementPlan, 2_000)],
  ]);
}

function listFrom(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  return [];
}

/**
 * Builds the only payload shape exposed by an anonymous share link.
 *
 * This is intentionally an allowlist, not a recursive sanitizer. New fields in
 * the durable itinerary stay private until they are deliberately reviewed here.
 */
export function buildPublicShareSnapshot(itinerary) {
  if (!itinerary || typeof itinerary !== 'object' || Array.isArray(itinerary)) return null;

  const metadata = itinerary.exportMetadata && typeof itinerary.exportMetadata === 'object'
    ? itinerary.exportMetadata
    : {};
  const booking = listFrom(itinerary.bookingChecklist);
  const documents = listFrom(itinerary.documentsChecklist);
  const backups = listFrom(itinerary.backupPlans);

  return {
    version: '2.0',
    destination: publicDestination(itinerary.destination),
    trip: publicTrip(itinerary.trip),
    days: Array.isArray(itinerary.days)
      ? itinerary.days.slice(0, MAX_PUBLIC_DAYS).map(publicDay).filter(Boolean)
      : [],
    exportMetadata: definedEntries([
      ['clientFacingNotes', cleanText(metadata.clientFacingNotes, 3_000)],
      ['companyName', cleanText(metadata.companyName, 160)],
      ['travelers', cleanNumber(metadata.travelers, 0, 100)],
    ]),
    bookingChecklist: booking
      .slice(0, MAX_PUBLIC_CHECKLIST_ITEMS)
      .map(publicChecklistItem)
      .filter(Boolean),
    documentsChecklist: documents
      .slice(0, MAX_PUBLIC_CHECKLIST_ITEMS)
      .map(publicChecklistItem)
      .filter(Boolean),
    backupPlans: backups
      .slice(0, MAX_PUBLIC_CHECKLIST_ITEMS)
      .map(publicBackup)
      .filter(Boolean),
  };
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
  if (!itinerary) return null;
  if (mode !== 'internal') return buildPublicShareSnapshot(itinerary);

  // Internal exports are authenticated workspace artifacts. They are never
  // persisted in, or returned by, an anonymous share link.
  const dossier = buildDossierExportContext(itinerary, mode);
  return {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    mode: 'internal',
    destination: itinerary.destination,
    trip: itinerary.trip,
    days: itinerary.days,
    exportMetadata: dossier.exportMetadata,
    // Provide safe copies of checklists
    bookingChecklist: dossier.bookingChecklist,
    documentsChecklist: dossier.documents,
    backupPlans: dossier.backupPlans
  };
}

export function hasInternalNotesLeakRisk(itinerary, mode) {
  if (mode === 'internal') return false;

  const serialized = JSON.stringify(buildPublicShareSnapshot(itinerary) || {}).toLowerCase();
  return [
    'internalnotes',
    'internalnote',
    'suppliernotes',
    'suppliernote',
    'bookingreference',
    'clientname',
    'commission',
    'margin',
    'markup',
  ].some((field) => serialized.includes(`\"${field}\"`));
}
