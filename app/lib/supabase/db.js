import 'server-only';

import { logger } from '../logger';
import { getRequestIdentity } from '../server/identity';
import {
  createTripRecord,
  getTripRecord,
  updateTripRecord,
} from '../server/trip-repository';
import { createSupabaseAdminClient } from './admin';

// Compatibility facade for generation and older server callers. Trip authorization
// and backend selection live in the request-scoped repository; this module never
// falls back from a failed Supabase write to SQLite.
export async function createItineraryRecord(itinerary, metadata = {}) {
  const identity = metadata.identity || await getRequestIdentity();
  const result = await createTripRecord(itinerary, metadata, identity);
  if (!result.ok) {
    return { ok: false, provider: 'none', reason: result.status };
  }
  return {
    ok: true,
    provider: result.provider,
    id: result.trip.id,
    version: result.trip.version,
    shareToken: null,
  };
}

export async function getItineraryRecord(id, identityOverride = null) {
  const identity = identityOverride || await getRequestIdentity();
  const result = await getTripRecord(id, identity);
  if (!result.ok) return null;
  return {
    id: result.trip.id,
    version: result.trip.version,
    permission: result.trip.permission,
    shareToken: null,
    itinerary: result.trip.itinerary,
  };
}

export async function updateItineraryRecord(id, itinerary, identityOverride = null) {
  const identity = identityOverride || await getRequestIdentity();
  const expectedVersion = Number(itinerary?.version);
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
    return { ok: false, reason: 'precondition_required' };
  }
  const result = await updateTripRecord(id, itinerary, expectedVersion, identity);
  return result.ok
    ? { ok: true, provider: result.provider, version: result.trip.version }
    : { ok: false, reason: result.status, currentVersion: result.currentVersion };
}

export async function createNewsletterSubscriber({ email, source = 'newsletter_popup', locale = 'pt', metadata = {} }) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, provider: 'none', reason: 'supabase_not_configured' };

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .upsert(
      {
        email,
        source,
        locale,
        metadata,
        status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    )
    .select('id')
    .single();

  if (error) {
    logger.warn('supabase:newsletter_failed', error, { source });
    return { ok: false, provider: 'none', reason: 'storage_error' };
  }
  return { ok: true, provider: 'supabase', id: data.id };
}

export async function createCustomRequestRecord(payload) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, provider: 'none', reason: 'supabase_not_configured' };

  const identity = await getRequestIdentity();
  if (!identity?.authenticated || !identity.userId) {
    return { ok: false, provider: 'none', reason: 'auth_required' };
  }
  const { data, error } = await supabase
    .from('custom_requests')
    .insert({
      user_id: identity.userId,
      destination: payload.destination,
      start_date: payload.startDate,
      end_date: payload.endDate,
      budget: Number(payload.budget) || null,
      travelers: String(payload.travelers || ''),
      notes: payload.notes || '',
      status: 'pending',
    })
    .select('id, status, created_at')
    .single();

  if (error) {
    logger.warn('supabase:custom_request_failed', error);
    return { ok: false, provider: 'none', reason: 'storage_error' };
  }

  return { ok: true, provider: 'supabase', request: data };
}
