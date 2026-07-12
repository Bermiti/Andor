import { cookies } from 'next/headers';
import { LOCAL_AUTH_COOKIE, sessionCookieOptions } from '../../../../lib/auth-constants';
import { logoutLocalUser } from '../../../../lib/server/local-auth';

export const runtime = 'nodejs';

export async function POST() {
  const cookieStore = await cookies();
  logoutLocalUser(cookieStore.get(LOCAL_AUTH_COOKIE)?.value);
  cookieStore.set(LOCAL_AUTH_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
  return Response.json({ ok: true });
}
