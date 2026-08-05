// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createItineraryRecord: vi.fn(),
  generateFallback: vi.fn(),
  geocode: vi.fn(),
  returnedDayOffset: 0,
}));

vi.mock('server-only', () => ({}));

vi.mock('../app/lib/supabase/db', () => ({
  createItineraryRecord: mocks.createItineraryRecord,
}));

vi.mock('../app/lib/fallback-ai', () => ({
  generateDestinationAwareFallbackItinerary: mocks.generateFallback,
}));

vi.mock('../app/lib/geocoding', () => ({
  geocodeServerSide: mocks.geocode,
  getCountryCentroid: vi.fn(() => null),
}));

import { POST } from '../app/api/generate-itinerary/route';

const destinationEntity = {
  entityId: 'geo-ext-coimbra',
  canonicalName: 'Coimbra',
  displayName: 'Coimbra, Portugal',
  entityType: 'city',
  countryCode: 'PT',
  coordinates: { lat: 40.2033, lng: -8.4103 },
  resolutionStatus: 'partially_resolved',
};

function generatedItinerary(requestedDays) {
  const dayCount = Math.max(0, requestedDays + mocks.returnedDayOffset);
  return {
    destination: {
      city: 'Coimbra',
      name: 'Coimbra, Portugal',
      coordinates: [40.2033, -8.4103],
    },
    trip: { totalDays: dayCount },
    days: Array.from({ length: dayCount }, (_, index) => ({
      title: `Coimbra Stories: Historic Route ${index + 1}`,
      periods: {
        morning: {
          activities: [{
            name: `Coimbra stop ${index + 1}`,
            coordinates: [40.2074, -8.4265],
          }],
        },
      },
    })),
  };
}

function request(days = 2) {
  return new Request('http://localhost/api/generate-itinerary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      destination: 'Coimbra, Portugal',
      destinationEntity,
      days,
      forceFallback: true,
    }),
  });
}

describe('generate itinerary persistence contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.returnedDayOffset = 0;
    mocks.generateFallback.mockImplementation(async (_destination, days) => generatedItinerary(days));
    mocks.geocode.mockResolvedValue({ lat: 40.2074, lng: -8.4265 });
  });

  test('returns an explicit browser-only draft for a guest', async () => {
    mocks.createItineraryRecord.mockResolvedValue({
      ok: false,
      provider: 'none',
      reason: 'auth_required',
    });

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.persistence).toEqual({
      mode: 'local_draft',
      provider: 'browser',
      persisted: false,
      reason: 'auth_required',
    });
    expect(body.itinerary.metadata.persistenceMode).toBe('local_draft');
    expect(body.itinerary.destination).toMatchObject({
      entityId: 'geo-ext-coimbra',
      canonicalName: 'Coimbra',
      countryCode: 'PT',
    });
  });

  test('does not report an authenticated persistence failure as success', async () => {
    mocks.createItineraryRecord.mockResolvedValue({
      ok: false,
      provider: 'none',
      reason: 'storage_error',
    });

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatchObject({
      code: 'ITINERARY_PERSISTENCE_FAILED',
      retryable: true,
    });
  });

  test('returns the durable id only after persistence succeeds', async () => {
    mocks.createItineraryRecord.mockResolvedValue({
      ok: true,
      provider: 'sqlite',
      id: '20202020-2020-4020-8020-202020202020',
      shareToken: null,
    });

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.persistence).toEqual({
      mode: 'durable',
      provider: 'sqlite',
      persisted: true,
      reason: null,
    });
    expect(body.itinerary.id).toBe('20202020-2020-4020-8020-202020202020');
  });

  test.each([-1, 1])('rejects a provider result with a day offset of %i before persistence', async (offset) => {
    mocks.returnedDayOffset = offset;
    mocks.createItineraryRecord.mockResolvedValue({
      ok: true,
      provider: 'sqlite',
      id: '30303030-3030-4030-8030-303030303030',
    });

    const response = await POST(request(3));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe('ITINERARY_DATA_INVALID');
    expect(mocks.createItineraryRecord).not.toHaveBeenCalled();
  });

  test('turns a thrown persistence error into a retryable 503', async () => {
    mocks.createItineraryRecord.mockRejectedValue(new Error('database unavailable'));

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatchObject({
      code: 'ITINERARY_PERSISTENCE_FAILED',
      retryable: true,
    });
  });

  test('rejects a nominally successful persistence result without an id', async () => {
    mocks.createItineraryRecord.mockResolvedValue({
      ok: true,
      provider: 'sqlite',
      id: null,
    });

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe('ITINERARY_PERSISTENCE_FAILED');
  });
});
