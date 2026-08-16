/**
 * Recommendation Engine
 *
 * Generates contextual recommendations for itinerary activities
 * based on location, budget, preferences, and schedule gaps.
 *
 * All recommendations include justification and impact analysis.
 * No data is presented as fact when it is an estimate.
 */

const RECOMMENDATION_CONTEXTS = [
  'near_you',
  'budget_friendly',
  'rainy_day',
  'local_experience',
  'nightlife',
  'family_friendly',
  'accessible',
  'free_activity',
  'gastronomic',
  'quieter_option',
  'saved_recommendation',
  'less_travel',
  'special_event',
];

const ACTIVITY_CATEGORIES = [
  'museum', 'park', 'restaurant', 'cafe', 'bar', 'monument',
  'viewpoint', 'market', 'beach', 'shopping', 'cultural', 'nature',
  'adventure', 'wellness', 'nightlife', 'food_tour', 'walking_tour',
  'workshop', 'show', 'temple', 'gallery', 'garden', 'other',
];

function haversineDistanceKm(from, to) {
  if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) return null;
  const R = 6371;
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateWalkingMinutes(distanceKm) {
  if (distanceKm == null) return null;
  return Math.round(distanceKm / 5 * 60); // ~5 km/h walking speed
}

function text(value, fallback = '') {
  return value == null ? fallback : String(value).trim() || fallback;
}

/**
 * Determines which recommendation contexts apply given the current state.
 */
export function resolveRecommendationContexts({
  currentLocation = null,
  budgetRemaining = null,
  budgetTotal = null,
  weatherCondition = null,
  preferences = {},
  period = null,
  hasChildren = false,
  accessibilityNeeded = false,
} = {}) {
  const contexts = [];

  if (currentLocation) contexts.push('near_you');
  if (budgetRemaining != null && budgetTotal != null && budgetRemaining / budgetTotal < 0.3) {
    contexts.push('budget_friendly');
    contexts.push('free_activity');
  }
  if (weatherCondition === 'rain' || weatherCondition === 'storm') {
    contexts.push('rainy_day');
  }
  if (period === 'evening' || period === 'dinner') contexts.push('nightlife');
  if (period === 'lunch' || period === 'dinner') contexts.push('gastronomic');
  if (hasChildren) contexts.push('family_friendly');
  if (accessibilityNeeded) contexts.push('accessible');
  if (preferences.prefersLocal) contexts.push('local_experience');
  if (preferences.prefersQuiet) contexts.push('quieter_option');

  return contexts;
}

/**
 * Scores and ranks candidate activities for recommendation.
 */
export function scoreRecommendation(candidate, {
  currentLocation = null,
  budgetRemaining = null,
  rejectedIds = new Set(),
  savedIds = new Set(),
  contexts = [],
} = {}) {
  if (rejectedIds.has(candidate.id)) return null;

  let score = 50; // base score
  const justifications = [];

  // Distance scoring
  const distance = haversineDistanceKm(currentLocation, candidate.coordinates);
  if (distance != null) {
    if (distance < 0.5) {
      score += 20;
      justifications.push(`A ${Math.round(distance * 1000)}m de distância`);
    } else if (distance < 1.5) {
      score += 10;
      justifications.push(`A ${distance.toFixed(1)} km (~${estimateWalkingMinutes(distance)} min a pé)`);
    } else if (distance < 5) {
      score += 5;
      justifications.push(`A ${distance.toFixed(1)} km de distância`);
    } else {
      score -= 5;
    }
  }

  // Budget scoring
  const cost = candidate.estimatedCost;
  if (cost != null && budgetRemaining != null) {
    if (cost === 0) {
      score += 15;
      justifications.push('Atividade gratuita');
    } else if (cost <= budgetRemaining * 0.1) {
      score += 10;
      justifications.push('Dentro do orçamento disponível');
    } else if (cost > budgetRemaining * 0.5) {
      score -= 15;
      justifications.push('Pode ultrapassar o orçamento restante');
    }
  }

  // Context-based scoring
  if (contexts.includes('near_you') && distance != null && distance < 1) score += 10;
  if (contexts.includes('budget_friendly') && (cost === 0 || cost < 15)) score += 15;
  if (contexts.includes('rainy_day') && candidate.indoor) {
    score += 20;
    justifications.push('Atividade interior — ideal para dias de chuva');
  }
  if (contexts.includes('family_friendly') && candidate.familyFriendly) {
    score += 10;
    justifications.push('Adequado para famílias');
  }
  if (contexts.includes('accessible') && candidate.accessible) {
    score += 15;
    justifications.push('Acessibilidade confirmada');
  }
  if (contexts.includes('gastronomic') && ['restaurant', 'cafe', 'food_tour', 'market'].includes(candidate.category)) {
    score += 10;
    justifications.push('Experiência gastronómica');
  }
  if (contexts.includes('local_experience') && candidate.localExperience) {
    score += 10;
    justifications.push('Experiência local autêntica');
  }

  // Saved items get a boost
  if (savedIds.has(candidate.id)) {
    score += 25;
    justifications.push('Guardaste esta recomendação anteriormente');
  }

  // Confidence penalty for estimates
  if (candidate.provenance?.isEstimated) {
    score -= 5;
  }

  return {
    ...candidate,
    score: Math.max(0, Math.min(100, score)),
    justifications,
    distance: distance != null ? Math.round(distance * 100) / 100 : null,
    walkingMinutes: estimateWalkingMinutes(distance),
    budgetImpact: cost != null && budgetRemaining != null
      ? { cost, remainingAfter: budgetRemaining - cost, percentOfRemaining: Math.round(cost / budgetRemaining * 100) }
      : null,
    routeImpact: distance != null
      ? { distanceKm: Math.round(distance * 10) / 10, estimatedMinutes: estimateWalkingMinutes(distance) }
      : null,
  };
}

/**
 * Generates ranked recommendations from a pool of candidates.
 */
export function generateRecommendations(candidates, options = {}) {
  const maxResults = options.maxResults || 8;

  const scored = candidates
    .map((candidate) => scoreRecommendation(candidate, options))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return scored.map((item) => ({
    id: item.id,
    name: text(item.name, 'Recomendação'),
    category: ACTIVITY_CATEGORIES.includes(item.category) ? item.category : 'other',
    context: item.context || resolveRecommendationContexts(options)[0] || 'near_you',
    justification: item.justifications.length > 0
      ? item.justifications[0]
      : 'Sugerida com base no seu itinerário',
    justifications: item.justifications,
    estimatedCost: item.estimatedCost ?? null,
    estimatedDuration: item.estimatedDuration ?? null,
    distance: item.distance,
    walkingMinutes: item.walkingMinutes,
    coordinates: item.coordinates || null,
    budgetImpact: item.budgetImpact,
    routeImpact: item.routeImpact,
    score: item.score,
    provenance: item.provenance || null,
    isEstimate: Boolean(item.provenance?.isEstimated),
    indoor: Boolean(item.indoor),
    familyFriendly: Boolean(item.familyFriendly),
    accessible: Boolean(item.accessible),
  }));
}

/**
 * Records a user's decision about a recommendation.
 * Used to improve future scoring.
 */
export function createRecommendationFeedback(recommendationId, action, metadata = {}) {
  const validActions = ['added', 'replaced', 'saved', 'rejected', 'requested_alternative'];
  if (!validActions.includes(action)) return null;

  return {
    recommendationId: text(recommendationId),
    action,
    timestamp: new Date().toISOString(),
    period: text(metadata.period),
    dayNumber: metadata.dayNumber ?? null,
    reason: text(metadata.reason),
  };
}
