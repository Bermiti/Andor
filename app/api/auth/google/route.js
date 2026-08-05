import { NextResponse } from 'next/server';
import { apiError } from '../../../lib/api-utils';
import { resolveAuthOrigin, safeAuthRedirectPath } from '../../../lib/auth-redirect';
import { logger } from '../../../lib/logger';
import { resolveAuthBackend } from '../../../lib/server/identity';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export const runtime = 'nodejs';

function callbackUrl(origin, nextPath) {
  const url = new URL('/api/auth/callback', origin);
  url.searchParams.set('next', nextPath);
  return url.toString();
}

function loginErrorRedirect(origin, code) {
  const url = new URL('/', origin);
  url.searchParams.set('authError', code);
  return privateRedirect(url);
}

function privateRedirect(url) {
  const response = NextResponse.redirect(url);
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const appOrigin = resolveAuthOrigin(requestUrl);
  const nextPath = safeAuthRedirectPath(requestUrl.searchParams.get('next'));

  if (resolveAuthBackend() !== 'supabase') {
    return loginErrorRedirect(appOrigin, 'google_not_configured');
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return loginErrorRedirect(appOrigin, 'google_not_configured');
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl(appOrigin, nextPath),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error || !data?.url) {
      logger.warn('auth_google:start_failed', error || new Error('Missing OAuth redirect URL'));
      return loginErrorRedirect(appOrigin, 'google_start_failed');
    }

    return privateRedirect(data.url);
  } catch (error) {
    logger.warn('auth_google:start_failed', error);
    return loginErrorRedirect(appOrigin, 'google_start_failed');
  }
}

export async function POST(request) {
  if (resolveAuthBackend() !== 'supabase') {
    return apiError(
      'GOOGLE_AUTH_UNAVAILABLE',
      'O login Google ainda não está configurado neste ambiente. Usa email e palavra-passe.',
      503,
      false
    );
  }

  const nextPath = request
    ? safeAuthRedirectPath(new URL(request.url).searchParams.get('next'))
    : safeAuthRedirectPath(null);

  return NextResponse.json({
    redirect: true,
    url: `/api/auth/google?next=${encodeURIComponent(nextPath)}`,
  });
}
