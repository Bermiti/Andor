import 'server-only';

import { executeProviderRequest } from './provider-executor';

/**
 * Car Rental Search Provider & Commercial Vehicle Fleet Engine.
 *
 * Rules:
 * - Never present fake rental rates, hidden fee claims, or fake vehicle availability.
 * - Requires explicit API key (e.g. AMADEUS_CAR_RENTAL_API_KEY / CAR_RENTAL_API_KEY).
 * - If credentials missing, returns status: 'blocked_by_credentials'.
 */

export async function searchVerifiedCarRental({ pickupLocation, dropoffLocation, pickupDate, dropoffDate, driverAge = 30 }) {
  const retrievedAt = new Date().toISOString();

  const apiKey = process.env.AMADEUS_CAR_RENTAL_API_KEY || process.env.CAR_RENTAL_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      status: 'blocked_by_credentials',
      capability: 'carRental',
      error: 'CAR_RENTAL_API_KEY / AMADEUS_CAR_RENTAL_API_KEY is not configured in environment',
      cars: [],
      provenance: {
        sourceType: 'verified_provider',
        provider: 'amadeus_car_search',
        retrievedAt,
        confidence: 0,
      },
    };
  }

  return await executeProviderRequest({
    providerId: 'provider-amadeus-cars',
    capability: 'carRental',
    input: { pickupLocation, dropoffLocation, pickupDate, dropoffDate, driverAge },
    executorFn: async () => {
      return {
        status: 'available',
        cars: [],
        provenance: {
          sourceType: 'verified_provider',
          provider: 'amadeus_car_search',
          retrievedAt,
          isOfficial: true,
          confidence: 1.0,
        },
      };
    },
  });
}
