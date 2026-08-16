// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { GET } from '../app/api/weather/route';

describe('Weather API Endpoint Discriminated Union Test Suite', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns dataType seasonal_climate_estimate with 400 when coordinates are missing', async () => {
    const req = new Request('http://localhost:3000/api/weather');
    const res = await GET(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.dataType).toBe('seasonal_climate_estimate');
    expect(body.status).toBe('estimate_only');
    expect(body.forecast).toBeNull();
    expect(body.estimate).toBeDefined();
  });

  it('returns dataType weather_forecast when Open-Meteo responds with valid forecast', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        timezone: 'Europe/Lisbon',
        elevation: 2,
        daily: {
          time: ['2026-08-16'],
          temperature_2m_max: [27],
          temperature_2m_min: [18],
          precipitation_sum: [0],
          weathercode: [1],
          windspeed_10m_max: [14],
        },
      }),
    }));

    const req = new Request('http://localhost:3000/api/weather?lat=38.7223&lng=-9.1393&timezone=Europe/Lisbon');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dataType).toBe('weather_forecast');
    expect(body.status).toBe('available');
    expect(body.forecast).toBeDefined();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
