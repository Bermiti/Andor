// @vitest-environment node

import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

vi.mock('server-only', () => ({}));

process.env.ANDOR_SQLITE_PATH = resolve('.andor', `ledger-authorization-${randomUUID()}.sqlite`);
process.env.NEXT_PUBLIC_SUPABASE_URL = '';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = '';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';

const { createTripRecord } = await import('../app/lib/server/trip-repository');
const { getTripLedger, saveTripLedger } = await import('../app/lib/server/ledger-dal');
const { getLocalDatabase } = await import('../app/lib/server/local-db');

const owner = {
  authenticated: true,
  provider: 'local',
  userId: '11111111-1111-4111-8111-111111111111',
};
const collaborator = {
  authenticated: true,
  provider: 'local',
  userId: '22222222-2222-4222-8222-222222222222',
};
const outsider = {
  authenticated: true,
  provider: 'local',
  userId: '33333333-3333-4333-8333-333333333333',
};

const itinerary = {
  destination: { city: 'Porto', country: 'Portugal', countryCode: 'PT' },
  trip: { totalDays: 2, travelStyle: 'culture' },
  days: [{ dayNumber: 1, title: 'Ribeira', stops: [] }],
};

const ledger = {
  version: 1,
  currency: 'EUR',
  participants: [
    { id: 'traveler-1', name: 'Ana' },
    { id: 'traveler-2', name: 'Bruno' },
  ],
  expenses: [{
    id: 'expense-1',
    description: 'Jantar',
    amountCents: 4200,
    paidBy: 'traveler-1',
    splitBetween: ['traveler-1', 'traveler-2'],
    category: 'food',
    date: '2026-08-02',
    notes: '',
  }],
};

describe.sequential('ledger authorization and optimistic concurrency', () => {
  let tripId;

  it('materializes an empty authorized ledger at revision zero', async () => {
    const created = await createTripRecord(itinerary, { source: 'ledger-test' }, owner);
    expect(created.ok).toBe(true);
    tripId = created.trip.id;

    await expect(getTripLedger(tripId, owner, { correlationId: randomUUID() }))
      .resolves.toMatchObject({
        ok: true,
        provider: 'sqlite',
        version: 0,
        updatedAt: null,
        ledger: { version: 1, participants: [], expenses: [] },
      });
  });

  it('does not reveal another account ledger', async () => {
    await expect(getTripLedger(tripId, outsider)).resolves.toMatchObject({
      ok: false,
      status: 'not_found',
    });
  });

  it('requires edit permission for writes while viewers retain read access', async () => {
    const now = new Date().toISOString();
    getLocalDatabase().prepare(`
      INSERT INTO trip_members
        (trip_id, user_id, role, invited_by, created_at, updated_at, revoked_at)
      VALUES (?, ?, 'viewer', ?, ?, ?, NULL)
    `).run(tripId, collaborator.userId, owner.userId, now, now);

    const firstWrite = await saveTripLedger(tripId, ledger, 0, owner, {
      correlationId: randomUUID(),
    });
    expect(firstWrite).toMatchObject({ ok: true, provider: 'sqlite', version: 1 });

    await expect(getTripLedger(tripId, collaborator)).resolves.toMatchObject({
      ok: true,
      version: 1,
      ledger: { expenses: [{ id: 'expense-1' }] },
    });
    await expect(saveTripLedger(tripId, ledger, 1, collaborator)).resolves.toMatchObject({
      ok: false,
      status: 'forbidden',
    });
  });

  it('allows editors and rejects a stale conditional write with the current revision', async () => {
    getLocalDatabase().prepare(`
      UPDATE trip_members
      SET role = 'editor', updated_at = ?
      WHERE trip_id = ? AND user_id = ?
    `).run(new Date().toISOString(), tripId, collaborator.userId);

    const editedLedger = {
      ...ledger,
      expenses: [{ ...ledger.expenses[0], amountCents: 5000 }],
    };
    await expect(saveTripLedger(tripId, editedLedger, 1, collaborator)).resolves.toMatchObject({
      ok: true,
      version: 2,
      ledger: { expenses: [{ amountCents: 5000 }] },
    });
    await expect(saveTripLedger(tripId, ledger, 1, owner)).resolves.toMatchObject({
      ok: false,
      status: 'conflict',
      currentVersion: 2,
    });
  });

  it('stores canonical local ledgers without an owner-key authorization column', () => {
    const columns = getLocalDatabase()
      .prepare('PRAGMA table_info(canonical_trip_ledgers)')
      .all()
      .map((column) => column.name);
    expect(columns).toEqual([
      'trip_id',
      'ledger_json',
      'version',
      'created_at',
      'updated_at',
    ]);
  });
});
