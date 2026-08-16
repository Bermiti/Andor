import 'server-only';

import { createHash, randomUUID } from 'node:crypto';
import { logger } from '../logger';
import { createSupabaseServerClient } from '../supabase/server';
import { getDataBackendMode } from './backend-mode';
import { getLocalDatabase } from './local-db';

const DEFAULT_LEASE_SECONDS = 120;
const DEFAULT_RETENTION_HOURS = 24;
const MAX_CHECKPOINT_BYTES = 500_000;
const MAX_TRIP_RECORD_BYTES = 1_500_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HASH_PATTERN = /^[0-9a-f]{64}$/i;

function authenticatedUserId(identity) {
  if (!identity?.authenticated || !identity?.userId) return null;
  return String(identity.userId);
}

function boundedPositiveInteger(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function leaseDurationMs() {
  return boundedPositiveInteger(
    process.env.GENERATION_REQUEST_LEASE_SECONDS,
    DEFAULT_LEASE_SECONDS,
    10,
    3600,
  ) * 1000;
}

function retentionDurationMs() {
  return boundedPositiveInteger(
    process.env.GENERATION_REQUEST_RETENTION_HOURS,
    DEFAULT_RETENTION_HOURS,
    1,
    24 * 90,
  ) * 60 * 60 * 1000;
}

function canonicalize(value, ancestors = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('Generation request payload must contain finite numbers.');
    return Object.is(value, -0) ? 0 : value;
  }
  if (typeof value !== 'object') {
    throw new TypeError('Generation request payload must be JSON serializable.');
  }
  if (ancestors.has(value)) throw new TypeError('Generation request payload must not contain cycles.');

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return value.map((item) => canonicalize(item, ancestors));
    }

    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) throw new TypeError('Generation request payload contains an invalid date.');
      return value.toJSON();
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('Generation request payload must contain only plain JSON objects.');
    }

    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = canonicalize(value[key], ancestors);
        return result;
      }, {});
  } finally {
    ancestors.delete(value);
  }
}

export function canonicalRequestHash(payload) {
  const canonicalJson = JSON.stringify(canonicalize(payload));
  return createHash('sha256').update(canonicalJson).digest('hex');
}

function normalizeReservationInput(input) {
  const key = typeof input?.key === 'string' ? input.key.trim() : '';
  const requestHash = typeof input?.requestHash === 'string' ? input.requestHash.toLowerCase() : '';
  if (key.length < 16 || key.length > 128 || /[\u0000-\u001f\u007f]/.test(key)) {
    return { ok: false, status: 'failed', failureCode: 'invalid_idempotency_key' };
  }
  if (!HASH_PATTERN.test(requestHash)) {
    return { ok: false, status: 'failed', failureCode: 'invalid_request_hash' };
  }
  return { ok: true, key, requestHash };
}

function normalizeLeaseInput(input) {
  const requestId = typeof input?.requestId === 'string' ? input.requestId.trim() : '';
  const leaseToken = typeof input?.leaseToken === 'string' ? input.leaseToken.trim() : '';
  if (!UUID_PATTERN.test(requestId) || !UUID_PATTERN.test(leaseToken)) {
    return { ok: false, status: 'lease_lost' };
  }
  return { ok: true, requestId, leaseToken };
}

function serializeJson(value, label, maximumBytes) {
  let serialized;
  try {
    serialized = JSON.stringify(value);
  } catch {
    return { ok: false, failureCode: `invalid_${label}` };
  }
  if (serialized === undefined || Buffer.byteLength(serialized, 'utf8') > maximumBytes) {
    return { ok: false, failureCode: `${label}_too_large` };
  }
  return { ok: true, value: JSON.parse(serialized), serialized };
}

function destinationLabel(itinerary, explicitDestination) {
  if (typeof explicitDestination === 'string' && explicitDestination.trim()) return explicitDestination.trim().slice(0, 300);
  const routeLabel = itinerary?.journey?.routeLabel;
  if (typeof routeLabel === 'string' && routeLabel.trim()) return routeLabel.trim().slice(0, 300);
  const destination = itinerary?.destination;
  if (typeof destination === 'string' && destination.trim()) return destination.trim().slice(0, 300);
  const label = destination?.displayName
    || destination?.canonicalName
    || destination?.city
    || destination?.name
    || itinerary?.title
    || 'Destino';
  return String(label).trim().slice(0, 300) || 'Destino';
}

