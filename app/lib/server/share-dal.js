import 'server-only';

import { createSupabaseAdminClient } from '../supabase/admin';
import { buildSharePayload } from '../share-utils';
import { logger } from '../logger';
import { getRequestIdentity, ownsResource } from './identity';
import {
  getLocalShareByTokenHash,
  insertLocalShare,
  listLocalShares,
  revokeLocalShare,
  touchLocalShare,
} from './local-db';
import { createIdentifier, createOpaqueToken, hashOpaqueToken } from './security';

const DEFAULT_EXPIRY_DAYS = 7;
const MAX_EXPIRY_DAYS = 90;

function normalizeAudience(value) {
  return value === 'internal' ? 'internal' : 'client';
}

function normalizeExpiryDays(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_EXPIRY_DAYS;
  return Math.min(MAX_EXPIRY_DAYS, Math.max(0, Math.round(numeric)));
}

function mapSupabaseShare(row) {
  if (!row) return null;
  return {
    id: row.id,
    sourceKey: row.source_key,
    ownerKey: row.owner_key,
    tokenHash: row.token_hash,
    audience: row.audience,
    payload: row.payload,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
    lastAccessedAt: row.last_accessed_at,
    provider: 'supabase',
  };
}

function publicShareMetadata(record) {
  return {
    id: record.id,
    sourceKey: record.sourceKey,
    audience: record.audience,
    expiresAt: record.expiresAt,
    revokedAt: record.revokedAt,
    createdAt: record.createdAt,
    lastAccessedAt: record.lastAccessedAt,
  };
}

async function findShareRecord(tokenHash) {
  const supabase = createSupabaseAdminClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('itinerary_shares')
      .select('*')
      .eq('token_hash', tokenHash)
      .maybeSingle();
    if (!error && data) return mapSupabaseShare(data);
    if (error) logger.warn('supabase:get_share_failed', error);
  }

  const local = getLocalShareByTokenHash(tokenHash);
  return local ? { ...local, provider: 'sqlite' } : null;
}

export async function createItineraryShare({
  sourceKey,
  itinerary,
  audience = 'client',
  expiresInDays = DEFAULT_EXPIRY_DAYS,
  identity: identityOverride = null,
}) {
  const identity = identityOverride || await getRequestIdentity();
  if (!identity?.ownerKey) return { ok: false, status: 'auth_required' };

  const normalizedAudience = normalizeAudience(audience);
  const normalizedExpiry = normalizeExpiryDays(expiresInDays);
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + normalizedExpiry * 24 * 60 * 60 * 1000).toISOString();
  const token = createOpaqueToken(32);
  const record = {
    id: createIdentifier(),
    sourceKey: String(sourceKey),
    ownerKey: identity.ownerKey,
    tokenHash: hashOpaqueToken(token),
    audience: normalizedAudience,
    payload: {
      ...buildSharePayload(itinerary, normalizedAudience),
      shareAccess: {
        audience: normalizedAudience,
        readOnly: true,
        sourceKey: String(sourceKey),
        expiresAt,
      },
    },
    expiresAt,
    createdAt,
  };

  const supabase = createSupabaseAdminClient();
  if (supabase) {
    const { error } = await supabase.from('itinerary_shares').insert({
      id: record.id,
      source_key: record.sourceKey,
      owner_key: record.ownerKey,
      token_hash: record.tokenHash,
      audience: record.audience,
      payload: record.payload,
      expires_at: record.expiresAt,
      created_at: record.createdAt,
    });
    if (!error) {
      return { ok: true, token, provider: 'supabase', share: publicShareMetadata(record) };
    }
    logger.warn('supabase:create_share_failed', error, { sourceKey: record.sourceKey });
  }

  insertLocalShare(record);
  return { ok: true, token, provider: 'sqlite', share: publicShareMetadata(record) };
}

export async function getItineraryShare(token, identityOverride = undefined) {
  if (!token || !/^[A-Za-z0-9_-]{32,128}$/.test(token)) {
    return { ok: false, status: 'not_found' };
  }

  const record = await findShareRecord(hashOpaqueToken(token));
  if (!record) return { ok: false, status: 'not_found' };
  if (record.revokedAt) return { ok: false, status: 'revoked', share: publicShareMetadata(record) };
  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    return { ok: false, status: 'expired', share: publicShareMetadata(record) };
  }

  if (record.audience === 'internal') {
    const identity = identityOverride === undefined ? await getRequestIdentity() : identityOverride;
    if (!ownsResource(identity, record.ownerKey)) {
      return { ok: false, status: 'forbidden', share: publicShareMetadata(record) };
    }
  }

  if (record.provider === 'supabase') {
    createSupabaseAdminClient()
      ?.from('itinerary_shares')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', record.id)
      .then(({ error }) => {
        if (error) logger.warn('supabase:touch_share_failed', error, { shareId: record.id });
      });
  } else {
    touchLocalShare(record.id);
  }

  return {
    ok: true,
    share: publicShareMetadata(record),
    payload: record.payload,
  };
}

export async function listItineraryShares(sourceKey, identityOverride = null) {
  const identity = identityOverride || await getRequestIdentity();
  if (!identity?.ownerKey) return { ok: false, status: 'auth_required', shares: [] };

  const shares = [];
  const supabase = createSupabaseAdminClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('itinerary_shares')
      .select('id, source_key, audience, expires_at, revoked_at, created_at, last_accessed_at')
      .eq('source_key', String(sourceKey))
      .eq('owner_key', identity.ownerKey)
      .order('created_at', { ascending: false });
    if (!error) {
      shares.push(...(data || []).map((row) => publicShareMetadata(mapSupabaseShare(row))));
    } else {
      logger.warn('supabase:list_shares_failed', error, { sourceKey });
    }
  }

  const local = listLocalShares(String(sourceKey), identity.ownerKey).map(publicShareMetadata);
  const known = new Set(shares.map((share) => share.id));
  shares.push(...local.filter((share) => !known.has(share.id)));
  shares.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { ok: true, shares };
}

export async function revokeItineraryShare(token, identityOverride = null) {
  const identity = identityOverride || await getRequestIdentity();
  if (!identity?.ownerKey) return { ok: false, status: 'auth_required' };
  if (!token || !/^[A-Za-z0-9_-]{32,128}$/.test(token)) return { ok: false, status: 'not_found' };

  const record = await findShareRecord(hashOpaqueToken(token));
  if (!record) return { ok: false, status: 'not_found' };
  if (!ownsResource(identity, record.ownerKey)) return { ok: false, status: 'forbidden' };

  if (record.provider === 'supabase') {
    const { error } = await createSupabaseAdminClient()
      .from('itinerary_shares')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', record.id)
      .eq('owner_key', identity.ownerKey);
    if (error) {
      logger.warn('supabase:revoke_share_failed', error, { shareId: record.id });
      return { ok: false, status: 'storage_error' };
    }
  } else {
    revokeLocalShare(record.id, identity.ownerKey);
  }

  return { ok: true, share: { ...publicShareMetadata(record), revokedAt: new Date().toISOString() } };
}
