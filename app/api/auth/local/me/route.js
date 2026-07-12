import { cookies } from 'next/headers';
import { apiError } from '../../../../lib/api-utils';
import { LOCAL_AUTH_COOKIE } from '../../../../lib/auth-constants';
import { readLocalUserFromToken } from '../../../../lib/server/local-auth';

export const runtime = 'nodejs';

export async function GET() {
  const cookieStore = await cookies();
  const user = readLocalUserFromToken(cookieStore.get(LOCAL_AUTH_COOKIE)?.value);
  if (!user) return apiError('AUTH_REQUIRED', 'Sessão não autenticada.', 401, false);
  return Response.json({ user }, { headers: { 'Cache-Control': 'no-store' } });
}
