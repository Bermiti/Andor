import { getDayTitleQualityScore, isBannedDayTitle, suggestDayTitle } from './day-title-validator.js';
import { normalizeUnitedKingdomDestination } from './destination-geography.js';

export const DESTINATION_BOUNDS = {
  tokyo: { latMin: 35.0, latMax: 36.5, lngMin: 138.5, lngMax: 140.5, center: { lat: 35.6762, lng: 139.6503 } },
  paris: { latMin: 48.5, latMax: 49.2, lngMin: 1.8, lngMax: 2.8, center: { lat: 48.8566, lng: 2.3522 } },
  bali: { latMin: -8.9, latMax: -8.0, lngMin: 114.8, lngMax: 115.8, center: { lat: -8.3405, lng: 115.0920 } },
  lisbon: { latMin: 38.4, latMax: 39.1, lngMin: -9.6, lngMax: -8.7, center: { lat: 38.7223, lng: -9.1393 } },
  lisboa: { latMin: 38.4, latMax: 39.1, lngMin: -9.6, lngMax: -8.7, center: { lat: 38.7223, lng: -9.1393 } },
  london: { latMin: 51.2, latMax: 51.8, lngMin: -0.5, lngMax: 0.3, center: { lat: 51.5074, lng: -0.1278 } },
  londres: { latMin: 51.2, latMax: 51.8, lngMin: -0.5, lngMax: 0.3, center: { lat: 51.5074, lng: -0.1278 } },
  nyc: { latMin: 40.3, latMax: 41.0, lngMin: -74.3, lngMax: -73.5, center: { lat: 40.7128, lng: -74.0060 } },
  newyork: { latMin: 40.3, latMax: 41.0, lngMin: -74.3, lngMax: -73.5, center: { lat: 40.7128, lng: -74.0060 } },
  'new york': { latMin: 40.3, latMax: 41.0, lngMin: -74.3, lngMax: -73.5, center: { lat: 40.7128, lng: -74.0060 } },
  barcelona: { latMin: 41.2, latMax: 41.6, lngMin: 1.8, lngMax: 2.4, center: { lat: 41.3874, lng: 2.1686 } },
  rome: { latMin: 41.7, latMax: 42.1, lngMin: 12.2, lngMax: 12.8, center: { lat: 41.9028, lng: 12.4964 } },
  roma: { latMin: 41.7, latMax: 42.1, lngMin: 12.2, lngMax: 12.8, center: { lat: 41.9028, lng: 12.4964 } },
  amsterdam: { latMin: 52.2, latMax: 52.5, lngMin: 4.7, lngMax: 5.1, center: { lat: 52.3676, lng: 4.9041 } },
  marrakech: { latMin: 31.5, latMax: 31.75, lngMin: -8.2, lngMax: -7.85, center: { lat: 31.6295, lng: -8.0075 } },
  marrakesh: { latMin: 31.5, latMax: 31.75, lngMin: -8.2, lngMax: -7.85, center: { lat: 31.6295, lng: -8.0075 } },
  kyoto: { latMin: 34.8, latMax: 35.2, lngMin: 135.5, lngMax: 135.9, center: { lat: 35.0116, lng: 135.7681 } },
  osaka: { latMin: 34.45, latMax: 34.9, lngMin: 135.25, lngMax: 135.75, center: { lat: 34.6937, lng: 135.5023 } },
  porto: { latMin: 41.0, latMax: 41.3, lngMin: -8.8, lngMax: -8.45, center: { lat: 41.1579, lng: -8.6291 } },
  madrid: { latMin: 40.25, latMax: 40.6, lngMin: -3.9, lngMax: -3.45, center: { lat: 40.4168, lng: -3.7038 } },
  berlin: { latMin: 52.35, latMax: 52.7, lngMin: 13.1, lngMax: 13.65, center: { lat: 52.5200, lng: 13.4050 } },
  reykjavik: { latMin: 64.0, latMax: 64.25, lngMin: -22.1, lngMax: -21.7, center: { lat: 64.1466, lng: -21.9426 } },
};

