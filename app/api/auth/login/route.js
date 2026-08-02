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
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(128),
}).strict();

export async function POST(req) {
  const parsed = loginSchema.safeParse(await readJsonBody(req, 'auth_login'));
  if (!parsed.success) {
    return apiError('INVALID_LOGIN', 'Introduz um email e palavra-passe validos.', 400, false);
  }

  const backend = resolveAuthBackend();
  if (backend === 'local') {
    const result = loginLocalUser(parsed.data);
    if (!result.ok) {
      const unavailable = result.code === 'LOCAL_AUTH_DISABLED';
      return apiError(
        unavailable ? 'AUTH_NOT_CONFIGURED' : 'INVALID_CREDENTIALS',
        unavailable ? 'Autenticacao indisponivel.' : 'Email ou palavra-passe invalidos.',
        unavailable ? 503 : 401,
        unavailable
      );
    }
    const cookieStore = await cookies();
    cookieStore.set(LOCAL_AUTH_COOKIE, result.session.token, sessionCookieOptions());
    return Response.json(
      { authenticated: true, provider: 'local', user: result.user },
      { headers: { 'Cache-Control': 'no-store, private' } }
    );
  }

  if (backend !== 'supabase') {
    return apiError('AUTH_NOT_CONFIGURED', 'Autenticacao indisponivel.', 503, true);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data?.session || !data?.user) {
    return apiError('INVALID_CREDENTIALS', 'Email ou palavra-passe invalidos.', 401, false);
  }

  return Response.json(
    {
      authenticated: true,
      provider: 'supabase',
      user: toPublicAuthUser(data.user),
    },
    { headers: { 'Cache-Control': 'no-store, private' } }
  );
}
