import { describe, expect, it } from 'vitest';
import poiListFixture from '../fixtures/providers/opentripmap/poi_list.json';

describe('OpenTripMap Contract Test Suite', () => {
  it('validates sanitized POI contract structure and coordinates', () => {
    expect(Array.isArray(poiListFixture)).toBe(true);
    const poi = poiListFixture[0];

    expect(poi).toHaveProperty('xid');
    expect(poi).toHaveProperty('name');
    expect(poi).toHaveProperty('point');
    expect(typeof poi.point.lat).toBe('number');
    expect(typeof poi.point.lon).toBe('number');
  });
});
