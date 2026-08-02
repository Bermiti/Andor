// @vitest-environment node

import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

vi.mock('server-only', () => ({}));

const sqlitePath = resolve('.andor', `sprint1-authorization-${randomUUID()}.sqlite`);
process.env.ANDOR_SQLITE_PATH = sqlitePath;
process.env.NEXT_PUBLIC_SUPABASE_URL = '';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = '';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
process.env.ANDOR_EMAIL_HASH_SECRET = 'integration-test-email-secret';

const {
  createTripRecord,
  deleteTripRecord,
  getTripRecord,
  importLegacyTrip,
  requireTripAction,
  updateTripRecord,
} = await import('../app/lib/server/trip-repository');
const {
  acceptTripInvitation,
  createTripInvitation,
  listTripAccess,
  revokeTripInvitation,
  revokeTripMember,
  updateTripMember,
} = await import('../app/lib/server/membership-repository');
const { getLocalDatabase } = await import('../app/lib/server/local-db');

const owner = {
  authenticated: true,
  provider: 'local',
  userId: '11111111-1111-4111-8111-111111111111',
  user: { email: 'owner@example.test' },
};
const collaborator = {
  authenticated: true,
  provider: 'local',
  userId: '22222222-2222-4222-8222-222222222222',
  user: { email: 'collaborator@example.test' },
};
const outsider = {
  authenticated: true,
  provider: 'local',
  userId: '33333333-3333-4333-8333-333333333333',
  user: { email: 'outsider@example.test' },
};

const itinerary = {
  destination: { city: 'Edinburgh', country: 'Scotland', countryCode: 'GB' },
  trip: { totalDays: 2, travelStyle: 'culture' },
  days: [{ dayNumber: 1, title: 'Old Town', stops: [] }],
};

describe.sequential('durable trip authorization boundary', () => {
  let tripId;

  it('creates an owner membership and hides the trip from another account', async () => {
    const created = await createTripRecord(itinerary, { source: 'integration-test' }, owner);
    expect(created.ok).toBe(true);
    expect(created.trip.permission).toBe('owner');
    expect(created.trip.version).toBe(1);
    tripId = created.trip.id;

    await expect(getTripRecord(tripId, outsider)).resolves.toMatchObject({
      ok: false,
      status: 'not_found',
    });
  });

  it('accepts an email-bound viewer invitation and stores only its token hash', async () => {
    const invited = await createTripInvitation({
      tripId,
      email: collaborator.user.email,
      role: 'viewer',
    }, owner);
    expect(invited.ok).toBe(true);
    expect(invited.token).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const stored = getLocalDatabase()
      .prepare('SELECT token_hash FROM trip_invitations WHERE id = ?')
      .get(invited.invitation.id);
    expect(stored.token_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.token_hash).not.toBe(invited.token);

    await expect(acceptTripInvitation(invited.token, outsider)).resolves.toMatchObject({
      ok: false,
      status: 'forbidden',
    });
    await expect(acceptTripInvitation(invited.token, collaborator)).resolves.toMatchObject({
      ok: true,
      role: 'viewer',
      tripId,
    });
    await expect(getTripRecord(tripId, collaborator)).resolves.toMatchObject({
      ok: true,
      trip: { permission: 'viewer' },
    });
  });

  it('enforces the owner/editor/viewer capability matrix', async () => {
    await expect(updateTripRecord(tripId, { ...itinerary, title: 'viewer write' }, 1, collaborator))
      .resolves.toMatchObject({ ok: false, status: 'forbidden' });
    await expect(requireTripAction(tripId, collaborator, 'manage_shares'))
      .resolves.toMatchObject({ ok: false, status: 'forbidden' });
    await expect(listTripAccess(tripId, collaborator))
      .resolves.toMatchObject({ ok: false, status: 'forbidden' });

    await expect(updateTripMember({
      tripId,
      memberUserId: collaborator.userId,
      role: 'editor',
    }, owner)).resolves.toMatchObject({ ok: true, role: 'editor' });

    const edited = await updateTripRecord(
      tripId,
      { ...itinerary, title: 'editor write' },
      1,
      collaborator
    );
    expect(edited).toMatchObject({ ok: true, trip: { version: 2 } });
    await expect(createTripInvitation({
      tripId,
      email: outsider.user.email,
      role: 'viewer',
    }, collaborator)).resolves.toMatchObject({ ok: false, status: 'forbidden' });
    await expect(deleteTripRecord(tripId, collaborator))
      .resolves.toMatchObject({ ok: false, status: 'forbidden' });
  });

  it('returns a deterministic conflict for a stale optimistic write', async () => {
    await expect(updateTripRecord(tripId, { ...itinerary, title: 'stale owner write' }, 1, owner))
      .resolves.toMatchObject({
        ok: false,
        status: 'conflict',
        currentVersion: 2,
      });
  });

  it('keeps the owner immutable and removes a revoked collaborator immediately', async () => {
    await expect(updateTripMember({
      tripId,
      memberUserId: owner.userId,
      role: 'viewer',
    }, owner)).resolves.toMatchObject({ ok: false, status: 'owner_immutable' });
    await expect(revokeTripMember({ tripId, memberUserId: owner.userId }, owner))
      .resolves.toMatchObject({ ok: false, status: 'owner_immutable' });
    await expect(revokeTripMember({ tripId, memberUserId: collaborator.userId }, owner))
      .resolves.toMatchObject({ ok: true });
    await expect(getTripRecord(tripId, collaborator))
      .resolves.toMatchObject({ ok: false, status: 'not_found' });
  });

  it('supports revocation before acceptance', async () => {
    const invited = await createTripInvitation({
      tripId,
      email: outsider.user.email,
      role: 'viewer',
    }, owner);
    expect(invited.ok).toBe(true);
    await expect(revokeTripInvitation({
      tripId,
      invitationId: invited.invitation.id,
    }, owner)).resolves.toMatchObject({ ok: true });
    await expect(acceptTripInvitation(invited.token, outsider))
      .resolves.toMatchObject({ ok: false, status: 'revoked' });
  });

  it('imports legacy data idempotently and rejects key reuse with a changed payload', async () => {
    const idempotencyKey = 'legacy-trip-key-0001';
    const first = await importLegacyTrip({ itinerary, idempotencyKey }, owner);
    expect(first).toMatchObject({ ok: true, status: 'imported' });
    await expect(importLegacyTrip({ itinerary, idempotencyKey }, owner))
      .resolves.toMatchObject({ ok: true, status: 'replayed', tripId: first.tripId });
    await expect(importLegacyTrip({
      itinerary: { ...itinerary, title: 'different payload' },
      idempotencyKey,
    }, owner)).resolves.toMatchObject({ ok: false, status: 'conflict', tripId: first.tripId });
  });

  it('soft-deletes as owner and makes the resource inaccessible', async () => {
    await expect(deleteTripRecord(tripId, owner)).resolves.toMatchObject({ ok: true });
    await expect(getTripRecord(tripId, owner))
      .resolves.toMatchObject({ ok: false, status: 'not_found' });
  });
});
