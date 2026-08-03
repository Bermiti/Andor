import 'server-only';

import { executeProviderRequest } from './provider-executor';
import { PoiSchema } from './provider-contracts';

/**
 * OpenTripMap Places Provider & Guarded Recommendation Engine.
 *
 * Rules:
 * - Never allow LLM to hallucinate venues, coordinates, or ratings.
 * - All places in the final itinerary MUST be selected from verified candidate IDs or flagged as 'unverified_ai_proposal'.
 * - Calculates deterministic suitability score before passing candidates to AI.
 */

export async function searchVerifiedPlaces({ lat, lng, radiusMeters = 5000, kinds = 'interesting_places', limit = 10 }) {
  const retrievedAt = new Date().toISOString();

  const apiKey = process.env.OPENTRIPMAP_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      status: 'blocked_by_credentials',
      error: 'OPENTRIPMAP_API_KEY is not configured in environment',
      candidates: [],
    };
  }

  return await executeProviderRequest({
    providerId: 'provider-opentripmap',
    capability: 'places',
    input: { lat, lng, radiusMeters, kinds, limit },
    executorFn: async () => {
      const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=${radiusMeters}&lon=${lng}&lat=${lat}&kinds=${encodeURIComponent(kinds)}&limit=${limit}&apikey=${apiKey}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) {
        throw new Error(`OpenTripMap provider returned HTTP ${res.status}`);
      }
      const data = await res.json();
      const features = Array.isArray(data.features) ? data.features : [];

      const candidates = features.map((feat) => {
        const props = feat.properties || {};
        const coords = feat.geometry?.coordinates || [];
        return {
          internalEntityId: `otm-${props.xid || props.id || Math.random().toString(36).substring(7)}`,
          provider: 'provider-opentripmap',
          providerPlaceId: props.xid || String(props.id),
          name: props.name || 'Ponto de Interesse',
          categories: (props.kinds || '').split(',').filter(Boolean),
          coordinates: { lat: coords[1], lng: coords[0] },
          rating: props.rate ? Number(props.rate) : null,
          retrievedAt,
          provenance: {
            sourceType: 'verified_provider',
            provider: 'opentripmap',
            retrievedAt,
            isOfficial: false,
            confidence: 0.9,
            attribution: 'Data by OpenTripMap / OpenStreetMap contributors',
          },
        };
      }).filter((c) => c.name !== 'Ponto de Interesse');

      return candidates;
    },
  });
}

/**
 * Calculates deterministic suitability score for a place candidate based on user preferences.
 */
export function calculateDeterministicPoiScore(candidate, userInterests = []) {
  let score = 0.5;
  const candidateCategories = (candidate.categories || []).map((c) => c.toLowerCase());

  userInterests.forEach((interest) => {
    const key = String(interest).toLowerCase();
    if (candidateCategories.some((cat) => cat.includes(key))) {
      score += 0.2;
    }
  });

  if (typeof candidate.rating === 'number' && candidate.rating > 0) {
    score += candidate.rating * 0.05;
  }

  return Math.min(1.0, Math.max(0.0, Math.round(score * 100) / 100));
}

/**
 * Validates AI itinerary proposals against verified candidate IDs and rejects unverified venue injections.
 */
export function rejectUnverifiedAiVenues(aiProposedStops = [], verifiedCandidates = []) {
  const candidateMap = new Map();
  verifiedCandidates.forEach((c) => {
    candidateMap.set(c.internalEntityId, c);
    if (c.providerPlaceId) candidateMap.set(c.providerPlaceId, c);
    candidateMap.set(c.name.toLowerCase().trim(), c);
  });

  return aiProposedStops.map((stop) => {
    const match = candidateMap.get(stop.id) || candidateMap.get(stop.name?.toLowerCase()?.trim());

    if (match) {
      return {
        ...stop,
        id: match.internalEntityId,
        coordinates: match.coordinates,
        provenance: match.provenance,
        verificationStatus: 'verified',
      };
    }

    return {
      ...stop,
      verificationStatus: 'unverified_ai_proposal',
      provenance: {
        sourceType: 'estimate',
        provider: 'ai_editorial_proposal',
        retrievedAt: new Date().toISOString(),
        confidence: 0.4,
        note: 'Sugestão editorial ainda não verificada por provider de turismo.',
      },
    };
  });
}
