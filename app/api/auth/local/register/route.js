import { cookies } from 'next/headers';
import { z } from 'zod';
import { apiError, readJsonBody } from '../../../../lib/api-utils';
import { LOCAL_AUTH_COOKIE, sessionCookieOptions } from '../../../../lib/auth-constants';
import { isLocalAdapterEnabled } from '../../../../lib/server/backend-mode';
import { registerLocalUser } from '../../../../lib/server/local-auth';

export const runtime = 'nodejs';

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
}).strict();

export async function POST(req) {
  if (!isLocalAdapterEnabled()) {
    return apiError('LOCAL_AUTH_DISABLED', 'Rota nao encontrada.', 404, false);
  }
  const parsed = schema.safeParse(await readJsonBody(req, 'local_register'));
  if (!parsed.success) {
    return apiError('INVALID_REGISTRATION', 'Revê o nome, email e palavra-passe.', 400, false);
  }

  const result = registerLocalUser(parsed.data);
  if (!result.ok) {
    return apiError(result.code, result.message, 409, false);
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCAL_AUTH_COOKIE, result.session.token, sessionCookieOptions());
  return Response.json(
    { authenticated: true, provider: 'local', user: result.user },
    { status: 201, headers: { 'Cache-Control': 'no-store, private' } }
  );
}
