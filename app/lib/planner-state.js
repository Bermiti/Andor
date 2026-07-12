export const PLANNER_DRAFT_VERSION = 1;
export const PLANNER_DRAFT_KEY = 'andor_wizard_state';

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

export function getPlannerStepError(step, state) {
  if (step === 1 && !state.isSurprise && !String(state.destination || '').trim()) {
    return 'Indica o destino da viagem.';
  }
  if (step === 2 && !state.datesUnknown && (!state.dates?.start || !state.dates?.end)) {
    return 'Seleciona as datas ou indica que ainda não as sabes.';
  }
  if (step === 2 && state.companyMode && !String(state.clientName || '').trim()) {
    return 'Indica o nome do cliente ou viajante para usar o modo de agência.';
  }
  if (step === 3 && (!Array.isArray(state.stylesList) || state.stylesList.length === 0)) {
    return 'Escolhe pelo menos um estilo de viagem.';
  }
  return '';
}

export function normalizePlannerDraft(value) {
  if (!value || typeof value !== 'object' || value.version !== PLANNER_DRAFT_VERSION) return null;
  return {
    ...value,
    step: Math.min(7, Math.max(1, Number.parseInt(value.step, 10) || 1)),
    destination: String(value.destination || ''),
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
    flexibleDays: normalizeFlexibleDays(value.flexibleDays),
  };
}
