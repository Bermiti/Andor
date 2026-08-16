// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('../app/lib/server/backend-mode', () => ({
  getDataBackendMode: () => 'supabase',
}));
vi.mock('../app/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({ rpc: mocks.rpc })),
}));

const {
  checkpointGenerationRequest,
  completeGenerationRequest,
  failGenerationRequest,
  reserveGenerationRequest,
} = await import('../app/lib/server/generation-request-repository');

const identity = {
  authenticated: true,
  provider: 'supabase',
  userId: '11111111-1111-4111-8111-111111111111',
};
const requestId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const leaseToken = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const tripId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

describe('generation request repository Supabase RPC contract', () => {
  beforeEach(() => {
    mocks.rpc.mockReset();
  });

  it('reserves with the exact p_* arguments and maps all durable outcomes', async () => {
    mocks.rpc
      .mockResolvedValueOnce({
        data: [{
          outcome: 'reserved',
          request_id: requestId,
          lease_token: leaseToken,
          lease_expires_at: '2026-08-05T12:02:00.000Z',
          attempt_count: 1,
          checkpoint: null,
        }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ outcome: 'completed', request_id: requestId, trip_id: tripId, response: { tripId } }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ outcome: 'hash_mismatch', request_id: requestId }],
        error: null,
      });

    await expect(reserveGenerationRequest({
      key: 'supabase-generation-key',
      requestHash: 'A'.repeat(64),
    }, identity)).resolves.toMatchObject({
      ok: true,
      status: 'reserved',
      provider: 'supabase',
      requestId,
      leaseToken,
      attemptCount: 1,
    });
    expect(mocks.rpc).toHaveBeenNthCalledWith(1, 'reserve_generation_request', {
      p_idempotency_key: 'supabase-generation-key',
      p_request_hash: 'a'.repeat(64),
    });

    await expect(reserveGenerationRequest({
      key: 'supabase-generation-key',
      requestHash: 'a'.repeat(64),
    }, identity)).resolves.toMatchObject({
      ok: true,
      status: 'replay',
      replayed: true,
      tripId,
      response: { tripId },
    });
    await expect(reserveGenerationRequest({
      key: 'supabase-generation-key',
      requestHash: 'a'.repeat(64),
    }, identity)).resolves.toMatchObject({ ok: false, status: 'mismatch' });
  });

  it('rejects keys outside the shared 16–128 character contract before the RPC', async () => {
    await expect(reserveGenerationRequest({
      key: 'too-short',
      requestHash: 'a'.repeat(64),
    }, identity)).resolves.toMatchObject({
      ok: false,
      status: 'failed',
      failureCode: 'invalid_idempotency_key',
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('checkpoints with the exact lease and returns the renewed lease metadata', async () => {
    const checkpoint = { completedStages: [1], nextStage: 2 };
    mocks.rpc.mockResolvedValueOnce({
      data: [{
        outcome: 'checkpointed',
        checkpoint,
        lease_expires_at: '2026-08-05T12:04:00.000Z',
      }],
      error: null,
    });

    await expect(checkpointGenerationRequest({ requestId, leaseToken, checkpoint }, identity))
      .resolves.toMatchObject({
        ok: true,
        status: 'in_progress',
        provider: 'supabase',
        requestId,
        checkpoint,
        leaseExpiresAt: '2026-08-05T12:04:00.000Z',
      });
    expect(mocks.rpc).toHaveBeenCalledWith('checkpoint_generation_request', {
      p_request_id: requestId,
      p_lease_token: leaseToken,
      p_checkpoint: checkpoint,
    });
  });

  it('completes through one RPC and strips caller-controlled ownership fields', async () => {
    const responsePayload = { ok: true, id: tripId, itinerary: { id: tripId } };
    mocks.rpc.mockResolvedValueOnce({
      data: [{
        outcome: 'completed',
        trip_id: tripId,
        response: responsePayload,
      }],
      error: null,
    });

    await expect(completeGenerationRequest({
      requestId,
      leaseToken,
      tripRecord: {
        id: tripId,
        ownerId: 'attacker',
        userId: 'attacker',
        visibility: 'public',
        status: 'published',
        itinerary: {
          schemaVersion: 2,
          journey: { routeLabel: 'Paris → Lyon', stages: [] },
          destination: { city: 'Paris', countryCode: 'FR' },
          trip: { totalDays: 4, travelers: 2 },
          days: [
            { dayNumber: 1, stops: [] },
            { dayNumber: 2, stops: [] },
            { dayNumber: 3, stops: [] },
            { dayNumber: 4, stops: [] },
          ],
        },
        metadata: { source: 'generation-test' },
        responsePayload,
      },
    }, identity)).resolves.toMatchObject({
      ok: true,
      status: 'replay',
      replayed: false,
      tripId,
      response: responsePayload,
    });

    expect(mocks.rpc).toHaveBeenCalledWith('complete_generation_request', {
      p_request_id: requestId,
      p_lease_token: leaseToken,
      p_trip_record: expect.objectContaining({
        id: tripId,
        destination: 'Paris → Lyon',
        visibility: 'private',
        status: 'draft',
        currency: 'EUR',
        schemaVersion: 2,
        responsePayload,
      }),
    });
    const sentTrip = mocks.rpc.mock.calls[0][1].p_trip_record;
    expect(sentTrip).not.toHaveProperty('ownerId');
    expect(sentTrip).not.toHaveProperty('userId');
  });

  it('fails with the exact RPC arguments and preserves checkpoint diagnostics', async () => {
    const checkpoint = { completedStages: [1], nextStage: 2 };
    const response = { ok: true, id: tripId };
    mocks.rpc
      .mockResolvedValueOnce({
        data: [{ outcome: 'failed', retryable: true, checkpoint, trip_id: null, response: null }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ outcome: 'already_completed', retryable: false, checkpoint, trip_id: tripId, response }],
        error: null,
      });

    await expect(failGenerationRequest({
      requestId,
      leaseToken,
      failureCode: 'provider_timeout_stage_2',
      retryable: true,
    }, identity)).resolves.toMatchObject({
      ok: false,
      status: 'failed',
      provider: 'supabase',
      requestId,
      failureCode: 'provider_timeout_stage_2',
      retryable: true,
      checkpoint,
    });
    expect(mocks.rpc).toHaveBeenCalledWith('fail_generation_request', {
      p_request_id: requestId,
      p_lease_token: leaseToken,
      p_failure_code: 'provider_timeout_stage_2',
      p_retryable: true,
    });
    await expect(failGenerationRequest({
      requestId,
      leaseToken,
      failureCode: 'provider_timeout_stage_2',
      retryable: true,
    }, identity)).resolves.toMatchObject({
      ok: true,
      status: 'replay',
      replayed: true,
      requestId,
      tripId,
      response,
    });
  });

  it('normalizes lease loss and RPC result or transport errors without throwing', async () => {
    mocks.rpc
      .mockResolvedValueOnce({ data: [{ outcome: 'lease_lost' }], error: null })
      .mockResolvedValueOnce({ data: null, error: { code: 'XX000', message: 'database failed' } })
      .mockRejectedValueOnce(new Error('network unavailable'));

    await expect(checkpointGenerationRequest({
      requestId,
      leaseToken,
      checkpoint: { nextStage: 2 },
    }, identity)).resolves.toMatchObject({ ok: false, status: 'lease_lost' });
    await expect(reserveGenerationRequest({
      key: 'supabase-error-key',
      requestHash: 'd'.repeat(64),
    }, identity)).resolves.toMatchObject({
      ok: false,
      status: 'storage_error',
      provider: 'supabase',
    });
    await expect(reserveGenerationRequest({
      key: 'supabase-throw-key',
      requestHash: 'e'.repeat(64),
    }, identity)).resolves.toMatchObject({
      ok: false,
      status: 'storage_error',
      provider: 'supabase',
    });
  });
});
