// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { POST } from '../app/api/routing/route';

describe('Routing API Endpoint & OSRM Engine Test Suite', () => {
  it('returns 400 route_unavailable when origin or destination coordinates are missing', async () => {
    const req = new Request('http://localhost:3000/api/routing', {
      method: 'POST',
      body: JSON.stringify({ mode: 'walking' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.measurementType).toBe('route_unavailable');
    expect(body.error).toBe('ROUTING_INVALID_INPUT');
  });

  it('returns estimated_route when forceEstimate flag is true', async () => {
    const req = new Request('http://localhost:3000/api/routing', {
      method: 'POST',
      body: JSON.stringify({
        origin: { lat: 38.7223, lng: -9.1393 },
        destination: { lat: 38.7180, lng: -9.1305 },
        mode: 'walking',
        forceEstimate: true,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.measurementType).toBe('estimated_route');
    expect(body.durationSeconds).toBeGreaterThan(0);
    expect(body.provenance.provider).toBe('andor_route_estimator');
  });

  it('returns provider_route or fallback estimated_route from OSRM engine', async () => {
    const req = new Request('http://localhost:3000/api/routing', {
      method: 'POST',
      body: JSON.stringify({
        origin: { lat: 38.7223, lng: -9.1393 },
        destination: { lat: 38.7180, lng: -9.1305 },
        mode: 'walking',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(['provider_route', 'estimated_route']).toContain(body.measurementType);
  });
});
