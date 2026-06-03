import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { enrichRestaurantsData } from '../app/lib/enrichment-services';

describe('Restaurant Enrichment Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = originalEnv;
  });

  test('falls back to custom city mock data if API keys are missing', async () => {
    // Ensure keys are undefined/mock default
    process.env.FOURSQUARE_API_KEY = 'fsq3...';
    process.env.OPENTRIPMAP_API_KEY = '5ae2e3...';

    const results = await enrichRestaurantsData(35.6762, 139.6503, 'Tokyo');
    expect(results).toHaveLength(3);
    expect(results[0].source).toBe('estimated');
    expect(results[0].name).toContain('Sushi');
  });

  test('uses Foursquare API if key is present and fetch succeeds', async () => {
    process.env.FOURSQUARE_API_KEY = 'fsq_valid_test_key';
    
    const mockFsqResponse = {
      results: [
        {
          name: 'Test Fsq Bistro',
          categories: [{ name: 'French Bistro' }],
          rating: 8.8,
          price: 2,
          location: { address: '123 Test St' }
        }
      ]
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockFsqResponse
    });

    const results = await enrichRestaurantsData(48.8566, 2.3522, 'Paris');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Test Fsq Bistro');
    expect(results[0].cuisine).toBe('French Bistro');
    expect(results[0].rating).toBe('4.4'); // 8.8 / 2
    expect(results[0].priceLevel).toBe('€€');
    expect(results[0].source).toBe('foursquare');
  });

  test('uses OpenTripMap foods API if OTM key is present and Fsq fails', async () => {
    process.env.FOURSQUARE_API_KEY = 'fsq3...';
    process.env.OPENTRIPMAP_API_KEY = 'otm_valid_test_key';

    const mockRadiusResponse = {
      features: [
        {
          properties: { xid: 'x123' }
        }
      ]
    };

    const mockDetailResponse = {
      name: 'OTM Cafe',
      kinds: 'foods,cafes',
      address: { road: 'OTM Street' }
    };

    // First fetch: OTM radius search
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRadiusResponse
    });

    // Second fetch: OTM place detail search
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDetailResponse
    });

    const results = await enrichRestaurantsData(40.7128, -74.006, 'New York');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('OTM Cafe');
    expect(results[0].cuisine).toBe('cafes');
    expect(results[0].address).toBe('OTM Street');
    expect(results[0].source).toBe('opentripmap');
  });
});
