// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { buildUserProfile, rankItemsByUserPreferences } from '../app/lib/server/personalization-engine';

describe('Personalization Engine Test Suite (Sprint 6)', () => {
  it('honors explicit user consent for preference tracking', () => {
    const profileNoConsent = buildUserProfile({ userId: 'user-1', explicitConsent: false });
    expect(profileNoConsent.explicitConsent).toBe(false);
    expect(profileNoConsent.interests).toEqual([]);

    const profileWithConsent = buildUserProfile({
      userId: 'user-2',
      explicitConsent: true,
      preferences: { interests: ['art', 'gastronomy'] },
    });
    expect(profileWithConsent.explicitConsent).toBe(true);
    expect(profileWithConsent.interests).toEqual(['art', 'gastronomy']);
  });

  it('ranks candidate items according to user interests', () => {
    const userProfile = buildUserProfile({
      userId: 'user-3',
      explicitConsent: true,
      preferences: { interests: ['art'] },
    });

    const candidates = [
      { name: 'Parque de Diversões', categories: ['entertainment'], score: 0.5 },
      { name: 'Museu do Louvre', categories: ['art', 'museum'], score: 0.5 },
    ];

    const ranked = rankItemsByUserPreferences(candidates, userProfile);
    expect(ranked[0].name).toBe('Museu do Louvre');
    expect(ranked[0].personalizationScore).toBeGreaterThan(0.5);
  });
});