const DESTINATION_DEFAULTS = {
  tokyo: { country: 'Japan', countryCode: 'JP', flag: 'JP', timezone: 'Asia/Tokyo', currency: { code: 'JPY', symbol: 'JPY' } },
  paris: { country: 'France', countryCode: 'FR', flag: 'FR', timezone: 'Europe/Paris', currency: { code: 'EUR', symbol: 'EUR' } },
  bali: { country: 'Indonesia', countryCode: 'ID', flag: 'ID', timezone: 'Asia/Makassar', currency: { code: 'IDR', symbol: 'IDR' } },
  lisbon: { country: 'Portugal', countryCode: 'PT', flag: 'PT', timezone: 'Europe/Lisbon', currency: { code: 'EUR', symbol: 'EUR' } },
  lisboa: { country: 'Portugal', countryCode: 'PT', flag: 'PT', timezone: 'Europe/Lisbon', currency: { code: 'EUR', symbol: 'EUR' } },
  london: { country: 'United Kingdom', countryCode: 'GB', flag: 'GB', timezone: 'Europe/London', currency: { code: 'GBP', symbol: 'GBP' } },
  barcelona: { country: 'Spain', countryCode: 'ES', flag: 'ES', timezone: 'Europe/Madrid', currency: { code: 'EUR', symbol: 'EUR' } },
  rome: { country: 'Italy', countryCode: 'IT', flag: 'IT', timezone: 'Europe/Rome', currency: { code: 'EUR', symbol: 'EUR' } },
  roma: { country: 'Italy', countryCode: 'IT', flag: 'IT', timezone: 'Europe/Rome', currency: { code: 'EUR', symbol: 'EUR' } },
  amsterdam: { country: 'Netherlands', countryCode: 'NL', flag: 'NL', timezone: 'Europe/Amsterdam', currency: { code: 'EUR', symbol: 'EUR' } },
  marrakech: { country: 'Morocco', countryCode: 'MA', flag: 'MA', timezone: 'Africa/Casablanca', currency: { code: 'MAD', symbol: 'MAD' } },
  kyoto: { country: 'Japan', countryCode: 'JP', flag: 'JP', timezone: 'Asia/Tokyo', currency: { code: 'JPY', symbol: 'JPY' } },
  osaka: { country: 'Japan', countryCode: 'JP', flag: 'JP', timezone: 'Asia/Tokyo', currency: { code: 'JPY', symbol: 'JPY' } },
  porto: { country: 'Portugal', countryCode: 'PT', flag: 'PT', timezone: 'Europe/Lisbon', currency: { code: 'EUR', symbol: 'EUR' } },
  madrid: { country: 'Spain', countryCode: 'ES', flag: 'ES', timezone: 'Europe/Madrid', currency: { code: 'EUR', symbol: 'EUR' } },
  berlin: { country: 'Germany', countryCode: 'DE', flag: 'DE', timezone: 'Europe/Berlin', currency: { code: 'EUR', symbol: 'EUR' } },
  reykjavik: { country: 'Iceland', countryCode: 'IS', flag: 'IS', timezone: 'Atlantic/Reykjavik', currency: { code: 'ISK', symbol: 'ISK' } },
  'new york': { country: 'United States', countryCode: 'US', flag: 'US', timezone: 'America/New_York', currency: { code: 'USD', symbol: 'USD' } },
  newyork: { country: 'United States', countryCode: 'US', flag: 'US', timezone: 'America/New_York', currency: { code: 'USD', symbol: 'USD' } },
  nyc: { country: 'United States', countryCode: 'US', flag: 'US', timezone: 'America/New_York', currency: { code: 'USD', symbol: 'USD' } },
};

function normalizeDestinationKey(value) {
  if (!value) return null;
  const source = typeof value === 'object'
    ? (value.city || value.name || value.destination || value.country || '')
    : String(value);
  const city = source.split(',')[0].trim().toLowerCase();
  const normalized = city.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (DESTINATION_BOUNDS[normalized]) return normalized;
  const compact = normalized.replace(/\s+/g, '');
  if (DESTINATION_BOUNDS[compact]) return compact;
  for (const key of Object.keys(DESTINATION_BOUNDS)) {
    if (normalized.includes(key) || key.includes(normalized)) return key;
  }
  return normalized || null;
}

export function getDestinationBounds(destination) {
  const key = normalizeDestinationKey(destination);
  return key ? DESTINATION_BOUNDS[key] || null : null;
}

function clone(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return null;
  }
}

