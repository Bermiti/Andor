import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({
  cookies: new Map(),
  localSession: null,
  claimsResult: { data: { claims: null }, error: null },
}));

vi.mock('server-only', () => ({}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name) => {
      const value = authState.cookies.get(name);
      return value === undefined ? undefined : { name, value };
    },
  })),
}));

vi.mock('../app/lib/server/local-db', () => ({
  createLocalSession: vi.fn(),
  createLocalUser: vi.fn(),
  deleteLocalSession: vi.fn(),
  getLocalSession: vi.fn(() => authState.localSession),
  getLocalUserByEmail: vi.fn(),
}));

vi.mock('../app/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getClaims: vi.fn(async () => authState.claimsResult),
    },
  })),
}));

import {
  AuthBoundaryError,
  getOptionalAuthenticatedUser,
  requireAdmin,
  requireAuthenticatedUser,
} from '../app/lib/server/identity';
import { getLocalSession } from '../app/lib/server/local-db';
import {
  authCookieOptions,
  GUEST_SESSION_COOKIE,
  LOCAL_AUTH_COOKIE,
} from '../app/lib/auth-constants';
import { POST as loginRoute } from '../app/api/auth/login/route';

function configureSupabase(enabled) {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', enabled ? 'https://project.supabase.co' : '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', enabled ? 'sb_publishable_test' : '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
}

describe('server authentication boundary', () => {
  beforeEach(() => {
    authState.cookies.clear();
    authState.localSession = null;
    authState.claimsResult = { data: { claims: null }, error: null };
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('ANDOR_E2E_LOCAL_AUTH', '');
    configureSupabase(false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('never promotes the legacy guest cookie to an authenticated identity', async () => {
    authState.cookies.set(GUEST_SESSION_COOKIE, 'legacy-guest-token');

    await expect(getOptionalAuthenticatedUser()).resolves.toBeNull();
    await expect(requireAuthenticatedUser()).rejects.toMatchObject({
      code: 'AUTH_REQUIRED',
      status: 401,
    });
  });

  it('fails closed on an expired Supabase session without falling back to local auth', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    configureSupabase(true);
    authState.cookies.set(LOCAL_AUTH_COOKIE, 'local-token');
    authState.localSession = {
      user: { id: 'local-user', email: 'local@example.test', name: 'Local' },
    };
    authState.claimsResult = { data: { claims: null }, error: new Error('expired') };

    await expect(getOptionalAuthenticatedUser()).resolves.toBeNull();
    expect(getLocalSession).not.toHaveBeenCalled();
  });

  it('blocks SQLite identities in production unless the explicit E2E adapter is enabled', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    configureSupabase(false);
    authState.cookies.set(LOCAL_AUTH_COOKIE, 'local-token');
    authState.localSession = {
      user: { id: 'local-user', email: 'local@example.test', name: 'Local' },
    };

    await expect(getOptionalAuthenticatedUser()).resolves.toBeNull();
    expect(getLocalSession).not.toHaveBeenCalled();

    vi.stubEnv('ANDOR_E2E_LOCAL_AUTH', '1');
    await expect(getOptionalAuthenticatedUser()).resolves.toMatchObject({
      userId: 'local-user',
      provider: 'local',
      authenticated: true,
    });
  });

  it('derives userId only from verified claims and ignores caller-supplied identifiers', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    configureSupabase(true);
    authState.claimsResult = {
      data: {
        claims: {
          sub: 'verified-user',
          email: 'verified@example.test',
          user_metadata: { name: 'Verified' },
          app_metadata: { role: 'user' },
        },
      },
      error: null,
    };

    const identity = await getOptionalAuthenticatedUser({ userId: 'client-controlled-user' });
    expect(identity).toMatchObject({
      userId: 'verified-user',
      ownerKey: 'supabase:verified-user',
      provider: 'supabase',
    });
  });

  it('rejects client-supplied userId fields at the BFF boundary', async () => {
    const response = await loginRoute(new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'traveler@example.test',
        password: 'Andor-Segura-2026',
        userId: 'client-controlled-user',
      }),
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'INVALID_LOGIN' },
    });
  });

  it('requires a server-controlled Supabase admin claim', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    configureSupabase(true);
    authState.claimsResult = {
      data: { claims: { sub: 'regular-user', app_metadata: { role: 'user' } } },
      error: null,
    };
    await expect(requireAdmin()).rejects.toEqual(
      expect.objectContaining({ code: 'ADMIN_REQUIRED', status: 403 })
    );

    authState.claimsResult = {
      data: { claims: { sub: 'admin-user', app_metadata: { role: 'admin' } } },
      error: null,
    };
    await expect(requireAdmin()).resolves.toMatchObject({ userId: 'admin-user', appRole: 'admin' });
  });

  it('forces HttpOnly, SameSite=Lax and Secure on production auth cookies', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ANDOR_E2E_LOCAL_AUTH', '');
    expect(authCookieOptions({ secure: false })).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
    });
  });

  it('exposes typed authentication errors', () => {
    const error = new AuthBoundaryError('AUTH_REQUIRED', 'required', 401);
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ code: 'AUTH_REQUIRED', status: 401 });
  });
});
