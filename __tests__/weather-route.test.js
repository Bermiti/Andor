// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { GET } from '../app/api/weather/route';

describe('Weather API Endpoint Test Suite', () => {
  it('returns 400 with seasonal climate estimate when coordinates are missing or invalid', async () => {
    const req = new Request('http://localhost:3000/api/weather');
    const res = await GET(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.status).toBe('invalid_coordinates');
    expect(body.measurementType).toBe('seasonal_climate_estimate');
  });

  it('fetches verified weather forecast from Open-Meteo for valid coordinates', async () => {
    const req = new Request('http://localhost:3000/api/weather?lat=38.7223&lng=-9.1393&timezone=Europe/Lisbon');
    const res = await GET(req);

    // Weather service will return 200 with forecast or 503 if Open-Meteo is unreachable
    expect([200, 503]).toContain(res.status);

    const body = await res.json();
    expect(body.measurementType).toBe('weather_forecast');
    expect(body.provenance).toBeDefined();
    expect(body.provenance.provider).toBe('open-meteo');
  });
});
