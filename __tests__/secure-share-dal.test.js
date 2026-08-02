import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  mode: 'sqlite',
  identity: { authenticated: true, userId: '11111111-1111-4111-8111-111111111111' },
  permissionResult: { ok: true, provider: 'sqlite', trip: { permission: 'owner' } },
  share: null,
  trip: null,
  shares: [],
}));

const mocks = vi.hoisted(() => ({
  getRequestIdentity: vi.fn(async () => state.identity),
  requireTripAction: vi.fn(async () => state.permissionResult),
  insertLocalTripShareLink: vi.fn(() => ({ ok: true })),
  getLocalTripShareLinkByHash: vi.fn(() => state.share),
  getLocalTripForUser: vi.fn(() => state.trip),
  listLocalTripShareLinks: vi.fn(() => ({ ok: true, shares: state.shares })),
  revokeLocalTripShareLink: vi.fn(() => ({ ok: true, revokedAt: '2026-08-03T00:00:00.000Z' })),
  touchLocalTripShareLink: vi.fn(),
  createSupabaseServerClient: vi.fn(async () => null),
  createSupabaseAdminClient: vi.fn(() => null),
}));

vi.mock('server-only', () => ({}));
vi.mock('../app/lib/server/backend-mode', () => ({
  getDataBackendMode: vi.fn(() => state.mode),
}));
vi.mock('../app/lib/server/identity', () => ({
  getRequestIdentity: mocks.getRequestIdentity,
}));
vi.mock('../app/lib/server/trip-repository', () => ({
  requireTripAction: mocks.requireTripAction,
}));
vi.mock('../app/lib/server/local-trip-store', () => ({
  getLocalTripForUser: mocks.getLocalTripForUser,
  getLocalTripShareLinkByHash: mocks.getLocalTripShareLinkByHash,
  insertLocalTripShareLink: mocks.insertLocalTripShareLink,
  listLocalTripShareLinks: mocks.listLocalTripShareLinks,
  revokeLocalTripShareLink: mocks.revokeLocalTripShareLink,
  touchLocalTripShareLink: mocks.touchLocalTripShareLink,
}));
vi.mock('../app/lib/supabase/server', () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));
vi.mock('../app/lib/supabase/admin', () => ({
  createSupabaseAdminClient: mocks.createSupabaseAdminClient,
}));
vi.mock('../app/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import {
  createItineraryShare,
  getItineraryShare,
  listItineraryShares,
  revokeItineraryShare,
} from '../app/lib/server/share-dal';
import { hashOpaqueToken } from '../app/lib/server/security';

const TRIP_ID = '22222222-2222-4222-8222-222222222222';
const SHARE_ID = '33333333-3333-4333-8333-333333333333';

