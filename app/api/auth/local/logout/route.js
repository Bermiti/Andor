import { cookies } from 'next/headers';
import { apiError } from '../../../../lib/api-utils';
import { expiredSessionCookieOptions, LOCAL_AUTH_COOKIE } from '../../../../lib/auth-constants';
import { isLocalAdapterEnabled } from '../../../../lib/server/backend-mode';
import { logoutLocalUser } from '../../../../lib/server/local-auth';

export const runtime = 'nodejs';

export async function POST() {
  if (!isLocalAdapterEnabled()) {
    return apiError('LOCAL_AUTH_DISABLED', 'Rota nao encontrada.', 404, false);
  }
  const cookieStore = await cookies();
  logoutLocalUser(cookieStore.get(LOCAL_AUTH_COOKIE)?.value);
  cookieStore.set(LOCAL_AUTH_COOKIE, '', expiredSessionCookieOptions());
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store, private' } });
}