function currencyCode(itinerary, explicitCurrency) {
  const raw = explicitCurrency
    || itinerary?.destination?.currency
    || itinerary?.trip?.budgetBreakdown?.currency
    || itinerary?.trip?.currency
    || itinerary?.currency;
  const value = typeof raw === 'object' ? raw?.code : raw;
  const code = String(value || 'EUR').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : 'EUR';
}

function normalizeTripMetadata(itinerary, metadata = {}) {
  const trip = itinerary?.trip || {};
  const travelers = Number(metadata.travelers ?? trip.travelers ?? 0);
  const destination = itinerary?.destination || itinerary?.journey?.stages?.[0]?.destination || {};
  return {
    destinationCity: metadata.destinationCity
      || destination.canonicalName
      || destination.city
      || destination.name
      || null,
    destinationCountry: metadata.destinationCountry
      || destination.countryCode
      || destination.country
      || null,
    days: itinerary.days.length,
    style: metadata.style || trip.travelStyle || itinerary?.style || null,
    budget: metadata.budget || trip.budgetTier || null,
    travelers: Number.isFinite(travelers) ? Math.max(0, Math.trunc(travelers)) || null : null,
    startDate: metadata.startDate || trip.startDate || null,
    endDate: metadata.endDate || trip.endDate || null,
    source: String(metadata.source || 'generated').slice(0, 80),
  };
}

function normalizeTripRecord(tripRecord) {
  if (!tripRecord || typeof tripRecord !== 'object' || Array.isArray(tripRecord)) {
    return { ok: false, status: 'failed', failureCode: 'invalid_trip' };
  }
  const itineraryResult = serializeJson(tripRecord.itinerary, 'trip', MAX_TRIP_RECORD_BYTES);
  if (!itineraryResult.ok || !itineraryResult.value || typeof itineraryResult.value !== 'object' || Array.isArray(itineraryResult.value)) {
    return { ok: false, status: 'failed', failureCode: itineraryResult.failureCode || 'invalid_trip' };
  }
  if (!Array.isArray(itineraryResult.value.days) || itineraryResult.value.days.length < 1) {
    return { ok: false, status: 'failed', failureCode: 'invalid_trip' };
  }
  if (tripRecord.metadata?.days != null
      && Number(tripRecord.metadata.days) !== itineraryResult.value.days.length) {
    return { ok: false, status: 'failed', failureCode: 'invalid_trip' };
  }
  const responseResult = serializeJson(
    tripRecord.responsePayload,
    'response',
    MAX_TRIP_RECORD_BYTES,
  );
  if (!responseResult.ok
      || !responseResult.value
      || typeof responseResult.value !== 'object'
      || Array.isArray(responseResult.value)) {
    return { ok: false, status: 'failed', failureCode: responseResult.failureCode || 'invalid_response' };
  }

  const id = tripRecord.id == null || tripRecord.id === '' ? randomUUID() : String(tripRecord.id);
  if (!UUID_PATTERN.test(id)) return { ok: false, status: 'failed', failureCode: 'invalid_trip_id' };
  const storedResponseResult = serializeJson(
    { ...responseResult.value, id },
    'response',
    MAX_TRIP_RECORD_BYTES,
  );
  if (!storedResponseResult.ok) {
    return { ok: false, status: 'failed', failureCode: storedResponseResult.failureCode };
  }
  const schemaVersion = boundedPositiveInteger(
    tripRecord.schemaVersion ?? itineraryResult.value.schemaVersion ?? itineraryResult.value.dataVersion,
    1,
    1,
    999_999_999,
  );
  const metadata = normalizeTripMetadata(itineraryResult.value, tripRecord.metadata || {});
  const metadataResult = serializeJson(metadata, 'metadata', MAX_CHECKPOINT_BYTES);
  if (!metadataResult.ok) return { ok: false, status: 'failed', failureCode: metadataResult.failureCode };

  return {
    ok: true,
    trip: {
      id,
      destination: destinationLabel(itineraryResult.value, tripRecord.destination),
      itinerary: itineraryResult.value,
      itineraryJson: itineraryResult.serialized,
      metadata: metadataResult.value,
      metadataJson: metadataResult.serialized,
      visibility: 'private',
      status: 'draft',
      currency: currencyCode(itineraryResult.value, tripRecord.currency),
      schemaVersion,
      responsePayload: storedResponseResult.value,
      responseJson: storedResponseResult.serialized,
    },
  };
}

