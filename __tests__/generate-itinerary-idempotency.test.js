// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  reserve: vi.fn(),
  checkpoint: vi.fn(),
  complete: vi.fn(),
  fail: vi.fn(),
  fallback: vi.fn(),
  geocode: vi.fn(),
  createItineraryRecord: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('../app/lib/server/identity', () => ({
  getRequestIdentity: vi.fn(async () => ({
    authenticated: true,
    userId: '11111111-1111-4111-8111-111111111111',
    provider: 'local',
  })),
}));
vi.mock('../app/lib/server/generation-request-repository', () => ({
  canonicalRequestHash: vi.fn(() => 'a'.repeat(64)),
  reserveGenerationRequest: mocks.reserve,
  checkpointGenerationRequest: mocks.checkpoint,
  completeGenerationRequest: mocks.complete,
  failGenerationRequest: mocks.fail,
}));
vi.mock('../app/lib/fallback-ai', () => ({
  generateDestinationAwareFallbackItinerary: mocks.fallback,
}));
vi.mock('../app/lib/geocoding', () => ({
  geocodeServerSide: mocks.geocode,
  getCountryCentroid: vi.fn(() => null),
}));
vi.mock('../app/lib/supabase/db', () => ({
  createItineraryRecord: mocks.createItineraryRecord,
}));

import { POST } from '../app/api/generate-itinerary/route';

const KEY = '12345678-1234-4123-8123-123456789012';

function generatedItinerary(days = 2) {
  return {
    destination: {
      city: 'Coimbra',
      name: 'Coimbra, Portugal',
      coordinates: [40.2033, -8.4103],
    },
    trip: { totalDays: days },
    days: Array.from({ length: days }, (_, index) => ({
      title: `Coimbra Stories: Route ${index + 1}`,
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

function makeRequest({ key = KEY, destination = 'Coimbra, Portugal' } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (key !== null) headers['Idempotency-Key'] = key;
  return new Request('http://localhost/api/generate-itinerary', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      destination,
      destinationEntity: {
        entityId: 'geo-coimbra',
        canonicalName: 'Coimbra',
        displayName: 'Coimbra, Portugal',
        entityType: 'city',
        countryCode: 'PT',
        coordinates: { lat: 40.2033, lng: -8.4103 },
      },
      days: 2,
      forceFallback: true,
    }),
  });
}

function makeMultiRequest() {
  const lisbon = {
    entityId: 'geo-lisbon', canonicalName: 'Lisboa', displayName: 'Lisboa, Portugal',
    entityType: 'city', countryCode: 'PT', coordinates: { lat: 38.7223, lng: -9.1393 },
    timezone: 'Europe/Lisbon', currencyCodes: ['EUR'], resolutionStatus: 'resolved',
  };
  const porto = {
    entityId: 'geo-porto', canonicalName: 'Porto', displayName: 'Porto, Portugal',
    entityType: 'city', countryCode: 'PT', coordinates: { lat: 41.1579, lng: -8.6291 },
    timezone: 'Europe/Lisbon', currencyCodes: ['EUR'], resolutionStatus: 'resolved',
  };
  return new Request('http://localhost/api/generate-itinerary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': KEY },
    body: JSON.stringify({
      destination: lisbon.displayName,
      destinationEntity: lisbon,
      journey: {
        schemaVersion: 2,
        stages: [
          { id: 'stage-lisbon', destination: lisbon.displayName, destinationEntity: lisbon, nights: 1, transportMode: 'train' },
          { id: 'stage-porto', destination: porto.displayName, destinationEntity: porto, nights: 1, transportMode: 'train' },
        ],
      },
      days: 3,
      travelers: 2,
      forceFallback: true,
    }),
  });
}

