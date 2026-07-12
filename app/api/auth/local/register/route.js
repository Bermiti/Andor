import { cookies } from 'next/headers';
import { z } from 'zod';
import { apiError, readJsonBody } from '../../../../lib/api-utils';
import { LOCAL_AUTH_COOKIE, sessionCookieOptions } from '../../../../lib/auth-constants';
import { registerLocalUser } from '../../../../lib/server/local-auth';

export const runtime = 'nodejs';

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
});

export async function POST(req) {
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
  return Response.json({ user: result.user }, { status: 201 });
}