function firstRpcRow(data) {
  if (Array.isArray(data)) return data[0] || null;
  return data && typeof data === 'object' ? data : null;
}

function parseLocalJson(value) {
  if (value == null || value === '') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function mapCommonRow(row, provider) {
  if (!row) return { provider };
  return {
    provider,
    requestId: row.request_id || row.id || null,
    attemptCount: Number(row.attempt_count) || 0,
    checkpoint: row.checkpoint ?? parseLocalJson(row.checkpoint_json),
    tripId: row.trip_id || null,
    response: row.response ?? parseLocalJson(row.response_json),
    failureCode: row.failure_code || null,
    retryable: row.retryable === true || row.retryable === 1,
    leaseExpiresAt: row.lease_expires_at || null,
    expiresAt: row.expires_at || null,
  };
}

function leaseIsCurrent(row, leaseToken, nowMs = Date.now()) {
  return row?.status === 'pending'
    && row.lease_token === leaseToken
    && Number.isFinite(Date.parse(row.lease_expires_at))
    && Date.parse(row.lease_expires_at) > nowMs
    && Number.isFinite(Date.parse(row.expires_at))
    && Date.parse(row.expires_at) > nowMs;
}

function withImmediateTransaction(operation) {
  const database = getLocalDatabase();
  database.exec('BEGIN IMMEDIATE');
  try {
    const result = operation(database);
    database.exec('COMMIT');
    return result;
  } catch (error) {
    try { database.exec('ROLLBACK'); } catch {}
    throw error;
  }
}

function localStorageFailure(context, error) {
  logger.warn(`generation_request_repository:${context}_failed`, error, { provider: 'sqlite' });
  return { ok: false, status: 'storage_error', provider: 'sqlite' };
}

function reserveLocalGenerationRequest({ key, requestHash }, userId) {
  try {
    return withImmediateTransaction((database) => {
      const nowMs = Date.now();
      const now = new Date(nowMs).toISOString();
      const existing = database.prepare(`
        SELECT * FROM generation_requests
        WHERE user_id = ? AND idempotency_key = ?
      `).get(userId, key);

      if (!existing) {
        const requestId = randomUUID();
        const leaseToken = randomUUID();
        const leaseExpiresAt = new Date(nowMs + leaseDurationMs()).toISOString();
        const expiresAt = new Date(nowMs + retentionDurationMs()).toISOString();
        database.prepare(`
          INSERT INTO generation_requests
            (id, user_id, idempotency_key, request_hash, status, lease_token,
             lease_expires_at, attempt_count, checkpoint_json, trip_id, response_json,
             failure_code, retryable, expires_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'pending', ?, ?, 1, '{}', NULL, NULL, NULL, 1, ?, ?, ?)
        `).run(requestId, userId, key, requestHash, leaseToken, leaseExpiresAt, expiresAt, now, now);
        return {
          ok: true,
          status: 'reserved',
          provider: 'sqlite',
          requestId,
          leaseToken,
          leaseExpiresAt,
          expiresAt,
          attemptCount: 1,
          checkpoint: {},
          resumed: false,
        };
      }

      const common = mapCommonRow(existing, 'sqlite');
      const requestExpiryMs = Date.parse(existing.expires_at);
      if (!Number.isFinite(requestExpiryMs) || requestExpiryMs <= nowMs) {
        const leaseToken = randomUUID();
        const expiresAt = new Date(nowMs + retentionDurationMs()).toISOString();
        const leaseExpiresAt = new Date(Math.min(nowMs + leaseDurationMs(), Date.parse(expiresAt))).toISOString();
        database.prepare(`
          UPDATE generation_requests
          SET request_hash = ?, status = 'pending', lease_token = ?, lease_expires_at = ?,
              attempt_count = 1, checkpoint_json = '{}', trip_id = NULL, response_json = NULL,
              failure_code = NULL, retryable = 1, expires_at = ?, created_at = ?, updated_at = ?
          WHERE id = ? AND user_id = ?
        `).run(requestHash, leaseToken, leaseExpiresAt, expiresAt, now, now, existing.id, userId);
        return {
          ok: true,
          status: 'reserved',
          provider: 'sqlite',
          requestId: existing.id,
          leaseToken,
          leaseExpiresAt,
          expiresAt,
          attemptCount: 1,
          checkpoint: {},
          resumed: false,
        };
      }
      if (existing.request_hash !== requestHash) return { ok: false, status: 'mismatch', ...common };
      if (existing.status === 'completed') {
        return { ok: true, status: 'replay', replayed: true, ...common };
      }
      if (existing.status === 'failed' && existing.retryable !== 1) {
        return { ok: false, status: 'failed', ...common };
      }

      const leaseExpiryMs = Date.parse(existing.lease_expires_at);
      if (Number.isFinite(leaseExpiryMs) && leaseExpiryMs > nowMs) {
        return {
          ok: true,
          status: 'in_progress',
          ...common,
          retryAfterSeconds: Math.max(1, Math.ceil((leaseExpiryMs - nowMs) / 1000)),
        };
      }

      const leaseToken = randomUUID();
      const leaseExpiresAt = new Date(Math.min(nowMs + leaseDurationMs(), requestExpiryMs)).toISOString();
      database.prepare(`
        UPDATE generation_requests
        SET status = 'pending', lease_token = ?, lease_expires_at = ?, attempt_count = attempt_count + 1,
            failure_code = NULL, retryable = 1, updated_at = ?
        WHERE id = ? AND user_id = ? AND status IN ('pending', 'failed')
      `).run(leaseToken, leaseExpiresAt, now, existing.id, userId);
      return {
        ok: true,
        status: 'reserved',
        provider: 'sqlite',
        requestId: existing.id,
        leaseToken,
        leaseExpiresAt,
        expiresAt: existing.expires_at,
        attemptCount: Number(existing.attempt_count) + 1,
        checkpoint: parseLocalJson(existing.checkpoint_json),
        resumed: true,
      };
    });
  } catch (error) {
    return localStorageFailure('reserve', error);
  }
}

function checkpointLocalGenerationRequest({ requestId, leaseToken, checkpoint, checkpointJson }, userId) {
  try {
    return withImmediateTransaction((database) => {
      const row = database.prepare(`
        SELECT * FROM generation_requests WHERE id = ? AND user_id = ?
      `).get(requestId, userId);
      if (!leaseIsCurrent(row, leaseToken)) return { ok: false, status: 'lease_lost', provider: 'sqlite' };

      const nowMs = Date.now();
      const now = new Date(nowMs).toISOString();
      const leaseExpiresAt = new Date(
        Math.min(nowMs + leaseDurationMs(), Date.parse(row.expires_at)),
      ).toISOString();
      const update = database.prepare(`
        UPDATE generation_requests
        SET checkpoint_json = ?, lease_expires_at = ?, updated_at = ?
        WHERE id = ? AND user_id = ? AND status = 'pending' AND lease_token = ?
      `).run(checkpointJson, leaseExpiresAt, now, requestId, userId, leaseToken);
      if (update.changes !== 1) return { ok: false, status: 'lease_lost', provider: 'sqlite' };
      return {
        ok: true,
        status: 'in_progress',
        provider: 'sqlite',
        requestId,
        checkpoint,
        leaseExpiresAt,
      };
    });
  } catch (error) {
    return localStorageFailure('checkpoint', error);
  }
}

function replayFromLocalRow(row, replayed = true) {
  const common = mapCommonRow(row, 'sqlite');
  return { ok: true, status: 'replay', replayed, ...common };
}

function completeLocalGenerationRequest({ requestId, leaseToken, trip }, userId) {
  try {
    return withImmediateTransaction((database) => {
      const row = database.prepare(`
        SELECT * FROM generation_requests WHERE id = ? AND user_id = ?
      `).get(requestId, userId);
      if (!row) return { ok: false, status: 'lease_lost', provider: 'sqlite' };
      if (row.status === 'completed') return replayFromLocalRow(row, true);
      if (row.status === 'failed') return { ok: false, status: 'failed', ...mapCommonRow(row, 'sqlite') };
      if (!leaseIsCurrent(row, leaseToken)) return { ok: false, status: 'lease_lost', provider: 'sqlite' };

      const now = new Date().toISOString();
      database.prepare(`
        INSERT INTO itineraries
          (id, owner_key, owner_id, user_id, destination, itinerary_json, metadata_json,
           visibility, status, currency, schema_version, version, deleted_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NULL, ?, ?)
      `).run(
        trip.id,
        `local:${userId}`,
        userId,
        userId,
        trip.destination,
        trip.itineraryJson,
        trip.metadataJson,
        trip.visibility,
        trip.status,
        trip.currency,
        trip.schemaVersion,
        now,
        now,
      );
      database.prepare(`
        INSERT INTO trip_members
          (trip_id, user_id, role, invited_by, created_at, updated_at, revoked_at)
        VALUES (?, ?, 'owner', ?, ?, ?, NULL)
      `).run(trip.id, userId, userId, now, now);
      database.prepare(`
        INSERT INTO audit_events
          (id, actor_user_id, action, resource_type, resource_id, correlation_id, metadata_json, created_at)
        VALUES (?, ?, 'trip.created', 'trip', ?, NULL, ?, ?)
      `).run(
        randomUUID(),
        userId,
        trip.id,
        JSON.stringify({ source: trip.metadata.source, version: 1, result: 'generation_completed' }),
        now,
      );
      const receipt = database.prepare(`
        UPDATE generation_requests
        SET status = 'completed', trip_id = ?, response_json = ?, lease_token = NULL,
            lease_expires_at = NULL, failure_code = NULL, retryable = 0, updated_at = ?
        WHERE id = ? AND user_id = ? AND status = 'pending' AND lease_token = ?
      `).run(trip.id, trip.responseJson, now, requestId, userId, leaseToken);
      if (receipt.changes !== 1) throw new Error('GENERATION_RECEIPT_WRITE_FAILED');

      return {
        ok: true,
        status: 'replay',
        replayed: false,
        provider: 'sqlite',
        requestId,
        tripId: trip.id,
        response: trip.responsePayload,
        checkpoint: parseLocalJson(row.checkpoint_json),
      };
    });
  } catch (error) {
    return localStorageFailure('complete', error);
  }
}

function failLocalGenerationRequest({ requestId, leaseToken, failureCode, retryable }, userId) {
  try {
    return withImmediateTransaction((database) => {
      const row = database.prepare(`
        SELECT * FROM generation_requests WHERE id = ? AND user_id = ?
      `).get(requestId, userId);
      if (!row) return { ok: false, status: 'lease_lost', provider: 'sqlite' };
      if (row.status === 'completed') return replayFromLocalRow(row, true);
      if (row.status === 'failed') return { ok: false, status: 'failed', ...mapCommonRow(row, 'sqlite') };
      if (!leaseIsCurrent(row, leaseToken)) return { ok: false, status: 'lease_lost', provider: 'sqlite' };

      const now = new Date().toISOString();
      const update = database.prepare(`
        UPDATE generation_requests
        SET status = 'failed', failure_code = ?, retryable = ?, lease_token = NULL,
            lease_expires_at = NULL, updated_at = ?
        WHERE id = ? AND user_id = ? AND status = 'pending' AND lease_token = ?
      `).run(failureCode, retryable ? 1 : 0, now, requestId, userId, leaseToken);
      if (update.changes !== 1) return { ok: false, status: 'lease_lost', provider: 'sqlite' };
      return {
        ok: false,
        status: 'failed',
        provider: 'sqlite',
        requestId,
        failureCode,
        retryable,
        checkpoint: parseLocalJson(row.checkpoint_json),
      };
    });
  } catch (error) {
    return localStorageFailure('fail', error);
  }
}

async function callSupabaseRpc(name, parameters) {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { ok: false, status: 'persistence_unavailable', provider: 'supabase' };
    const { data, error } = await supabase.rpc(name, parameters);
    if (error) {
      logger.warn(`generation_request_repository:${name}_failed`, error, { provider: 'supabase' });
      return { ok: false, status: 'storage_error', provider: 'supabase' };
    }
    return { ok: true, row: firstRpcRow(data) };
  } catch (error) {
    logger.warn(`generation_request_repository:${name}_failed`, error, { provider: 'supabase' });
    return { ok: false, status: 'storage_error', provider: 'supabase' };
  }
}