describe('authenticated generation idempotency contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fallback.mockResolvedValue(generatedItinerary());
    mocks.geocode.mockResolvedValue({ lat: 40.2074, lng: -8.4265 });
    mocks.reserve.mockResolvedValue({
      ok: true,
      status: 'reserved',
      provider: 'sqlite',
      requestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      leaseToken: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      checkpoint: null,
    });
    mocks.checkpoint.mockResolvedValue({ ok: true, status: 'in_progress', provider: 'sqlite' });
    mocks.complete.mockImplementation(async ({ tripRecord }) => ({
      ok: true,
      status: 'replay',
      replayed: false,
      provider: 'sqlite',
      tripId: tripRecord.id,
      response: tripRecord.responsePayload,
    }));
    mocks.fail.mockResolvedValue({ ok: false, status: 'failed', retryable: true });
  });

  test('requires a valid key before invoking a provider', async () => {
    const response = await POST(makeRequest({ key: null }));
    expect(response.status).toBe(428);
    expect((await response.json()).error.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
    expect(mocks.reserve).not.toHaveBeenCalled();
    expect(mocks.fallback).not.toHaveBeenCalled();
  });

  test('completes the itinerary and receipt atomically', async () => {
    const response = await POST(makeRequest());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.persistence).toMatchObject({ mode: 'durable', persisted: true, provider: 'sqlite' });
    expect(body.itinerary.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(mocks.checkpoint).toHaveBeenCalledTimes(1);
    expect(mocks.complete).toHaveBeenCalledTimes(1);
    expect(mocks.complete.mock.calls[0][0].tripRecord).toMatchObject({
      id: body.itinerary.id,
      responsePayload: { itinerary: { id: body.itinerary.id } },
    });
    expect(mocks.createItineraryRecord).not.toHaveBeenCalled();
  });

  test('replays the exact persisted response without regenerating', async () => {
    const first = await POST(makeRequest());
    const firstBody = await first.json();
    mocks.reserve.mockResolvedValueOnce({
      ok: true,
      status: 'replay',
      provider: 'sqlite',
      response: firstBody,
      tripId: firstBody.itinerary.id,
    });

    const replay = await POST(makeRequest());
    const replayBody = await replay.json();
    expect(replay.status).toBe(200);
    expect(replay.headers.get('Idempotency-Replayed')).toBe('true');
    expect(replayBody).toEqual(firstBody);
    expect(mocks.fallback).toHaveBeenCalledTimes(1);
    expect(mocks.complete).toHaveBeenCalledTimes(1);
  });

  test('rejects a reused key with a different semantic payload', async () => {
    mocks.reserve.mockResolvedValueOnce({ ok: false, status: 'mismatch', provider: 'sqlite' });
    const response = await POST(makeRequest({ destination: 'Porto, Portugal' }));
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe('IDEMPOTENCY_KEY_REUSED');
    expect(mocks.fallback).not.toHaveBeenCalled();
  });

  test('returns a retry interval while another lease is active', async () => {
    mocks.reserve.mockResolvedValueOnce({
      ok: true,
      status: 'in_progress',
      provider: 'sqlite',
      retryAfterSeconds: 17,
    });
    const response = await POST(makeRequest());
    expect(response.status).toBe(409);
    expect(response.headers.get('Retry-After')).toBe('17');
    expect((await response.json()).error.code).toBe('GENERATION_IN_PROGRESS');
    expect(mocks.fallback).not.toHaveBeenCalled();
  });

  test('generates a validated Lisboa to Porto journey and persists it once', async () => {
    mocks.fallback.mockImplementation(async (destination, days) => {
      const isPorto = /porto/i.test(destination);
      const center = isPorto ? [41.1579, -8.6291] : [38.7223, -9.1393];
      const city = isPorto ? 'Porto' : 'Lisboa';
      return {
        destination: { city, name: destination, coordinates: center },
        trip: { totalDays: days },
        days: Array.from({ length: days }, (_, index) => ({
          title: `${city} Stories: Route ${index + 1}`,
          periods: {
            morning: {
              activities: [{ name: `${city} stop ${index + 1}`, coordinates: center }],
            },
          },
        })),
      };
    });
    mocks.geocode.mockImplementation(async (query) => (
      /porto/i.test(query)
        ? { lat: 41.1579, lng: -8.6291 }
        : { lat: 38.7223, lng: -9.1393 }
    ));

    const response = await POST(makeMultiRequest());
    const body = await response.json();
    expect(response.status, JSON.stringify(body)).toBe(200);
    expect(body.itinerary).toMatchObject({
      schemaVersion: 2,
      journey: { kind: 'multi_destination', routeLabel: 'Lisboa → Porto' },
    });
    expect(body.itinerary.journey.stages.map((stage) => stage.allocatedDays)).toEqual([1, 2]);
    expect(body.itinerary.journey.transfers).toHaveLength(1);
    expect(body.itinerary.days.map((day) => day.stageId)).toEqual([
      'stage-lisbon',
      'stage-porto',
      'stage-porto',
    ]);
    expect(mocks.fallback).toHaveBeenCalledTimes(2);
    expect(mocks.complete).toHaveBeenCalledTimes(1);
  });
});
