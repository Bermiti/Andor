import 'server-only';

import { geocodeServerSide } from '../geocoding';
import {
  createJourneyItinerary,
  createStableJourneyId,
  JourneyModelError,
} from '../journey-model';
import { resolveGlobalGeographicEntity } from './global-geography';

const MAX_STAGES = 8;
const TRANSPORT_MODES = new Set(['unspecified', 'walk', 'bike', 'train', 'bus', 'car', 'flight', 'ferry', 'other']);

function text(value, maximum = 200) {
  return value == null ? '' : String(value).trim().slice(0, maximum);
}

function coordinateObject(value) {
  const lat = Array.isArray(value) ? Number(value[0]) : Number(value?.lat ?? value?.latitude);
  const lng = Array.isArray(value) ? Number(value[1]) : Number(value?.lng ?? value?.lon ?? value?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180 || (lat === 0 && lng === 0)) return null;
  return { lat, lng };
}

function safeProvenance(value) {
  if (!value || typeof value !== 'object') return null;
  const sourceType = text(value.sourceType, 60);
  const provider = text(value.provider, 100);
  if (!sourceType || !provider) return null;
  return { ...value, sourceType, provider };
}

function destinationFromEntity(entity, requestedName) {
  if (!entity || typeof entity !== 'object') return null;
  const coordinates = coordinateObject(entity.coordinates);
  const canonicalName = text(entity.canonicalName || entity.name || requestedName, 120);
  const displayName = text(entity.displayName || entity.localizedNames?.pt || canonicalName, 200);
  if (!canonicalName || !displayName || !coordinates) return null;
  const countryCode = text(entity.countryCode, 2).toUpperCase();
  const currencyCodes = Array.isArray(entity.currencyCodes)
    ? entity.currencyCodes.map((code) => text(code, 3).toUpperCase()).filter((code) => /^[A-Z]{3}$/.test(code))
    : [];
  return {
    ...entity,
    entityId: text(entity.entityId || entity.id, 160) || null,
    canonicalName,
    displayName,
    entityType: text(entity.entityType || entity.type, 60) || null,
    city: text(entity.city, 120) || (/city|town|municipality/i.test(entity.entityType || entity.type || '') ? canonicalName : null),
    region: text(entity.region, 120) || null,
    country: text(entity.country, 120) || null,
    countryCode: /^[A-Z]{2}$/.test(countryCode) ? countryCode : null,
    regionCode: text(entity.regionCode, 80) || null,
    parentPath: Array.isArray(entity.parentPath) ? entity.parentPath.map(String).slice(0, 12) : [],
    coordinates,
    boundingBox: entity.boundingBox || null,
    timezone: text(entity.timezone, 100) || null,
    currencyCodes,
    resolutionStatus: text(entity.resolutionStatus, 40) || 'partially_resolved',
    provenance: safeProvenance(entity.provenance),
  };
}

export function normalizeJourneyGenerationRequest(value, totalDays) {
  const stages = value?.stages;
  if (!Array.isArray(stages) || stages.length < 2 || stages.length > MAX_STAGES) {
    throw new JourneyModelError('Invalid multi-destination request', [
      `A multi-destination journey requires between 2 and ${MAX_STAGES} stages`,
    ]);
  }

  const normalized = stages.map((stage, index) => {
    const destinationName = text(
      stage?.destination || stage?.destinationEntity?.displayName || stage?.destinationEntity?.canonicalName,
      160,
    );
    const nights = Number(stage?.nights);
    if (!destinationName) {
      throw new JourneyModelError('Invalid multi-destination request', [`Stage ${index + 1} requires a destination`]);
    }
    if (!Number.isInteger(nights) || nights < 1 || nights > 30) {
      throw new JourneyModelError('Invalid multi-destination request', [
        `Stage ${index + 1} nights must be an integer between 1 and 30`,
      ]);
    }
    if (stage?.destinationEntity?.resolutionStatus === 'ambiguous') {
      throw new JourneyModelError('Invalid multi-destination request', [
        `Stage ${index + 1} destination is ambiguous and must be selected explicitly`,
      ]);
    }
    const mode = text(stage?.transportMode, 40).toLowerCase();
    return {
      ...stage,
      id: text(stage?.id, 160) || createStableJourneyId('stage-request', destinationName, index),
      destinationName,
      destinationEntity: stage?.destinationEntity && typeof stage.destinationEntity === 'object'
        ? stage.destinationEntity
        : null,
      nights,
      order: index + 1,
      arrivalWindow: text(stage?.arrivalWindow, 80) || 'afternoon',
      departureWindow: text(stage?.departureWindow, 80) || 'afternoon',
      transportMode: TRANSPORT_MODES.has(mode) ? mode : 'unspecified',
      notes: text(stage?.notes, 4_000),
      status: text(stage?.status, 40) || 'planned',
      accommodation: stage?.accommodation && typeof stage.accommodation === 'object' ? stage.accommodation : null,
      budgetAllocation: stage?.budgetAllocation && typeof stage.budgetAllocation === 'object'
        ? stage.budgetAllocation
        : null,
    };
  });

  const requestedDays = Number(totalDays);
  const totalNights = normalized.reduce((sum, stage) => sum + stage.nights, 0);
  if (!Number.isInteger(requestedDays) || requestedDays < 1 || totalNights !== requestedDays - 1) {
    throw new JourneyModelError('Invalid multi-destination request', [
      `Stage nights total ${totalNights}; expected ${Math.max(0, requestedDays - 1)}`,
    ]);
  }
  return normalized;
}

