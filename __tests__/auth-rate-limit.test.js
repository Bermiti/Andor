import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('../app/lib/server/local-db', () => ({
  createLocalSession: vi.fn(),
  createLocalUser: vi.fn(),
  deleteLocalSession: vi.fn(),
  getLocalSession: vi.fn(),
  getLocalUserByEmail: vi.fn(),
}));
vi.mock('../app/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { POST as loginRoute } from '../app/api/auth/login/route';
import { POST as registerRoute } from '../app/api/auth/register/route';
import { clearRateLimitStore } from '../app/lib/server/rate-limit';

function jsonRequest(path, body) {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '203.0.113.42',
    },
    body: JSON.stringify(body),
  });
}

describe('canonical auth route rate limits', () => {
  beforeEach(() => {
    clearRateLimitStore();
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('ANDOR_E2E_LOCAL_AUTH', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('limits repeated login attempts on /api/auth/login', async () => {
    vi.stubEnv('RATE_LIMIT_AUTH_LOGIN_MAX', '1');

    const first = await loginRoute(jsonRequest('/api/auth/login', { email: 'invalid' }));
    expect(first.status).toBe(400);
    expect(first.headers.get('x-ratelimit-remaining')).toBe('0');
    expect(first.headers.get('cache-control')).toBe('no-store, private');

    const blocked = await loginRoute(jsonRequest('/api/auth/login', { email: 'invalid' }));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBeTruthy();
    await expect(blocked.json()).resolves.toMatchObject({
      error: { code: 'RATE_LIMIT_EXCEEDED', retryable: true },
    });
  });

  it('limits repeated registration attempts on /api/auth/register', async () => {
    vi.stubEnv('RATE_LIMIT_AUTH_REGISTER_MAX', '1');

    const first = await registerRoute(jsonRequest('/api/auth/register', { name: '' }));
    expect(first.status).toBe(400);
    expect(first.headers.get('x-ratelimit-remaining')).toBe('0');
    expect(first.headers.get('cache-control')).toBe('no-store, private');

    const blocked = await registerRoute(jsonRequest('/api/auth/register', { name: '' }));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBeTruthy();
    await expect(blocked.json()).resolves.toMatchObject({
      error: { code: 'RATE_LIMIT_EXCEEDED', retryable: true },
    });
  });
});
