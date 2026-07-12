import 'server-only';

import { cookies } from 'next/headers';
import { GUEST_SESSION_COOKIE, LOCAL_AUTH_COOKIE } from '../auth-constants';
import { createSupabaseServerClient } from '../supabase/server';
import { getLocalSession } from './local-db';
import { hashOpaqueToken } from './security';

export async function getLocalAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(LOCAL_AUTH_COOKIE)?.value;
  if (!token) return null;
  return getLocalSession(hashOpaqueToken(token));
}

export async function getRequestIdentity() {
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase.auth.getClaims();
      const userId = data?.claims?.sub;
      if (userId) {
        return {
          ownerKey: `supabase:${userId}`,
          userId,
          provider: 'supabase',
          authenticated: true,
        };
      }
    }
  } catch (error) {}

  const localSession = await getLocalAuthenticatedUser();
  if (localSession?.user?.id) {
    return {
      ownerKey: `local:${localSession.user.id}`,
      userId: localSession.user.id,
      user: localSession.user,
      provider: 'local',
      authenticated: true,
    };
  }

  const cookieStore = await cookies();
  const guestToken = cookieStore.get(GUEST_SESSION_COOKIE)?.value;
  if (!guestToken) return null;

  return {
    ownerKey: `guest:${hashOpaqueToken(guestToken)}`,
    userId: null,
    provider: 'guest',
    authenticated: true,
  };
}

export function ownsResource(identity, ownerKey) {
  return Boolean(identity?.ownerKey && ownerKey && identity.ownerKey === ownerKey);
}