function parseCoordinate(value) {
  if (Array.isArray(value) && value.length >= 2) {
    return { lat: Number(value[0]), lng: Number(value[1]) };
  }
  if (value && typeof value === 'object') {
    const lat = value.lat ?? value.latitude;
    const lng = value.lng ?? value.lon ?? value.longitude;
    if (lat !== undefined && lng !== undefined) return { lat: Number(lat), lng: Number(lng) };
  }
  return null;
}

function isPlausibleCoord(coords) {
  return Boolean(coords)
    && Number.isFinite(coords.lat)
    && Number.isFinite(coords.lng)
    && !(coords.lat === 0 && coords.lng === 0)
    && coords.lat >= -90
    && coords.lat <= 90
    && coords.lng >= -180
    && coords.lng <= 180;
}

function isInBounds(coords, bounds) {
  if (!isPlausibleCoord(coords) || !bounds) return false;
  return coords.lat >= bounds.latMin
    && coords.lat <= bounds.latMax
    && coords.lng >= bounds.lngMin
    && coords.lng <= bounds.lngMax;
}

function distanceKm(from, to) {
  if (!isPlausibleCoord(from) || !isPlausibleCoord(to)) return null;
  const radians = (degrees) => degrees * (Math.PI / 180);
  const earthRadiusKm = 6371;
  const latDelta = radians(to.lat - from.lat);
  const lngDelta = radians(to.lng - from.lng);
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(lngDelta / 2) ** 2;
  const boundedA = Math.min(1, Math.max(0, a));
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(boundedA), Math.sqrt(1 - boundedA));
}

function getDestinationRadiusKm(destination = {}) {
  const entityType = safeText(
    destination.entityType || destination.placeType || destination.type || destination.category,
    '',
  ).toLowerCase();
  if (/country|nation/.test(entityType)) return 2500;
  if (/region|state|province|territory/.test(entityType)) return 1000;
  if (/city|town|village|municipality|locality/.test(entityType)) return 250;
  return 500;
}

function isCoherentWithDestination(coords, destinationCenter, radiusKm) {
  if (!isPlausibleCoord(destinationCenter)) return true;
  const distance = distanceKm(coords, destinationCenter);
  return distance !== null && distance <= radiusKm;
}

function positiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function numberOr(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = parseFloat(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeText(value, fallback = '') {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || fallback;
}

function normalizeBudgetBreakdown(budgetBreakdown = {}) {
  const flightsMin = numberOr(budgetBreakdown.flights?.min ?? budgetBreakdown.flights, 0);
  const flightsMax = numberOr(budgetBreakdown.flights?.max, flightsMin);
  const accommodation = numberOr(budgetBreakdown.accommodation?.total ?? budgetBreakdown.accommodation, 0);
  const food = numberOr(budgetBreakdown.food?.total ?? budgetBreakdown.food, 0);
  const activities = numberOr(budgetBreakdown.activities?.total ?? budgetBreakdown.activities, 0);
  const transport = numberOr(budgetBreakdown.transport?.total ?? budgetBreakdown.transport, 0);
  const min = numberOr(budgetBreakdown.grandTotal?.min, flightsMin + accommodation + food + activities + transport);
  const max = numberOr(budgetBreakdown.grandTotal?.max, Math.max(min, flightsMax + accommodation + food + activities + transport));
  return {
    flights: { min: Math.max(0, flightsMin), max: Math.max(0, flightsMax) },
    accommodation: { total: Math.max(0, accommodation) },
    food: { total: Math.max(0, food) },
    activities: { total: Math.max(0, activities) },
    transport: { total: Math.max(0, transport) },
    grandTotal: { min: Math.max(0, min), max: Math.max(0, max) },
    perPersonEstimate: budgetBreakdown.perPersonEstimate || { min: Math.max(0, min), max: Math.max(0, max) },
    currency: budgetBreakdown.currency || 'EUR',
  };
}

function getRawActivities(day) {
  if (!day || typeof day !== 'object') return [];
  const activities = [];
  if (day.periods && typeof day.periods === 'object') {
    ['morning', 'afternoon', 'evening'].forEach((period) => {
      const periodActivities = day.periods?.[period]?.activities;
      if (Array.isArray(periodActivities)) {
        periodActivities.forEach((activity) => activities.push({ ...activity, period: activity.period || period }));
      }
    });
  }
  if (activities.length > 0) return activities;
  if (Array.isArray(day.activities)) return day.activities;
  if (Array.isArray(day.stops)) return day.stops;
  return [];
}

function normalizeTransport(transport, isFirst) {
  if (!transport || typeof transport !== 'object') return null;
  const source = transport;
  return {
    ...source,
    mode: safeText(source.mode, ''),
    line: safeText(source.line, ''),
    duration: safeText(source.duration, ''),
    cost: source.cost === undefined || source.cost === null ? null : Math.max(0, numberOr(source.cost, 0)),
    directions: safeText(source.directions, ''),
  };
}

function normalizeActivity(
  activity,
  dayIndex,
  activityIndex,
  bounds,
  destinationName,
  result,
  currencyCode = 'EUR',
  destinationCenter = null,
  destinationRadiusKm = 500,
) {
  const source = activity && typeof activity === 'object' ? activity : {};
  const name = safeText(source.name || source.title, `Stop ${activityIndex + 1}`);
  const rawCoords = parseCoordinate(source.coordinates || source.coords || source.location || source.coordinate);
  let coordinates = rawCoords;
  if (!isPlausibleCoord(rawCoords)) {
    coordinates = null;
    result.warnings.push(`Missing or invalid coordinates omitted for activity "${name}"`);
  } else if (bounds && !isInBounds(rawCoords, bounds)) {
    coordinates = null;
    result.valid = false;
    result.errors.push(`Activity "${name}" coordinates outside destination bounds; coordinates omitted`);
  } else if (!bounds && !isCoherentWithDestination(rawCoords, destinationCenter, destinationRadiusKm)) {
    coordinates = null;
    result.valid = false;
    result.errors.push(`Activity "${name}" coordinates are not coherent with the destination; coordinates omitted`);
  }

  let rating = numberOr(source.rating, null);
  if (rating !== null && (rating <= 0 || rating > 10)) {
    result.warnings.push(`Invalid rating ignored for activity "${name}"`);
    rating = null;
  }

  const rawCost = source.cost ?? source.estimatedCost ?? source.price;
  const cost = rawCost === undefined || rawCost === null || rawCost === ''
    ? null
    : Math.max(0, numberOr(rawCost, 0));
  const normalized = {
    ...source,
    id: safeText(source.id, `d${dayIndex + 1}-a${activityIndex + 1}`),
    name,
    type: safeText(source.type || source.category, 'atividade'),
    category: safeText(source.category || source.type, 'atividade'),
    emoji: safeText(source.emoji, '📍'),
    description: safeText(source.description || source.type, ''),
    address: safeText(source.address || source.area, ''),
    coordinates,
    startTime: safeText(source.startTime || source.time || source.hour, ''),
    time: safeText(source.time || source.startTime || source.hour, ''),
    duration: safeText(source.duration, ''),
    durationMinutes: source.durationMinutes === undefined || source.durationMinutes === null
      ? null
      : numberOr(source.durationMinutes, null),
    cost,
    estimatedCost: source.estimatedCost ?? null,
    currency: source.currency || currencyCode,
    rating,
    ratingSource: source.ratingSource || source.reviewSource || null,
    crowd: safeText(source.crowd, ''),
    bookingRequired: typeof source.bookingRequired === 'boolean' ? source.bookingRequired : null,
    insiderTip: safeText(source.insiderTip || source.localTip || source.localSecret, ''),
    localTip: safeText(source.localTip || source.insiderTip || source.localSecret, ''),
    photoKeyword: safeText(source.photoKeyword, ''),
    period: safeText(source.period, activityIndex === 0 ? 'morning' : activityIndex === 1 ? 'afternoon' : 'evening'),
    transportFromPrevious: normalizeTransport(source.transportFromPrevious || source.transport, activityIndex === 0),
    bookingUrl: source.bookingUrl || source.booking || null,
  };
  return normalized;
}

function buildPeriods(day, activities) {
  const existing = day.periods && typeof day.periods === 'object' ? day.periods : {};
  const periods = {
    morning: { ...(existing.morning || {}), timeRange: existing.morning?.timeRange || '09:00 - 12:00', activities: [] },
    afternoon: { ...(existing.afternoon || {}), timeRange: existing.afternoon?.timeRange || '13:00 - 17:00', activities: [] },
    evening: { ...(existing.evening || {}), timeRange: existing.evening?.timeRange || '18:00 - 22:00', activities: [] },
  };
  activities.forEach((activity, index) => {
    const period = ['morning', 'afternoon', 'evening'].includes(activity.period)
      ? activity.period
      : index === 0 ? 'morning' : index === 1 ? 'afternoon' : 'evening';
    periods[period].activities.push(activity);
  });
  return periods;
}

function normalizeMeal(
  meal,
  mealName,
  destinationName,
  bounds,
  result,
  currencyCode = 'EUR',
  destinationCenter = null,
  destinationRadiusKm = 500,
) {
  if (!meal || typeof meal !== 'object') return null;
  const source = meal;
  const name = safeText(source.name || source.restaurant, 'Sugestão por confirmar');
  let coordinates = parseCoordinate(source.coordinates || source.location);
  if (!isPlausibleCoord(coordinates)) {
    coordinates = null;
  } else if (bounds && !isInBounds(coordinates, bounds)) {
    coordinates = null;
    result.valid = false;
    result.errors.push(`${mealName} coordinates outside destination bounds; coordinates omitted`);
  } else if (!bounds && !isCoherentWithDestination(coordinates, destinationCenter, destinationRadiusKm)) {
    coordinates = null;
    result.valid = false;
    result.errors.push(`${mealName} coordinates are not coherent with the destination; coordinates omitted`);
  }
  const rawCost = source.cost ?? source.estimatedCost;
  return {
    ...source,
    name,
    cuisine: safeText(source.cuisine || source.type, ''),
    type: safeText(source.type, mealName),
    priceRange: safeText(source.priceRange, ''),
    cost: rawCost === undefined || rawCost === null || rawCost === '' ? null : Math.max(0, numberOr(rawCost, 0)),
    currency: source.currency || currencyCode,
    address: safeText(source.address, ''),
    coordinates,
    mustOrder: safeText(source.mustOrder || source.note, ''),
    openingHours: safeText(source.openingHours || source.hours, ''),
    bookingRequired: typeof source.bookingRequired === 'boolean' ? source.bookingRequired : null,
    insiderNote: safeText(source.insiderNote || source.localTip || source.note, ''),
  };
}

function normalizeDayTitle(day, dayIndex, destinationName, seenTitles, result) {
  const original = safeText(day.title || day.dayTitle, '');
  let title = original;
  const weak = !title || isBannedDayTitle(title) || getDayTitleQualityScore(title) < 40;
  if (weak) {
    title = suggestDayTitle({ ...day, dayIndex }, destinationName);
    result.warnings.push(`Repaired weak or banned day title for day ${dayIndex + 1}`);
  }
  if (isBannedDayTitle(title) || getDayTitleQualityScore(title) < 40) {
    const firstActivity = getRawActivities(day)[0]?.name || destinationName;
    title = `Local Hours: ${firstActivity} and ${destinationName} Backstreets`;
  }
  let uniqueTitle = title;
  let suffix = 2;
  while (seenTitles.has(uniqueTitle.trim().toLowerCase())) {
    uniqueTitle = `${title}: Route ${suffix}`;
    suffix += 1;
  }
  if (uniqueTitle !== title || original !== uniqueTitle) {
    result.warnings.push(`Duplicate or generic title normalized for day ${dayIndex + 1}`);
  }
  seenTitles.add(uniqueTitle.trim().toLowerCase());
  return uniqueTitle;
}

export function validateAndNormalize(itinerary, options = {}) {
  const result = { valid: true, warnings: [], errors: [], normalized: null, fatal: false };

  if (!itinerary || typeof itinerary !== 'object' || Array.isArray(itinerary)) {
    result.valid = false;
    result.fatal = true;
    result.errors.push('Itinerary is not an object');
    return result;
  }

  const normalized = clone(itinerary);
  if (!normalized) {
    result.valid = false;
    result.fatal = true;
    result.errors.push('Itinerary cannot be cloned safely');
    return result;
  }

  const destInput = normalized.destination || normalized.city || null;
  const ukDestination = normalizeUnitedKingdomDestination(destInput);
  const destName = ukDestination?.name || (typeof destInput === 'object'
    ? safeText(destInput.city || destInput.name || destInput.region || destInput.country, '')
    : safeText(destInput, ''));
  if (!destName) {
    result.valid = false;
    result.fatal = true;
    result.errors.push('Missing destination');
    return result;
  }

  const destinationInput = ukDestination || destInput;
  const destKey = normalizeDestinationKey(destinationInput);
  const legacyBounds = getDestinationBounds(destinationInput);
  const defaults = DESTINATION_DEFAULTS[destKey] || {};
  const rawDestination = ukDestination || (typeof destInput === 'object' ? destInput : {});
  const destinationCoords = parseCoordinate(rawDestination.coordinates);
  const hasResolvedCenter = isPlausibleCoord(destinationCoords) && Boolean(
    rawDestination.entityId
    || rawDestination.coordinateSource
    || rawDestination.resolutionStatus,
  );
  const bounds = hasResolvedCenter ? null : legacyBounds;
  const normalizedDestinationCoordinates = isPlausibleCoord(destinationCoords)
    ? [destinationCoords.lat, destinationCoords.lng]
    : bounds?.center
      ? [bounds.center.lat, bounds.center.lng]
      : null;
  if (rawDestination.coordinates != null && !isPlausibleCoord(destinationCoords)) {
    result.valid = false;
    result.errors.push('Destination coordinates are invalid and were omitted');
  }
  normalized.destination = {
    ...defaults,
    ...rawDestination,
    name: safeText(rawDestination.name || rawDestination.city, destName),
    city: ukDestination
      ? safeText(rawDestination.city, '')
      : safeText(rawDestination.city || rawDestination.name, destName.split(',')[0]),
    country: safeText(rawDestination.country, defaults.country || ''),
    countryCode: safeText(rawDestination.countryCode, defaults.countryCode || ''),
    flag: safeText(rawDestination.flag, defaults.flag || defaults.countryCode || ''),
    timezone: safeText(rawDestination.timezone, defaults.timezone || ''),
    currency: rawDestination.currency || defaults.currency || { code: 'EUR', symbol: 'EUR' },
    coordinates: normalizedDestinationCoordinates,
  };

  if (bounds && !isInBounds(parseCoordinate(normalized.destination.coordinates), bounds)) {
    normalized.destination.coordinates = [bounds.center.lat, bounds.center.lng];
    result.valid = false;
    result.errors.push('Destination coordinates were outside expected bounds and were repaired');
  }
  if (options?.requireDestinationCoordinate === true
    && !isPlausibleCoord(parseCoordinate(normalized.destination.coordinates))) {
    result.valid = false;
    result.fatal = true;
    result.errors.push('Destination coordinates are required to verify geographic coherence');
  }

  const rawDays = normalized.days || normalized.trip?.days || normalized.dailyPlan || [];
  if (!Array.isArray(rawDays) || rawDays.length === 0) {
    result.valid = false;
    result.fatal = true;
    result.errors.push('Missing days array');
    return result;
  }

  const explicitExpectedDays = positiveInteger(
    typeof options === 'number' ? options : options?.expectedDays,
  );
  const declaredDays = positiveInteger(normalized.trip?.totalDays);
  const expectedDays = explicitExpectedDays || declaredDays || rawDays.length;
  if (rawDays.length !== expectedDays) {
    result.valid = false;
    result.fatal = true;
    result.errors.push(`Expected exactly ${expectedDays} days, received ${rawDays.length}`);
  }
  if (explicitExpectedDays && declaredDays && declaredDays !== explicitExpectedDays) {
    result.warnings.push(`Trip totalDays was repaired from ${declaredDays} to ${explicitExpectedDays}`);
  }

  normalized.trip = {
    ...normalized.trip,
    totalDays: expectedDays,
    travelStyle: safeText(normalized.trip?.travelStyle || normalized.style, ''),
    groupType: safeText(normalized.trip?.groupType || normalized.travelers, ''),
    budgetTier: safeText(normalized.trip?.budgetTier || normalized.budgetTier || normalized.budget, ''),
    budgetBreakdown: normalizeBudgetBreakdown(normalized.trip?.budgetBreakdown || normalized.budgetBreakdown || {}),
    topTips: Array.isArray(normalized.trip?.topTips) ? normalized.trip.topTips : [],
  };
  const destinationCurrency = normalized.destination.currency?.code || normalized.destination.currency || 'EUR';
  normalized.trip.budgetBreakdown = normalizeBudgetBreakdown(normalized.trip.budgetBreakdown);
  normalized.trip.budgetBreakdown.currency = destinationCurrency;
  ['flights', 'accommodation', 'food', 'transport', 'activities', 'grandTotal'].forEach((key) => {
    if (normalized.trip.budgetBreakdown[key]) {
      normalized.trip.budgetBreakdown[key].currency = destinationCurrency;
    }
  });
  normalized.summary = normalized.summary || { title: `${normalized.destination.city} trip` };

  const seenTitles = new Set();
  let mapCriticalCount = 0;
  const destinationCenter = parseCoordinate(normalized.destination.coordinates);
  const destinationRadiusKm = getDestinationRadiusKm(normalized.destination);
  normalized.days = rawDays.map((rawDay, dayIndex) => {
    const day = rawDay && typeof rawDay === 'object' ? rawDay : {};
    const title = normalizeDayTitle(day, dayIndex, normalized.destination.city, seenTitles, result);
    const activities = getRawActivities(day).map((activity, activityIndex) => {
      const normalizedActivity = normalizeActivity(
        activity,
        dayIndex,
        activityIndex,
        bounds,
        normalized.destination.city,
        result,
        destinationCurrency,
        destinationCenter,
        destinationRadiusKm,
      );
      if (normalizedActivity.coordinates) mapCriticalCount += 1;
      return normalizedActivity;
    });

    if (activities.length === 0) {
      result.valid = false;
      result.fatal = true;
      result.errors.push(`Day ${dayIndex + 1} has no activities`);
    }

    const meals = day.meals && typeof day.meals === 'object' ? day.meals : {};
    return {
      ...day,
      dayNumber: numberOr(day.dayNumber, dayIndex + 1),
      date: safeText(day.date, ''),
      title,
      emoji: safeText(day.emoji, '📍'),
      theme: safeText(day.theme || day.areaFocus || day.area, normalized.destination.city),
      moodDescription: safeText(day.moodDescription || day.mood, ''),
      budgetEstimate: day.budgetEstimate === undefined || day.budgetEstimate === null
        ? null
        : Math.max(0, numberOr(day.budgetEstimate, 0)),
      estimatedCost: day.estimatedCost === undefined || day.estimatedCost === null
        ? null
        : Math.max(0, numberOr(day.estimatedCost, 0)),
      weather: day.weather || null,
      transport: day.transport || null,
      periods: buildPeriods(day, activities),
      activities,
      stops: activities,
      meals: {
        breakfast: 'breakfast' in meals ? normalizeMeal(meals.breakfast, 'breakfast', normalized.destination.city, bounds, result, destinationCurrency, destinationCenter, destinationRadiusKm) : null,
        lunch: normalizeMeal(meals.lunch, 'lunch', normalized.destination.city, bounds, result, destinationCurrency, destinationCenter, destinationRadiusKm),
        dinner: normalizeMeal(meals.dinner, 'dinner', normalized.destination.city, bounds, result, destinationCurrency, destinationCenter, destinationRadiusKm),
      },
      localSecret: safeText(day.localSecret || day.localSecrets, ''),
    };
  });

  if (mapCriticalCount === 0) {
    result.valid = false;
    result.fatal = true;
    result.errors.push('No map-critical coordinates available after normalization');
  }

  normalized.flightOptions = Array.isArray(normalized.flightOptions) ? normalized.flightOptions : [];
  normalized.accommodation = normalized.accommodation || {};
  normalized.packingList = normalized.packingList || { essential: [], weatherSpecific: [], appsMustHave: [], doNotBring: [] };
  normalized.nearbyEscapes = Array.isArray(normalized.nearbyEscapes) ? normalized.nearbyEscapes : [];
  normalized.andorInsights = Array.isArray(normalized.andorInsights) ? normalized.andorInsights : [];
  normalized.suggestions = Array.isArray(normalized.suggestions) && normalized.suggestions.length >= 3
    ? normalized.suggestions
    : ['Adjust the pace', 'Add a nearby escape', 'Make it more food-focused'];

  result.normalized = normalized;
  return result;
}

export default validateAndNormalize;
