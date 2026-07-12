import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseEnv } from './env';
import { GUEST_SESSION_COOKIE, sessionCookieOptions } from '../auth-constants';

export async function updateSession(request) {
  const { url, publishableKey, hasPublicConfig } = getSupabaseEnv();
  const existingGuestToken = request.cookies.get(GUEST_SESSION_COOKIE)?.value;
  const guestToken = existingGuestToken || crypto.randomUUID();
  if (!existingGuestToken) {
    request.cookies.set(GUEST_SESSION_COOKIE, guestToken);
  }

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
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    await supabase.auth.getClaims();
  }

  if (!existingGuestToken) {
    response.cookies.set(
      GUEST_SESSION_COOKIE,
      guestToken,
      sessionCookieOptions(request.nextUrl.protocol === 'https:')
    );
  }
  return response;
}
