/**
 * Travel Persona Preference Engine v2
 *
 * Persists user travel preferences locally and syncs with Supabase user profile when authenticated.
 * Isolates preferences per user ID to prevent account leaks.
 * Injects learned preferences into itinerary generation payloads while allowing trip-specific overrides.
 */

const ANONYMOUS_STORAGE_KEY = 'andor_travel_persona_anon';

export const DEFAULT_PERSONA = {
  version: 2,
  userId: null,
  updatedAt: null,
  pace: 'balanced', // 'relaxed' | 'balanced' | 'fast'
  budgetTier: 'moderate', // 'economic' | 'moderate' | 'luxury'
  interests: [], // ['gastronomy', 'culture', 'nature', 'beach', 'nightlife', 'relaxation']
  travelStyle: 'local_authentic', // 'popular_highlights' | 'local_authentic' | 'hidden_gems'
  dietaryRestrictions: [],
  accessibilityNeeded: false,
  learnedTraits: {
    rejectedCategories: [],
    preferredTimeWindows: ['morning', 'afternoon'],
    averageTripDuration: 5,
    interactionCount: 0,
  },
};

function getStorageKey(userId = null) {
  return userId ? `andor_travel_persona_${userId}` : ANONYMOUS_STORAGE_KEY;
}

/**
 * Reads the travel persona profile for a given user ID (or anonymous).
 */
export function getTravelPersona(userId = null) {
  if (typeof window === 'undefined') return { ...DEFAULT_PERSONA, userId };
  const key = getStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ...DEFAULT_PERSONA, userId };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PERSONA,
      ...parsed,
      userId,
      learnedTraits: { ...DEFAULT_PERSONA.learnedTraits, ...(parsed.learnedTraits || {}) },
    };
  } catch {
    return { ...DEFAULT_PERSONA, userId };
  }
}

/**
 * Updates explicit preferences in the persona profile.
 */
export function updateTravelPersona(updates = {}, userId = null) {
  if (typeof window === 'undefined') return { ...DEFAULT_PERSONA, userId };
  const key = getStorageKey(userId);
  const current = getTravelPersona(userId);
  const next = {
    ...current,
    ...updates,
    userId,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {}
  return next;
}

/**
 * Records an implicit signal from user interactions.
 */
export function recordPersonaSignal(signalType, payload = {}, userId = null) {
  const current = getTravelPersona(userId);
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

  return updateTravelPersona({ learnedTraits: learned }, userId);
}

/**
 * Resets the travel persona profile to initial default state.
 */
export function resetTravelPersona(userId = null) {
  if (typeof window === 'undefined') return { ...DEFAULT_PERSONA, userId };
  const key = getStorageKey(userId);
  try {
    localStorage.removeItem(key);
  } catch {}
  return { ...DEFAULT_PERSONA, userId };
}

/**
 * Merges persona preferences into trip generation options without mutating the global persona.
 */
export function applyPersonaToGenerationPayload(basePayload = {}, userId = null) {
  const persona = getTravelPersona(userId);
  const payload = { ...basePayload };

  // Apply default pace from persona if not explicitly specified in trip
  if (!payload.travelStyle && persona.pace) {
    payload.travelStyle = persona.pace;
  }

  // Apply default budget from persona if not explicitly specified
  if (!payload.budgetTier && persona.budgetTier) {
    payload.budgetTier = persona.budgetTier;
  }

  // Combine interests if base has none
  if ((!payload.stylesList || payload.stylesList.length === 0) && persona.interests?.length > 0) {
    payload.stylesList = [...persona.interests];
  }

  // Inject excluded categories from persona learned traits
  if (persona.learnedTraits?.rejectedCategories?.length > 0) {
    payload.excludedCategories = Array.from(
      new Set([...(payload.excludedCategories || []), ...persona.learnedTraits.rejectedCategories])
    );
  }

  return payload;
}

/**
 * Summarizes the persona into human-readable portuguese bullets for UI presentation.
 */
export function summarizePersonaForUser(persona) {
  const p = persona || getTravelPersona();
  const summary = [];

  const paceLabels = { relaxed: 'Ritmo descontraído e calmo', balanced: 'Ritmo equilibrado', fast: 'Ritmo dinâmico com muitas visitas' };
  const budgetLabels = { economic: 'Foco em poupança e boas oportunidades', moderate: 'Orçamento médio equilibrado', luxury: 'Experiências de elevado conforto e luxo' };
  const styleLabels = { popular_highlights: 'Preferência por atração emblemáticas', local_authentic: 'Preferência por experiências locais e autênticas', hidden_gems: 'Foco em segredos escondidos e locais tranquilos' };

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
