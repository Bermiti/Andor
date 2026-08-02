import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseEnv } from './env';
import {
  authCookieOptions,
  expiredSessionCookieOptions,
  GUEST_SESSION_COOKIE,
  LOCAL_AUTH_COOKIE,
} from '../auth-constants';
import { isLocalAdapterEnabled } from '../server/backend-mode';

function expireLegacyIdentityCookies(request, response) {
  if (request.cookies.has(GUEST_SESSION_COOKIE)) {
    response.cookies.set(GUEST_SESSION_COOKIE, '', expiredSessionCookieOptions());
  }
  if (!isLocalAdapterEnabled() && request.cookies.has(LOCAL_AUTH_COOKIE)) {
    response.cookies.set(LOCAL_AUTH_COOKIE, '', expiredSessionCookieOptions());
  }
}

export async function updateSession(request) {
  const { url, publishableKey, hasPublicConfig } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  if (hasPublicConfig) {
    const supabase = createServerClient(url, publishableKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, authCookieOptions(options));
          });
        },
      },
    });

    await supabase.auth.getClaims();
  }

  expireLegacyIdentityCookies(request, response);
  return response;
}
