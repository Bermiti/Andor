// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createTripRecord, getTripRecord, updateTripRecord } from '../app/lib/server/trip-repository';
import { buildPublicShareSnapshot } from '../app/lib/share-utils';

describe('Full Lifecycle Geographic Persistence & Public Sharing Sanitization Suite', () => {
  it('executes creation -> retrieval -> update -> public sharing snapshot with structured geography', async () => {
    const identity = {
      userId: 'user-lifecycle-1',
      authenticated: true,
      role: 'authenticated',
      isGuest: false,
    };

    const initialItinerary = {
      title: 'Viagem a Lisboa e Porto',
      destination: {
        entityId: 'geo-pt-lisbon',
        canonicalName: 'Lisbon',
        displayName: 'Lisboa, PT',
        entityType: 'city',
        countryCode: 'PT',
        regionCode: 'PT-11',
        timezone: 'Europe/Lisbon',
        currencyCodes: ['EUR'],
        resolutionStatus: 'resolved',
        provenance: {
          sourceType: 'official',
          provider: 'iso_3166_2',
          confidence: 1,
          attribution: 'Official ISO database',
        },
      },
      trip: {
        totalDays: 3,
        travelers: 2,
      },
      days: [],
    };

    // 1. Create Trip Record
    const createRes = await createTripRecord(initialItinerary, {}, identity);
    expect(createRes.ok).toBe(true);
    const tripId = createRes.trip.id;

    // 2. Retrieve Trip Record (Reload simulation)
    const getRes1 = await getTripRecord(tripId, identity);
    expect(getRes1.ok).toBe(true);
    expect(getRes1.trip.itinerary.destination.entityId).toBe('geo-pt-lisbon');
    expect(getRes1.trip.itinerary.destination.timezone).toBe('Europe/Lisbon');

    // 3. Update Trip Record (Preserve geography and bump version)
    const updatedItinerary = {
      ...getRes1.trip.itinerary,
      title: 'Viagem a Lisboa e Sintra (Atualizada)',
      version: getRes1.trip.version,
    };
    const updateRes = await updateTripRecord(tripId, updatedItinerary, getRes1.trip.version, identity);
    expect(updateRes.ok).toBe(true);

    // 4. Retrieve Updated Trip
    const getRes2 = await getTripRecord(tripId, identity);
    expect(getRes2.ok).toBe(true);
    expect(getRes2.trip.itinerary.title).toBe('Viagem a Lisboa e Sintra (Atualizada)');
    expect(getRes2.trip.itinerary.destination.entityId).toBe('geo-pt-lisbon');

    // 5. Public Share Snapshot Sanitization
    const publicSnapshot = buildPublicShareSnapshot(getRes2.trip.itinerary);
    expect(publicSnapshot).toBeDefined();
    expect(publicSnapshot.destination.entityId).toBe('geo-pt-lisbon');
    expect(publicSnapshot.destination.countryCode).toBe('PT');
    expect(publicSnapshot.destination.provenance).toBeDefined();
    expect(publicSnapshot.destination.provenance.provider).toBe('iso_3166_2');
  });
});
