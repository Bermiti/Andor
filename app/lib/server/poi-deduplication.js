import 'server-only';

/**
 * Deduplication Engine for Points of Interest across multi-provider sources.
 */

function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\bs\b|\bs\.?\b/g, 'sao')
    .replace(/\bst\b|\bst\.?\b/g, 'saint')
    .replace(/[^a-z0-9]/g, '');
}

function calculateDistanceMeters(coord1, coord2) {
  if (!coord1 || !coord2 || typeof coord1.lat !== 'number' || typeof coord2.lat !== 'number') return Infinity;
  const R = 6371e3;
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function deduplicatePoiCandidates(rawCandidates = []) {
  const deduplicated = [];

  for (const candidate of rawCandidates) {
    const normName = normalizeString(candidate.name);
    let matchFound = false;

    for (const existing of deduplicated) {
      const existingNormName = normalizeString(existing.name);
      const distance = calculateDistanceMeters(candidate.coordinates, existing.coordinates);

      const nameMatch = normName === existingNormName || normName.includes(existingNormName) || existingNormName.includes(normName);
      const closeDistance = distance < 200; // Within 200 meters

      if (nameMatch && closeDistance) {
        matchFound = true;
        existing.providerMatches = existing.providerMatches || [existing.provider];
        if (!existing.providerMatches.includes(candidate.provider)) {
          existing.providerMatches.push(candidate.provider);
        }
        existing.matchConfidence = Math.min(1.0, (existing.matchConfidence || 0.8) + 0.15);
        existing.matchReasons = existing.matchReasons || ['Same spatial proximity and normalized alias match'];
        break;
      }
    }

    if (!matchFound) {
      deduplicated.push({
        ...candidate,
        providerMatches: [candidate.provider],
        matchConfidence: 0.85,
        matchReasons: ['Unique spatial and name record'],
      });
    }
  }

  return deduplicated;
}
