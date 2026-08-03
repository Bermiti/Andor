import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  extractCoordinates, 
  formatRouteDuration, 
  formatRouteDistance, 
  calculateDayRoutes 
} from '../app/lib/route-calculator';

describe('Route Calculator', () => {
  describe('extractCoordinates', () => {
    it('extracts from lat/lng format', () => {
      expect(extractCoordinates({ lat: 10, lng: 20 })).toEqual({ lat: 10, lng: 20 });
    });
    
    it('extracts from latitude/longitude format', () => {
      expect(extractCoordinates({ latitude: 10, longitude: 20 })).toEqual({ lat: 10, lng: 20 });
    });
    
    it('extracts from coordinates object format', () => {
      expect(extractCoordinates({ coordinates: { lat: 10, lng: 20 } })).toEqual({ lat: 10, lng: 20 });
    });

    it('returns null for missing or invalid coordinates', () => {
      expect(extractCoordinates(null)).toBeNull();
      expect(extractCoordinates({})).toBeNull();
      expect(extractCoordinates({ lat: 10 })).toBeNull();
      expect(extractCoordinates({ lat: '10', lng: '20' })).toBeNull();
    });
  });

  describe('formatRouteDuration', () => {
    it('formats minutes in Portuguese', () => {
      expect(formatRouteDuration(15)).toBe('15 min');
      expect(formatRouteDuration(60)).toBe('1h');
      expect(formatRouteDuration(90)).toBe('1h 30min');
    });
  });

  describe('formatRouteDistance', () => {
    it('formats distance in Portuguese', () => {
      expect(formatRouteDistance(0.5)).toBe('500 m');
      expect(formatRouteDistance(1.23)).toBe('1.2 km');
      expect(formatRouteDistance(10)).toBe('10.0 km');
    });
  });

  describe('calculateDayRoutes', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns empty array for less than 2 valid stops', async () => {
      expect(await calculateDayRoutes([])).toEqual([]);
      expect(await calculateDayRoutes([{ lat: 10, lng: 20 }])).toEqual([]);
      expect(await calculateDayRoutes([{ lat: 10, lng: 20 }, { name: 'Invalid' }])).toEqual([]);
    });

    it('skips stops without valid coordinates', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ distance: 1.2, duration: 15, geometry: [] })
      });

      const stops = [
        { name: 'Stop A', lat: 0, lng: 0 },
        { name: 'Invalid Stop' },
        { name: 'Stop B', lat: 0.01, lng: 0.01 }
      ];

      const routes = await calculateDayRoutes(stops);
      expect(routes.length).toBe(1);
      expect(routes[0].from.name).toBe('Stop A');
      expect(routes[0].to.name).toBe('Stop B');
    });

    it('returns expected structure with mock fetch', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ distance: 1.2, duration: 15, geometry: [[0,0], [0.01,0.01]] })
      });

      const stops = [
        { name: 'Stop A', lat: 0, lng: 0 },
        { name: 'Stop B', lat: 0.01, lng: 0.01 } // Distance < 5km -> walking
      ];

      const routes = await calculateDayRoutes(stops);
      expect(routes.length).toBe(1);
      expect(routes[0]).toEqual({
        from: { name: 'Stop A', lat: 0, lng: 0 },
        to: { name: 'Stop B', lat: 0.01, lng: 0.01 },
        distance: { km: 1.2, text: '1.2 km' },
        duration: { minutes: 15, text: '15 min a pé' },
        mode: 'walking',
        geometry: [[0,0], [0.01,0.01]],
        provenance: 'osrm'
      });
    });

    it('uses fallback estimate on API error', async () => {
      global.fetch.mockRejectedValue(new Error('API Down'));

      const stops = [
        { name: 'Stop A', lat: 0, lng: 0 },
        { name: 'Stop B', lat: 0.01, lng: 0.01 } // Close, walking
      ];

      const routes = await calculateDayRoutes(stops);
      expect(routes.length).toBe(1);
      expect(routes[0].provenance).toBe('estimate');
      expect(routes[0].distance.text).toContain('km');
      expect(routes[0].duration.text).toContain('a pé (estimado)');
    });
    
    it('switches to driving mode if distance > 5km', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ distance: 10, duration: 12, geometry: [] })
      });

      const stops = [
        { name: 'Stop A', lat: 0, lng: 0 },
        { name: 'Stop B', lat: 0.1, lng: 0.1 } // Distance > 5km -> driving
      ];

      const routes = await calculateDayRoutes(stops);
      expect(routes.length).toBe(1);
      expect(routes[0].mode).toBe('driving');
      expect(routes[0].duration.text).toContain('de carro');
    });
  });
});