async function reserveSupabaseGenerationRequest({ key, requestHash }) {
  const result = await callSupabaseRpc('reserve_generation_request', {
    p_idempotency_key: key,
    p_request_hash: requestHash,
  });
  if (!result.ok) return result;
  const row = result.row;
  const common = mapCommonRow(row, 'supabase');
  switch (row?.outcome) {
    case 'reserved':
      return {
        ok: true,
        status: 'reserved',
        ...common,
        leaseToken: row.lease_token,
        resumed: Number(row.attempt_count) > 1,
      };
    case 'in_progress':
      return {
        ok: true,
        status: 'in_progress',
        ...common,
        retryAfterSeconds: common.leaseExpiresAt
          ? Math.max(1, Math.ceil((Date.parse(common.leaseExpiresAt) - Date.now()) / 1000))
          : undefined,
      };
    case 'completed':
      return { ok: true, status: 'replay', replayed: true, ...common };
    case 'failed':
      return { ok: false, status: 'failed', ...common };
    case 'hash_mismatch':
      return { ok: false, status: 'mismatch', ...common };
    default:
      return { ok: false, status: 'storage_error', provider: 'supabase' };
  }
}

async function checkpointSupabaseGenerationRequest({ requestId, leaseToken, checkpoint }) {
  const result = await callSupabaseRpc('checkpoint_generation_request', {
    p_request_id: requestId,
    p_lease_token: leaseToken,
    p_checkpoint: checkpoint,
  });
  if (!result.ok) return result;
  const common = mapCommonRow(result.row, 'supabase');
  switch (result.row?.outcome) {
    case 'checkpointed':
      return {
        ok: true,
        status: 'in_progress',
        ...common,
        requestId,
        checkpoint: result.row.checkpoint ?? checkpoint,
      };
    case 'not_found':
    case 'lease_lost':
      return { ok: false, status: 'lease_lost', provider: 'supabase' };
    default:
      return { ok: false, status: 'storage_error', provider: 'supabase' };
  }
}

