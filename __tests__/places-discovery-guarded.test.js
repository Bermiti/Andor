// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  calculateDeterministicPoiScore,
  rejectUnverifiedAiVenues,
} from '../app/lib/server/places-provider';

describe('Guarded Places Discovery & Recommendation Test Suite', () => {
  it('calculates deterministic POI score based on matching user interests and ratings', () => {
    const candidate = {
      internalEntityId: 'otm-123',
      name: 'Castelo de São Jorge',
      categories: ['historic', 'castles', 'architecture'],
      rating: 3,
    };

    const score = calculateDeterministicPoiScore(candidate, ['historic', 'culture']);
    expect(score).toBeGreaterThan(0.5);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  it('matches verified candidates and tags unverified AI venue proposals with unverified_ai_proposal status', () => {
    const verifiedCandidates = [
      {
        internalEntityId: 'otm-castle-1',
        name: 'Castelo de São Jorge',
        coordinates: { lat: 38.7139, lng: -9.1335 },
        provenance: { provider: 'opentripmap' },
      },
    ];

    const aiStops = [
      { id: 'otm-castle-1', name: 'Castelo de São Jorge' },
      { id: 'fake-venue-999', name: 'Restaurante Inventado pela IA' },
    ];

    const processed = rejectUnverifiedAiVenues(aiStops, verifiedCandidates);
    expect(processed[0].verificationStatus).toBe('verified');
    expect(processed[0].provenance.provider).toBe('opentripmap');

    expect(processed[1].verificationStatus).toBe('unverified_ai_proposal');
    expect(processed[1].provenance.sourceType).toBe('estimate');
  });
});
