import { describe, it, expect } from 'vitest';
import {
  resolveRecommendationContexts,
  scoreRecommendation,
  generateRecommendations,
  createRecommendationFeedback,
} from '../app/lib/recommendation-engine';

describe('resolveRecommendationContexts', () => {
  it('returns near_you when location is provided', () => {
    const contexts = resolveRecommendationContexts({ currentLocation: { lat: 38.7, lng: -9.1 } });
    expect(contexts).toContain('near_you');
  });

  it('returns budget_friendly when budget is low', () => {
    const contexts = resolveRecommendationContexts({ budgetRemaining: 20, budgetTotal: 100 });
    expect(contexts).toContain('budget_friendly');
    expect(contexts).toContain('free_activity');
  });

  it('returns rainy_day for rain weather', () => {
    const contexts = resolveRecommendationContexts({ weatherCondition: 'rain' });
    expect(contexts).toContain('rainy_day');
  });

  it('returns family_friendly when children present', () => {
    const contexts = resolveRecommendationContexts({ hasChildren: true });
    expect(contexts).toContain('family_friendly');
  });

  it('returns nightlife for evening period', () => {
    const contexts = resolveRecommendationContexts({ period: 'evening' });
    expect(contexts).toContain('nightlife');
  });

  it('returns gastronomic for lunch period', () => {
    const contexts = resolveRecommendationContexts({ period: 'lunch' });
    expect(contexts).toContain('gastronomic');
  });

  it('returns accessible when needed', () => {
    const contexts = resolveRecommendationContexts({ accessibilityNeeded: true });
    expect(contexts).toContain('accessible');
  });
});

describe('scoreRecommendation', () => {
  const baseCandidate = {
    id: 'activity-1',
    name: 'Pastéis de Belém',
    category: 'cafe',
    coordinates: { lat: 38.6976, lng: -9.2032 },
    estimatedCost: 5,
    estimatedDuration: 30,
  };

  it('gives higher score to nearby activities', () => {
    const nearby = scoreRecommendation(baseCandidate, {
      currentLocation: { lat: 38.6976, lng: -9.2030 }, // very close
    });
    const faraway = scoreRecommendation(baseCandidate, {
      currentLocation: { lat: 41.15, lng: -8.61 }, // Porto
    });
    expect(nearby.score).toBeGreaterThan(faraway.score);
  });

  it('gives higher score to free activities when budget is low', () => {
    const free = scoreRecommendation(
      { ...baseCandidate, estimatedCost: 0 },
      { budgetRemaining: 10, budgetTotal: 100 },
    );
    const expensive = scoreRecommendation(
      { ...baseCandidate, estimatedCost: 50 },
      { budgetRemaining: 10, budgetTotal: 100 },
    );
    expect(free.score).toBeGreaterThan(expensive.score);
  });

  it('boosts indoor activities on rainy days', () => {
    const indoor = scoreRecommendation(
      { ...baseCandidate, indoor: true },
      { contexts: ['rainy_day'] },
    );
    const outdoor = scoreRecommendation(
      { ...baseCandidate, indoor: false },
      { contexts: ['rainy_day'] },
    );
    expect(indoor.score).toBeGreaterThan(outdoor.score);
  });

  it('excludes rejected recommendations', () => {
    const result = scoreRecommendation(baseCandidate, {
      rejectedIds: new Set(['activity-1']),
    });
    expect(result).toBeNull();
  });

  it('boosts saved recommendations', () => {
    const saved = scoreRecommendation(baseCandidate, {
      savedIds: new Set(['activity-1']),
    });
    const unsaved = scoreRecommendation(baseCandidate, {
      savedIds: new Set(),
    });
    expect(saved.score).toBeGreaterThan(unsaved.score);
  });

  it('includes budget impact when cost and budget available', () => {
    const result = scoreRecommendation(baseCandidate, {
      budgetRemaining: 50,
    });
    expect(result.budgetImpact).toBeDefined();
    expect(result.budgetImpact.cost).toBe(5);
    expect(result.budgetImpact.remainingAfter).toBe(45);
  });

  it('includes route impact when distance calculable', () => {
    const result = scoreRecommendation(baseCandidate, {
      currentLocation: { lat: 38.7, lng: -9.2 },
    });
    expect(result.routeImpact).toBeDefined();
    expect(result.routeImpact.distanceKm).toBeGreaterThan(0);
  });
});

describe('generateRecommendations', () => {
  const candidates = [
    { id: '1', name: 'Museum', category: 'museum', coordinates: { lat: 38.7, lng: -9.2 }, estimatedCost: 10, indoor: true },
    { id: '2', name: 'Park', category: 'park', coordinates: { lat: 38.71, lng: -9.21 }, estimatedCost: 0 },
    { id: '3', name: 'Restaurant', category: 'restaurant', coordinates: { lat: 38.72, lng: -9.22 }, estimatedCost: 25 },
    { id: '4', name: 'Beach', category: 'beach', coordinates: { lat: 38.65, lng: -9.3 }, estimatedCost: 0 },
  ];

  it('returns ranked results up to maxResults', () => {
    const results = generateRecommendations(candidates, { maxResults: 2 });
    expect(results.length).toBe(2);
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
  });

  it('each result has required fields', () => {
    const results = generateRecommendations(candidates);
    for (const result of results) {
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('justification');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('isEstimate');
    }
  });

  it('excludes rejected candidates', () => {
    const results = generateRecommendations(candidates, {
      rejectedIds: new Set(['1', '2']),
    });
    expect(results.find((r) => r.id === '1')).toBeUndefined();
    expect(results.find((r) => r.id === '2')).toBeUndefined();
  });

  it('does not present estimates as facts', () => {
    const estimated = [
      { id: '1', name: 'Test', category: 'other', estimatedCost: 10, provenance: { isEstimated: true, sourceType: 'estimate', provider: 'andor' } },
    ];
    const results = generateRecommendations(estimated);
    expect(results[0].isEstimate).toBe(true);
  });
});

describe('createRecommendationFeedback', () => {
  it('creates valid feedback for known actions', () => {
    const feedback = createRecommendationFeedback('rec-1', 'added', { period: 'morning', dayNumber: 3 });
    expect(feedback.recommendationId).toBe('rec-1');
    expect(feedback.action).toBe('added');
    expect(feedback.period).toBe('morning');
    expect(feedback.dayNumber).toBe(3);
    expect(feedback.timestamp).toBeDefined();
  });

  it('returns null for invalid action', () => {
    const feedback = createRecommendationFeedback('rec-1', 'invalid_action');
    expect(feedback).toBeNull();
  });

  it('handles all valid actions', () => {
    for (const action of ['added', 'replaced', 'saved', 'rejected', 'requested_alternative']) {
      const feedback = createRecommendationFeedback('rec-1', action);
      expect(feedback).not.toBeNull();
      expect(feedback.action).toBe(action);
    }
  });
});
