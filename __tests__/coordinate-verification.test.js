import { describe, expect, it, vi } from 'vitest';
import { verifyActivityCoordinates } from '../app/lib/server/coordinate-verification';

describe('activity coordinate verification', () => {
  it('discards model-proposed coordinates when the provider cannot resolve the place', async () => {
    const activities = [{
      name: 'Invented place',
      type: 'culture',
      coordinates: [38.72, -9.14],
      coordinateSource: 'ai',
    }];

    await verifyActivityCoordinates(activities, {
      destinationCity: 'Lisbon',
      country: 'PT',
      geocode: vi.fn().mockResolvedValue(null),
    });

    expect(activities[0]).toMatchObject({
      coordinates: null,
      coordinateSource: 'unavailable',
      coordinateVerificationStatus: 'unverified',
    });
  });

  it('replaces model coordinates with provider-resolved coordinates', async () => {
    const activities = [{
      name: 'Museu Nacional do Azulejo',
      coordinates: [1, 1],
      coordinateSource: 'ai',
    }];

    await verifyActivityCoordinates(activities, {
      destinationCity: 'Lisbon',
      country: 'PT',
      geocode: vi.fn().mockResolvedValue({ lat: 38.7242, lng: -9.1138 }),
    });

    expect(activities[0].coordinates).toEqual([38.7242, -9.1138]);
    expect(activities[0].coordinateSource).toBe('nominatim');
    expect(activities[0].coordinateVerificationStatus).toBe('verified_provider');
    expect(activities[0].coordinateProvenance).toMatchObject({
      sourceType: 'verified_provider',
      provider: 'nominatim',
    });
  });

  it('reuses code-owned provider coordinates only when the caller explicitly allows them', async () => {
    const geocode = vi.fn();
    const activities = [{
      name: 'Provider candidate',
      coordinates: { lat: 38.71, lng: -9.13 },
      coordinateSource: 'nominatim',
    }];

    await verifyActivityCoordinates(activities, {
      geocode,
      allowExistingVerifiedCoordinates: true,
    });

    expect(activities[0].coordinates).toEqual([38.71, -9.13]);
    expect(activities[0].coordinateVerificationStatus).toBe('verified_input');
    expect(geocode).not.toHaveBeenCalled();
  });

  it('deduplicates identical place queries within one itinerary', async () => {
    const geocode = vi.fn().mockResolvedValue({ lat: 48.8606, lng: 2.3376 });
    const activities = [{ name: 'Louvre Museum' }, { name: 'Louvre Museum' }];

    await verifyActivityCoordinates(activities, {
      destinationCity: 'Paris',
      country: 'FR',
      geocode,
    });

    expect(geocode).toHaveBeenCalledTimes(1);
    expect(activities[0].coordinates).toEqual(activities[1].coordinates);
  });
});

