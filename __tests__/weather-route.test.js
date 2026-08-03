// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { GET } from '../app/api/weather/route';

describe('Weather API Endpoint Discriminated Union Test Suite', () => {
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
    const req = new Request('http://localhost:3000/api/weather?lat=38.7223&lng=-9.1393&timezone=Europe/Lisbon');
    const res = await GET(req);

    expect([200, 503]).toContain(res.status);
    const body = await res.json();

    if (res.status === 200) {
      expect(body.dataType).toBe('weather_forecast');
      expect(body.status).toBe('available');
      expect(body.forecast).toBeDefined();
    } else {
      expect(body.dataType).toBe('unavailable');
      expect(body.status).toBe('provider_unavailable');
    }
  });
});
