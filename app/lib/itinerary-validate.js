import { getDayTitleQualityScore, isBannedDayTitle, suggestDayTitle } from './day-title-validator.js';

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

function numberOr(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = parseFloat(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
  const source = transport && typeof transport === 'object' ? transport : {};
  return {
    mode: safeText(source.mode, isFirst ? 'walk' : 'public transport'),
    line: safeText(source.line, isFirst ? 'hotel start' : 'direct route'),
    duration: safeText(source.duration, isFirst ? '10 min' : '18 min'),
    cost: Math.max(0, numberOr(source.cost, 0)),
    directions: safeText(source.directions, isFirst ? 'Start from the recommended base area.' : 'Travel directly from the previous stop.'),
  };
}

function normalizeActivity(activity, dayIndex, activityIndex, bounds, destinationName, result, currencyCode = 'EUR') {
  const source = activity && typeof activity === 'object' ? activity : {};
  const name = safeText(source.name || source.title, `Stop ${activityIndex + 1}`);
  const rawCoords = parseCoordinate(source.coordinates || source.coords || source.location || source.coordinate);
  let coordinates = rawCoords;
  if (!isPlausibleCoord(rawCoords)) {
    coordinates = bounds?.center ? { ...bounds.center } : null;
    result.warnings.push(`Missing or invalid coordinates repaired for activity "${name}"`);
  } else if (bounds && !isInBounds(rawCoords, bounds)) {
    coordinates = { ...bounds.center };
    result.valid = false;
    result.errors.push(`Activity "${name}" coordinates outside destination bounds; repaired to ${destinationName} center`);
  }

  let rating = numberOr(source.rating, 4.6);
  if (rating < 4.0 || rating > 5.0) {
    result.warnings.push(`Rating clamped for activity "${name}"`);
    rating = clamp(rating, 4.0, 5.0);
  }

  const cost = Math.max(0, numberOr(source.cost ?? source.estimatedCost ?? source.price, 0));
  const normalized = {
    ...source,
    id: safeText(source.id, `d${dayIndex + 1}-a${activityIndex + 1}`),
    name,
    type: safeText(source.type || source.category, 'experience'),
    category: safeText(source.category || source.type, 'experience'),
    emoji: safeText(source.emoji, 'pin'),
    description: safeText(source.description || source.type, ''),
    address: safeText(source.address || source.area, destinationName),
    coordinates,
    startTime: safeText(source.startTime || source.time || source.hour, activityIndex === 0 ? '09:30' : '14:30'),
    time: safeText(source.time || source.startTime || source.hour, activityIndex === 0 ? '09:30' : '14:30'),
    duration: safeText(source.duration, '90 min'),
    durationMinutes: numberOr(source.durationMinutes, null) || numberOr(source.duration, 90),
    cost,
    estimatedCost: source.estimatedCost ?? cost,
    currency: source.currency || currencyCode,
    rating,
    crowd: safeText(source.crowd, 'moderate'),
    bookingRequired: Boolean(source.bookingRequired),
    insiderTip: safeText(source.insiderTip || source.localTip || source.localSecret, `Ask staff nearby about the quietest time for ${name}; timing matters more than the main entrance.`),
    localTip: safeText(source.localTip || source.insiderTip || source.localSecret, ''),
    photoKeyword: safeText(source.photoKeyword, `${name} ${destinationName}`),
    period: safeText(source.period, activityIndex === 0 ? 'morning' : activityIndex === 1 ? 'afternoon' : 'evening'),
    transportFromPrevious: normalizeTransport(source.transportFromPrevious || source.transport, activityIndex === 0),
    bookingUrl: source.bookingUrl || source.booking || null,
  };

  if (!normalized.coordinates && bounds?.center) {
    normalized.coordinates = { ...bounds.center };
  }
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

function getDefaultMealCost(mealName, currencyCode) {
  const defaults = {
    EUR: { breakfast: 8, lunch: 18, dinner: 32 },
    JPY: { breakfast: 900, lunch: 1800, dinner: 3600 },
    USD: { breakfast: 12, lunch: 24, dinner: 45 },
    GBP: { breakfast: 9, lunch: 20, dinner: 38 },
    IDR: { breakfast: 60000, lunch: 150000, dinner: 280000 },
    MAD: { breakfast: 45, lunch: 100, dinner: 180 },
  };
  return (defaults[currencyCode] || defaults.EUR)[mealName] || defaults.EUR[mealName] || 20;
}

function normalizeMeal(meal, mealName, destinationName, bounds, result, currencyCode = 'EUR') {
  if (mealName === 'breakfast' && meal === null) return null;
  const source = meal && typeof meal === 'object' ? meal : {};
  const fallbackName = mealName === 'breakfast' ? `Breakfast near ${destinationName}` : `${mealName} near ${destinationName}`;
  const name = safeText(source.name || source.restaurant, fallbackName);
  let coordinates = parseCoordinate(source.coordinates || source.location);
  if (!isPlausibleCoord(coordinates)) {
    coordinates = bounds?.center ? { ...bounds.center } : null;
    result.warnings.push(`Missing meal coordinates repaired for ${mealName}`);
  } else if (bounds && !isInBounds(coordinates, bounds)) {
    coordinates = { ...bounds.center };
    result.valid = false;
    result.errors.push(`${mealName} coordinates outside destination bounds; repaired to destination center`);
  }
  return {
    ...source,
    name,
    cuisine: safeText(source.cuisine || source.type, mealName === 'breakfast' ? 'Cafe' : 'Local cuisine'),
    type: safeText(source.type, mealName),
    priceRange: safeText(source.priceRange, ''),
    cost: Math.max(0, numberOr(source.cost, getDefaultMealCost(mealName, currencyCode))),
    currency: source.currency || currencyCode,
    address: safeText(source.address, destinationName),
    coordinates,
    mustOrder: safeText(source.mustOrder || source.note, mealName === 'breakfast' ? 'house pastry and coffee' : 'the seasonal house speciality'),
    openingHours: safeText(source.openingHours || source.hours, mealName === 'dinner' ? '18:30 - 22:30' : '08:00 - 15:00'),
    bookingRequired: Boolean(source.bookingRequired || mealName === 'dinner'),
    insiderNote: safeText(source.insiderNote || source.localTip || source.note, `Ask for the daily special at ${name}; it is usually fresher than the translated menu.`),
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

export function validateAndNormalize(itinerary) {
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
  const destName = typeof destInput === 'object'
    ? safeText(destInput.city || destInput.name || destInput.country, '')
    : safeText(destInput, '');
  if (!destName) {
    result.valid = false;
    result.fatal = true;
    result.errors.push('Missing destination');
    return result;
  }

  const destKey = normalizeDestinationKey(destInput);
  const bounds = getDestinationBounds(destInput);
  const defaults = DESTINATION_DEFAULTS[destKey] || {};
  const rawDestination = typeof destInput === 'object' ? destInput : {};
  const destinationCoords = parseCoordinate(rawDestination.coordinates);
  normalized.destination = {
    ...defaults,
    ...rawDestination,
    name: safeText(rawDestination.name || rawDestination.city, destName),
    city: safeText(rawDestination.city || rawDestination.name, destName.split(',')[0]),
    country: safeText(rawDestination.country, defaults.country || ''),
    countryCode: safeText(rawDestination.countryCode, defaults.countryCode || ''),
    flag: safeText(rawDestination.flag, defaults.flag || defaults.countryCode || ''),
    timezone: safeText(rawDestination.timezone, defaults.timezone || ''),
    currency: rawDestination.currency || defaults.currency || { code: 'EUR', symbol: 'EUR' },
    coordinates: isPlausibleCoord(destinationCoords)
      ? [destinationCoords.lat, destinationCoords.lng]
      : bounds?.center ? [bounds.center.lat, bounds.center.lng] : rawDestination.coordinates,
  };

  if (bounds && !isInBounds(parseCoordinate(normalized.destination.coordinates), bounds)) {
    normalized.destination.coordinates = [bounds.center.lat, bounds.center.lng];
    result.valid = false;
    result.errors.push('Destination coordinates were outside expected bounds and were repaired');
  }

  const rawDays = normalized.days || normalized.trip?.days || normalized.dailyPlan || [];
  if (!Array.isArray(rawDays) || rawDays.length === 0) {
    result.valid = false;
    result.fatal = true;
    result.errors.push('Missing days array');
    return result;
  }

  normalized.trip = {
    totalDays: numberOr(normalized.trip?.totalDays, rawDays.length),
    travelStyle: safeText(normalized.trip?.travelStyle || normalized.style, 'cultural'),
    groupType: safeText(normalized.trip?.groupType || normalized.travelers, 'travellers'),
    budgetTier: safeText(normalized.trip?.budgetTier || normalized.budgetTier || normalized.budget, 'comfort'),
    budgetBreakdown: normalizeBudgetBreakdown(normalized.trip?.budgetBreakdown || normalized.budgetBreakdown || {}),
    topTips: Array.isArray(normalized.trip?.topTips) && normalized.trip.topTips.length >= 3
      ? normalized.trip.topTips
      : [
          `Keep the first morning in ${normalized.destination.city} flexible.`,
          'Confirm opening hours the night before key activities.',
          'Save addresses offline before leaving the hotel.',
        ],
    ...normalized.trip,
  };
  const destinationCurrency = normalized.destination.currency?.code || normalized.destination.currency || 'EUR';
  normalized.trip.budgetBreakdown = normalizeBudgetBreakdown(normalized.trip.budgetBreakdown);
  normalized.trip.budgetBreakdown.currency = destinationCurrency;
  ['flights', 'accommodation', 'food', 'transport', 'activities', 'grandTotal'].forEach((key) => {
    if (normalized.trip.budgetBreakdown[key]) {
      normalized.trip.budgetBreakdown[key].currency = destinationCurrency;
    }
  });
  normalized.summary = normalized.summary || {
    title: `${normalized.destination.city} trip`,
    estimatedTotalCost: normalized.trip.budgetBreakdown.grandTotal.min,
  };

  const seenTitles = new Set();
  let mapCriticalCount = 0;
  normalized.days = rawDays.map((rawDay, dayIndex) => {
    const day = rawDay && typeof rawDay === 'object' ? rawDay : {};
    const title = normalizeDayTitle(day, dayIndex, normalized.destination.city, seenTitles, result);
    const activities = getRawActivities(day).map((activity, activityIndex) => {
      const normalizedActivity = normalizeActivity(activity, dayIndex, activityIndex, bounds, normalized.destination.city, result, destinationCurrency);
      if (normalizedActivity.coordinates) mapCriticalCount += 1;
      return normalizedActivity;
    });

    if (activities.length === 0) {
      result.valid = false;
      result.errors.push(`Day ${dayIndex + 1} has no activities`);
    }

    const meals = day.meals && typeof day.meals === 'object' ? day.meals : {};
    return {
      ...day,
      dayNumber: numberOr(day.dayNumber, dayIndex + 1),
      date: safeText(day.date, ''),
      title,
      emoji: safeText(day.emoji, 'pin'),
      theme: safeText(day.theme || day.areaFocus || day.area, normalized.destination.city),
      moodDescription: safeText(day.moodDescription || day.mood, `A well-paced day in ${normalized.destination.city} with room to breathe.`),
      budgetEstimate: Math.max(0, numberOr(day.budgetEstimate || day.estimatedCost, 0)),
      estimatedCost: Math.max(0, numberOr(day.estimatedCost || day.budgetEstimate, 0)),
      weather: day.weather || { avgTemp: '', condition: 'Check forecast', practicalTip: 'Verify weather 48 hours before departure.' },
      transport: day.transport || { mainRecommendation: 'Walk and public transport', cost: 0, tip: 'Keep the route grouped by area.' },
      periods: buildPeriods(day, activities),
      activities,
      stops: activities,
      meals: {
        breakfast: 'breakfast' in meals ? normalizeMeal(meals.breakfast, 'breakfast', normalized.destination.city, bounds, result, destinationCurrency) : null,
        lunch: normalizeMeal(meals.lunch, 'lunch', normalized.destination.city, bounds, result, destinationCurrency),
        dinner: normalizeMeal(meals.dinner, 'dinner', normalized.destination.city, bounds, result, destinationCurrency),
      },
      localSecret: safeText(day.localSecret || day.localSecrets, `Ask a staff member in ${normalized.destination.city} which street they use for a quiet dinner after work, then save that area offline.`),
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
