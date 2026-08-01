import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { enrichActivityData, enrichTransportData } from '../app/lib/enrichment-services';

describe('enrichment integrity', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.OPENTRIPMAP_API_KEY = '5ae2e3...';
    process.env.AMADEUS_API_KEY = '';
    process.env.AMADEUS_API_SECRET = '';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = originalEnv;
  });

  test('missing activity providers do not invent ratings, hours, fees, or descriptions', async () => {
    const result = await enrichActivityData('Unknown Place', 'Edinburgh');

    expect(result.source).toBe('unavailable');
    expect(result.rating).toBeNull();
    expect(result.hours).toBeNull();
    expect(result.fee).toBeNull();
    expect(result.description).toBeNull();
  });

  test('missing transport providers return search links and no synthetic offers', async () => {
    const result = await enrichTransportData('Lisboa', 'Edinburgh', '2026-09-01');

    expect(result.options).toEqual([]);
    expect(result.overview).toMatch(/não foram consultados/i);
    expect(result.googleFlightsUrl).toContain('google.com/travel/flights');
  });
});
