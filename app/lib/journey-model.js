import { z } from 'zod';

export const JOURNEY_SCHEMA_VERSION = 2;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const PERIODS = ['morning', 'lunch', 'afternoon', 'dinner', 'evening', 'unscheduled'];
const STAGE_STATUSES = ['draft', 'planned', 'confirmed', 'completed', 'cancelled'];
const TRANSFER_STATUSES = ['draft', 'planned', 'selected', 'booked', 'confirmed', 'completed', 'cancelled'];
const TRANSFER_MODES = ['unspecified', 'walk', 'bike', 'train', 'bus', 'car', 'flight', 'ferry', 'other'];

const EntityIdSchema = z.string().trim().min(1).max(160);
const IsoDateSchema = z.string().regex(ISO_DATE_PATTERN, 'Expected an ISO date (YYYY-MM-DD)');
const NullableIsoDateSchema = IsoDateSchema.nullable();
const CurrencyCodeSchema = z.string().trim().toUpperCase().regex(CURRENCY_PATTERN).nullable();

export const JourneyCoordinatesSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
}).strict();

const BoundingBoxSchema = z.object({
  minLat: z.number().finite().min(-90).max(90),
  maxLat: z.number().finite().min(-90).max(90),
  minLng: z.number().finite().min(-180).max(180),
  maxLng: z.number().finite().min(-180).max(180),
}).strict();

const ProvenanceSchema = z.object({
  sourceType: z.enum(['official', 'verified_provider', 'user', 'ai_proposal', 'estimate', 'legacy', 'demo', 'unknown']),
  provider: z.string().trim().min(1).max(100),
  providerRecordId: z.string().trim().max(160).nullable().optional(),
  retrievedAt: z.string().trim().max(60).nullable().optional(),
  confidence: z.number().finite().min(0).max(1).nullable().optional(),
  attribution: z.string().trim().max(300).nullable().optional(),
  isEstimated: z.boolean().optional(),
}).passthrough();

export const JourneyDestinationSchema = z.object({
  entityId: z.string().trim().min(1).max(160).nullable().default(null),
  canonicalName: z.string().trim().min(1).max(120),
  displayName: z.string().trim().min(1).max(200),
  entityType: z.string().trim().min(1).max(60).nullable().default(null),
  city: z.string().trim().max(120).nullable().default(null),
  region: z.string().trim().max(120).nullable().default(null),
  country: z.string().trim().max(120).nullable().default(null),
  countryCode: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/).nullable().default(null),
  regionCode: z.string().trim().max(80).nullable().default(null),
  parentPath: z.array(z.string().trim().min(1).max(160)).max(12).default([]),
  coordinates: JourneyCoordinatesSchema,
  boundingBox: BoundingBoxSchema.nullable().default(null),
  timezone: z.string().trim().min(1).max(100).nullable().default(null),
  currencyCodes: z.array(z.string().trim().toUpperCase().regex(CURRENCY_PATTERN)).max(8).default([]),
  resolutionStatus: z.enum(['resolved', 'partially_resolved', 'ambiguous', 'unresolved', 'legacy']).default('partially_resolved'),
  provenance: ProvenanceSchema.nullable().default(null),
}).passthrough();

const MoneySchema = z.object({
  amount: z.number().finite().nonnegative().nullable().default(null),
  currency: CurrencyCodeSchema.default(null),
  kind: z.enum(['cap', 'estimate', 'selected', 'confirmed']).default('estimate'),
}).passthrough();

const AccommodationSchema = z.object({
  status: z.enum(['not_started', 'searching', 'selected', 'booked', 'confirmed']).default('not_started'),
  name: z.string().trim().max(200).nullable().default(null),
  address: z.string().trim().max(300).nullable().default(null),
  checkIn: z.string().trim().max(60).nullable().default(null),
  checkOut: z.string().trim().max(60).nullable().default(null),
  cost: MoneySchema.nullable().default(null),
  provenance: ProvenanceSchema.nullable().default(null),
}).passthrough();

const StageBoundarySchema = z.object({
  kind: z.enum(['trip_start', 'trip_end', 'transfer']),
  transferId: EntityIdSchema.nullable().default(null),
  date: NullableIsoDateSchema.default(null),
  timeWindow: z.string().trim().max(80).nullable().default(null),
}).passthrough();

export const JourneyStageSchema = z.object({
  id: EntityIdSchema,
  sequence: z.number().int().nonnegative(),
  destination: JourneyDestinationSchema,
  arrivalDate: NullableIsoDateSchema,
  departureDate: NullableIsoDateSchema,
  nights: z.number().int().nonnegative(),
  allocatedDays: z.number().int().positive(),
  dayStart: z.number().int().positive(),
  dayEnd: z.number().int().positive(),
  status: z.enum(STAGE_STATUSES).default('planned'),
  arrival: StageBoundarySchema,
  departure: StageBoundarySchema,
  accommodation: AccommodationSchema.nullable().default(null),
  notes: z.string().max(4_000).default(''),
  budgetAllocation: MoneySchema.nullable().default(null),
}).passthrough();

