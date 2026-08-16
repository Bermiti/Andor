import 'server-only';

import { createHash, randomUUID } from 'node:crypto';
import { createSupabaseAdminClient } from '../supabase/admin';
import { createSupabaseServerClient } from '../supabase/server';
import { canPerformTripAction } from '../trip-permissions';
import { logger } from '../logger';
import { getDataBackendMode } from './backend-mode';
import {
  createLocalTrip,
  getLocalTripForUser,
  getLocalTripImport,
  listLocalTripsForUser,
  recordLocalTripImport,
  softDeleteLocalTrip,
  updateLocalTrip,
} from './local-trip-store';

function text(value, fallback = '') {
  const result = value == null ? '' : String(value).trim();
  return result || fallback;
}

function destinationParts(itinerary) {
  const destination = itinerary?.destination;
  if (typeof destination === 'string') {
    const [city = '', ...rest] = destination.split(',').map((part) => part.trim());
    const country = rest.join(', ');
    return { label: destination, city: city || destination, country: country || null };
  }
  const city = text(destination?.canonicalName || destination?.city || destination?.name || itinerary?.title, 'Destino');
  const region = text(destination?.regionCode || destination?.region, '');
  const country = text(destination?.countryCode || destination?.country, '');
  return {
    label: text(destination?.displayName, [city, region, country].filter(Boolean).join(', ')),
    city,
    country: country || null,
  };
}

function currencyCode(itinerary) {
  const raw = itinerary?.destination?.currency
    || itinerary?.trip?.budgetBreakdown?.currency
    || itinerary?.trip?.currency
    || itinerary?.currency;
  const code = typeof raw === 'object' ? raw?.code : raw;
  return text(code, '').toUpperCase().slice(0, 8) || null;
}

function mapSupabaseTrip(row, role = null) {
  if (!row) return null;
  return {
    id: row.id,
    ownerId: row.owner_id || row.user_id,
    destination: row.destination,
    itinerary: row.itinerary,
    visibility: row.visibility || 'private',
    status: row.status || 'draft',
    currency: row.currency || null,
    schemaVersion: Number(row.schema_version) || 1,
    version: Number(row.version) || 1,
    deletedAt: row.deleted_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    role,
  };
}

function tripDto(record, provider) {
  if (!record) return null;
  return {
    id: record.id,
    ownerId: record.ownerId,
    permission: record.role,
    version: record.version,
    visibility: record.visibility,
    status: record.status,
    currency: record.currency,
    schemaVersion: record.schemaVersion,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
    persistence: provider,
    itinerary: {
      ...(record.itinerary || {}),
      id: record.id,
      version: record.version,
    },
  };
}

async function getSupabaseMembership(supabase, tripId, userId) {
  const { data, error } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .is('revoked_at', null)
    .maybeSingle();
  if (error) {
    logger.warn('trip_repository:membership_read_failed', error, { tripId });
    return null;
  }
  return data?.role || null;
}

async function writeSupabaseAudit(identity, event) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    logger.warn('trip_repository:audit_write_failed', null, {
      action: event.action,
      reason: 'admin_client_unavailable',
    });
    return;
  }
  const { error } = await admin.from('audit_events').insert({
    actor_user_id: identity.userId,
    action: event.action,
    resource_type: event.resourceType || 'trip',
    resource_id: event.resourceId,
    correlation_id: event.correlationId || null,
    metadata: event.metadata || {},
  });
  if (error) logger.warn('trip_repository:audit_write_failed', error, { action: event.action });
}

function requireIdentity(identity) {
  return Boolean(identity?.authenticated && identity?.userId);
}

export async function createTripRecord(itinerary, metadata = {}, identity) {
  if (!requireIdentity(identity)) return { ok: false, status: 'auth_required' };
  if (!itinerary || typeof itinerary !== 'object') return { ok: false, status: 'invalid' };

  const mode = getDataBackendMode();
  const destination = destinationParts(itinerary);
  const trip = itinerary.trip || {};
  const values = {
    id: metadata.id || randomUUID(),
    owner_id: identity.userId,
    user_id: identity.userId,
    destination: destination.label || 'Destino',
    destination_city: destination.city,
    destination_country: destination.country,
    days_count: Number(metadata.days || trip.totalDays || itinerary.days?.length || 0),
    style: metadata.style || trip.travelStyle || itinerary.style || null,
    budget_tier: metadata.budget || trip.budgetTier || null,
    travelers: Number(metadata.travelers || trip.travelers || 0) || null,
    start_date: metadata.startDate || trip.startDate || null,
    end_date: metadata.endDate || trip.endDate || null,
    itinerary,
    source: metadata.source || 'generated',
    visibility: 'private',
    status: metadata.status || 'draft',
    currency: currencyCode(itinerary),
    schema_version: Number(itinerary.schemaVersion || itinerary.dataVersion || 1),
  };

  if (mode === 'sqlite') {
    const result = createLocalTrip({
      id: values.id,
      ownerId: identity.userId,
      destination: values.destination,
      itinerary,
      metadata: {
        days: values.days_count,
        style: values.style,
        budget: values.budget_tier,
        travelers: values.travelers,
        startDate: values.start_date,
        endDate: values.end_date,
        source: values.source,
      },
      status: values.status,
      currency: values.currency,
      schemaVersion: values.schema_version,
      correlationId: metadata.correlationId,
    });
    return result.ok
      ? { ok: true, provider: 'sqlite', trip: tripDto(result.trip, 'sqlite') }
      : result;
  }
  if (mode !== 'supabase') return { ok: false, status: 'persistence_unavailable' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, status: 'persistence_unavailable' };
  const { data, error } = await supabase
    .from('itineraries')
    .insert(values)
    .select('*')
    .single();
  if (error) {
    logger.warn('trip_repository:create_failed', error, { destination: destination.label });
    return { ok: false, status: error.code === '23505' ? 'conflict' : 'storage_error' };
  }
  const role = await getSupabaseMembership(supabase, data.id, identity.userId) || 'owner';
  return { ok: true, provider: 'supabase', trip: tripDto(mapSupabaseTrip(data, role), 'supabase') };
}