async function completeSupabaseGenerationRequest({ requestId, leaseToken, trip }) {
  const result = await callSupabaseRpc('complete_generation_request', {
    p_request_id: requestId,
    p_lease_token: leaseToken,
    p_trip_record: {
      id: trip.id,
      destination: trip.destination,
      itinerary: trip.itinerary,
      metadata: trip.metadata,
      visibility: trip.visibility,
      status: trip.status,
      currency: trip.currency,
      schemaVersion: trip.schemaVersion,
      responsePayload: trip.responsePayload,
    },
  });
  if (!result.ok) return result;
  const common = mapCommonRow(result.row, 'supabase');
  switch (result.row?.outcome) {
    case 'completed':
      return { ok: true, status: 'replay', replayed: false, ...common, requestId };
    case 'already_completed':
      return { ok: true, status: 'replay', replayed: true, ...common, requestId };
    case 'not_found':
    case 'lease_lost':
      return { ok: false, status: 'lease_lost', provider: 'supabase' };
    case 'invalid_trip':
      return { ok: false, status: 'failed', provider: 'supabase', failureCode: 'invalid_trip' };
    default:
      return { ok: false, status: 'storage_error', provider: 'supabase' };
  }
}

async function failSupabaseGenerationRequest({ requestId, leaseToken, failureCode, retryable }) {
  const result = await callSupabaseRpc('fail_generation_request', {
    p_request_id: requestId,
    p_lease_token: leaseToken,
    p_failure_code: failureCode,
    p_retryable: retryable,
  });
  if (!result.ok) return result;
  const common = mapCommonRow(result.row, 'supabase');
  switch (result.row?.outcome) {
    case 'failed':
      return {
        ok: false,
        status: 'failed',
        ...common,
        requestId,
        failureCode,
        retryable: result.row.retryable === true,
      };
    case 'already_completed':
      return { ok: true, status: 'replay', replayed: true, ...common, requestId };
    case 'not_found':
    case 'lease_lost':
      return { ok: false, status: 'lease_lost', provider: 'supabase' };
    default:
      return { ok: false, status: 'storage_error', provider: 'supabase' };
  }
}

