import { createSupabaseAdminClient } from './admin';
import { createSupabaseServerClient } from './server';
import { logger } from '../logger';

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

async function getCurrentUserId() {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const { data } = await supabase.auth.getClaims();
    return data?.claims?.sub || null;
  } catch (error) {
    logger.warn('supabase:get_current_user_failed', error);
    return null;
  }
}

export async function createItineraryRecord(itinerary, metadata = {}) {
  const supabase = createSupabaseAdminClient();
  if (!supabase || !itinerary) {
    return { ok: false, provider: 'local', reason: 'supabase_not_configured' };
  }

  const destination = getDestinationParts(itinerary);
  const trip = itinerary.trip || {};
  const days = Array.isArray(itinerary.days) ? itinerary.days : [];
  const userId = metadata.userId === undefined ? await getCurrentUserId() : metadata.userId;

  const row = {
    user_id: userId || null,
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

  const { data, error } = await supabase
    .from('itineraries')
    .insert(row)
    .select('id, share_token')
    .single();

  if (error) {
    logger.warn('supabase:create_itinerary_failed', error, { destination: destination.label });
    return { ok: false, provider: 'local', reason: error.message };
  }

  return {
    ok: true,
    provider: 'supabase',
    id: data.id,
    shareToken: data.share_token,
  };
}

export async function getItineraryRecord(idOrToken) {
  const supabase = createSupabaseAdminClient();
  if (!supabase || !idOrToken) return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrToken);
  let query = supabase.from('itineraries').select('*').limit(1);
  query = isUuid
    ? query.or(`id.eq.${idOrToken},share_token.eq.${idOrToken}`)
    : query.eq('id', idOrToken);

  const { data, error } = await query.maybeSingle();
  if (error) {
    logger.warn('supabase:get_itinerary_failed', error, { idOrToken });
    return null;
  }
  if (!data) return null;

  return {
    id: data.id,
    shareToken: data.share_token,
    itinerary: {
      ...data.itinerary,
      id: data.id,
      shareToken: data.share_token,
      savedAt: data.itinerary?.savedAt || data.created_at,
    },
  };
}

export async function updateItineraryRecord(id, itinerary) {
  const supabase = createSupabaseAdminClient();
  if (!supabase || !id || !itinerary) return { ok: false };

  const { error } = await supabase
    .from('itineraries')
    .update({ itinerary, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    logger.warn('supabase:update_itinerary_failed', error, { id });
    return { ok: false, reason: error.message };
  }
  return { ok: true };
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

  const userId = await getCurrentUserId();
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
