import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { executeProviderRequest } from '../app/lib/server/provider-executor';
import { clearRateLimitStore } from '../app/lib/server/rate-limit';
import {
  calculateEstimatedRoute,
  calculateStraightLineDistance,
  formatVerifiedProviderRoute,
} from '../app/lib/server/routing-provider';
import {
  fetchWeatherForecast,
  getHistoricalClimateNormals,
  getSeasonalClimateEstimate,
} from '../app/lib/server/weather-provider';

describe('Sprint 3.2 Weather, Routing, and Executor Test Suite', () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('distinguishes live weather forecasts from historical climate normals and estimates', async () => {
    const historical = getHistoricalClimateNormals('PT', 8);
    expect(historical.measurementType).toBe('climate_normals');
    expect(historical.provenance.sourceType).toBe('official');

    const estimate = getSeasonalClimateEstimate('summer');
    expect(estimate.measurementType).toBe('seasonal_climate_estimate');
    expect(estimate.provenance.isEstimated).toBe(true);

    const forecast = await fetchWeatherForecast({ lat: 38.70775, lng: -9.13659 });
    expect(['available', 'provider_unavailable']).toContain(forecast.status);
    expect(forecast.measurementType).toBe('weather_forecast');
  });

  it('strictly separates straight-line distance, estimated routes, and verified provider routes', () => {
    const origin = { lat: 38.70775, lng: -9.13659 }; // Lisbon
    const destination = { lat: 38.7139, lng: -9.1336 }; // Castelo de São Jorge

    const straightLine = calculateStraightLineDistance(origin, destination);
    expect(straightLine.measurementType).toBe('straight_line');
    expect(straightLine.isRoute).toBe(false);
    expect(straightLine.durationSeconds).toBeNull();

    const estimated = calculateEstimatedRoute(origin, destination, 'walking');
    expect(estimated.measurementType).toBe('estimated_route');
    expect(estimated.isRoute).toBe(false);
    expect(typeof estimated.durationSeconds).toBe('number');

    const providerRoute = formatVerifiedProviderRoute({
      origin,
      destination,
      mode: 'walking',
      distanceMeters: 950,
      durationSeconds: 720,
    });
    expect(providerRoute.measurementType).toBe('provider_route');
    expect(providerRoute.isRoute).toBe(true);
  });

  it('executes provider requests through central executor with rate limiting and error handling', async () => {
    const res = await executeProviderRequest({
      providerId: 'provider-nominatim',
      capability: 'geography',
      input: { query: 'Lisboa' },
      executorFn: async (inp) => ({ canonicalName: 'Lisboa', countryCode: 'PT' }),
    });

    expect(res.success).toBe(true);
    expect(res.data.canonicalName).toBe('Lisboa');
    expect(res.correlationId).toBeDefined();
  });

  it('blocks a provider after its configured aggregate request limit', async () => {
    vi.stubEnv('RATE_LIMIT_PROVIDER_MAX', '1');
    const executorFn = vi.fn(async () => ({ ok: true }));
    const request = {
      providerId: 'provider-rate-limit-test',
      capability: 'geography',
      input: { query: 'Lisboa' },
      executorFn,
    };

    await expect(executeProviderRequest(request)).resolves.toMatchObject({ success: true });
    await expect(executeProviderRequest(request)).resolves.toMatchObject({
      success: false,
      error: {
        code: 'PROVIDER_RATE_LIMITED',
        retryable: true,
      },
    });
    expect(executorFn).toHaveBeenCalledTimes(1);
  });
});
