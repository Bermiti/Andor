import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  LOCAL_AUTH_COOKIE,
  sessionCookieOptions,
} from '../../../lib/auth-constants';
import { resolveAuthBackend, toPublicAuthUser } from '../../../lib/server/identity';
import { loginLocalUser } from '../../../lib/server/local-auth';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get('next') || '/my-trips';

  const backend = resolveAuthBackend();

  // 1. Supabase OAuth Google redirect
  if (backend === 'supabase') {
    try {
      const supabase = await createSupabaseServerClient();
      const redirectTo = `${origin}/api/auth/callback?next=${encodeURIComponent(next)}`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error || !data?.url) {
        return NextResponse.redirect(`${origin}/?authError=${encodeURIComponent(error?.message || 'OAuth error')}`);
      }

      return NextResponse.redirect(data.url);
    } catch (err) {
      console.error('Google OAuth error:', err);
    }
  }

  // 2. Local / Development / Fallback mode Google sign in
  const googleMockUser = {
    email: 'google.user@andortravel.com',
    password: 'GoogleUserPassword123!',
    name: 'Viajante Google',
  };

  const loginRes = loginLocalUser(googleMockUser);
  const sessionToken = loginRes.ok ? loginRes.session.token : 'google-oauth-session-token';
  const userPayload = loginRes.ok ? loginRes.user : toPublicAuthUser({
    id: 'usr_google_default',
    email: googleMockUser.email,
    name: googleMockUser.name,
    user_metadata: { name: googleMockUser.name, avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
  });

  const cookieStore = await cookies();
  cookieStore.set(LOCAL_AUTH_COOKIE, sessionToken, sessionCookieOptions());

  return NextResponse.redirect(`${origin}${next}`);
}

export async function POST(request) {
  const backend = resolveAuthBackend();

  if (backend === 'supabase') {
    return NextResponse.json({
      redirect: true,
      url: '/api/auth/google',
    });
  }

  const googleMockUser = {
    email: 'google.user@andortravel.com',
    password: 'GoogleUserPassword123!',
    name: 'Viajante Google',
  };

  const loginRes = loginLocalUser(googleMockUser);
  const sessionToken = loginRes.ok ? loginRes.session.token : 'google-oauth-session-token';
  const userPayload = loginRes.ok ? loginRes.user : toPublicAuthUser({
    id: 'usr_google_default',
    email: googleMockUser.email,
    name: googleMockUser.name,
  });

  const cookieStore = await cookies();
  cookieStore.set(LOCAL_AUTH_COOKIE, sessionToken, sessionCookieOptions());

  return NextResponse.json({
    authenticated: true,
    provider: backend,
    user: userPayload,
  });
}
