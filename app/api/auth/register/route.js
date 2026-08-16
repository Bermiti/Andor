import { cookies } from 'next/headers';
import { z } from 'zod';
import { apiError, readJsonBody } from '../../../lib/api-utils';
import { LOCAL_AUTH_COOKIE, sessionCookieOptions } from '../../../lib/auth-constants';
import { resolveAuthBackend, toPublicAuthUser } from '../../../lib/server/identity';
import { registerLocalUser } from '../../../lib/server/local-auth';
import { checkRateLimit, getRateLimitHeaders } from '../../../lib/server/rate-limit';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export const runtime = 'nodejs';

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
}).strict();

function withRateLimitHeaders(response, headers) {
  Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
  response.headers.set('Cache-Control', 'no-store, private');
  return response;
}

export async function POST(req) {
  const rateLimit = await checkRateLimit('auth_register', null, req);
  const rateLimitHeaders = getRateLimitHeaders(rateLimit);
  if (!rateLimit.allowed) {
    return Response.json(
      {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Muitas tentativas de registo. Tenta novamente mais tarde.',
          retryable: true,
        },
      },
      { status: 429, headers: { ...rateLimitHeaders, 'Cache-Control': 'no-store, private' } }
    );
  }

  const parsed = registerSchema.safeParse(await readJsonBody(req, 'auth_register'));
  if (!parsed.success) {
    return withRateLimitHeaders(
      apiError('INVALID_REGISTRATION', 'Reve o nome, email e palavra-passe.', 400, false),
      rateLimitHeaders
    );
  }

  const backend = resolveAuthBackend();
  if (backend === 'local') {
    const result = registerLocalUser(parsed.data);
    if (!result.ok) {
      const unavailable = result.code === 'LOCAL_AUTH_DISABLED';
      return withRateLimitHeaders(
        apiError(
          unavailable ? 'AUTH_NOT_CONFIGURED' : result.code,
          unavailable ? 'Autenticacao indisponivel.' : result.message,
          unavailable ? 503 : 409,
          unavailable
        ),
        rateLimitHeaders
      );
    }
    const cookieStore = await cookies();
    cookieStore.set(LOCAL_AUTH_COOKIE, result.session.token, sessionCookieOptions());
    return Response.json(
      { authenticated: true, provider: 'local', user: result.user, pendingVerification: false },
      { status: 201, headers: { ...rateLimitHeaders, 'Cache-Control': 'no-store, private' } }
    );
  }

  if (backend !== 'supabase') {
    return withRateLimitHeaders(
      apiError('AUTH_NOT_CONFIGURED', 'Autenticacao indisponivel.', 503, true),
      rateLimitHeaders
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { name: parsed.data.name } },
  });
  if (error || !data?.user) {
    return withRateLimitHeaders(
      apiError(
        'REGISTRATION_FAILED',
        'Nao foi possivel concluir o registo. Confirma os dados ou verifica o teu email.',
        400,
        false
      ),
      rateLimitHeaders
    );
  }

  if (data.session) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email: data.user.email || parsed.data.email,
      name: parsed.data.name,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  }

  return Response.json(
    {
      authenticated: Boolean(data.session),
      provider: 'supabase',
      user: data.session ? toPublicAuthUser(data.user) : null,
      pendingVerification: !data.session,
    },
    { status: 201, headers: { ...rateLimitHeaders, 'Cache-Control': 'no-store, private' } }
  );
}
