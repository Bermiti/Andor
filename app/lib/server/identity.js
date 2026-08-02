import 'server-only';

import { cookies } from 'next/headers';
import {
  isE2ELocalAuthEnabled,
  LOCAL_AUTH_COOKIE,
} from '../auth-constants';
import { getSupabaseEnv } from '../supabase/env';
import { createSupabaseServerClient } from '../supabase/server';
import { isLocalAdapterEnabled } from './backend-mode';
import { getLocalSession } from './local-db';
import { hashOpaqueToken } from './security';

export class AuthBoundaryError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = 'AuthBoundaryError';
    this.code = code;
    this.status = status;
  }
}

export function isAuthBoundaryError(error) {
  return error instanceof AuthBoundaryError;
}

export function resolveAuthBackend() {
  if (isE2ELocalAuthEnabled()) return 'local';
  if (getSupabaseEnv().hasPublicConfig) return 'supabase';
  if (isLocalAdapterEnabled()) return 'local';
  return 'unavailable';
}

export function toPublicAuthUser(user, profile = {}) {
  if (!user?.id) return null;
  const metadata = user.user_metadata || {};
  return {
    id: user.id,
    name: profile.name || user.name || metadata.name || user.email?.split('@')[0] || 'Viajante',
    email: user.email || profile.email || '',
    createdAt: user.createdAt || user.created_at || profile.created_at || null,
    visitedCountries: profile.visited_countries || profile.visitedCountries || user.visitedCountries || [],
    trips: user.trips || [],
    interests: profile.interests || user.interests || ['History', 'Food'],
    bio: profile.bio ?? user.bio ?? '',
    lookingForBuddy: Boolean(
      profile.looking_for_buddy
      ?? profile.lookingForBuddy
      ?? user.lookingForBuddy
    ),
  };
}

export async function getLocalAuthenticatedUser() {
  if (!isLocalAdapterEnabled()) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get(LOCAL_AUTH_COOKIE)?.value;
  if (!token) return null;
  return getLocalSession(hashOpaqueToken(token));
}

function identityFromSupabaseClaims(claims) {
  const userId = claims?.sub;
  if (!userId) return null;
  const appMetadata = claims.app_metadata || {};
  const appRole = appMetadata.role === 'admin' || appMetadata.is_admin === true
    ? 'admin'
    : 'user';
  const user = toPublicAuthUser({
    id: userId,
    email: claims.email || '',
    created_at: claims.created_at || null,
    user_metadata: claims.user_metadata || {},
  });
  return {
    ownerKey: `supabase:${userId}`,
    userId,
    user,
    provider: 'supabase',
    appRole,
    authenticated: true,
  };
}

export async function getOptionalAuthenticatedUser() {
  const backend = resolveAuthBackend();

  if (backend === 'supabase') {
    try {
      const supabase = await createSupabaseServerClient();
      if (!supabase) return null;
      const { data, error } = await supabase.auth.getClaims();
      if (error) return null;
      return identityFromSupabaseClaims(data?.claims);
    } catch (error) {
      return null;
    }
  }

  if (backend === 'local') {
    const localSession = await getLocalAuthenticatedUser();
    if (!localSession?.user?.id) return null;
    return {
      ownerKey: `local:${localSession.user.id}`,
      userId: localSession.user.id,
      user: toPublicAuthUser(localSession.user),
      provider: 'local',
      appRole: 'user',
      authenticated: true,
    };
  }

  return null;
}

// Backwards-compatible name for existing DAL callers. It now returns only a
// verified user identity; anonymous guest cookies are deliberately ignored.
export async function getRequestIdentity() {
  return getOptionalAuthenticatedUser();
}

export async function requireAuthenticatedUser() {
  const identity = await getOptionalAuthenticatedUser();
  if (!identity) {
    throw new AuthBoundaryError('AUTH_REQUIRED', 'Sessao nao autenticada.', 401);
  }
  return identity;
}

export async function requireAdmin() {
  const identity = await requireAuthenticatedUser();
  if (identity.provider !== 'supabase' || identity.appRole !== 'admin') {
    throw new AuthBoundaryError('ADMIN_REQUIRED', 'Acesso de administrador necessario.', 403);
  }
  return identity;
}

export function ownsResource(identity, ownerKey) {
  return Boolean(identity?.ownerKey && ownerKey && identity.ownerKey === ownerKey);
}
