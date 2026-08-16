import {
  isJourneyV2,
  upgradeLegacyItineraryToJourneyV2,
} from './journey-model';

function viewModel(itinerary) {
  if (!itinerary || typeof itinerary !== 'object') return null;
  try {
    return isJourneyV2(itinerary)
      ? itinerary
      : upgradeLegacyItineraryToJourneyV2(itinerary);
  } catch {
    return null;
  }
}

export function getJourneyStages(itinerary) {
  return viewModel(itinerary)?.journey?.stages || [];
}

export function getJourneyTransfers(itinerary) {
  return viewModel(itinerary)?.journey?.transfers || [];
}

export function getJourneyRouteLabel(itinerary) {
  const model = viewModel(itinerary);
  if (model?.journey?.routeLabel) return model.journey.routeLabel;
  const destination = itinerary?.destination;
  return typeof destination === 'string'
    ? destination
    : destination?.displayName || destination?.canonicalName || destination?.city || destination?.name || 'Destino';
}

export function getStageById(itinerary, stageId) {
  if (!stageId) return null;
  return getJourneyStages(itinerary).find((stage) => stage.id === stageId) || null;
}

export function getDaysForStage(itinerary, stageOrId) {
  const model = viewModel(itinerary);
  if (!model) return [];
  const stageId = typeof stageOrId === 'string' ? stageOrId : stageOrId?.id;
  if (!stageId) return [];
  return model.days.filter((day) => day.stageId === stageId);
}

export function getStageForDay(itinerary, day) {
  if (!day) return null;
  return getStageById(itinerary, day.stageId);
}

export function getStageForDayIndex(itinerary, dayIndex) {
  const model = viewModel(itinerary);
  if (!model || !Number.isInteger(dayIndex) || dayIndex < 0) return null;
  return getStageForDay(model, model.days[dayIndex]);
}

export function getDestinationForDayIndex(itinerary, dayIndex) {
  return getStageForDayIndex(itinerary, dayIndex)?.destination || null;
}

export function getIncomingTransferForStage(itinerary, stageOrId) {
  const stageId = typeof stageOrId === 'string' ? stageOrId : stageOrId?.id;
  if (!stageId) return null;
  return getJourneyTransfers(itinerary).find((transfer) => transfer.toStageId === stageId) || null;
}

export function getTransfersForDayIndex(itinerary, dayIndex) {
  const model = viewModel(itinerary);
  if (!model || !Number.isInteger(dayIndex) || dayIndex < 0) return [];
  const day = model.days[dayIndex];
  if (!day) return [];
  const ids = new Set(day.transferIds || []);
  return model.journey.transfers.filter((transfer) => ids.has(transfer.id));
}

export function getMapContextForDayIndex(itinerary, dayIndex) {
  const model = viewModel(itinerary);
  if (!model || !Number.isInteger(dayIndex) || dayIndex < 0) return null;
  const day = model.days[dayIndex];
  const stage = day ? getStageForDay(model, day) : null;
  if (!day || !stage) return null;
  return {
    day,
    stage,
    stageId: stage.id,
    destination: stage.destination,
    center: stage.destination.coordinates || null,
    boundingBox: stage.destination.boundingBox || null,
    timezone: stage.destination.timezone || null,
    currencyCodes: stage.destination.currencyCodes || [],
    transfers: getTransfersForDayIndex(model, dayIndex),
  };
}

export function getActiveStageContext(itinerary, dayIndex) {
  const map = getMapContextForDayIndex(itinerary, dayIndex);
  if (!map) return null;
  return {
    ...map,
    stageDays: getDaysForStage(itinerary, map.stageId),
    incomingTransfer: getIncomingTransferForStage(itinerary, map.stageId),
  };
}