describe('secure share data access boundary', () => {
  beforeEach(() => {
    state.mode = 'sqlite';
    state.identity = { authenticated: true, userId: '11111111-1111-4111-8111-111111111111' };
    state.permissionResult = { ok: true, provider: 'sqlite', trip: { permission: 'owner' } };
    state.share = null;
    state.trip = null;
    state.shares = [];
    vi.clearAllMocks();
  });

  it('creates an owner-authorized link from a durable trip id and persists only its hash', async () => {
    const result = await createItineraryShare({
      tripId: TRIP_ID,
      expiresInDays: 7,
      identity: state.identity,
    });

    expect(result).toMatchObject({ ok: true, provider: 'sqlite' });
    expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(mocks.requireTripAction).toHaveBeenCalledWith(TRIP_ID, state.identity, 'manage_shares');
    expect(mocks.insertLocalTripShareLink).toHaveBeenCalledTimes(1);

    const stored = mocks.insertLocalTripShareLink.mock.calls[0][0];
    expect(stored).toMatchObject({
      tripId: TRIP_ID,
      permission: 'viewer',
      audience: 'client',
      createdBy: state.identity.userId,
      tokenHash: hashOpaqueToken(result.token),
    });
    expect(stored.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(stored.tokenHash).not.toBe(result.token);
    expect(stored).not.toHaveProperty('payload');
    expect(stored).not.toHaveProperty('itinerary');
  });

  it('does not accept the legacy caller-controlled sourceKey or itinerary contract', async () => {
    const result = await createItineraryShare({
      sourceKey: TRIP_ID,
      itinerary: { internalNotes: 'caller-controlled' },
      expiresInDays: 7,
      identity: state.identity,
    });

    expect(result).toEqual({ ok: false, status: 'not_found' });
    expect(mocks.requireTripAction).not.toHaveBeenCalled();
    expect(mocks.insertLocalTripShareLink).not.toHaveBeenCalled();
  });

  it('rejects invalid expiry and a non-owner permission result without writing', async () => {
    await expect(createItineraryShare({
      tripId: TRIP_ID,
      expiresInDays: 0,
      identity: state.identity,
    })).resolves.toEqual({ ok: false, status: 'invalid' });

    state.permissionResult = { ok: false, status: 'forbidden' };
    await expect(createItineraryShare({
      tripId: TRIP_ID,
      expiresInDays: 7,
      identity: state.identity,
    })).resolves.toEqual({ ok: false, status: 'forbidden' });
    expect(mocks.insertLocalTripShareLink).not.toHaveBeenCalled();
  });

  it('never falls back to SQLite when Supabase is the selected backend', async () => {
    state.mode = 'supabase';

    await expect(createItineraryShare({
      tripId: TRIP_ID,
      expiresInDays: 7,
      identity: state.identity,
    })).resolves.toEqual({ ok: false, status: 'persistence_unavailable' });
    expect(mocks.insertLocalTripShareLink).not.toHaveBeenCalled();

    await expect(getItineraryShare('C'.repeat(43))).resolves.toEqual({
      ok: false,
      status: 'persistence_unavailable',
    });
    expect(mocks.getLocalTripShareLinkByHash).not.toHaveBeenCalled();
  });

  it('resolves an active token to an allowlisted, read-only snapshot', async () => {
    const token = 'A'.repeat(43);
    state.share = {
      id: SHARE_ID,
      tripId: TRIP_ID,
      tokenHash: hashOpaqueToken(token),
      permission: 'viewer',
      audience: 'client',
      createdBy: state.identity.userId,
      createdAt: '2026-08-01T00:00:00.000Z',
      expiresAt: '2099-08-01T00:00:00.000Z',
    };
    state.trip = {
      itinerary: {
        destination: { city: 'Edinburgh', secret: 'PRIVATE-DESTINATION' },
        trip: { totalDays: 2, internalNotes: 'PRIVATE-TRIP' },
        days: [{
          dayNumber: 1,
          title: 'Royal Mile',
          internalNotes: 'PRIVATE-DAY',
          stops: [{ name: 'Castle', bookingReference: 'PRIVATE-BOOKING' }],
        }],
        exportMetadata: { clientName: 'PRIVATE-CLIENT', clientFacingNotes: 'Bring a coat.' },
      },
    };

    const result = await getItineraryShare(token);

    expect(result).toMatchObject({
      ok: true,
      share: { id: SHARE_ID, permission: 'viewer', audience: 'client' },
      payload: {
        destination: { city: 'Edinburgh' },
        trip: { totalDays: 2 },
        exportMetadata: { clientFacingNotes: 'Bring a coat.' },
      },
    });
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE-|tokenHash|createdBy/);
    expect(mocks.getLocalTripForUser).toHaveBeenCalledWith(TRIP_ID, state.identity.userId);
    expect(mocks.touchLocalTripShareLink).toHaveBeenCalledWith(SHARE_ID);
  });

  it('collapses expired and revoked tokens to the same non-enumerating status', async () => {
    const token = 'B'.repeat(43);
    const activeShape = {
      id: SHARE_ID,
      tripId: TRIP_ID,
      permission: 'viewer',
      audience: 'client',
      createdBy: state.identity.userId,
      createdAt: '2026-08-01T00:00:00.000Z',
    };

    state.share = { ...activeShape, expiresAt: '2000-01-01T00:00:00.000Z' };
    await expect(getItineraryShare(token)).resolves.toEqual({ ok: false, status: 'not_found' });

    state.share = { ...activeShape, expiresAt: '2099-01-01T00:00:00.000Z', revokedAt: '2026-08-02T00:00:00.000Z' };
    await expect(getItineraryShare(token)).resolves.toEqual({ ok: false, status: 'not_found' });
    expect(mocks.getLocalTripForUser).not.toHaveBeenCalled();
  });

  it('lists links without token material and revokes by trip and share ids', async () => {
    state.shares = [{
      id: SHARE_ID,
      tripId: TRIP_ID,
      tokenHash: 'f'.repeat(64),
      permission: 'viewer',
      audience: 'client',
      createdBy: state.identity.userId,
      createdAt: '2026-08-01T00:00:00.000Z',
      expiresAt: '2099-08-01T00:00:00.000Z',
    }];

    const listed = await listItineraryShares(TRIP_ID, state.identity);
    expect(listed).toMatchObject({ ok: true, shares: [{ id: SHARE_ID }] });
    expect(JSON.stringify(listed)).not.toMatch(/tokenHash|createdBy|f{64}/);

    const revoked = await revokeItineraryShare({
      tripId: TRIP_ID,
      shareId: SHARE_ID,
      identity: state.identity,
    });
    expect(revoked).toMatchObject({ ok: true, share: { id: SHARE_ID } });
    expect(mocks.revokeLocalTripShareLink).toHaveBeenCalledWith({
      tripId: TRIP_ID,
      shareId: SHARE_ID,
      actorUserId: state.identity.userId,
    });
  });
});
