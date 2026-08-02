import 'server-only';

import { buildPublicShareSnapshot } from '../share-utils';
import { logger } from '../logger';
import { createSupabaseAdminClient } from '../supabase/admin';
import { createSupabaseServerClient } from '../supabase/server';
import { getDataBackendMode } from './backend-mode';
import { getRequestIdentity } from './identity';
import {
  getLocalTripForUser,
  getLocalTripShareLinkByHash,
  insertLocalTripShareLink,
  listLocalTripShareLinks,
  revokeLocalTripShareLink,
  touchLocalTripShareLink,
} from './local-trip-store';
import { createIdentifier, createOpaqueToken, hashOpaqueToken } from './security';
import { requireTripAction } from './trip-repository';

const DEFAULT_EXPIRY_DAYS = 7;
const MAX_EXPIRY_DAYS = 90;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hasIdentity(identity) {
  return Boolean(identity?.authenticated && identity?.userId);
}

async function resolveIdentity(identityOverride) {
  return identityOverride === undefined ? getRequestIdentity() : identityOverride;
}

function validExpiryDays(value) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= 1 && numeric <= MAX_EXPIRY_DAYS
    ? numeric
    : null;
}

function mapShareLink(row) {
  if (!row) return null;
  return {
    id: row.id,
    tripId: row.trip_id || row.tripId,
    tokenHash: row.token_hash || row.tokenHash,
    permission: row.permission || 'viewer',
    audience: row.audience || 'client',
    expiresAt: row.expires_at || row.expiresAt,
    revokedAt: row.revoked_at || row.revokedAt || null,
    createdBy: row.created_by || row.createdBy,
    createdAt: row.created_at || row.createdAt,
    lastAccessedAt: row.last_accessed_at || row.lastAccessedAt || null,
  };
}

function publicShareMetadata(record) {
  return {
    id: record.id,
    permission: 'viewer',
    audience: 'client',
    expiresAt: record.expiresAt,
    revokedAt: record.revokedAt || null,
    createdAt: record.createdAt,
    lastAccessedAt: record.lastAccessedAt || null,
  };
}

function permissionFailure(result) {
  if (result?.status === 'auth_required') return { ok: false, status: 'auth_required' };
  if (result?.status === 'persistence_unavailable') return { ok: false, status: 'persistence_unavailable' };
  if (result?.status === 'storage_error') return { ok: false, status: 'storage_error' };
  if (result?.status === 'forbidden') return { ok: false, status: 'forbidden' };
  return { ok: false, status: 'not_found' };
}

async function readSupabaseShareByHash(tokenHash) {
  const admin = createSupabaseAdminClient();
  if (!admin) return { ok: false, status: 'persistence_unavailable' };

  const { data, error } = await admin
    .from('trip_share_links')
    .select('id, trip_id, permission, audience, expires_at, revoked_at, created_by, created_at, last_accessed_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();
  if (error) {
    logger.warn('share_dal:public_link_read_failed', { code: error.code });
    return { ok: false, status: 'storage_error' };
  }
  return data
    ? { ok: true, admin, record: mapShareLink(data) }
    : { ok: false, status: 'not_found' };
}

async function readPublicItinerary(record, mode, admin = null) {
  if (mode === 'sqlite') {
    const trip = getLocalTripForUser(record.tripId, record.createdBy);
    return trip?.itinerary
      ? { ok: true, itinerary: trip.itinerary }
      : { ok: false, status: 'not_found' };
  }

  const { data, error } = await admin
    .from('itineraries')
    .select('itinerary')
    .eq('id', record.tripId)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) {
    logger.warn('share_dal:public_trip_read_failed', { code: error.code }, { shareId: record.id });
    return { ok: false, status: 'storage_error' };
  }
  return data?.itinerary
    ? { ok: true, itinerary: data.itinerary }
    : { ok: false, status: 'not_found' };
}

export async function createItineraryShare({
  tripId,
  expiresInDays = DEFAULT_EXPIRY_DAYS,
  identity: identityOverride,
}) {
  const identity = await resolveIdentity(identityOverride);
  if (!hasIdentity(identity)) return { ok: false, status: 'auth_required' };
  if (!UUID_PATTERN.test(String(tripId || ''))) return { ok: false, status: 'not_found' };

  const expiryDays = validExpiryDays(expiresInDays);
  if (!expiryDays) return { ok: false, status: 'invalid' };

  const permission = await requireTripAction(tripId, identity, 'manage_shares');
  if (!permission.ok) return permissionFailure(permission);

  const mode = getDataBackendMode();
  if (mode === 'unavailable') return { ok: false, status: 'persistence_unavailable' };

  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1_000).toISOString();
  const token = createOpaqueToken(32);
  const record = {
    id: createIdentifier(),
    tripId: String(tripId),
    tokenHash: hashOpaqueToken(token),
    permission: 'viewer',
    audience: 'client',
    expiresAt,
    revokedAt: null,
    createdBy: identity.userId,
    createdAt,
    lastAccessedAt: null,
  };

  if (mode === 'sqlite') {
    const result = insertLocalTripShareLink(record);
    return result.ok
      ? { ok: true, token, provider: 'sqlite', share: publicShareMetadata(record) }
      : permissionFailure(result);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, status: 'persistence_unavailable' };
  const { data, error } = await supabase
    .from('trip_share_links')
    .insert({
      id: record.id,
      trip_id: record.tripId,
      token_hash: record.tokenHash,
      permission: 'viewer',
      audience: 'client',
      expires_at: record.expiresAt,
      created_by: record.createdBy,
      created_at: record.createdAt,
    })
    .select('id, trip_id, permission, audience, expires_at, revoked_at, created_by, created_at, last_accessed_at')
    .single();
  if (error) {
    logger.warn('share_dal:create_failed', { code: error.code }, { tripId });
    return { ok: false, status: error.code === '42501' ? 'forbidden' : 'storage_error' };
  }

  return {
    ok: true,
    token,
    provider: 'supabase',
    share: publicShareMetadata(mapShareLink(data)),
  };
}

