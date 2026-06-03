import { describe, expect, test } from 'vitest';
import { normalizeCoords, validateCoords, getCountryCentroid, getZoomForType } from '../app/lib/geocoding';

describe('Geocoding Utilities', () => {
  describe('validateCoords', () => {
    test('accepts valid coordinates within bounds', () => {
      expect(validateCoords(38.7223, -9.1393)).toBe(true); // Lisbon
      expect(validateCoords(-30, 20)).toBe(true);
    });

    test('rejects out of bounds coordinates', () => {
      expect(validateCoords(95, -9.1393)).toBe(false);
      expect(validateCoords(38.7223, -185)).toBe(false);
      expect(validateCoords(NaN, 12)).toBe(false);
      expect(validateCoords(12, null)).toBe(false);
    });

    test('rejects (0,0) coordinate', () => {
      expect(validateCoords(0, 0)).toBe(false);
    });
  });

  describe('normalizeCoords', () => {
    test('normalizes array format [lat, lng]', () => {
      expect(normalizeCoords([38.7223, -9.1393])).toEqual({ lat: 38.7223, lng: -9.1393 });
    });

    test('normalizes object format { lat, lng }', () => {
      expect(normalizeCoords({ lat: 38.7223, lng: -9.1393 })).toEqual({ lat: 38.7223, lng: -9.1393 });
    });

    test('normalizes object format { latitude, longitude }', () => {
      expect(normalizeCoords({ latitude: 38.7223, longitude: -9.1393 })).toEqual({ lat: 38.7223, lng: -9.1393 });
    });

    test('returns null for invalid inputs', () => {
      expect(normalizeCoords(null)).toBe(null);
      expect(normalizeCoords([])).toBe(null);
      expect(normalizeCoords([0, 0])).toBe(null);
      expect(normalizeCoords({ lat: 95, lng: 200 })).toBe(null);
    });
  });

  describe('getCountryCentroid', () => {
    test('resolves standard 2-letter codes', () => {
      expect(getCountryCentroid('pt')).toEqual([39.3999, -8.2245]);
      expect(getCountryCentroid('jp')).toEqual([36.2048, 138.2529]);
    });

    test('resolves lowercase country name strings', () => {
      expect(getCountryCentroid('portugal')).toEqual([39.3999, -8.2245]);
      expect(getCountryCentroid('japão')).toEqual([36.2048, 138.2529]);
      expect(getCountryCentroid('japan')).toEqual([36.2048, 138.2529]);
    });

    test('returns null for unknown countries', () => {
      expect(getCountryCentroid('unknown-land')).toBe(null);
      expect(getCountryCentroid('')).toBe(null);
    });
  });

  describe('getZoomForType', () => {
    test('returns appropriate zoom levels', () => {
      expect(getZoomForType('country')).toBe(6);
      expect(getZoomForType('region')).toBe(8);
      expect(getZoomForType('city')).toBe(12);
      expect(getZoomForType('neighbourhood')).toBe(14);
      expect(getZoomForType('restaurant')).toBe(15);
      expect(getZoomForType(null)).toBe(13);
    });
  });
});
