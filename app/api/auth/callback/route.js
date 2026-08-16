import { NextResponse } from 'next/server';
import { resolveAuthOrigin, safeAuthRedirectPath } from '../../../lib/auth-redirect';
import { logger } from '../../../lib/logger';
import { resolveAuthBackend } from '../../../lib/server/identity';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export const runtime = 'nodejs';

function errorRedirect(origin, code) {
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

function displayName(user) {
  const metadata = user?.user_metadata || {};
  return metadata.full_name
    || metadata.name
    || user?.email?.split('@')[0]
    || 'Viajante';
}

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const appOrigin = resolveAuthOrigin(requestUrl);
  const nextPath = safeAuthRedirectPath(requestUrl.searchParams.get('next'));
  const providerError = requestUrl.searchParams.get('error');

  if (providerError) {
    const code = providerError === 'access_denied' ? 'google_cancelled' : 'google_callback_failed';
    return errorRedirect(appOrigin, code);
  }

  const code = requestUrl.searchParams.get('code');
  if (!code) {
    return errorRedirect(appOrigin, 'google_missing_code');
  }

  if (resolveAuthBackend() !== 'supabase') {
    return errorRedirect(appOrigin, 'google_not_configured');
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return errorRedirect(appOrigin, 'google_not_configured');
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    const user = data?.user || data?.session?.user;
    if (error || !data?.session || !user?.id || !user?.email) {
      logger.warn('auth_google:callback_exchange_failed', error || new Error('Incomplete OAuth session'));
      return errorRedirect(appOrigin, 'google_callback_failed');
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      name: displayName(user),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (profileError) {
      logger.warn('auth_google:profile_upsert_failed', profileError, { userId: user.id });
      await supabase.auth.signOut().catch(() => null);
      return errorRedirect(appOrigin, 'google_profile_failed');
    }

    return privateRedirect(new URL(nextPath, appOrigin));
  } catch (error) {
    logger.warn('auth_google:callback_failed', error);
    return errorRedirect(appOrigin, 'google_callback_failed');
  }
}
