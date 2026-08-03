// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { searchVerifiedAccommodation } from '../app/lib/server/accommodation-provider';
import { searchVerifiedFlights } from '../app/lib/server/flight-provider';
import { searchVerifiedCarRental } from '../app/lib/server/car-rental-provider';

describe('Commercial Search Providers Test Suite (Sprint 4)', () => {
  it('returns status blocked_by_credentials for accommodation when API keys are missing', async () => {
    delete process.env.AMADEUS_API_KEY;
    delete process.env.ACCOMMODATION_API_KEY;

    const res = await searchVerifiedAccommodation({ destination: 'Tokyo' });
    expect(res.success).toBe(false);
    expect(res.status).toBe('blocked_by_credentials');
    expect(res.offers).toEqual([]);
  });

  it('returns status blocked_by_credentials for flight search when API keys are missing', async () => {
    delete process.env.AMADEUS_FLIGHTS_API_KEY;
    delete process.env.FLIGHTS_API_KEY;

    const res = await searchVerifiedFlights({ originCode: 'LIS', destinationCode: 'TYO' });
    expect(res.success).toBe(false);
    expect(res.status).toBe('blocked_by_credentials');
    expect(res.flights).toEqual([]);
  });

  it('returns status blocked_by_credentials for car rental when API keys are missing', async () => {
    delete process.env.AMADEUS_CAR_RENTAL_API_KEY;
    delete process.env.CAR_RENTAL_API_KEY;

    const res = await searchVerifiedCarRental({ pickupLocation: 'LIS' });
    expect(res.success).toBe(false);
    expect(res.status).toBe('blocked_by_credentials');
    expect(res.cars).toEqual([]);
  });
});
