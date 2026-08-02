import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { authCookieOptions } from '../auth-constants';
import { getSupabaseEnv } from './env';

export function normalizeSupabaseAuthCookieOptions(options = {}) {
  return authCookieOptions(options);
}

export async function createSupabaseServerClient() {
  const { url, publishableKey, hasPublicConfig } = getSupabaseEnv();
  if (!hasPublicConfig) return null;

  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, normalizeSupabaseAuthCookieOptions(options));
          });
        } catch (error) {
          // Server Components cannot always write cookies. The proxy refreshes them.
        }
      },
    },
  });
}
