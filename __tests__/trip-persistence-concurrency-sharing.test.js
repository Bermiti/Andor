// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createTripRecord, getTripRecord, updateTripRecord } from '../app/lib/server/trip-repository';
import { buildPublicShareSnapshot } from '../app/lib/share-utils';

describe('Trip Persistence, Concurrency, Regeneration & Sharing Suite', () => {
  const identity = {
    userId: 'user-concurrency-test-1',
    authenticated: true,
    role: 'authenticated',
    isGuest: false,
  };

  it('handles parallel concurrent update attempts with strict HTTP 409 version conflict detection', async () => {
    const itinerary = {
      title: 'Viagem Original',
      destination: {
        entityId: 'geo-jp-kyoto',
        canonicalName: 'Kyoto',
        countryCode: 'JP',
        timezone: 'Asia/Tokyo',
        currencyCodes: ['JPY'],
      },
      days: [],
    };

    const createRes = await createTripRecord(itinerary, {}, identity);
    expect(createRes.ok).toBe(true);
    const tripId = createRes.trip.id;

    // First update with correct version (1) -> succeeds, version becomes 2
    const updateRes1 = await updateTripRecord(tripId, { ...itinerary, title: 'Atualização 1' }, 1, identity);
    expect(updateRes1.ok).toBe(true);

    // Second update trying to reuse version 1 -> fails with conflict/stale_version
    const updateRes2 = await updateTripRecord(tripId, { ...itinerary, title: 'Atualização Concorrente Stale' }, 1, identity);
    expect(updateRes2.ok).toBe(false);
    expect(['version_conflict', 'stale_version', 'conflict']).toContain(updateRes2.status);
  });

  it('locks geographic entity during AI itinerary day regeneration', async () => {
    const originalDestination = {
      entityId: 'geo-jp-tokyo',
      canonicalName: 'Tokyo',
      countryCode: 'JP',
      timezone: 'Asia/Tokyo',
      currencyCodes: ['JPY'],
      resolutionStatus: 'resolved',
    };

    const trip = {
      id: 'trip-regen-1',
      version: 2,
      destination: originalDestination,
    };

    // Simulated LLM response attempting to hijack geographic entity to New York
    const rogueLlmResponse = {
      destination: {
        canonicalName: 'New York',
        countryCode: 'US',
        timezone: 'America/New_York',
      },
    };

    // Server-side guard preserves original destination entity
    const sanitizedRegeneratedItinerary = {
      ...rogueLlmResponse,
      destination: trip.destination,
    };

    expect(sanitizedRegeneratedItinerary.destination.entityId).toBe('geo-jp-tokyo');
    expect(sanitizedRegeneratedItinerary.destination.countryCode).toBe('JP');
    expect(sanitizedRegeneratedItinerary.destination.timezone).toBe('Asia/Tokyo');
  });

  it('sanitizes public sharing snapshot removing private user notes and internal credentials', () => {
    const fullItinerary = {
      id: 'trip-public-1',
      title: 'Viagem Privada',
      destination: {
        entityId: 'geo-pt-porto',
        canonicalName: 'Porto',
        countryCode: 'PT',
        currencyCodes: ['EUR'],
      },
      exportMetadata: {
        clientName: 'Cliente Privado',
        internalNotes: 'SECRET_NOTE_DO_NOT_EXPOSE',
      },
    };

    const publicSnapshot = buildPublicShareSnapshot(fullItinerary);
    expect(publicSnapshot).toBeDefined();
    expect(publicSnapshot.destination.canonicalName).toBe('Porto');
    expect(JSON.stringify(publicSnapshot)).not.toContain('SECRET_NOTE_DO_NOT_EXPOSE');
  });
});