export const JourneyTransferSchema = z.object({
  id: EntityIdSchema,
  sequence: z.number().int().nonnegative(),
  fromStageId: EntityIdSchema,
  toStageId: EntityIdSchema,
  travelDayNumber: z.number().int().positive(),
  travelDate: NullableIsoDateSchema,
  mode: z.enum(TRANSFER_MODES).default('unspecified'),
  status: z.enum(TRANSFER_STATUSES).default('planned'),
  departureWindow: z.string().trim().max(80).nullable().default(null),
  arrivalWindow: z.string().trim().max(80).nullable().default(null),
  durationMinutes: z.number().int().positive().nullable().default(null),
  distanceKm: z.number().finite().nonnegative().nullable().default(null),
  cost: MoneySchema.nullable().default(null),
  provenance: ProvenanceSchema.nullable().default(null),
  notes: z.string().max(2_000).default(''),
}).passthrough();

export const JourneyActivitySchema = z.object({
  id: EntityIdSchema,
  stageId: EntityIdSchema,
  dayId: EntityIdSchema,
  name: z.string().trim().min(1).max(240),
  period: z.enum(PERIODS).default('unscheduled'),
  coordinates: JourneyCoordinatesSchema.nullable().optional(),
}).passthrough();

export const JourneyDaySchema = z.object({
  id: EntityIdSchema,
  dayNumber: z.number().int().positive(),
  date: NullableIsoDateSchema,
  stageId: EntityIdSchema,
  stageDayNumber: z.number().int().positive(),
  transferIds: z.array(EntityIdSchema).default([]),
  activities: z.array(JourneyActivitySchema).default([]),
  periods: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export const JourneySchema = z.object({
  kind: z.enum(['single_destination', 'multi_destination']),
  routeLabel: z.string().trim().min(1).max(500),
  startDate: NullableIsoDateSchema,
  endDate: NullableIsoDateSchema,
  totalDays: z.number().int().positive(),
  totalNights: z.number().int().nonnegative(),
  baseCurrency: CurrencyCodeSchema,
  stages: z.array(JourneyStageSchema).min(1).max(14),
  transfers: z.array(JourneyTransferSchema).max(13),
}).passthrough();

export const JourneyItinerarySchema = z.object({
  schemaVersion: z.literal(JOURNEY_SCHEMA_VERSION),
  journey: JourneySchema,
  destination: JourneyDestinationSchema,
  trip: z.record(z.string(), z.unknown()),
  days: z.array(JourneyDaySchema).min(1).max(365),
}).passthrough();

export class JourneyModelError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'JourneyModelError';
    this.code = 'INVALID_JOURNEY';
    this.errors = errors;
  }
}

function clone(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function text(value, fallback = '') {
  const normalized = value == null ? '' : String(value).trim();
  return normalized || fallback;
}

function nullableText(value) {
  const normalized = text(value);
  return normalized || null;
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
  );
}

function stableHash(value) {
  const input = JSON.stringify(canonicalize(value));
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193) >>> 0;
    second = Math.imul(second ^ code, 0x85ebca6b) >>> 0;
    second ^= second >>> 13;
  }
  return `${first.toString(16).padStart(8, '0')}${second.toString(16).padStart(8, '0')}`;
}

export function createStableJourneyId(namespace, ...parts) {
  const safeNamespace = text(namespace, 'entity')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'entity';
  return `${safeNamespace}-${stableHash(parts)}`;
}

