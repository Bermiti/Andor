import { describe, expect, it, vi } from 'vitest';
import citySearchFixture from '../fixtures/providers/nominatim/city_search.json';

describe('Nominatim Contract Test Suite', () => {
  it('validates sanitized city search contract structure and attribution', () => {
    expect(Array.isArray(citySearchFixture)).toBe(true);
    const first = citySearchFixture[0];

    expect(first).toHaveProperty('display_name');
    expect(first).toHaveProperty('lat');
    expect(first).toHaveProperty('lon');
    expect(first.licence).toContain('OpenStreetMap');

    const lat = parseFloat(first.lat);
    const lon = parseFloat(first.lon);

    expect(isNaN(lat)).toBe(false);
    expect(isNaN(lon)).toBe(false);
    expect(lat).toBeGreaterThanOrEqual(-90);
    expect(lat).toBeLessThanOrEqual(90);
  });
});
