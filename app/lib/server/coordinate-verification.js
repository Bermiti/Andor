const TRUSTED_COORDINATE_SOURCES = new Set([
  'curated',
  'geocoder',
  'nominatim',
  'openstreetmap',
  'verified_provider',
]);

function coordinatePair(value) {
  const lat = Array.isArray(value) ? Number(value[0]) : Number(value?.lat ?? value?.latitude);
  const lng = Array.isArray(value) ? Number(value[1]) : Number(value?.lng ?? value?.lon ?? value?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180 || (lat === 0 && lng === 0)) return null;
  return [lat, lng];
}

function normalizedQuery(value) {
  return String(value || '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('en');
}

function canUseExistingCoordinates(activity, allowExistingVerifiedCoordinates) {
  if (!allowExistingVerifiedCoordinates || !coordinatePair(activity?.coordinates)) return false;
  const coordinateSource = normalizedQuery(activity?.coordinateSource || activity?.source);
  const provenanceSource = normalizedQuery(activity?.provenance?.sourceType);
  return TRUSTED_COORDINATE_SOURCES.has(coordinateSource)
    || provenanceSource === 'official'
    || provenanceSource === 'verified_provider';
}

/**
 * Mutates the supplied activities so their coordinates can be consumed safely by
 * maps and navigation. Model-proposed coordinates are discarded unless the
 * named place is resolved by the geocoder. Existing coordinates are accepted
 * only for code-owned provider/discovery results when explicitly enabled by the
 * caller.
 */
export async function verifyActivityCoordinates(
  activities,
  {
    destinationCity = '',
    country = '',
    geocode,
    allowExistingVerifiedCoordinates = false,
  } = {},
) {
  const geocodeByQuery = new Map();

  for (const activity of activities || []) {
    if (!activity || typeof activity !== 'object') continue;

    if (activity.type === 'planning_placeholder' || activity.provenance?.sourceType === 'planning_placeholder') {
      activity.coordinates = null;
      activity.coordinateSource = 'not_applicable';
      activity.coordinateVerificationStatus = 'not_applicable';
      continue;
    }

    if (canUseExistingCoordinates(activity, allowExistingVerifiedCoordinates)) {
      const coordinates = coordinatePair(activity.coordinates);
      activity.coordinates = coordinates;
      activity.coordinateVerificationStatus = 'verified_input';
      continue;
    }

    // Never allow model-proposed coordinates to survive a failed lookup.
    activity.coordinates = null;
    activity.coordinateSource = 'unavailable';
    activity.coordinateVerificationStatus = 'unverified';

    const query = [activity.name, destinationCity].filter(Boolean).join(', ');
    const queryKey = normalizedQuery(`${query}|${country}`);
    if (!queryKey || typeof geocode !== 'function') continue;

    if (!geocodeByQuery.has(queryKey)) {
      geocodeByQuery.set(queryKey, Promise.resolve().then(() => geocode(query, country)));
    }

    let resolved = null;
    try {
      resolved = coordinatePair(await geocodeByQuery.get(queryKey));
    } catch {
      resolved = null;
    }

    if (!resolved) continue;

    activity.coordinates = resolved;
    activity.coordinateSource = 'nominatim';
    activity.coordinateVerificationStatus = 'verified_provider';
    activity.coordinateProvenance = {
      sourceType: 'verified_provider',
      provider: 'nominatim',
      retrievedAt: new Date().toISOString(),
    };
  }

  return activities;
}

