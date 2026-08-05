import { z } from 'zod';
import { apiError, readJsonBody } from '../../../lib/api-utils';
import {
  LOCAL_AUTH_COOKIE,
  sessionCookieOptions,
} from '../../../lib/auth-constants';
import {
  resolveAuthBackend,
  toPublicAuthUser,
} from '../../../lib/server/identity';
import { loginLocalUser } from '../../../lib/server/local-auth';
import { checkRateLimit, getRateLimitHeaders } from '../../../lib/server/rate-limit';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(128),
}).strict();

function withRateLimitHeaders(response, headers) {
  Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
  response.headers.set('Cache-Control', 'no-store, private');
  return response;
}

export async function POST(req) {
  const rateLimit = await checkRateLimit('auth_login', null, req);
  const rateLimitHeaders = getRateLimitHeaders(rateLimit);
  if (!rateLimit.allowed) {
    return Response.json(
      {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Muitas tentativas. Tenta novamente mais tarde.',
          retryable: true,
        },
      },
      { status: 429, headers: { ...rateLimitHeaders, 'Cache-Control': 'no-store, private' } }
    );
  }

  const parsed = loginSchema.safeParse(await readJsonBody(req, 'auth_login'));
  if (!parsed.success) {
    return withRateLimitHeaders(
      apiError('INVALID_LOGIN', 'Introduz um email e palavra-passe validos.', 400, false),
      rateLimitHeaders
    );
  }

  const backend = resolveAuthBackend();
  if (backend === 'local') {
    const result = loginLocalUser(parsed.data);
    if (!result.ok) {
      const unavailable = result.code === 'LOCAL_AUTH_DISABLED';
      return withRateLimitHeaders(
        apiError(
          unavailable ? 'AUTH_NOT_CONFIGURED' : 'INVALID_CREDENTIALS',
          unavailable ? 'Autenticacao indisponivel.' : 'Email ou palavra-passe invalidos.',
          unavailable ? 503 : 401,
          unavailable
        ),
        rateLimitHeaders
      );
    }
    const cookieStore = await cookies();
    cookieStore.set(LOCAL_AUTH_COOKIE, result.session.token, sessionCookieOptions());
    return Response.json(
      { authenticated: true, provider: 'local', user: result.user },
      { headers: { ...rateLimitHeaders, 'Cache-Control': 'no-store, private' } }
    );
  }

  if (backend !== 'supabase') {
    return withRateLimitHeaders(
      apiError('AUTH_NOT_CONFIGURED', 'Autenticacao indisponivel.', 503, true),
      rateLimitHeaders
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data?.session || !data?.user) {
    return withRateLimitHeaders(
      apiError('INVALID_CREDENTIALS', 'Email ou palavra-passe invalidos.', 401, false),
      rateLimitHeaders
    );
  }

  return Response.json(
    {
      authenticated: true,
      provider: 'supabase',
      user: toPublicAuthUser(data.user),
    },
    { headers: { ...rateLimitHeaders, 'Cache-Control': 'no-store, private' } }
  );
}