export async function listTripRecords(identity) {
  if (!requireIdentity(identity)) return { ok: false, status: 'auth_required', trips: [] };
  const mode = getDataBackendMode();
  if (mode === 'sqlite') {
    return {
      ok: true,
      provider: 'sqlite',
      trips: listLocalTripsForUser(identity.userId).map((trip) => tripDto(trip, 'sqlite')),
    };
  }
  if (mode !== 'supabase') return { ok: false, status: 'persistence_unavailable', trips: [] };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, status: 'persistence_unavailable', trips: [] };
  const { data, error } = await supabase
    .from('itineraries')
    .select('*')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });
  if (error) {
    logger.warn('trip_repository:list_failed', error);
    return { ok: false, status: 'storage_error', trips: [] };
  }
  const trips = await Promise.all((data || []).map(async (row) => {
    const role = await getSupabaseMembership(supabase, row.id, identity.userId);
    return tripDto(mapSupabaseTrip(row, role), 'supabase');
  }));
  return { ok: true, provider: 'supabase', trips: trips.filter((trip) => trip.permission) };
}

export async function getTripRecord(id, identity, options = {}) {
  if (!requireIdentity(identity)) return { ok: false, status: 'auth_required' };
  const mode = getDataBackendMode();
  if (mode === 'sqlite') {
    const record = getLocalTripForUser(id, identity.userId, options);
    return record
      ? { ok: true, provider: 'sqlite', trip: tripDto(record, 'sqlite') }
      : { ok: false, status: 'not_found' };
  }
  if (mode !== 'supabase') return { ok: false, status: 'persistence_unavailable' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, status: 'persistence_unavailable' };
  let query = supabase.from('itineraries').select('*').eq('id', id);
  if (!options.includeDeleted) query = query.is('deleted_at', null);
  const { data, error } = await query.maybeSingle();
  if (error) {
    logger.warn('trip_repository:get_failed', error, { id });
    return { ok: false, status: 'storage_error' };
  }
  if (!data) return { ok: false, status: 'not_found' };
  const role = await getSupabaseMembership(supabase, id, identity.userId);
  if (!role) return { ok: false, status: 'not_found' };
  return { ok: true, provider: 'supabase', trip: tripDto(mapSupabaseTrip(data, role), 'supabase') };
}

export async function requireTripAction(id, identity, action) {
  const result = await getTripRecord(id, identity);
  if (!result.ok) return result;
  return canPerformTripAction(result.trip.permission, action)
    ? result
    : { ok: false, status: 'forbidden', trip: result.trip };
}

