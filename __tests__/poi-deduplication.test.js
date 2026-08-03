// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { deduplicatePoiCandidates } from '../app/lib/server/poi-deduplication';

describe('POI Deduplication Engine Test Suite', () => {
  it('deduplicates places with matching normalized names and close distance', () => {
    const raw = [
      {
        internalEntityId: 'otm-1',
        provider: 'opentripmap',
        name: 'Castelo de S. Jorge',
        coordinates: { lat: 38.7139, lng: -9.1335 },
      },
      {
        internalEntityId: 'nominatim-2',
        provider: 'nominatim',
        name: 'Castelo de Sao Jorge',
        coordinates: { lat: 38.7140, lng: -9.1336 },
      },
    ];

    const deduplicated = deduplicatePoiCandidates(raw);
    expect(deduplicated.length).toBe(1);
    expect(deduplicated[0].providerMatches).toContain('opentripmap');
    expect(deduplicated[0].providerMatches).toContain('nominatim');
    expect(deduplicated[0].matchConfidence).toBeGreaterThan(0.85);
  });

  it('keeps distinct candidates separated if distance or names differ', () => {
    const raw = [
      {
        internalEntityId: 'otm-1',
        provider: 'opentripmap',
        name: 'Castelo de São Jorge',
        coordinates: { lat: 38.7139, lng: -9.1335 },
      },
      {
        internalEntityId: 'otm-2',
        provider: 'opentripmap',
        name: 'Torre de Belém',
        coordinates: { lat: 38.6916, lng: -9.216 },
      },
    ];

    const deduplicated = deduplicatePoiCandidates(raw);
    expect(deduplicated.length).toBe(2);
  });
});