function backendUnavailable() {
  return { ok: false, status: 'persistence_unavailable' };
}

export async function reserveGenerationRequest(input, identity) {
  const userId = authenticatedUserId(identity);
  if (!userId) return { ok: false, status: 'auth_required' };
  const normalized = normalizeReservationInput(input);
  if (!normalized.ok) return normalized;
  const mode = getDataBackendMode();
  if (mode === 'sqlite') return reserveLocalGenerationRequest(normalized, userId);
  if (mode === 'supabase') return reserveSupabaseGenerationRequest(normalized);
  return backendUnavailable();
}

export async function checkpointGenerationRequest(input, identity) {
  const userId = authenticatedUserId(identity);
  if (!userId) return { ok: false, status: 'auth_required' };
  const lease = normalizeLeaseInput(input);
  if (!lease.ok) return lease;
  const checkpointResult = serializeJson(input?.checkpoint, 'checkpoint', MAX_CHECKPOINT_BYTES);
  if (!checkpointResult.ok
      || !checkpointResult.value
      || typeof checkpointResult.value !== 'object'
      || Array.isArray(checkpointResult.value)) {
    return {
      ok: false,
      status: 'failed',
      failureCode: checkpointResult.failureCode || 'invalid_checkpoint',
    };
  }
  const normalized = {
    ...lease,
    checkpoint: checkpointResult.value,
    checkpointJson: checkpointResult.serialized,
  };
  const mode = getDataBackendMode();
  if (mode === 'sqlite') return checkpointLocalGenerationRequest(normalized, userId);
  if (mode === 'supabase') return checkpointSupabaseGenerationRequest(normalized);
  return backendUnavailable();
}