export async function resolveJourneyStageDestination(stage, dependencies = {}) {
  const resolveRegistry = dependencies.resolveRegistry || resolveGlobalGeographicEntity;
  const geocode = dependencies.geocode || geocodeServerSide;
  const selected = destinationFromEntity(stage.destinationEntity, stage.destinationName);
  if (selected) return selected;

  const registry = resolveRegistry(stage.destinationName)
    || resolveRegistry(stage.destinationName.split(',')[0]?.trim());
  const registered = destinationFromEntity(registry, stage.destinationName);
  if (registered) return registered;

  const geocoded = await geocode(stage.destinationName);
  const coordinates = coordinateObject(geocoded);
  if (!coordinates) {
    throw new JourneyModelError('Cannot resolve journey destination', [
      `Stage ${stage.order} destination could not be resolved: ${stage.destinationName}`,
    ]);
  }
  const canonicalName = text(stage.destinationName.split(',')[0], 120);
  return {
    entityId: null,
    canonicalName,
    displayName: text(geocoded.displayName || stage.destinationName, 200),
    entityType: text(geocoded.type, 60) || null,
    city: /city|town|municipality/i.test(geocoded.type || '') ? canonicalName : null,
    region: null,
    country: null,
    countryCode: null,
    regionCode: null,
    parentPath: [],
    coordinates,
    boundingBox: null,
    timezone: null,
    currencyCodes: [],
    resolutionStatus: 'partially_resolved',
    provenance: {
      sourceType: 'verified_provider',
      provider: 'nominatim',
      confidence: null,
      isEstimated: false,
    },
  };
}

function stageCheckpointKey(stage, destination) {
  return createStableJourneyId('stage-result', stage.id, destination.entityId, destination.coordinates, stage.nights);
}

function transferConsumesWholeDay(transfer) {
  return transfer?.allDay === true
    || transfer?.mode === 'flight'
    || (transfer?.mode === 'ferry' && transfer?.arrivalWindow === 'night')
    || transfer?.arrivalWindow === 'night';
}

function asTransferOnlyDay(day, transfer, destinationName) {
  const periods = day?.periods && typeof day.periods === 'object'
    ? Object.fromEntries(Object.entries(day.periods).map(([key, value]) => [
      key,
      value && typeof value === 'object' ? { ...value, activities: [] } : value,
    ]))
    : undefined;
  return {
    ...(day || {}),
    title: `Deslocação e chegada a ${destinationName}`,
    activities: [],
    stops: [],
    ...(periods ? { periods } : {}),
    transferDay: true,
    transferNote: `Dia reservado à deslocação em modo ${transfer.mode}; adiciona atividades apenas se o horário real o permitir.`,
  };
}

function namespaceStageDayEntities(day, stage, dayIndex) {
  const source = day && typeof day === 'object' ? day : {};
  const dayId = createStableJourneyId('day', stage.id, source.id || source.title || dayIndex, dayIndex);
  const activityId = (activity, activityIndex) => {
    if (!activity || typeof activity !== 'object') return activity;
    return {
      ...activity,
      id: createStableJourneyId(
        'activity',
        stage.id,
        dayId,
        activity.id || activity.name || activity.title || activityIndex,
      ),
    };
  };
  const periods = source.periods && typeof source.periods === 'object'
    ? Object.fromEntries(Object.entries(source.periods).map(([key, value]) => [
      key,
      value && typeof value === 'object'
        ? {
          ...value,
          activities: Array.isArray(value.activities)
            ? value.activities.map(activityId)
            : value.activities,
        }
        : value,
    ]))
    : source.periods;
  return {
    ...source,
    id: dayId,
    ...(periods ? { periods } : {}),
    ...(Array.isArray(source.stops) ? { stops: source.stops.map(activityId) } : {}),
    ...(Array.isArray(source.activities) ? { activities: source.activities.map(activityId) } : {}),
  };
}

export function createPlanningPlaceholderStageItinerary(destination, allocatedDays) {
  return {
    destination,
    trip: { totalDays: allocatedDays },
    days: Array.from({ length: allocatedDays }, (_, index) => ({
      title: `Tempo aberto em ${destination.canonicalName}: dia ${index + 1} por decidir`,
      periods: {
        morning: {
          label: 'Tempo livre',
          activities: [{
            name: `Bloco livre para planear em ${destination.canonicalName}`,
            type: 'planning_placeholder',
            category: 'planning_placeholder',
            coordinates: null,
            duration: null,
            cost: null,
            bookingRequired: null,
            description: 'Sem local atribuído. Escolhe uma opção verificada ou mantém este período livre.',
            provenance: {
              sourceType: 'planning_placeholder',
              provider: 'andor',
              confidence: null,
              isEstimated: true,
            },
          }],
        },
        afternoon: { label: 'Sem plano', activities: [] },
        evening: { label: 'Sem plano', activities: [] },
      },
      budgetEstimate: null,
      placeholder: true,
    })),
    suggestions: [`Procurar opções verificadas em ${destination.canonicalName}`],
    metadata: {
      generationSource: 'planning-placeholder',
      dataHonesty: {
        reason: 'Não existem dados locais verificados suficientes nem um fornecedor de IA disponível.',
        containsInventedPlaces: false,
      },
    },
  };
}

