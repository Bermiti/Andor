// @vitest-environment node

import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

vi.mock('server-only', () => ({}));

process.env.ANDOR_SQLITE_PATH = resolve('.andor', `generation-requests-${randomUUID()}.sqlite`);
process.env.NEXT_PUBLIC_SUPABASE_URL = '';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = '';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
process.env.GENERATION_REQUEST_LEASE_SECONDS = '10';
process.env.GENERATION_REQUEST_RETENTION_HOURS = '24';

const {
  canonicalRequestHash,
  checkpointGenerationRequest,
  completeGenerationRequest,
  failGenerationRequest,
  reserveGenerationRequest,
} = await import('../app/lib/server/generation-request-repository');
const { getLocalDatabase } = await import('../app/lib/server/local-db');

const owner = {
  authenticated: true,
  provider: 'local',
  userId: '11111111-1111-4111-8111-111111111111',
};
const outsider = {
  authenticated: true,
  provider: 'local',
  userId: '22222222-2222-4222-8222-222222222222',
};

function generationInput(key, payload = { destinations: ['Lisboa'], days: 3 }) {
  return { key, requestHash: canonicalRequestHash(payload) };
}

function tripRecord(overrides = {}) {
  const id = overrides.id || randomUUID();
  return {
    id,
    itinerary: {
      schemaVersion: 2,
      journey: {
        routeLabel: 'Lisboa → Porto',
        stages: [
          { destination: { city: 'Lisboa', countryCode: 'PT' }, dayStart: 1, dayEnd: 2 },
          { destination: { city: 'Porto', countryCode: 'PT' }, dayStart: 3, dayEnd: 3 },
        ],
        transfers: [{ fromStage: 1, toStage: 2, mode: 'train' }],
      },
      destination: { city: 'Lisboa', countryCode: 'PT' },
      trip: { totalDays: 3, travelers: 2, travelStyle: 'culture' },
      days: [
        { dayNumber: 1, title: 'Lisboa', stops: [] },
        { dayNumber: 2, title: 'Lisboa', stops: [] },
        { dayNumber: 3, title: 'Porto', stops: [] },
      ],
    },
    metadata: { source: 'generation-test' },
    responsePayload: { ok: true, id, itinerary: { id, schemaVersion: 2 } },
    ...overrides,
  };
}