export async function completeGenerationRequest(input, identity) {
  const userId = authenticatedUserId(identity);
  if (!userId) return { ok: false, status: 'auth_required' };
  const lease = normalizeLeaseInput(input);
  if (!lease.ok) return lease;
  const tripResult = normalizeTripRecord(input?.tripRecord);
  if (!tripResult.ok) return tripResult;
  const normalized = { ...lease, trip: tripResult.trip };
  const mode = getDataBackendMode();
  if (mode === 'sqlite') return completeLocalGenerationRequest(normalized, userId);
  if (mode === 'supabase') return completeSupabaseGenerationRequest(normalized);
  return backendUnavailable();
}

export async function failGenerationRequest(input, identity) {
  const userId = authenticatedUserId(identity);
  if (!userId) return { ok: false, status: 'auth_required' };
  const lease = normalizeLeaseInput(input);
  if (!lease.ok) return lease;
  const failureCode = typeof input?.failureCode === 'string' ? input.failureCode.trim() : '';
  if (failureCode.length < 3
      || failureCode.length > 80
      || !/^[A-Za-z][A-Za-z0-9_.-]+$/.test(failureCode)) {
    return { ok: false, status: 'failed', failureCode: 'invalid_failure_code' };
  }
  const normalized = { ...lease, failureCode, retryable: input?.retryable !== false };
  const mode = getDataBackendMode();
  if (mode === 'sqlite') return failLocalGenerationRequest(normalized, userId);
  if (mode === 'supabase') return failSupabaseGenerationRequest(normalized);
  return backendUnavailable();
}
