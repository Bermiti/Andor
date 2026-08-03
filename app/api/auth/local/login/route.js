import { cookies } from 'next/headers';
import { z } from 'zod';
import { apiError, readJsonBody } from '../../../../lib/api-utils';
import { LOCAL_AUTH_COOKIE, sessionCookieOptions } from '../../../../lib/auth-constants';
import { isLocalAdapterEnabled } from '../../../../lib/server/backend-mode';
import { loginLocalUser } from '../../../../lib/server/local-auth';
import { checkRateLimit, getRateLimitHeaders } from '../../../../lib/server/rate-limit';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().trim().toLowerCase(),
  password: z.string().min(1).max(128),
}).strict();

export async function POST(req) {
  if (!isLocalAdapterEnabled()) {
    return apiError('LOCAL_AUTH_DISABLED', 'Rota nao encontrada.', 404, false);
  }

  const rateLimit = await checkRateLimit('auth_login', null, req);
  const rateLimitHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return Response.json(
      { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Muitas tentativas. Tenta novamente mais tarde.' } },
      { status: 429, headers: { ...rateLimitHeaders, 'Cache-Control': 'no-store, private' } }
    );
  }

  const parsed = schema.safeParse(await readJsonBody(req, 'local_login'));
  if (!parsed.success) {
    return apiError('INVALID_LOGIN', 'Introduz um email e palavra-passe válidos.', 400, false);
  }

  const result = loginLocalUser(parsed.data);
  if (!result.ok) {
    return apiError(result.code, result.message, 401, false);
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCAL_AUTH_COOKIE, result.session.token, sessionCookieOptions());
  return Response.json(
    { authenticated: true, provider: 'local', user: result.user },
    { headers: { ...rateLimitHeaders, 'Cache-Control': 'no-store, private' } }
  );
}
