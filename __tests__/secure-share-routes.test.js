import { beforeEach, describe, expect, it, vi } from 'vitest';

const routeState = vi.hoisted(() => ({
  identity: { authenticated: true, userId: '11111111-1111-4111-8111-111111111111' },
  createResult: {
    ok: true,
    provider: 'sqlite',
    token: 'A'.repeat(43),
    share: { id: '33333333-3333-4333-8333-333333333333' },
  },
  listResult: { ok: true, provider: 'sqlite', shares: [] },
  revokeResult: {
    ok: true,
    provider: 'sqlite',
    share: { id: '33333333-3333-4333-8333-333333333333' },
  },
  publicResult: { ok: false, status: 'not_found' },
}));

const routeMocks = vi.hoisted(() => ({
  getRequestIdentity: vi.fn(async () => routeState.identity),
  createItineraryShare: vi.fn(async () => routeState.createResult),
  listItineraryShares: vi.fn(async () => routeState.listResult),
  revokeItineraryShare: vi.fn(async () => routeState.revokeResult),
  getItineraryShare: vi.fn(async () => routeState.publicResult),
}));

vi.mock('server-only', () => ({}));
vi.mock('../app/lib/server/identity', () => ({
  getRequestIdentity: routeMocks.getRequestIdentity,
}));
vi.mock('../app/lib/server/share-dal', () => ({
  createItineraryShare: routeMocks.createItineraryShare,
  listItineraryShares: routeMocks.listItineraryShares,
  revokeItineraryShare: routeMocks.revokeItineraryShare,
  getItineraryShare: routeMocks.getItineraryShare,
}));

import {
  GET as listShares,
  POST as createShare,
} from '../app/api/itineraries/[id]/shares/route';
import { DELETE as revokeShare } from '../app/api/itineraries/[id]/shares/[shareId]/route';
import { GET as readPublicShare } from '../app/api/shares/[token]/route';

const TRIP_ID = '22222222-2222-4222-8222-222222222222';
const SHARE_ID = '33333333-3333-4333-8333-333333333333';
const tripContext = { params: Promise.resolve({ id: TRIP_ID }) };

describe('secure share route contracts', () => {
  beforeEach(() => {
    routeState.identity = { authenticated: true, userId: '11111111-1111-4111-8111-111111111111' };
    routeState.createResult = {
      ok: true,
      provider: 'sqlite',
      token: 'A'.repeat(43),
      share: { id: SHARE_ID },
    };
    routeState.listResult = { ok: true, provider: 'sqlite', shares: [] };
    routeState.revokeResult = { ok: true, provider: 'sqlite', share: { id: SHARE_ID } };
    routeState.publicResult = { ok: false, status: 'not_found' };
    vi.clearAllMocks();
  });

  it('rejects legacy client-provided itinerary and source identifiers', async () => {
    const response = await createShare(new Request(`http://localhost/api/itineraries/${TRIP_ID}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expiresInDays: 7,
        sourceKey: 'caller-controlled',
        itinerary: { internalNotes: 'caller-controlled' },
      }),
    }), tripContext);

    expect(response.status).toBe(422);
    expect(routeMocks.createItineraryShare).not.toHaveBeenCalled();
  });

  it('accepts only expiry and derives the durable trip id from the route', async () => {
    const response = await createShare(new Request(`http://localhost/api/itineraries/${TRIP_ID}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresInDays: 14 }),
    }), tripContext);

    expect(response.status).toBe(201);
    expect(routeMocks.createItineraryShare).toHaveBeenCalledWith({
      tripId: TRIP_ID,
      expiresInDays: 14,
      identity: routeState.identity,
    });
    await expect(response.json()).resolves.toMatchObject({
      token: 'A'.repeat(43),
      path: `/itinerary/share/${'A'.repeat(43)}`,
      persistence: 'sqlite',
    });
  });

  it('requires an authenticated identity to list owner links', async () => {
    routeState.identity = null;
    const response = await listShares(
      new Request(`http://localhost/api/itineraries/${TRIP_ID}/shares`),
      tripContext
    );
    expect(response.status).toBe(401);
    expect(routeMocks.listItineraryShares).not.toHaveBeenCalled();
  });

  it('revokes by non-secret link id under its durable trip', async () => {
    const response = await revokeShare(
      new Request(`http://localhost/api/itineraries/${TRIP_ID}/shares/${SHARE_ID}`, { method: 'DELETE' }),
      { params: Promise.resolve({ id: TRIP_ID, shareId: SHARE_ID }) }
    );

    expect(response.status).toBe(200);
    expect(routeMocks.revokeItineraryShare).toHaveBeenCalledWith({
      tripId: TRIP_ID,
      shareId: SHARE_ID,
      identity: routeState.identity,
    });
  });

  it('returns the same public response for unknown, expired, and revoked token states', async () => {
    const token = 'B'.repeat(43);
    for (const status of ['not_found', 'expired', 'revoked']) {
      routeState.publicResult = { ok: false, status };
      const response = await readPublicShare(
        new Request(`http://localhost/api/shares/${token}`),
        { params: Promise.resolve({ token }) }
      );
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toMatchObject({
        error: { code: 'SHARE_NOT_FOUND' },
      });
    }
    expect(routeMocks.getItineraryShare).toHaveBeenCalledTimes(3);
  });
});
