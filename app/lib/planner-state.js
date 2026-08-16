export const PLANNER_DRAFT_VERSION = 2;
export const PLANNER_DRAFT_KEY = 'andor_wizard_state';
export const MAX_PLANNER_STAGES = 8;

export function normalizeFlexibleDays(value, fallback = 5) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(14, Math.max(1, parsed));
}

export function getPlannerDayCount({ datesUnknown, flexibleDays, dates }) {
  if (datesUnknown || !dates?.start || !dates?.end) {
    return normalizeFlexibleDays(flexibleDays);
  }

  const start = new Date(`${dates.start}T12:00:00`);
  const end = new Date(`${dates.end}T12:00:00`);
  const diff = end.getTime() - start.getTime();
  if (!Number.isFinite(diff) || diff < 0) return 1;
  return Math.min(14, Math.max(1, Math.round(diff / 86_400_000) + 1));
}

export function getPlannerNightCount(state) {
  return Math.max(0, getPlannerDayCount(state) - 1);
}

export function normalizePlannerStages(value, fallback = {}) {
  const source = Array.isArray(value) && value.length > 0
    ? value
    : [{
      id: 'stage-1',
      destination: fallback.destination || '',
      destinationEntity: fallback.destinationEntity || null,
      nights: fallback.nights ?? Math.max(0, normalizeFlexibleDays(fallback.flexibleDays) - 1),
      arrivalWindow: fallback.arrivalWindow || 'afternoon',
      departureWindow: fallback.departureWindow || 'afternoon',
      transportMode: 'train',
    }];

  return source.slice(0, MAX_PLANNER_STAGES).map((stage, index) => ({
    id: String(stage?.id || `stage-${index + 1}`).slice(0, 80),
    destination: String(stage?.destination || stage?.destinationEntity?.displayName || '').slice(0, 160),
    destinationEntity: stage?.destinationEntity && typeof stage.destinationEntity === 'object'
      ? stage.destinationEntity
      : null,
    nights: Math.min(30, Math.max(0, Number.parseInt(stage?.nights, 10) || 0)),
    arrivalWindow: String(stage?.arrivalWindow || (index === 0 ? fallback.arrivalWindow : 'afternoon')).slice(0, 40),
    departureWindow: String(stage?.departureWindow || 'afternoon').slice(0, 40),
    transportMode: String(stage?.transportMode || 'train').slice(0, 40),
  }));
}

export function getPlannerStageNightTotal(stages) {
  return normalizePlannerStages(stages).reduce((total, stage) => total + stage.nights, 0);
}

export function getPlannerStepError(step, state) {
  const stages = normalizePlannerStages(state.journeyStages, {
    destination: state.destination,
    destinationEntity: state.destinationEntity,
    flexibleDays: state.flexibleDays,
  });
  if (step === 1 && !state.isSurprise && stages.some((stage) => !stage.destination.trim())) {
    return 'Indica o destino da viagem.';
  }
  if (step === 1 && !state.isSurprise && stages.length > 1 && stages.some((stage) => stage.nights < 1)) {
    return 'Cada etapa de uma viagem multi-destino precisa de pelo menos uma noite.';
  }
  if (step === 2 && !state.datesUnknown && (!state.dates?.start || !state.dates?.end)) {
    return 'Seleciona as datas ou indica que ainda não as sabes.';
  }
  if (step === 2 && state.companyMode && !String(state.clientName || '').trim()) {
    return 'Indica o nome do cliente ou viajante para usar o modo de agência.';
  }
  if (step === 2 && stages.length > 1) {
    const expectedNights = getPlannerNightCount(state);
    if (getPlannerStageNightTotal(stages) !== expectedNights) {
      return `Distribui exatamente ${expectedNights} noites pelas etapas.`;
    }
  }
  if (step === 3 && (!Array.isArray(state.stylesList) || state.stylesList.length === 0)) {
    return 'Escolhe pelo menos um estilo de viagem.';
  }
  return '';
}

export function normalizePlannerDraft(value) {
  if (!value || typeof value !== 'object' || ![1, PLANNER_DRAFT_VERSION].includes(value.version)) return null;
  const flexibleDays = normalizeFlexibleDays(value.flexibleDays);
  const journeyStages = normalizePlannerStages(value.journeyStages, {
    destination: value.destination,
    destinationEntity: value.destinationEntity,
    flexibleDays,
    arrivalWindow: value.arrivalTime,
    departureWindow: value.departureTime,
  });
  return {
    ...value,
    version: PLANNER_DRAFT_VERSION,
    step: Math.min(7, Math.max(1, Number.parseInt(value.step, 10) || 1)),
    destination: String(value.destination || journeyStages[0]?.destination || ''),
    dates: {
      start: String(value.dates?.start || ''),
      end: String(value.dates?.end || ''),
      flexible: Boolean(value.dates?.flexible),
    },
    travelers: {
      adults: Math.max(1, Number.parseInt(value.travelers?.adults, 10) || 2),
      children: Math.max(0, Number.parseInt(value.travelers?.children, 10) || 0),
    },
    stylesList: Array.isArray(value.stylesList) ? value.stylesList.slice(0, 3) : [],
    dietary: Array.isArray(value.dietary) ? value.dietary : [],
    flexibleDays,
    journeyStages,
    generationIntent: value.generationIntent
      && typeof value.generationIntent.key === 'string'
      && typeof value.generationIntent.fingerprint === 'string'
      ? {
        key: value.generationIntent.key.slice(0, 128),
        fingerprint: value.generationIntent.fingerprint.slice(0, 128),
      }
      : null,
  };
}
