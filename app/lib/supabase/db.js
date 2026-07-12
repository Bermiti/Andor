import { createSupabaseAdminClient } from './admin';
import { logger } from '../logger';
import { getRequestIdentity, ownsResource } from '../server/identity';
import {
  getLocalItinerary,
  updateLocalItinerary,
  upsertLocalItinerary,
} from '../server/local-db';

function getDestinationParts(itinerary) {
  const destination = itinerary?.destination;
  if (typeof destination === 'string') {
    const [city, ...rest] = destination.split(',').map((part) => part.trim()).filter(Boolean);
    return {
      label: destination,
      city: city || destination,
      country: rest.join(', ') || null,
    };
  }

  const city = destination?.city || destination?.name || itinerary?.title || 'Destino';
  const country = destination?.country || null;
  return {
    label: [city, country].filter(Boolean).join(', ') || 'Destino',
    city,
    country,
  };
}

function ownsItineraryRow(identity, row) {
  if (ownsResource(identity, row?.owner_key || row?.ownerKey)) return true;
  return Boolean(
    identity?.provider === 'supabase'
    && identity.userId
    && row?.user_id
    && identity.userId === row.user_id
  );
}

export async function createItineraryRecord(itinerary, metadata = {}) {
  const identity = metadata.identity || await getRequestIdentity();
  if (!itinerary || !identity?.ownerKey) {
    return { ok: false, provider: 'none', reason: 'auth_required' };
  }

  const supabase = createSupabaseAdminClient();
  const destination = getDestinationParts(itinerary);
  const trip = itinerary.trip || {};
  const days = Array.isArray(itinerary.days) ? itinerary.days : [];
  const userId = identity.provider === 'supabase' ? identity.userId : null;

  const row = {
    user_id: userId || null,
    owner_key: identity.ownerKey,
    destination: destination.label,
    destination_city: destination.city,
    destination_country: destination.country,
    days_count: Number(metadata.days || trip.totalDays || days.length || 0),
    style: metadata.style || trip.travelStyle || itinerary.style || null,
    budget_tier: metadata.budget || trip.budgetTier || null,
    travelers: Number(metadata.travelers || 0) || null,
    start_date: metadata.startDate || trip.startDate || null,
    end_date: metadata.endDate || trip.endDate || null,
    itinerary,
    source: metadata.source || 'generated',
  };

  if (!supabase) {
    const local = upsertLocalItinerary({
      ownerKey: identity.ownerKey,
      userId: identity.userId,
      destination: destination.label,
      itinerary,
      metadata: {
        days: row.days_count,
        style: row.style,
        budget: row.budget_tier,
        travelers: row.travelers,
        startDate: row.start_date,
        endDate: row.end_date,
        source: row.source,
      },
    });
    return { ok: true, provider: 'sqlite', id: local.id, shareToken: null };
  }

  const { data, error } = await supabase
    .from('itineraries')
    .insert(row)
    .select('id, share_token')
    .single();

  if (error) {
    logger.warn('supabase:create_itinerary_failed', error, { destination: destination.label });
    const local = upsertLocalItinerary({
      ownerKey: identity.ownerKey,
      userId: identity.userId,
      destination: destination.label,
      itinerary,
      metadata: { source: row.source, fallbackReason: error.message },
    });
    return { ok: true, provider: 'sqlite', id: local.id, shareToken: null };
  }

  return {
    ok: true,
    provider: 'supabase',
    id: data.id,
    shareToken: data.share_token,
  };
}

export async function getItineraryRecord(id, identityOverride = null) {
  const identity = identityOverride || await getRequestIdentity();
  if (!id || !identity?.ownerKey) return null;

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    const local = getLocalItinerary(id);
    if (!local || !ownsItineraryRow(identity, local)) return null;
    return {
      id: local.id,
      shareToken: null,
      itinerary: {
        ...local.itinerary,
        id: local.id,
        savedAt: local.itinerary?.savedAt || local.createdAt,
      },
    };
  }

  const { data, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    logger.warn('supabase:get_itinerary_failed', error, { id });
    const local = getLocalItinerary(id);
    if (!local || !ownsItineraryRow(identity, local)) return null;
    return {
      id: local.id,
      shareToken: null,
      itinerary: { ...local.itinerary, id: local.id, savedAt: local.itinerary?.savedAt || local.createdAt },
    };
  }
  if (!data) {
    const local = getLocalItinerary(id);
    if (!local || !ownsItineraryRow(identity, local)) return null;
    return {
      id: local.id,
      shareToken: null,
      itinerary: { ...local.itinerary, id: local.id, savedAt: local.itinerary?.savedAt || local.createdAt },
    };
  }
  if (!ownsItineraryRow(identity, data)) return null;

  return {
    id: data.id,
    shareToken: null,
    itinerary: {
      ...data.itinerary,
      id: data.id,
      savedAt: data.itinerary?.savedAt || data.created_at,
    },
  };
}

export async function updateItineraryRecord(id, itinerary, identityOverride = null) {
  const identity = identityOverride || await getRequestIdentity();
  if (!id || !itinerary || !identity?.ownerKey) return { ok: false, reason: 'auth_required' };

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return updateLocalItinerary(id, identity.ownerKey, itinerary)
      ? { ok: true, provider: 'sqlite' }
      : { ok: false, reason: 'not_found' };
  }

  const existing = await getItineraryRecord(id, identity);
  if (!existing) return { ok: false, reason: 'not_found' };

  const { error } = await supabase
    .from('itineraries')
    .update({ itinerary, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    logger.warn('supabase:update_itinerary_failed', error, { id });
    if (updateLocalItinerary(id, identity.ownerKey, itinerary)) {
      return { ok: true, provider: 'sqlite' };
    }
    return { ok: false, reason: error.message };
  }
  return { ok: true, provider: 'supabase' };
}

export async function createNewsletterSubscriber({ email, source = 'newsletter_popup', locale = 'pt', metadata = {} }) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, provider: 'local', reason: 'supabase_not_configured' };

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
    logger.warn('supabase:newsletter_failed', error, { email });
    return { ok: false, provider: 'local', reason: error.message };
  }
  return { ok: true, provider: 'supabase', id: data.id };
}

export async function createCustomRequestRecord(payload) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, provider: 'local', reason: 'supabase_not_configured' };

  const identity = await getRequestIdentity();
  const userId = identity?.provider === 'supabase' ? identity.userId : null;
  const { data, error } = await supabase
    .from('custom_requests')
    .insert({
      user_id: userId,
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
    logger.warn('supabase:custom_request_failed', error, { destination: payload.destination });
    return { ok: false, provider: 'local', reason: error.message };
  }

  return { ok: true, provider: 'supabase', request: data };
}