export async function generateMultiDestinationItinerary({
  journey,
  totalDays,
  startDate = null,
  endDate = null,
  baseItinerary = {},
  generationProfile = {},
  checkpoint = null,
  generateStage,
  onCheckpoint = async () => {},
  dependencies = {},
} = {}) {
  if (typeof generateStage !== 'function') {
    throw new TypeError('generateStage must be a function');
  }
  const requestStages = normalizeJourneyGenerationRequest(journey, totalDays);
  const resolvedStages = [];
  for (const stage of requestStages) {
    resolvedStages.push({
      ...stage,
      destination: await resolveJourneyStageDestination(stage, dependencies),
    });
  }

  const transfers = resolvedStages.slice(0, -1).map((stage, index) => ({
    mode: stage.transportMode,
    departureWindow: stage.departureWindow,
    arrivalWindow: resolvedStages[index + 1].arrivalWindow,
    status: 'planned',
    durationMinutes: null,
    cost: null,
    provenance: {
      sourceType: 'user',
      provider: 'andor_wizard',
      confidence: 1,
      isEstimated: false,
    },
  }));

  const cachedResults = new Map(
    Array.isArray(checkpoint?.stageResults)
      ? checkpoint.stageResults.map((result) => [result.checkpointKey, result])
      : [],
  );
  const stageResults = [];
  const daysByStage = [];

  for (let index = 0; index < resolvedStages.length; index += 1) {
    const stage = resolvedStages[index];
    const allocatedDays = stage.nights + (index === resolvedStages.length - 1 ? 1 : 0);
    const checkpointKey = stageCheckpointKey(stage, stage.destination);
    let result = cachedResults.get(checkpointKey) || null;
    if (!result?.itinerary || !Array.isArray(result.itinerary.days) || result.itinerary.days.length !== allocatedDays) {
      const itinerary = await generateStage({
        stage,
        stageIndex: index,
        allocatedDays,
        destination: stage.destination,
        generationProfile,
      });
      if (!itinerary || !Array.isArray(itinerary.days) || itinerary.days.length !== allocatedDays) {
        throw new JourneyModelError('Stage generation failed', [
          `Stage ${index + 1} did not produce exactly ${allocatedDays} days`,
        ]);
      }
      result = { checkpointKey, stageId: stage.id, itinerary };
    }

    const incomingTransfer = index > 0 ? transfers[index - 1] : null;
    const stageDays = result.itinerary.days.map((day, dayIndex) => (
      namespaceStageDayEntities(day, stage, dayIndex)
    ));
    if (incomingTransfer && transferConsumesWholeDay(incomingTransfer)) {
      stageDays[0] = asTransferOnlyDay(stageDays[0], incomingTransfer, stage.destination.canonicalName);
    }
    daysByStage.push(stageDays);
    stageResults.push(result);
    await onCheckpoint({
      phase: 'generating_stages',
      completedStageIds: stageResults.map((item) => item.stageId),
      stageResults,
    });
  }

  const currencies = Array.from(new Set(resolvedStages.flatMap((stage) => stage.destination.currencyCodes)));
  const firstItinerary = stageResults[0].itinerary;
  return createJourneyItinerary({
    stages: resolvedStages.map((stage) => ({
      id: stage.id,
      destination: stage.destination,
      nights: stage.nights,
      arrival: { timeWindow: stage.arrivalWindow },
      departure: { timeWindow: stage.departureWindow },
      accommodation: stage.accommodation,
      notes: stage.notes,
      status: stage.status,
      budgetAllocation: stage.budgetAllocation,
    })),
    transfers,
    daysByStage,
    startDate,
    endDate,
    totalDays,
    baseCurrency: currencies.length === 1 ? currencies[0] : null,
    itinerary: {
      ...firstItinerary,
      ...baseItinerary,
      trip: {
        ...(firstItinerary.trip || {}),
        ...(baseItinerary.trip || {}),
      },
      metadata: {
        ...(firstItinerary.metadata || {}),
        ...(baseItinerary.metadata || {}),
        generationSource: 'multi-destination',
        stageGenerationSources: stageResults.map((result, index) => ({
          stageId: resolvedStages[index].id,
          source: result.itinerary.metadata?.generationSource || result.itinerary.metadata?.source || 'unknown',
        })),
      },
      suggestions: Array.from(new Set(stageResults.flatMap((result) => result.itinerary.suggestions || []))).slice(0, 12),
    },
  });
}