export async function updateTripRecord(id, itinerary, expectedVersion, identity, metadata = {}) {
  if (!requireIdentity(identity)) return { ok: false, status: 'auth_required' };
  const permission = await getTripRecord(id, identity);
  if (!permission.ok) return permission;
  if (!canPerformTripAction(permission.trip.permission, 'edit')) {
    return { ok: false, status: 'forbidden' };
  }
  if (Number(expectedVersion) !== permission.trip.version) {
    return { ok: false, status: 'conflict', currentVersion: permission.trip.version, trip: permission.trip };
  }

  const mode = getDataBackendMode();
  if (mode === 'sqlite') {
    const result = updateLocalTrip({
      id,
      userId: identity.userId,
      itinerary,
      expectedVersion,
      correlationId: metadata.correlationId,
    });
    return result.ok
      ? { ok: true, provider: 'sqlite', trip: tripDto(result.trip, 'sqlite') }
      : result;
  }
  if (mode !== 'supabase') return { ok: false, status: 'persistence_unavailable' };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('itineraries')
    .update({ itinerary, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('version', Number(expectedVersion))
    .is('deleted_at', null)
    .select('*')
    .maybeSingle();
  if (error) {
    logger.warn('trip_repository:update_failed', error, { id });
    return { ok: false, status: 'storage_error' };
  }
  if (!data) {
    const current = await getTripRecord(id, identity);
    return current.ok
      ? { ok: false, status: 'conflict', currentVersion: current.trip.version, trip: current.trip }
      : current;
  }
  const role = permission.trip.permission;
  return { ok: true, provider: 'supabase', trip: tripDto(mapSupabaseTrip(data, role), 'supabase') };
}

export async function deleteTripRecord(id, identity, metadata = {}) {
  const permission = await requireTripAction(id, identity, 'delete');
  if (!permission.ok) return permission;
  const mode = getDataBackendMode();
  if (mode === 'sqlite') {
    return softDeleteLocalTrip({ id, userId: identity.userId, correlationId: metadata.correlationId });
  }
  if (mode !== 'supabase') return { ok: false, status: 'persistence_unavailable' };

  const supabase = await createSupabaseServerClient();
  const deletedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('itineraries')
    .update({ deleted_at: deletedAt, updated_at: deletedAt })
    .eq('id', id)
    .eq('owner_id', identity.userId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, status: 'storage_error' };
  if (!data) return { ok: false, status: 'not_found' };
  await supabase.from('trip_share_links').update({ revoked_at: deletedAt }).eq('trip_id', id).is('revoked_at', null);
  return { ok: true, provider: 'supabase', deletedAt };
}

export function canonicalPayloadHash(value) {
  const canonicalize = (input) => {
    if (Array.isArray(input)) return input.map(canonicalize);
    if (!input || typeof input !== 'object') return input;
    return Object.fromEntries(
      Object.keys(input).sort().map((key) => [key, canonicalize(input[key])])
    );
  };
  return createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex');
}

export function deterministicImportTripId(userId, idempotencyKey) {
  const hex = createHash('sha256').update(`${userId}\0${idempotencyKey}`).digest('hex').slice(0, 32).split('');
  hex[12] = '5';
  hex[16] = ['8', '9', 'a', 'b'][Number.parseInt(hex[16], 16) % 4];
  const value = hex.join('');
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

export async function importLegacyTrip({ itinerary, idempotencyKey }, identity, metadata = {}) {
  if (!requireIdentity(identity)) return { ok: false, status: 'auth_required' };
  const payloadHash = canonicalPayloadHash(itinerary);
  const mode = getDataBackendMode();
  const tripId = deterministicImportTripId(identity.userId, idempotencyKey);

  if (mode === 'sqlite') {
    const existing = getLocalTripImport(identity.userId, idempotencyKey);
    if (existing) {
      return existing.payloadHash === payloadHash && existing.status === 'completed'
        ? { ok: true, status: 'replayed', provider: 'sqlite', tripId: existing.tripId }
        : { ok: false, status: 'conflict', tripId: existing.tripId };
    }
    const created = await createTripRecord(itinerary, {
      ...metadata,
      id: tripId,
      source: 'legacy-import',
    }, identity);
    if (!created.ok) return created;
    recordLocalTripImport({
      userId: identity.userId,
      idempotencyKey,
      payloadHash,
      tripId: created.trip.id,
    });
    return { ok: true, status: 'imported', provider: 'sqlite', tripId: created.trip.id, trip: created.trip };
  }
  if (mode !== 'supabase') return { ok: false, status: 'persistence_unavailable' };

  const supabase = await createSupabaseServerClient();
  const { data: existing, error: readError } = await supabase
    .from('trip_imports')
    .select('payload_hash, trip_id, status')
    .eq('user_id', identity.userId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();
  if (readError) return { ok: false, status: 'storage_error' };
  if (existing) {
    return existing.payload_hash === payloadHash && existing.status === 'completed'
      ? { ok: true, status: 'replayed', provider: 'supabase', tripId: existing.trip_id }
      : { ok: false, status: 'conflict', tripId: existing.trip_id };
  }

  const created = await createTripRecord(itinerary, {
    ...metadata,
    id: tripId,
    source: 'legacy-import',
  }, identity);
  if (!created.ok && created.status !== 'conflict') return created;
  const { error: insertError } = await supabase.from('trip_imports').insert({
    user_id: identity.userId,
    idempotency_key: idempotencyKey,
    payload_hash: payloadHash,
    trip_id: tripId,
    status: 'completed',
  });
  if (insertError) {
    const { data: raced } = await supabase
      .from('trip_imports')
      .select('payload_hash, trip_id, status')
      .eq('user_id', identity.userId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    if (raced?.payload_hash === payloadHash && raced?.status === 'completed') {
      return { ok: true, status: 'replayed', provider: 'supabase', tripId: raced.trip_id };
    }
    return { ok: false, status: 'conflict', tripId: raced?.trip_id || tripId };
  }
  await writeSupabaseAudit(identity, {
    action: 'trip.imported',
    resourceId: tripId,
    correlationId: metadata.correlationId,
    metadata: { source: 'legacy-import', importCount: 1 },
  });
  return { ok: true, status: 'imported', provider: 'supabase', tripId, trip: created.trip };
}
