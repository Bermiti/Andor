// @vitest-environment node

import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ mode: 'supabase' }));
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('../app/lib/server/backend-mode', () => ({
  getDataBackendMode: vi.fn(() => state.mode),
}));
vi.mock('../app/lib/supabase/admin', () => ({
  createSupabaseAdminClient: mocks.createSupabaseAdminClient,
}));
vi.mock('../app/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(async () => null),
}));
vi.mock('../app/lib/server/trip-repository', () => ({
  requireTripAction: vi.fn(),
}));
vi.mock('../app/lib/server/local-trip-store', () => ({
  acceptLocalInvitation: vi.fn(),
  createLocalInvitation: vi.fn(),
  listLocalInvitations: vi.fn(),
  listLocalTripMembers: vi.fn(),
  revokeLocalInvitation: vi.fn(),
  revokeLocalTripMember: vi.fn(),
  updateLocalTripMember: vi.fn(),
}));
vi.mock('../app/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { acceptTripInvitation } from '../app/lib/server/membership-repository';
import { hashOpaqueToken } from '../app/lib/server/security';

const token = 'A'.repeat(43);
const identity = {
  authenticated: true,
  userId: '11111111-1111-4111-8111-111111111111',
  user: { email: 'invitee@example.test' },
};

describe('Supabase invitation transaction boundary', () => {
  beforeEach(() => {
    process.env.ANDOR_EMAIL_HASH_SECRET = 'supabase-rpc-test-secret';
    state.mode = 'supabase';
    mocks.rpc.mockReset();
    mocks.createSupabaseAdminClient.mockReset();
    mocks.createSupabaseAdminClient.mockReturnValue({ rpc: mocks.rpc });
  });

  it('sends only hashes and identity to the atomic RPC', async () => {
    mocks.rpc.mockResolvedValue({
      data: [{
        status: 'accepted',
        trip_id: '22222222-2222-4222-8222-222222222222',
        role: 'viewer',
      }],
      error: null,
    });

    const result = await acceptTripInvitation(token, identity);

    expect(result).toMatchObject({
      ok: true,
      status: 'accepted',
      provider: 'supabase',
      tripId: '22222222-2222-4222-8222-222222222222',
      role: 'viewer',
    });
    expect(mocks.rpc).toHaveBeenCalledWith('accept_trip_invitation_transaction', {
      p_token_hash: hashOpaqueToken(token),
      p_user_id: identity.userId,
      p_email_hash: createHmac('sha256', process.env.ANDOR_EMAIL_HASH_SECRET)
        .update(identity.user.email)
        .digest('hex'),
    });
    expect(JSON.stringify(mocks.rpc.mock.calls[0])).not.toContain(token);
    expect(JSON.stringify(mocks.rpc.mock.calls[0])).not.toContain(identity.user.email);
  });

  it.each(['not_found', 'revoked', 'expired', 'forbidden'])(
    'preserves the safe %s terminal status',
    async (status) => {
      mocks.rpc.mockResolvedValue({ data: [{ status, trip_id: null, role: null }], error: null });
      await expect(acceptTripInvitation(token, identity)).resolves.toEqual({ ok: false, status });
    }
  );

  it('surfaces an accepted invitation whose membership is missing as an invalid state', async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ status: 'invalid_state', trip_id: null, role: null }],
      error: null,
    });
    await expect(acceptTripInvitation(token, identity)).resolves.toEqual({
      ok: false,
      status: 'invalid_state',
    });
  });

  it('maps an RPC failure to a retryable storage boundary', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: '40001' } });
    await expect(acceptTripInvitation(token, identity)).resolves.toEqual({
      ok: false,
      status: 'storage_error',
    });
  });
});
