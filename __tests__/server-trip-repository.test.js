// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createTripRecord, getTripRecord } from '../app/lib/server/trip-repository';

describe('Server-Side Trip Repository Geographic Persistence Suite', () => {
  it('creates and retrieves a trip record preserving structured destination entity server-side', async () => {
    const identity = {
      userId: 'test-user-geo-1',
      authenticated: true,
      role: 'authenticated',
      isGuest: false,
    };

    const structuredItinerary = {
      title: 'Viagem a Tóquio',
      destination: {
        entityId: 'geo-jp-tokyo',
        canonicalName: 'Tokyo',
        displayName: 'Tóquio, JP',
        entityType: 'city',
        countryCode: 'JP',
        regionCode: 'JP-13',
        timezone: 'Asia/Tokyo',
        currencyCodes: ['JPY'],
        resolutionStatus: 'resolved',
      },
      days: [],
    };

    const createRes = await createTripRecord(structuredItinerary, {}, identity);
    expect(createRes.ok).toBe(true);
    expect(createRes.trip).toBeDefined();

    const getRes = await getTripRecord(createRes.trip.id, identity);
    expect(getRes.ok).toBe(true);
    expect(getRes.trip.itinerary.destination.entityId).toBe('geo-jp-tokyo');
    expect(getRes.trip.itinerary.destination.countryCode).toBe('JP');
    expect(getRes.trip.itinerary.destination.resolutionStatus).toBe('resolved');
  });
});
