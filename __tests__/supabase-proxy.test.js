import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const supabaseState = vi.hoisted(() => ({
  cookieAdapter: null,
}));

vi.mock('server-only', () => ({}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((url, key, options) => {
    supabaseState.cookieAdapter = options.cookies;
    return {
      auth: {
        getClaims: vi.fn(async () => {
          options.cookies.setAll(
            [{ name: 'sb-test-auth-token', value: 'refreshed', options: { maxAge: 60 } }],
            {
              'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
              Expires: 'Thu, 01 Jan 1970 00:00:00 GMT',
              Pragma: 'no-cache',
            }
          );
          return { data: { claims: null }, error: null };
        }),
      },
    };
  }),
}));

import { updateSession } from '../app/lib/supabase/proxy';

describe('Supabase session proxy', () => {
  beforeEach(() => {
    supabaseState.cookieAdapter = null;
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('preserves the private no-store headers emitted with refreshed auth cookies', async () => {
    const response = await updateSession(new NextRequest('https://andor.example/my-trips'));

    expect(supabaseState.cookieAdapter).toBeTruthy();
    expect(response.headers.get('cache-control')).toBe(
      'private, no-cache, no-store, must-revalidate, max-age=0'
    );
    expect(response.headers.get('pragma')).toBe('no-cache');
    expect(response.headers.get('expires')).toBe('Thu, 01 Jan 1970 00:00:00 GMT');
    expect(response.cookies.get('sb-test-auth-token')?.value).toBe('refreshed');
  });
});
