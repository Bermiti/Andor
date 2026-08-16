/**
 * In-memory product telemetry. Nothing in this module sends data to a third
 * party or persists it between page loads. See docs/commercial/analytics.md
 * before adding a provider: consent and a data-retention decision are required.
 */

const MAX_BUFFERED_EVENTS = 200;
const MAX_STRING_LENGTH = 160;
const MAX_ARRAY_LENGTH = 12;
const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]{1,63}$/;
const SENSITIVE_PROPERTY_PATTERN = /(?:^|_)(?:address|auth|code|email|first_name|full_name|latitude|longitude|message|name|notes|phone|query|secret|token|url)(?:$|_)/i;
const SENSITIVE_EXACT_KEYS = new Set([
  'destination',
  'id',
  'origin',
  'origin_city',
  'departure_city',
  'trip_id',
  'user_id',
]);

function sanitizePrimitive(value) {
  if (typeof value === 'string') return value.trim().slice(0, MAX_STRING_LENGTH);
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'boolean') return value;
  return undefined;
}

export function sanitizeAnalyticsProperties(properties = {}) {
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) return {};

  return Object.entries(properties).reduce((safeProperties, [key, value]) => {
    const normalizedKey = String(key).trim().slice(0, 64);
    if (
      !normalizedKey
      || SENSITIVE_EXACT_KEYS.has(normalizedKey.toLowerCase())
      || SENSITIVE_PROPERTY_PATTERN.test(normalizedKey)
    ) return safeProperties;

    if (Array.isArray(value)) {
      const safeValues = value
        .slice(0, MAX_ARRAY_LENGTH)
        .map(sanitizePrimitive)
        .filter((item) => item !== undefined);
      if (safeValues.length) safeProperties[normalizedKey] = safeValues;
      return safeProperties;
    }

    const safeValue = sanitizePrimitive(value);
    if (safeValue !== undefined) safeProperties[normalizedKey] = safeValue;
    return safeProperties;
  }, {});
}

function getReferrerHost() {
  try {
    return document.referrer ? new URL(document.referrer).hostname.slice(0, 120) : '';
  } catch {
    return '';
  }
}

export function sanitizeAnalyticsPath(pathname = '') {
  const path = String(pathname).slice(0, 240);
  return path
    .replace(/^\/invitations\/[^/]+/i, '/invitations/:token')
    .replace(/^\/itinerary\/share\/[^/]+/i, '/itinerary/share/:token')
    .replace(/^\/itinerary\/(?!share(?:\/|$)|tokyo-food(?:\/|$)|hidden-gems-lisbon(?:\/|$))[^/]+/i, '/itinerary/:id');
}

export function trackEvent(eventName, properties = {}) {
  if (typeof window === 'undefined' || !EVENT_NAME_PATTERN.test(String(eventName))) return false;

  try {
    if (!Array.isArray(window.andor_events)) window.andor_events = [];

    const eventPayload = {
      event: eventName,
      properties: {
        ...sanitizeAnalyticsProperties(properties),
        path: sanitizeAnalyticsPath(window.location.pathname),
        referrer_host: getReferrerHost(),
        timestamp: new Date().toISOString(),
      },
    };

    window.andor_events.push(eventPayload);
    if (window.andor_events.length > MAX_BUFFERED_EVENTS) {
      window.andor_events.splice(0, window.andor_events.length - MAX_BUFFERED_EVENTS);
    }

    window.dispatchEvent(new CustomEvent('andor-telemetry', { detail: eventPayload }));
    return true;
  } catch {
    // Analytics must never break a product flow. Returning false keeps failure
    // observable to callers and tests without logging traveler data.
    return false;
  }
}