export async function listItineraryShares(tripId, identityOverride) {
  const identity = await resolveIdentity(identityOverride);
  if (!hasIdentity(identity)) return { ok: false, status: 'auth_required', shares: [] };
  if (!UUID_PATTERN.test(String(tripId || ''))) return { ok: false, status: 'not_found', shares: [] };

  const permission = await requireTripAction(tripId, identity, 'manage_shares');
  if (!permission.ok) return { ...permissionFailure(permission), shares: [] };

  const mode = getDataBackendMode();
  if (mode === 'sqlite') {
    const result = listLocalTripShareLinks(tripId, identity.userId);
    return result.ok
      ? {
          ok: true,
          provider: 'sqlite',
          shares: result.shares.map((row) => publicShareMetadata(mapShareLink(row))),
        }
      : { ...permissionFailure(result), shares: [] };
  }
  if (mode !== 'supabase') return { ok: false, status: 'persistence_unavailable', shares: [] };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, status: 'persistence_unavailable', shares: [] };
  const { data, error } = await supabase
    .from('trip_share_links')
    .select('id, trip_id, permission, audience, expires_at, revoked_at, created_by, created_at, last_accessed_at')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false });
  if (error) {
    logger.warn('share_dal:list_failed', { code: error.code }, { tripId });
    return { ok: false, status: 'storage_error', shares: [] };
  }
  return {
    ok: true,
    provider: 'supabase',
    shares: (data || []).map((row) => publicShareMetadata(mapShareLink(row))),
  };
}

export async function revokeItineraryShare({ tripId, shareId, identity: identityOverride }) {
  const identity = await resolveIdentity(identityOverride);
  if (!hasIdentity(identity)) return { ok: false, status: 'auth_required' };
  if (!UUID_PATTERN.test(String(tripId || '')) || !UUID_PATTERN.test(String(shareId || ''))) {
    return { ok: false, status: 'not_found' };
  }

  const permission = await requireTripAction(tripId, identity, 'manage_shares');
  if (!permission.ok) return permissionFailure(permission);

  const mode = getDataBackendMode();
  if (mode === 'sqlite') {
    const result = revokeLocalTripShareLink({
      tripId,
      shareId,
      actorUserId: identity.userId,
    });
    return result.ok
      ? { ok: true, provider: 'sqlite', share: { id: shareId, revokedAt: result.revokedAt } }
      : permissionFailure(result);
  }
  if (mode !== 'supabase') return { ok: false, status: 'persistence_unavailable' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, status: 'persistence_unavailable' };
  const revokedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('trip_share_links')
    .update({ revoked_at: revokedAt })
    .eq('id', shareId)
    .eq('trip_id', tripId)
    .is('revoked_at', null)
    .select('id, trip_id, permission, audience, expires_at, revoked_at, created_by, created_at, last_accessed_at')
    .maybeSingle();
  if (error) {
    logger.warn('share_dal:revoke_failed', { code: error.code }, { tripId, shareId });
    return { ok: false, status: error.code === '42501' ? 'forbidden' : 'storage_error' };
  }
  return data
    ? { ok: true, provider: 'supabase', share: publicShareMetadata(mapShareLink(data)) }
    : { ok: false, status: 'not_found' };
}

export async function getItineraryShare(token) {
  if (!TOKEN_PATTERN.test(String(token || ''))) return { ok: false, status: 'not_found' };

  const mode = getDataBackendMode();
  let record;
  let admin = null;
  if (mode === 'sqlite') {
    record = getLocalTripShareLinkByHash(hashOpaqueToken(token));
    if (!record) return { ok: false, status: 'not_found' };
    record = mapShareLink(record);
  } else if (mode === 'supabase') {
    const result = await readSupabaseShareByHash(hashOpaqueToken(token));
    if (!result.ok) return result;
    ({ record, admin } = result);
  } else {
    return { ok: false, status: 'persistence_unavailable' };
  }

  // Revoked, expired, malformed, and unknown links intentionally collapse to
  // the same response so anonymous callers cannot enumerate link lifecycle.
  if (
    record.revokedAt
    || record.permission !== 'viewer'
    || record.audience !== 'client'
    || !record.expiresAt
    || new Date(record.expiresAt).getTime() <= Date.now()
  ) {
    return { ok: false, status: 'not_found' };
  }

  const itineraryResult = await readPublicItinerary(record, mode, admin);
  if (!itineraryResult.ok) return itineraryResult;
  const payload = buildPublicShareSnapshot(itineraryResult.itinerary);
  if (!payload) return { ok: false, status: 'not_found' };

  const accessedAt = new Date().toISOString();
  if (mode === 'sqlite') {
    touchLocalTripShareLink(record.id);
  } else {
    const { error } = await admin
      .from('trip_share_links')
      .update({ last_accessed_at: accessedAt })
      .eq('id', record.id);
    if (error) logger.warn('share_dal:touch_failed', { code: error.code }, { shareId: record.id });
  }

  return {
    ok: true,
    share: { ...publicShareMetadata(record), lastAccessedAt: accessedAt },
    payload,
  };
}
