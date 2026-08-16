function boundedInteger(value, fallback, minimum, maximum) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.trunc(parsed)));
}

function travelerCount(travelers) {
  if (typeof travelers === 'number') return boundedInteger(travelers, 1, 1, 20);
  const adults = boundedInteger(travelers?.adults, 0, 0, 20);
  const children = boundedInteger(travelers?.children, 0, 0, 20);
  return Math.min(20, Math.max(1, adults + children));
}

function dateField(dates, ...keys) {
  for (const key of keys) {
    const value = dates?.[key];
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  }
  return null;
}

function allocateNights(destinations, days) {
  if (destinations.length < 2 || days <= destinations.length) return null;
  const totalNights = days - 1;
  const base = Math.floor(totalNights / destinations.length);
  let remainder = totalNights % destinations.length;
  return destinations.map((destination, index) => {
    const nights = base + (remainder > 0 ? 1 : 0);
    remainder = Math.max(0, remainder - 1);
    return {
      id: `intent-stage-${index + 1}`,
      destination: destination.canonical,
      destinationEntity: destination.destinationEntity || null,
      nights,
      transportMode: 'unspecified',
      arrivalWindow: 'afternoon',
      departureWindow: 'morning',
    };
  });
}

export function buildGenerationPayloadFromIntent(intent, adaptiveAnswers = {}) {
  const fields = intent?.fields || {};
  const destinations = Array.isArray(fields.destinations)
    ? fields.destinations.filter((item) => item?.canonical)
    : [];
  const destination = destinations[0]?.canonical || '';
  const days = boundedInteger(fields.durationDays, 5, 1, 30);
  const interests = Array.isArray(fields.interests)
    ? fields.interests.map((item) => item?.id || item?.label).filter(Boolean)
    : [];
  const stages = allocateNights(destinations, days);
  const pace = fields.pace?.pace === 'fast' ? 'intense' : fields.pace?.pace || 'balanced';
  const startDate = dateField(fields.dates, 'startDate', 'start');

  return {
    destination,
    destinationEntity: destinations[0]?.destinationEntity || null,
    ...(stages ? {
      journey: {
        schemaVersion: 2,
        kind: 'multi_destination',
        totalNights: days - 1,
        stages,
      },
    } : {}),
    days,
    budget: fields.budget?.tier || 'moderate',
    travelers: travelerCount(fields.travelers),
    style: interests.join(', ') || 'general',
    startDate,
    endDate: dateField(fields.dates, 'endDate', 'end'),
    datesFlexible: !startDate,
    travelerType: fields.travelers?.type || 'unspecified',
    transportPreference: adaptiveAnswers.transportPreference || 'any',
    pace,
    mustSee: interests,
    avoid: [],
    adaptiveAnswers,
  };
}

export function resolveGeneratedItineraryResponse(data) {
  const itinerary = data?.itinerary || data;
  const persistence = data?.persistence || itinerary?.persistence;
  if (!itinerary || typeof itinerary !== 'object' || !Array.isArray(itinerary.days)) {
    throw new Error('O servidor não devolveu um roteiro válido.');
  }
  if (persistence?.mode === 'durable' && persistence.persisted === true) {
    if (!itinerary.id) throw new Error('O roteiro foi guardado sem um identificador válido.');
    return { mode: 'durable', id: itinerary.id, itinerary, persistence };
  }
  if (
    persistence?.mode === 'local_draft'
    && persistence.persisted === false
    && persistence.reason === 'auth_required'
  ) {
    return {
      mode: 'local_draft',
      id: null,
      itinerary: { ...itinerary, persistence },
      persistence,
    };
  }
  throw new Error('O roteiro não ficou guardado. Tenta novamente.');
}

export async function fingerprintGenerationPayload(payload) {
  const serialized = JSON.stringify(payload);
  if (globalThis.crypto?.subtle && typeof TextEncoder !== 'undefined') {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(serialized));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  let hash = 2166136261;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function createGenerationIntentKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `andor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}