function coordinateObject(value) {
  if (Array.isArray(value) && value.length >= 2) {
    const lat = Number(value[0]);
    const lng = Number(value[1]);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }
  if (value && typeof value === 'object') {
    const lat = Number(value.lat ?? value.latitude);
    const lng = Number(value.lng ?? value.lon ?? value.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }
  return null;
}

function destinationLabel(destination) {
  return text(
    destination?.canonicalName
      || destination?.city
      || destination?.name
      || destination?.displayName,
    'Destino',
  );
}

function normalizeDestination(input) {
  const source = typeof input === 'string' ? { displayName: input } : (input || {});
  const displayName = text(source.displayName || source.name || source.canonicalName);
  const displayParts = displayName.split(',').map((part) => part.trim()).filter(Boolean);
  const canonicalName = text(
    source.canonicalName || source.city || source.name || displayParts[0],
  );
  const coordinates = coordinateObject(source.coordinates || source.coordinate || source.coords);
  const currency = typeof source.currency === 'object' ? source.currency?.code : source.currency;
  const currencyCodes = Array.from(new Set(
    [
      ...(Array.isArray(source.currencyCodes) ? source.currencyCodes : []),
      currency,
    ]
      .map((code) => text(code).toUpperCase())
      .filter((code) => CURRENCY_PATTERN.test(code)),
  ));

  return {
    ...source,
    entityId: nullableText(source.entityId || source.id),
    canonicalName,
    displayName: displayName || canonicalName,
    entityType: nullableText(source.entityType || source.placeType || source.type),
    city: nullableText(source.city || (source.entityType === 'city' ? canonicalName : null)),
    region: nullableText(source.region),
    country: nullableText(source.country || displayParts.slice(1).join(', ')),
    countryCode: nullableText(source.countryCode)?.toUpperCase() || null,
    regionCode: nullableText(source.regionCode),
    parentPath: Array.isArray(source.parentPath) ? source.parentPath.filter(Boolean).map(String) : [],
    coordinates,
    boundingBox: source.boundingBox || null,
    timezone: nullableText(source.timezone),
    currencyCodes,
    resolutionStatus: text(
      source.resolutionStatus,
      source.entityId && coordinates ? 'resolved' : source.legacy ? 'legacy' : 'partially_resolved',
    ),
    provenance: source.provenance || null,
  };
}

function parseIsoDate(value) {
  if (!ISO_DATE_PATTERN.test(value || '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) return null;
  return date;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(value, numberOfDays) {
  const date = typeof value === 'string' ? parseIsoDate(value) : value;
  if (!date) return null;
  return isoDate(new Date(date.getTime() + numberOfDays * 86_400_000));
}

function inclusiveDayCount(startDate, endDate) {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (!start || !end || end < start) return null;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

function normalizeMoney(value) {
  if (!value || typeof value !== 'object') return null;
  const amount = value.amount == null ? null : Number(value.amount);
  return {
    ...value,
    amount: Number.isFinite(amount) && amount >= 0 ? amount : null,
    currency: CURRENCY_PATTERN.test(text(value.currency).toUpperCase())
      ? text(value.currency).toUpperCase()
      : null,
    kind: text(value.kind, 'estimate'),
  };
}

function normalizeAccommodation(value) {
  if (!value || typeof value !== 'object') return null;
  return {
    ...value,
    status: text(value.status, 'not_started'),
    name: nullableText(value.name),
    address: nullableText(value.address),
    checkIn: nullableText(value.checkIn),
    checkOut: nullableText(value.checkOut),
    cost: normalizeMoney(value.cost),
    provenance: value.provenance || null,
  };
}

function destinationIdentity(destination) {
  return {
    entityId: destination.entityId,
    canonicalName: destination.canonicalName,
    countryCode: destination.countryCode,
    regionCode: destination.regionCode,
    coordinates: destination.coordinates,
  };
}

export function calculateStraightLineDistanceKm(from, to) {
  if (!from || !to) return null;
  const radians = (degrees) => degrees * (Math.PI / 180);
  const earthRadiusKm = 6371;
  const latitudeDelta = radians(to.lat - from.lat);
  const longitudeDelta = radians(to.lng - from.lng);
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat))
    * Math.sin(longitudeDelta / 2) ** 2;
  const bounded = Math.max(0, Math.min(1, value));
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(bounded), Math.sqrt(1 - bounded));
}

function assertPlanInputs(stages, startDate, endDate, totalDays) {
  const errors = [];
  if (!Array.isArray(stages) || stages.length === 0) errors.push('At least one stage is required');
  if ((startDate && !endDate) || (!startDate && endDate)) {
    errors.push('startDate and endDate must be provided together');
  }
  if (startDate && !parseIsoDate(startDate)) errors.push('startDate is not a valid ISO date');
  if (endDate && !parseIsoDate(endDate)) errors.push('endDate is not a valid ISO date');
  if (startDate && endDate && inclusiveDayCount(startDate, endDate) === null) {
    errors.push('endDate must not precede startDate');
  }
  if (totalDays != null && (!Number.isInteger(Number(totalDays)) || Number(totalDays) < 1)) {
    errors.push('totalDays must be a positive integer');
  }
  if (errors.length > 0) throw new JourneyModelError('Cannot build journey plan', errors);
}

export function buildJourneyPlan({
  stages,
  transfers,
  startDate = null,
  endDate = null,
  totalDays = null,
  baseCurrency = null,
} = {}) {
  assertPlanInputs(stages, startDate, endDate, totalDays);

  const normalizedStages = stages.map((input, sequence) => {
    const destination = normalizeDestination(input?.destination || input);
    if (!destination.canonicalName || !destination.coordinates) {
      throw new JourneyModelError('Cannot build journey plan', [
        `Stage ${sequence + 1} requires a structured destination with coordinates`,
      ]);
    }
    const nights = Number(input?.nights);
    if (!Number.isInteger(nights) || nights < 0) {
      throw new JourneyModelError('Cannot build journey plan', [
        `Stage ${sequence + 1} nights must be a non-negative integer`,
      ]);
    }
    const id = text(input?.id) || createStableJourneyId(
      'stage',
      destinationIdentity(destination),
      sequence,
    );
    return {
      ...(input || {}),
      id,
      sequence,
      destination,
      nights,
    };
  });

  const dateDays = startDate && endDate ? inclusiveDayCount(startDate, endDate) : null;
  if (dateDays && totalDays != null && dateDays !== Number(totalDays)) {
    throw new JourneyModelError('Cannot build journey plan', [
      `Dates contain ${dateDays} days but totalDays is ${Number(totalDays)}`,
    ]);
  }
  const nightsTotal = normalizedStages.reduce((sum, stage) => sum + stage.nights, 0);
  const resolvedTotalDays = dateDays || (totalDays == null ? nightsTotal + 1 : Number(totalDays));
  if (nightsTotal !== resolvedTotalDays - 1) {
    throw new JourneyModelError('Cannot build journey plan', [
      `Stage nights total ${nightsTotal}; expected ${resolvedTotalDays - 1}`,
    ]);
  }

  let dayCursor = 1;
  const allocatedStages = normalizedStages.map((stage, sequence) => {
    const allocatedDays = stage.nights + (sequence === normalizedStages.length - 1 ? 1 : 0);
    if (allocatedDays < 1) {
      throw new JourneyModelError('Cannot build journey plan', [
        `Stage ${sequence + 1} must receive at least one day`,
      ]);
    }
    const dayStart = dayCursor;
    const dayEnd = dayStart + allocatedDays - 1;
    dayCursor = dayEnd + 1;
    const arrivalDate = startDate ? addDays(startDate, dayStart - 1) : null;
    const departureDate = startDate ? addDays(arrivalDate, stage.nights) : null;
    return {
      ...stage,
      allocatedDays,
      dayStart,
      dayEnd,
      arrivalDate,
      departureDate,
      status: text(stage.status, 'planned'),
      accommodation: normalizeAccommodation(stage.accommodation),
      notes: text(stage.notes),
      budgetAllocation: normalizeMoney(stage.budgetAllocation),
    };
  });

  if (dayCursor - 1 !== resolvedTotalDays) {
    throw new JourneyModelError('Cannot build journey plan', ['Stage allocation did not cover every trip day']);
  }

  if (transfers != null && (!Array.isArray(transfers) || transfers.length !== Math.max(0, allocatedStages.length - 1))) {
    throw new JourneyModelError('Cannot build journey plan', [
      `Expected ${Math.max(0, allocatedStages.length - 1)} transfers`,
    ]);
  }

  const allocatedTransfers = allocatedStages.slice(0, -1).map((fromStage, sequence) => {
    const toStage = allocatedStages[sequence + 1];
    const source = transfers?.[sequence] || {};
    const id = text(source.id) || createStableJourneyId('transfer', fromStage.id, toStage.id);
    const computedDistance = calculateStraightLineDistanceKm(
      fromStage.destination.coordinates,
      toStage.destination.coordinates,
    );
    return {
      ...source,
      id,
      sequence,
      fromStageId: fromStage.id,
      toStageId: toStage.id,
      travelDayNumber: toStage.dayStart,
      travelDate: toStage.arrivalDate,
      mode: text(source.mode, 'unspecified'),
      status: text(source.status, 'planned'),
      departureWindow: nullableText(source.departureWindow),
      arrivalWindow: nullableText(source.arrivalWindow),
      durationMinutes: source.durationMinutes == null ? null : Number(source.durationMinutes),
      distanceKm: source.distanceKm == null && computedDistance != null
        ? Math.round(computedDistance * 10) / 10
        : source.distanceKm == null ? null : Number(source.distanceKm),
      cost: normalizeMoney(source.cost),
      provenance: source.provenance || null,
      notes: text(source.notes),
    };
  });

  const transferByDestination = new Map(allocatedTransfers.map((transfer) => [transfer.toStageId, transfer]));
  const transferByOrigin = new Map(allocatedTransfers.map((transfer) => [transfer.fromStageId, transfer]));
  const finalStages = allocatedStages.map((stage, sequence) => {
    const incoming = transferByDestination.get(stage.id);
    const outgoing = transferByOrigin.get(stage.id);
    return {
      ...stage,
      arrival: {
        ...(stage.arrival || {}),
        kind: incoming ? 'transfer' : 'trip_start',
        transferId: incoming?.id || null,
        date: stage.arrivalDate,
        timeWindow: nullableText(stage.arrival?.timeWindow || incoming?.arrivalWindow),
      },
      departure: {
        ...(stage.departure || {}),
        kind: outgoing ? 'transfer' : 'trip_end',
        transferId: outgoing?.id || null,
        date: stage.departureDate,
        timeWindow: nullableText(stage.departure?.timeWindow || outgoing?.departureWindow),
      },
      sequence,
    };
  });

  const normalizedBaseCurrency = text(baseCurrency).toUpperCase();
  const inferredCurrencies = Array.from(new Set(finalStages.flatMap((stage) => stage.destination.currencyCodes)));

  return {
    kind: finalStages.length === 1 ? 'single_destination' : 'multi_destination',
    routeLabel: finalStages.map((stage) => destinationLabel(stage.destination)).join(' → '),
    startDate,
    endDate,
    totalDays: resolvedTotalDays,
    totalNights: resolvedTotalDays - 1,
    baseCurrency: CURRENCY_PATTERN.test(normalizedBaseCurrency)
      ? normalizedBaseCurrency
      : inferredCurrencies.length === 1 ? inferredCurrencies[0] : null,
    stages: finalStages,
    transfers: allocatedTransfers,
  };
}

function activityIdentity(activity) {
  const id = text(activity?.id);
  if (id) return `id:${id}`;
  const name = text(activity?.name || activity?.title).toLocaleLowerCase();
  const time = text(activity?.time || activity?.startTime).toLocaleLowerCase();
  return name || time ? `content:${name}|${time}` : '';
}

function legacyActivitySources(day) {
  const sources = [];
  for (const period of ['morning', 'afternoon', 'evening']) {
    const activities = day?.periods?.[period]?.activities;
    if (!Array.isArray(activities)) continue;
    activities.forEach((activity) => sources.push({ ...activity, period: activity?.period || period }));
  }
  if (Array.isArray(day?.stops)) day.stops.forEach((activity) => sources.push(activity));
  if (Array.isArray(day?.activities)) day.activities.forEach((activity) => sources.push(activity));
  return sources;
}

function periodMetadata(day) {
  if (!day?.periods || typeof day.periods !== 'object' || Array.isArray(day.periods)) return undefined;
  return Object.fromEntries(Object.entries(day.periods).map(([key, value]) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [key, value];
    const { activities: _activities, ...metadata } = value;
    return [key, metadata];
  }));
}

function normalizeDayActivities(day, dayId, stageId) {
  const merged = new Map();
  legacyActivitySources(day).forEach((activity, index) => {
    const key = activityIdentity(activity) || `position:${index}`;
    merged.set(key, { ...(merged.get(key) || {}), ...(activity || {}) });
  });
  return Array.from(merged.values()).map((activity, index) => {
    const coordinates = coordinateObject(activity.coordinates || activity.coords || activity.location);
    return {
      ...activity,
      id: text(activity.id) || createStableJourneyId('activity', dayId, activityIdentity(activity), index),
      stageId,
      dayId,
      name: text(activity.name || activity.title, `Atividade ${index + 1}`),
      period: PERIODS.includes(activity.period) ? activity.period : 'unscheduled',
      coordinates,
    };
  });
}

function normalizeDay(day, { stage, globalIndex, stageIndex, date, incomingTransfer }) {
  const source = day && typeof day === 'object' ? day : {};
  const {
    activities: _activities,
    stops: _stops,
    periods: _periods,
    transferIds: sourceTransferIds,
    ...rest
  } = source;
  const dayId = text(source.id) || createStableJourneyId(
    'day',
    stage.id,
    stageIndex,
    source.date || source.title || globalIndex,
  );
  const transferIds = Array.from(new Set([
    ...(Array.isArray(sourceTransferIds) ? sourceTransferIds.map(String) : []),
    ...(incomingTransfer && stageIndex === 0 ? [incomingTransfer.id] : []),
  ]));
  const metadata = periodMetadata(source);
  return {
    ...rest,
    id: dayId,
    dayNumber: globalIndex + 1,
    date: date || nullableText(source.date),
    stageId: stage.id,
    stageDayNumber: stageIndex + 1,
    transferIds,
    activities: normalizeDayActivities(source, dayId, stage.id),
    ...(metadata ? { periods: metadata } : {}),
  };
}

function stageDaysInput(daysByStage, stage, stageIndex) {
  if (Array.isArray(daysByStage)) {
    return Array.isArray(daysByStage[stageIndex]) ? daysByStage[stageIndex] : [];
  }
  if (daysByStage && typeof daysByStage === 'object') {
    return Array.isArray(daysByStage[stage.id]) ? daysByStage[stage.id] : [];
  }
  return [];
}

export function assignDaysToJourney(journey, daysByStage) {
  const days = [];
  journey.stages.forEach((stage, stageIndex) => {
    const stageDays = stageDaysInput(daysByStage, stage, stageIndex);
    if (stageDays.length !== stage.allocatedDays) {
      throw new JourneyModelError('Cannot assign journey days', [
        `Stage ${stage.id} expected ${stage.allocatedDays} days; received ${stageDays.length}`,
      ]);
    }
    const incomingTransfer = journey.transfers.find((transfer) => transfer.toStageId === stage.id) || null;
    stageDays.forEach((day, localIndex) => {
      const globalIndex = stage.dayStart - 1 + localIndex;
      days.push(normalizeDay(day, {
        stage,
        globalIndex,
        stageIndex: localIndex,
        date: journey.startDate ? addDays(journey.startDate, globalIndex) : null,
        incomingTransfer,
      }));
    });
  });
  return days.sort((left, right) => left.dayNumber - right.dayNumber);
}

export function createJourneyItinerary({
  stages,
  transfers,
  daysByStage,
  startDate = null,
  endDate = null,
  totalDays = null,
  baseCurrency = null,
  itinerary = {},
} = {}) {
  const journey = buildJourneyPlan({ stages, transfers, startDate, endDate, totalDays, baseCurrency });
  const days = assignDaysToJourney(journey, daysByStage);
  const candidate = {
    ...(itinerary || {}),
    schemaVersion: JOURNEY_SCHEMA_VERSION,
    journey,
    destination: journey.stages[0].destination,
    trip: {
      ...(itinerary?.trip || {}),
      totalDays: journey.totalDays,
      startDate: journey.startDate,
      endDate: journey.endDate,
    },
    days,
  };
  return parseJourneyItinerary(candidate);
}

function legacyDestination(itinerary) {
  const destination = itinerary?.destination;
  if (typeof destination === 'string') {
    const [city = '', ...countryParts] = destination.split(',').map((part) => part.trim());
    return normalizeDestination({
      canonicalName: city || destination,
      displayName: destination,
      city: city || null,
      country: countryParts.join(', ') || null,
      coordinates: itinerary?.coordinates || itinerary?.trip?.coordinates || null,
      currency: itinerary?.currency || itinerary?.trip?.currency || null,
      legacy: true,
      resolutionStatus: 'legacy',
    });
  }
  return normalizeDestination({ ...(destination || {}), legacy: true, resolutionStatus: 'legacy' });
}

export function upgradeLegacyItineraryToJourneyV2(itinerary) {
  if (isJourneyV2(itinerary)) return clone(itinerary);
  if (!itinerary || typeof itinerary !== 'object' || Array.isArray(itinerary)) {
    throw new JourneyModelError('Cannot upgrade legacy itinerary', ['Itinerary must be an object']);
  }
  const legacyDays = Array.isArray(itinerary.days)
    ? itinerary.days
    : Array.isArray(itinerary.dailyPlan) ? itinerary.dailyPlan : [];
  if (legacyDays.length === 0) {
    throw new JourneyModelError('Cannot upgrade legacy itinerary', ['Legacy itinerary has no days']);
  }
  const destination = legacyDestination(itinerary);
  if (!destination.canonicalName || !destination.coordinates) {
    throw new JourneyModelError('Cannot upgrade legacy itinerary', [
      'Legacy destination requires coordinates before migration',
    ]);
  }
  const legacyKey = text(itinerary.id) || createStableJourneyId(
    'legacy-trip',
    destinationIdentity(destination),
    itinerary.createdAt || itinerary.metadata?.createdAt || '',
  );
  const totalDays = legacyDays.length;
  let startDate = nullableText(itinerary.trip?.startDate || itinerary.startDate);
  let endDate = nullableText(itinerary.trip?.endDate || itinerary.endDate);
  if (startDate && !endDate && parseIsoDate(startDate)) endDate = addDays(startDate, totalDays - 1);
  if (endDate && !startDate && parseIsoDate(endDate)) startDate = addDays(endDate, -(totalDays - 1));
  if (startDate && endDate && inclusiveDayCount(startDate, endDate) !== totalDays) {
    throw new JourneyModelError('Cannot upgrade legacy itinerary', [
      `Legacy dates do not contain exactly ${totalDays} days`,
    ]);
  }
  const stageId = createStableJourneyId('legacy-stage', legacyKey, destinationIdentity(destination));
  const journey = buildJourneyPlan({
    stages: [{
      id: stageId,
      destination,
      nights: totalDays - 1,
      status: 'planned',
      accommodation: itinerary.accommodation || null,
    }],
    startDate,
    endDate,
    totalDays,
    baseCurrency: destination.currencyCodes[0] || null,
  });
  const days = assignDaysToJourney(journey, [legacyDays]);
  const upgraded = {
    ...clone(itinerary),
    schemaVersion: JOURNEY_SCHEMA_VERSION,
    journey,
    destination,
    trip: {
      ...(clone(itinerary.trip) || {}),
      totalDays,
      startDate,
      endDate,
    },
    days,
    metadata: {
      ...(clone(itinerary.metadata) || {}),
      migratedFromSchemaVersion: Number(itinerary.schemaVersion) || 1,
    },
  };
  return parseJourneyItinerary(upgraded);
}

export function isJourneyV2(value) {
  return Boolean(
    value
    && typeof value === 'object'
    && value.schemaVersion === JOURNEY_SCHEMA_VERSION
    && value.journey
    && Array.isArray(value.journey.stages),
  );
}

function semanticError(errors, message) {
  errors.push(message);
}

function destinationRadiusKm(destination) {
  const type = text(destination?.entityType).toLowerCase();
  if (/country|nation/.test(type)) return 2500;
  if (/region|state|province|territory|archipelago/.test(type)) return 1000;
  if (/island/.test(type)) return 500;
  if (/city|town|village|municipality|locality|neighbou?rhood/.test(type)) return 250;
  return 500;
}

function coordinateWithinDestination(coordinate, destination) {
  const box = destination.boundingBox;
  if (box) {
    return coordinate.lat >= box.minLat
      && coordinate.lat <= box.maxLat
      && coordinate.lng >= box.minLng
      && coordinate.lng <= box.maxLng;
  }
  const distance = calculateStraightLineDistanceKm(destination.coordinates, coordinate);
  return distance != null && distance <= destinationRadiusKm(destination);
}

function validateJourneySemantics(itinerary) {
  const errors = [];
  const warnings = [];
  const { journey, days } = itinerary;
  const stages = journey.stages;
  const transfers = journey.transfers;
  const expectedKind = stages.length === 1 ? 'single_destination' : 'multi_destination';
  if (journey.kind !== expectedKind) semanticError(errors, `journey.kind must be ${expectedKind}`);
  if (journey.totalNights !== journey.totalDays - 1) {
    semanticError(errors, 'journey.totalNights must equal journey.totalDays - 1');
  }
  const stageIds = new Set();
  let expectedDayStart = 1;
  let nightsTotal = 0;
  stages.forEach((stage, index) => {
    if (stageIds.has(stage.id)) semanticError(errors, `Duplicate stage id: ${stage.id}`);
    stageIds.add(stage.id);
    if (stage.sequence !== index) semanticError(errors, `Stage ${stage.id} has a non-contiguous sequence`);
    const expectedAllocatedDays = stage.nights + (index === stages.length - 1 ? 1 : 0);
    if (stage.allocatedDays !== expectedAllocatedDays) {
      semanticError(errors, `Stage ${stage.id} allocatedDays must be ${expectedAllocatedDays}`);
    }
    if (stage.dayStart !== expectedDayStart) semanticError(errors, `Stage ${stage.id} has an invalid dayStart`);
    if (stage.dayEnd !== stage.dayStart + stage.allocatedDays - 1) {
      semanticError(errors, `Stage ${stage.id} has an invalid dayEnd`);
    }
    if (stage.allocatedDays < 1) semanticError(errors, `Stage ${stage.id} has no allocated days`);
    expectedDayStart = stage.dayEnd + 1;
    nightsTotal += stage.nights;
  });
  if (nightsTotal !== journey.totalNights) semanticError(errors, 'Stage nights do not match journey.totalNights');
  if (expectedDayStart - 1 !== journey.totalDays) semanticError(errors, 'Stages do not cover every journey day');

  const dateCount = journey.startDate && journey.endDate
    ? inclusiveDayCount(journey.startDate, journey.endDate)
    : null;
  if (Boolean(journey.startDate) !== Boolean(journey.endDate)) {
    semanticError(errors, 'journey.startDate and journey.endDate must both be set or both be null');
  } else if (journey.startDate && dateCount === null) {
    semanticError(errors, 'Journey date range is invalid');
  } else if (dateCount != null && dateCount !== journey.totalDays) {
    semanticError(errors, `Journey dates contain ${dateCount} days; expected ${journey.totalDays}`);
  }
  if (journey.startDate) {
    stages.forEach((stage) => {
      const expectedArrival = addDays(journey.startDate, stage.dayStart - 1);
      const expectedDeparture = addDays(expectedArrival, stage.nights);
      if (stage.arrivalDate !== expectedArrival) semanticError(errors, `Stage ${stage.id} has an invalid arrivalDate`);
      if (stage.departureDate !== expectedDeparture) semanticError(errors, `Stage ${stage.id} has an invalid departureDate`);
    });
  }

  const transferIds = new Set();
  if (transfers.length !== Math.max(0, stages.length - 1)) {
    semanticError(errors, `Expected ${Math.max(0, stages.length - 1)} transfers; received ${transfers.length}`);
  }
  transfers.forEach((transfer, index) => {
    if (transferIds.has(transfer.id)) semanticError(errors, `Duplicate transfer id: ${transfer.id}`);
    transferIds.add(transfer.id);
    const fromStage = stages[index];
    const toStage = stages[index + 1];
    if (transfer.sequence !== index) semanticError(errors, `Transfer ${transfer.id} has a non-contiguous sequence`);
    if (!fromStage || transfer.fromStageId !== fromStage.id) {
      semanticError(errors, `Transfer ${transfer.id} has an invalid fromStageId`);
    }
    if (!toStage || transfer.toStageId !== toStage.id) {
      semanticError(errors, `Transfer ${transfer.id} has an invalid toStageId`);
    }
    if (toStage && transfer.travelDayNumber !== toStage.dayStart) {
      semanticError(errors, `Transfer ${transfer.id} must occur on the first day of its destination stage`);
    }
    if (toStage && transfer.travelDate !== toStage.arrivalDate) {
      semanticError(errors, `Transfer ${transfer.id} has an invalid travelDate`);
    }
  });

  stages.forEach((stage, index) => {
    const incoming = index === 0 ? null : transfers[index - 1];
    const outgoing = index === stages.length - 1 ? null : transfers[index];
    const expectedArrivalKind = incoming ? 'transfer' : 'trip_start';
    const expectedDepartureKind = outgoing ? 'transfer' : 'trip_end';
    if (stage.arrival.kind !== expectedArrivalKind
      || stage.arrival.transferId !== (incoming?.id || null)
      || stage.arrival.date !== stage.arrivalDate) {
      semanticError(errors, `Stage ${stage.id} has an invalid arrival boundary`);
    }
    if (stage.departure.kind !== expectedDepartureKind
      || stage.departure.transferId !== (outgoing?.id || null)
      || stage.departure.date !== stage.departureDate) {
      semanticError(errors, `Stage ${stage.id} has an invalid departure boundary`);
    }
  });

  if (days.length !== journey.totalDays) {
    semanticError(errors, `Expected exactly ${journey.totalDays} days; received ${days.length}`);
  }
  const dayIds = new Set();
  const activityIds = new Set();
  days.forEach((day, index) => {
    if (dayIds.has(day.id)) semanticError(errors, `Duplicate day id: ${day.id}`);
    dayIds.add(day.id);
    if (day.dayNumber !== index + 1) semanticError(errors, `Day ${day.id} has a non-contiguous dayNumber`);
    const stage = stages.find((candidate) => candidate.id === day.stageId);
    if (!stage) {
      semanticError(errors, `Day ${day.id} references an unknown stage: ${day.stageId}`);
      return;
    }
    if (day.dayNumber < stage.dayStart || day.dayNumber > stage.dayEnd) {
      semanticError(errors, `Day ${day.id} falls outside stage ${stage.id}`);
    }
    const expectedStageDay = day.dayNumber - stage.dayStart + 1;
    if (day.stageDayNumber !== expectedStageDay) {
      semanticError(errors, `Day ${day.id} has an invalid stageDayNumber`);
    }
    if (journey.startDate && day.date !== addDays(journey.startDate, index)) {
      semanticError(errors, `Day ${day.id} has an invalid date`);
    }
    if (new Set(day.transferIds).size !== day.transferIds.length) {
      semanticError(errors, `Day ${day.id} contains duplicate transfer references`);
    }
    day.transferIds.forEach((transferId) => {
      const transfer = transfers.find((candidate) => candidate.id === transferId);
      if (!transfer) semanticError(errors, `Day ${day.id} references an unknown transfer: ${transferId}`);
      else if (transfer.travelDayNumber !== day.dayNumber || transfer.toStageId !== day.stageId) {
        semanticError(errors, `Day ${day.id} references transfer ${transferId} on the wrong stage or day`);
      }
    });
    const expectedIncoming = transfers.find((transfer) => transfer.toStageId === stage.id);
    if (expectedIncoming && day.dayNumber === stage.dayStart && !day.transferIds.includes(expectedIncoming.id)) {
      semanticError(errors, `Day ${day.id} is missing incoming transfer ${expectedIncoming.id}`);
    }
    if (day.activities.length === 0 && day.transferIds.length === 0) {
      semanticError(errors, `Day ${day.dayNumber} has no activities or transfer`);
    }
    day.activities.forEach((activity) => {
      if (activityIds.has(activity.id)) semanticError(errors, `Duplicate activity id: ${activity.id}`);
      activityIds.add(activity.id);
      if (activity.stageId !== stage.id) {
        semanticError(errors, `Activity ${activity.id} references the wrong stage`);
      }
      if (activity.dayId !== day.id) semanticError(errors, `Activity ${activity.id} references the wrong day`);
      if (activity.coordinates && !coordinateWithinDestination(activity.coordinates, stage.destination)) {
        semanticError(errors, `Activity ${activity.id} coordinates are outside stage ${stage.id}`);
      }
    });
  });

  stages.forEach((stage) => {
    const assigned = days.filter((day) => day.stageId === stage.id);
    if (assigned.length !== stage.allocatedDays) {
      semanticError(errors, `Stage ${stage.id} expected ${stage.allocatedDays} assigned days; received ${assigned.length}`);
    }
  });

  if (itinerary.destination.entityId !== stages[0].destination.entityId
    || itinerary.destination.canonicalName !== stages[0].destination.canonicalName) {
    semanticError(errors, 'Top-level destination must be the first-stage compatibility projection');
  }
  if (Number(itinerary.trip.totalDays) !== journey.totalDays) {
    semanticError(errors, 'trip.totalDays must match journey.totalDays');
  }
  if (!journey.baseCurrency) warnings.push('Journey base currency is unknown; totals across currencies must not be combined');
  stages.forEach((stage) => {
    if (!stage.destination.timezone) warnings.push(`Stage ${stage.id} timezone is unknown`);
  });
  return { errors, warnings };
}

function zodIssueMessage(issue) {
  const path = issue.path.length > 0 ? issue.path.join('.') : 'itinerary';
  return `${path}: ${issue.message}`;
}

export function validateJourneyItinerary(value) {
  const parsed = JourneyItinerarySchema.safeParse(value);
  if (!parsed.success) {
    return {
      valid: false,
      fatal: true,
      errors: parsed.error.issues.map(zodIssueMessage),
      warnings: [],
      normalized: null,
    };
  }
  const semantic = validateJourneySemantics(parsed.data);
  return {
    valid: semantic.errors.length === 0,
    fatal: semantic.errors.length > 0,
    errors: semantic.errors,
    warnings: semantic.warnings,
    normalized: parsed.data,
  };
}

export function parseJourneyItinerary(value) {
  const result = validateJourneyItinerary(value);
  if (!result.valid) {
    throw new JourneyModelError('Journey itinerary validation failed', result.errors);
  }
  return result.normalized;
}
