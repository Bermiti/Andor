/**
 * Travel Persona Preference Engine
 *
 * Transparent preference profile that learns from user interactions
 * (wizard choices, activity additions, rejections, saved items)
 * without inferring sensitive attributes or making invasive assumptions.
 */

const STORAGE_KEY = 'andor_travel_persona_v1';

export const DEFAULT_PERSONA = {
  version: 1,
  updatedAt: null,
  pace: 'balanced', // 'relaxed' | 'balanced' | 'fast'
  budgetTier: 'moderate', // 'economic' | 'moderate' | 'luxury'
  interests: [], // ['gastronomy', 'culture', 'nature', 'beach', 'nightlife', 'relaxation']
  preferredTransport: 'train', // 'walk' | 'public' | 'train' | 'car'
  dietaryRestrictions: [], // ['vegetarian', 'vegan', 'halal', 'gluten_free']
  accessibilityNeeded: false,
  travelStyle: 'local_authentic', // 'popular_highlights' | 'local_authentic' | 'hidden_gems'
  learnedTraits: {
    rejectedCategories: [],
    preferredTimeWindows: ['morning', 'afternoon'],
    averageTripDuration: 5,
    interactionCount: 0,
  },
};

/**
 * Reads the travel persona profile from localStorage.
 */
export function getTravelPersona() {
  if (typeof window === 'undefined') return { ...DEFAULT_PERSONA };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PERSONA };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PERSONA, ...parsed, learnedTraits: { ...DEFAULT_PERSONA.learnedTraits, ...(parsed.learnedTraits || {}) } };
  } catch {
    return { ...DEFAULT_PERSONA };
  }
}

/**
 * Updates explicit preferences in the persona profile.
 */
export function updateTravelPersona(updates = {}) {
  if (typeof window === 'undefined') return { ...DEFAULT_PERSONA };
  const current = getTravelPersona();
  const next = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

/**
 * Records an implicit signal from user interactions (e.g. rejecting an activity, picking a budget tier).
 */
export function recordPersonaSignal(signalType, payload = {}) {
  const current = getTravelPersona();
  const learned = { ...current.learnedTraits };
  learned.interactionCount = (learned.interactionCount || 0) + 1;

  if (signalType === 'activity_rejected' && payload.category) {
    if (!learned.rejectedCategories.includes(payload.category)) {
      learned.rejectedCategories = [...learned.rejectedCategories, payload.category].slice(-10);
    }
  }

  if (signalType === 'trip_generated' && payload.durationDays) {
    const prevAvg = learned.averageTripDuration || 5;
    learned.averageTripDuration = Math.round((prevAvg * 3 + payload.durationDays) / 4);
  }

  return updateTravelPersona({ learnedTraits: learned });
}

/**
 * Resets the travel persona profile to initial default state.
 */
export function resetTravelPersona() {
  if (typeof window === 'undefined') return { ...DEFAULT_PERSONA };
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  return { ...DEFAULT_PERSONA };
}

/**
 * Summarizes the persona into human-readable portuguese bullets for UI presentation.
 */
export function summarizePersonaForUser(persona) {
  const p = persona || getTravelPersona();
  const summary = [];

  const paceLabels = { relaxed: 'Ritmo descontraído e calmo', balanced: 'Ritmo equilibrado', fast: 'Ritmo dinâmico com muitas visitas' };
  const budgetLabels = { economic: 'Foco em poupança e boas oportunidades', moderate: 'Orçamento médio equilibrado', luxury: 'Experiências de elevado conforto e luxo' };
  const styleLabels = { popular_highlights: 'Preferência por atracões emblemáticas', local_authentic: 'Preferência por experiências locais e autênticas', hidden_gems: 'Foco em segredos escondidos e locais tranquilos' };

  if (p.pace && paceLabels[p.pace]) summary.push({ key: 'pace', text: paceLabels[p.pace], isLearned: false });
  if (p.budgetTier && budgetLabels[p.budgetTier]) summary.push({ key: 'budget', text: budgetLabels[p.budgetTier], isLearned: false });
  if (p.travelStyle && styleLabels[p.travelStyle]) summary.push({ key: 'style', text: styleLabels[p.travelStyle], isLearned: false });

  if (Array.isArray(p.interests) && p.interests.length > 0) {
    summary.push({ key: 'interests', text: `Interesses: ${p.interests.join(', ')}`, isLearned: false });
  }

  if (p.learnedTraits?.rejectedCategories?.length > 0) {
    summary.push({ key: 'learned_rejections', text: `Evita atividades da categoria: ${p.learnedTraits.rejectedCategories.join(', ')}`, isLearned: true });
  }

  return summary;
}