describe.sequential('durable generation request repository with SQLite', () => {
  it('hashes canonical JSON independently of object key order', () => {
    expect(canonicalRequestHash({ b: 2, a: { d: 4, c: 3 } }))
      .toBe(canonicalRequestHash({ a: { c: 3, d: 4 }, b: 2 }));
    expect(canonicalRequestHash({ destinations: ['Lisboa', 'Porto'] }))
      .not.toBe(canonicalRequestHash({ destinations: ['Porto', 'Lisboa'] }));
    expect(() => canonicalRequestHash({ invalid: Number.POSITIVE_INFINITY })).toThrow(/finite numbers/);
  });

  it('reserves once, reports concurrent work, and rejects key reuse for another payload', async () => {
    const input = generationInput('generation-key-reserve');
    const first = await reserveGenerationRequest(input, owner);
    expect(first).toMatchObject({
      ok: true,
      status: 'reserved',
      provider: 'sqlite',
      attemptCount: 1,
      resumed: false,
    });
    expect(first.requestId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(first.leaseToken).toMatch(/^[0-9a-f-]{36}$/i);
    expect(new Date(first.expiresAt).getTime() - Date.now()).toBeGreaterThan(23.9 * 60 * 60 * 1000);
    expect(new Date(first.expiresAt).getTime() - Date.now()).toBeLessThanOrEqual(24 * 60 * 60 * 1000);

    await expect(reserveGenerationRequest(input, owner)).resolves.toMatchObject({
      ok: true,
      status: 'in_progress',
      requestId: first.requestId,
      attemptCount: 1,
    });
    await expect(reserveGenerationRequest(
      generationInput('generation-key-reserve', { destinations: ['Madrid'], days: 3 }),
      owner,
    )).resolves.toMatchObject({
      ok: false,
      status: 'mismatch',
      requestId: first.requestId,
    });
  });

  it('checkpoints only with the active user lease and resumes after a lease timeout', async () => {
    const input = generationInput('generation-key-timeout');
    const reserved = await reserveGenerationRequest(input, owner);
    const checkpoint = { completedStages: [1], nextStage: 2, partialDays: [{ dayNumber: 1 }] };

    await expect(checkpointGenerationRequest({
      requestId: reserved.requestId,
      leaseToken: reserved.leaseToken,
      checkpoint,
    }, owner)).resolves.toMatchObject({
      ok: true,
      status: 'in_progress',
      checkpoint,
    });

    await expect(checkpointGenerationRequest({
      requestId: reserved.requestId,
      leaseToken: reserved.leaseToken,
      checkpoint: { hijacked: true },
    }, outsider)).resolves.toMatchObject({ ok: false, status: 'lease_lost' });

    getLocalDatabase().prepare(`
      UPDATE generation_requests SET lease_expires_at = ? WHERE id = ?
    `).run(new Date(Date.now() - 1000).toISOString(), reserved.requestId);

    const resumed = await reserveGenerationRequest(input, owner);
    expect(resumed).toMatchObject({
      ok: true,
      status: 'reserved',
      requestId: reserved.requestId,
      attemptCount: 2,
      checkpoint,
      resumed: true,
    });
    expect(resumed.leaseToken).not.toBe(reserved.leaseToken);
    await expect(checkpointGenerationRequest({
      requestId: reserved.requestId,
      leaseToken: reserved.leaseToken,
      checkpoint,
    }, owner)).resolves.toMatchObject({ ok: false, status: 'lease_lost' });
  });

  it('atomically creates one trip and replays the stored receipt', async () => {
    const input = generationInput('generation-key-complete');
    const reserved = await reserveGenerationRequest(input, owner);
    const record = tripRecord();
    const completed = await completeGenerationRequest({
      requestId: reserved.requestId,
      leaseToken: reserved.leaseToken,
      tripRecord: record,
    }, owner);

    expect(completed).toMatchObject({
      ok: true,
      status: 'replay',
      replayed: false,
      tripId: record.id,
      response: record.responsePayload,
    });
    const database = getLocalDatabase();
    expect(database.prepare('SELECT count(*) AS count FROM itineraries WHERE id = ?').get(record.id).count).toBe(1);

    expect(database.prepare(`
      SELECT count(*) AS count FROM trip_members
      WHERE trip_id = ? AND user_id = ? AND role = 'owner'
    `).get(record.id, owner.userId).count).toBe(1);
    expect(database.prepare('SELECT destination, schema_version FROM itineraries WHERE id = ?').get(record.id))
      .toMatchObject({ destination: 'Lisboa → Porto', schema_version: 2 });

    await expect(reserveGenerationRequest(input, owner)).resolves.toMatchObject({
      ok: true,
      status: 'replay',
      replayed: true,
      tripId: record.id,
      response: record.responsePayload,
    });
    await expect(completeGenerationRequest({
      requestId: reserved.requestId,
      leaseToken: reserved.leaseToken,
      tripRecord: record,
    }, owner)).resolves.toMatchObject({
      ok: true,
      status: 'replay',
      replayed: true,
      tripId: record.id,
    });
    expect(database.prepare('SELECT count(*) AS count FROM itineraries WHERE id = ?').get(record.id).count).toBe(1);

    database.prepare(`
      UPDATE generation_requests SET created_at = ?, expires_at = ? WHERE id = ?
    `).run(
      new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)).toISOString(),
      new Date(Date.now() - 1000).toISOString(),
      reserved.requestId,
    );
    await expect(reserveGenerationRequest(
      generationInput('generation-key-complete', { destinations: ['Madrid'], days: 2 }),
      owner,
    )).resolves.toMatchObject({
      ok: true,
      status: 'reserved',
      requestId: reserved.requestId,
      attemptCount: 1,
      checkpoint: {},
      resumed: false,
    });
    expect(database.prepare(`
      SELECT trip_id, response_json FROM generation_requests WHERE id = ?
    `).get(reserved.requestId)).toEqual({ trip_id: null, response_json: null });
    expect(database.prepare('SELECT count(*) AS count FROM itineraries WHERE id = ?').get(record.id).count).toBe(1);
  });

  it('records a stage-two failure without leaving a partial trip', async () => {
    const input = generationInput('generation-key-stage-two');
    const reserved = await reserveGenerationRequest(input, owner);
    const checkpoint = { completedStages: [1], nextStage: 2 };
    await checkpointGenerationRequest({
      requestId: reserved.requestId,
      leaseToken: reserved.leaseToken,
      checkpoint,
    }, owner);

    await expect(failGenerationRequest({
      requestId: reserved.requestId,
      leaseToken: reserved.leaseToken,
      failureCode: 'provider_timeout_stage_2',
      retryable: true,
    }, owner)).resolves.toMatchObject({
      ok: false,
      status: 'failed',
      failureCode: 'provider_timeout_stage_2',
      retryable: true,
      checkpoint,
    });

    const row = getLocalDatabase().prepare(`
      SELECT status, trip_id, checkpoint_json FROM generation_requests WHERE id = ?
    `).get(reserved.requestId);
    expect(row).toMatchObject({ status: 'failed', trip_id: null });
    expect(JSON.parse(row.checkpoint_json)).toEqual(checkpoint);
    const retry = await reserveGenerationRequest(input, owner);
    expect(retry).toMatchObject({
      ok: true,
      status: 'reserved',
      requestId: reserved.requestId,
      attemptCount: 2,
      checkpoint,
      resumed: true,
    });
    expect(retry.leaseToken).not.toBe(reserved.leaseToken);
    expect(getLocalDatabase().prepare(`
      SELECT status, trip_id, failure_code FROM generation_requests WHERE id = ?
    `).get(reserved.requestId)).toEqual({ status: 'pending', trip_id: null, failure_code: null });

    await failGenerationRequest({
      requestId: reserved.requestId,
      leaseToken: retry.leaseToken,
      failureCode: 'generation_invalid',
      retryable: false,
    }, owner);
    await expect(reserveGenerationRequest(input, owner)).resolves.toMatchObject({
      ok: false,
      status: 'failed',
      failureCode: 'generation_invalid',
      retryable: false,
      checkpoint,
    });
  });

  it('serializes logical concurrent reservations and completions without duplicates', async () => {
    const input = generationInput('generation-key-concurrency');
    const reservations = await Promise.all(
      Array.from({ length: 8 }, () => reserveGenerationRequest(input, owner)),
    );
    expect(reservations.filter((result) => result.status === 'reserved')).toHaveLength(1);
    expect(reservations.filter((result) => result.status === 'in_progress')).toHaveLength(7);
    expect(new Set(reservations.map((result) => result.requestId))).toEqual(new Set([reservations[0].requestId]));

    const leaseOwner = reservations.find((result) => result.status === 'reserved');
    const record = tripRecord();
    const completions = await Promise.all([
      completeGenerationRequest({
        requestId: leaseOwner.requestId,
        leaseToken: leaseOwner.leaseToken,
        tripRecord: record,
      }, owner),
      completeGenerationRequest({
        requestId: leaseOwner.requestId,
        leaseToken: leaseOwner.leaseToken,
        tripRecord: record,
      }, owner),
    ]);
    expect(completions.filter((result) => result.replayed === false)).toHaveLength(1);
    expect(completions.filter((result) => result.replayed === true)).toHaveLength(1);
    expect(getLocalDatabase().prepare('SELECT count(*) AS count FROM itineraries WHERE id = ?').get(record.id).count).toBe(1);
  });
});
