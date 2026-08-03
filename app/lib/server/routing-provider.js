import 'server-only';

import { RouteSchema } from './provider-contracts';

/**
 * Universal Routing & Distance Engine.
 * Strictly separates:
 * 1. straight_line_distance (Haversine formula, no duration assumption)
 * 2. estimated_route (distance with assumed mode speed)
 * 3. provider_route (verified routing engine payload)
 */

/**
 * Calculates straight-line distance in meters using Haversine formula.
 */
export function calculateStraightLineDistance(origin, destination) {
  if (!origin || !destination || typeof origin.lat !== 'number' || typeof destination.lat !== 'number') {
    throw new Error('Invalid origin or destination coordinates');
  }

  const R = 6371e3; // Earth radius in meters
  const φ1 = (origin.lat * Math.PI) / 180;
  const φ2 = (destination.lat * Math.PI) / 180;
  const Δφ = ((destination.lat - origin.lat) * Math.PI) / 180;
  const Δλ = ((destination.lng - origin.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceMeters = Math.round(R * c);

  return {
    measurementType: 'straight_line',
    distanceMeters,
    isRoute: false,
    durationSeconds: null,
    provenance: {
      sourceType: 'official',
      provider: 'haversine_formula',
      retrievedAt: new Date().toISOString(),
      isOfficial: true,
      confidence: 1.0,
    },
  };
}

/**
 * Calculates estimated travel duration based on mode and assumed speed.
 */
export function calculateEstimatedRoute(origin, destination, mode = 'walking') {
  const straightLine = calculateStraightLineDistance(origin, destination);
  const distanceMeters = Math.round(straightLine.distanceMeters * 1.3); // Detour multiplier assumption

  let speedMetersPerSec = 1.38; // Walking ~5 km/h
  if (mode === 'bicycling') speedMetersPerSec = 4.16; // Cycling ~15 km/h
  if (mode === 'driving') speedMetersPerSec = 11.11; // Driving ~40 km/h

  const durationSeconds = Math.round(distanceMeters / speedMetersPerSec);

  return {
    measurementType: 'estimated_route',
    distanceMeters,
    durationSeconds,
    isRoute: false,
    assumptions: {
      detourFactor: 1.3,
      mode,
      speedKmh: Math.round(speedMetersPerSec * 3.6),
    },
    provenance: {
      sourceType: 'estimate',
      provider: 'andor_route_estimator',
      retrievedAt: new Date().toISOString(),
      isEstimated: true,
      confidence: 0.7,
    },
  };
}

/**
 * Formats a verified provider route response conforming to RouteSchema.
 */
export function formatVerifiedProviderRoute({
  origin,
  destination,
  mode,
  distanceMeters,
  durationSeconds,
  geometry,
  provider = 'osrm_routing_engine',
  trafficIncluded = false,
  timetableIncluded = false,
}) {
  const retrievedAt = new Date().toISOString();

  const payload = {
    origin,
    destination,
    mode,
    distanceMeters,
    durationSeconds,
    geometry,
    provider,
    retrievedAt,
    trafficIncluded,
    timetableIncluded,
    provenance: {
      sourceType: 'verified_provider',
      provider,
      retrievedAt,
      isOfficial: true,
      confidence: 1.0,
    },
  };

  return {
    measurementType: 'provider_route',
    isRoute: true,
    route: RouteSchema.parse(payload),
  };
}
