import { cookies } from 'next/headers';
import { z } from 'zod';
import { apiError, readJsonBody } from '../../../lib/api-utils';
import { LOCAL_AUTH_COOKIE, sessionCookieOptions } from '../../../lib/auth-constants';
import { resolveAuthBackend, toPublicAuthUser } from '../../../lib/server/identity';
import { registerLocalUser } from '../../../lib/server/local-auth';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export const runtime = 'nodejs';

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
}).strict();

export async function POST(req) {
  const parsed = registerSchema.safeParse(await readJsonBody(req, 'auth_register'));
  if (!parsed.success) {
    return apiError('INVALID_REGISTRATION', 'Reve o nome, email e palavra-passe.', 400, false);
  }

  const backend = resolveAuthBackend();
  if (backend === 'local') {
    const result = registerLocalUser(parsed.data);
    if (!result.ok) {
      const unavailable = result.code === 'LOCAL_AUTH_DISABLED';
      return apiError(
        unavailable ? 'AUTH_NOT_CONFIGURED' : result.code,
        unavailable ? 'Autenticacao indisponivel.' : result.message,
        unavailable ? 503 : 409,
        unavailable
      );
    }
    const cookieStore = await cookies();
    cookieStore.set(LOCAL_AUTH_COOKIE, result.session.token, sessionCookieOptions());
    return Response.json(
      { authenticated: true, provider: 'local', user: result.user, pendingVerification: false },
      { status: 201, headers: { 'Cache-Control': 'no-store, private' } }
    );
  }

  if (backend !== 'supabase') {
    return apiError('AUTH_NOT_CONFIGURED', 'Autenticacao indisponivel.', 503, true);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { name: parsed.data.name } },
  });
  if (error || !data?.user) {
    return apiError(
      'REGISTRATION_FAILED',
      'Nao foi possivel concluir o registo. Confirma os dados ou verifica o teu email.',
      400,
      false
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
    { status: 201, headers: { 'Cache-Control': 'no-store, private' } }
  );
}
