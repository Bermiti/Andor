import { cookies } from 'next/headers';
import {
  expiredSessionCookieOptions,
  LOCAL_AUTH_COOKIE,
} from '../../../lib/auth-constants';
import { resolveAuthBackend } from '../../../lib/server/identity';
import { logoutLocalUser } from '../../../lib/server/local-auth';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export const runtime = 'nodejs';

function isSupabaseAuthCookie(name) {
  return name.startsWith('sb-') && name.includes('-auth-token');
}

export async function POST() {
  const backend = resolveAuthBackend();
  const cookieStore = await cookies();

  if (backend === 'supabase') {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut().catch(() => null);
  } else if (backend === 'local') {
    logoutLocalUser(cookieStore.get(LOCAL_AUTH_COOKIE)?.value);
  }

  cookieStore.set(LOCAL_AUTH_COOKIE, '', expiredSessionCookieOptions());
  cookieStore.getAll()
    .filter((cookie) => isSupabaseAuthCookie(cookie.name))
    .forEach((cookie) => {
      cookieStore.set(cookie.name, '', expiredSessionCookieOptions());
    });

  return Response.json(
    { ok: true },
    { headers: { 'Cache-Control': 'no-store, private' } }
  );
}
