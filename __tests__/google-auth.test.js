import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({
  backend: 'local',
}));

const supabaseMocks = vi.hoisted(() => ({
  signInWithOAuth: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  upsertProfile: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('server-only', () => ({}));

vi.mock('../app/lib/server/identity', () => ({
  resolveAuthBackend: vi.fn(() => authState.backend),
}));

vi.mock('../app/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      signInWithOAuth: supabaseMocks.signInWithOAuth,
      exchangeCodeForSession: supabaseMocks.exchangeCodeForSession,
      signOut: supabaseMocks.signOut,
    },
    from: vi.fn(() => ({ upsert: supabaseMocks.upsertProfile })),
  })),
}));

vi.mock('../app/lib/logger', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    logger: {
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    },
  };
});

import { safeAuthRedirectPath } from '../app/lib/auth-redirect';
import {
  GET as startGoogleLogin,
  POST as requestGoogleLogin,
} from '../app/api/auth/google/route';
import { GET as finishGoogleLogin } from '../app/api/auth/callback/route';

describe('Google OAuth boundary', () => {
  beforeEach(() => {
    authState.backend = 'local';
    vi.clearAllMocks();
    supabaseMocks.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.test/oauth' },
      error: null,
    });
    supabaseMocks.exchangeCodeForSession.mockResolvedValue({
      data: {
        session: { access_token: 'server-only-test-token' },
        user: {
          id: 'user-google-1',
          email: 'traveler@example.test',
          user_metadata: { full_name: 'Maria Viajante' },
        },
      },
      error: null,
    });
    supabaseMocks.upsertProfile.mockResolvedValue({ error: null });
    supabaseMocks.signOut.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('never creates a fake Google identity when Supabase is unavailable', async () => {
    const response = await requestGoogleLogin();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'GOOGLE_AUTH_UNAVAILABLE', retryable: false },
    });
    expect(supabaseMocks.signInWithOAuth).not.toHaveBeenCalled();
  });

  it('preserves a safe invitation return path when requesting OAuth', async () => {
    authState.backend = 'supabase';
    const response = await requestGoogleLogin(new Request('http://localhost/api/auth/google?next=%2Finvitations%2Fvalid-token', {
      method: 'POST',
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      redirect: true,
      url: '/api/auth/google?next=%2Finvitations%2Fvalid-token',
    });
  });

  it('starts OAuth with the real callback and a validated internal return path', async () => {
    authState.backend = 'supabase';
    const response = await startGoogleLogin(new Request(
      'http://localhost/api/auth/google?next=%2Fitinerary%2Ftrip-123%3Fview%3Dmap'
    ));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://accounts.google.test/oauth');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(supabaseMocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: expect.objectContaining({
        redirectTo: 'http://localhost/api/auth/callback?next=%2Fitinerary%2Ftrip-123%3Fview%3Dmap',
      }),
    });
  });

  it('rejects external and encoded redirect attempts', () => {
    expect(safeAuthRedirectPath('https://evil.example/path')).toBe('/my-trips');
    expect(safeAuthRedirectPath('//evil.example/path')).toBe('/my-trips');
    expect(safeAuthRedirectPath('/%255cevil.example/path')).toBe('/my-trips');
    expect(safeAuthRedirectPath('/plan?source=oauth')).toBe('/plan?source=oauth');
  });

  it('uses the canonical production origin for the callback URL', async () => {
    authState.backend = 'supabase';
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://andor.example/app-path');

    await startGoogleLogin(new Request('http://internal-host/api/auth/google'));

    expect(supabaseMocks.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          redirectTo: 'https://andor.example/api/auth/callback?next=%2Fmy-trips',
        }),
      })
    );
  });

  it('maps provider cancellation to a user-safe error without exchanging a code', async () => {
    authState.backend = 'supabase';
    const response = await finishGoogleLogin(new Request(
      'http://localhost/api/auth/callback?error=access_denied&error_description=private-provider-text'
    ));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/?authError=google_cancelled');
    expect(supabaseMocks.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('exchanges the OAuth code, creates the profile and redirects internally', async () => {
    authState.backend = 'supabase';
    const response = await finishGoogleLogin(new Request(
      'http://localhost/api/auth/callback?code=oauth-code&next=%2Fplan%3Fsource%3Dgoogle'
    ));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/plan?source=google');
    expect(supabaseMocks.exchangeCodeForSession).toHaveBeenCalledWith('oauth-code');
    expect(supabaseMocks.upsertProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-google-1',
        email: 'traveler@example.test',
        name: 'Maria Viajante',
      }),
      { onConflict: 'id' }
    );
  });

  it('fails closed and clears the session if the required profile cannot be stored', async () => {
    authState.backend = 'supabase';
    supabaseMocks.upsertProfile.mockResolvedValue({ error: new Error('profile write failed') });

    const response = await finishGoogleLogin(new Request(
      'http://localhost/api/auth/callback?code=oauth-code'
    ));

    expect(response.headers.get('location')).toBe('http://localhost/?authError=google_profile_failed');
    expect(supabaseMocks.signOut).toHaveBeenCalledTimes(1);
  });
});
