import { describe, expect, test, vi } from 'vitest';
import {
  buildGenerationPayloadFromIntent,
  createGenerationIntentKey,
  fingerprintGenerationPayload,
  resolveGeneratedItineraryResponse,
} from '../app/lib/generation-client';

function intent(destination, overrides = {}) {
  return {
    fields: {
      destinations: [{ canonical: destination, type: 'region' }],
      durationDays: 7,
      dates: null,
      travelers: { type: 'family', adults: 2, children: 2, label: 'Família' },
      budget: { tier: 'moderate', label: 'Equilibrado' },
      interests: [{ id: 'nature', label: 'Natureza' }],
      pace: { pace: 'balanced', label: 'Equilibrado' },
      ...overrides,
    },
  };
}

describe('client generation contract', () => {
  test.each([
    ['Escócia, Reino Unido', 7, 4, 'moderate', 'nature'],
    ['Tóquio, Japão', 5, 1, 'economic', 'gastronomy'],
    ['Marraquexe, Marrocos', 4, 2, 'luxury', 'culture'],
  ])('maps %s to the API schema without destination-specific code', (
    destination,
    days,
    travelers,
    budget,
    interest,
  ) => {
    const payload = buildGenerationPayloadFromIntent(intent(destination, {
      durationDays: days,
      travelers: { adults: travelers, children: 0, type: 'group' },
      budget: { tier: budget },
      interests: [{ id: interest }],
    }));

    expect(payload).toMatchObject({
      destination,
      days,
      travelers,
      budget,
      style: interest,
      startDate: null,
      endDate: null,
      datesFlexible: true,
    });
  });

  test('creates a valid multi-destination night allocation', () => {
    const payload = buildGenerationPayloadFromIntent(intent('Lisboa, Portugal', {
      durationDays: 7,
      destinations: [
        { canonical: 'Lisboa, Portugal' },
        { canonical: 'Madrid, Espanha' },
        { canonical: 'Barcelona, Espanha' },
      ],
    }));

    expect(payload.journey.stages.map((stage) => stage.nights)).toEqual([2, 2, 2]);
    expect(payload.journey.totalNights).toBe(6);
  });

  test('accepts the real durable and guest-draft response contracts without an ok flag', () => {
    expect(resolveGeneratedItineraryResponse({
      itinerary: { id: 'trip-1', days: [{}] },
      persistence: { mode: 'durable', persisted: true, provider: 'sqlite' },
    })).toMatchObject({ mode: 'durable', id: 'trip-1' });

    expect(resolveGeneratedItineraryResponse({
      itinerary: { days: [{}] },
      persistence: { mode: 'local_draft', persisted: false, reason: 'auth_required' },
    })).toMatchObject({ mode: 'local_draft', id: null });
  });

  test('rejects malformed output and non-durable persistence failures', () => {
    expect(() => resolveGeneratedItineraryResponse({ itinerary: { days: 'invalid' } }))
      .toThrow(/roteiro válido/i);
    expect(() => resolveGeneratedItineraryResponse({
      itinerary: { days: [{}] },
      persistence: { persisted: false, reason: 'storage_error' },
    })).toThrow(/não ficou guardado/i);
  });

  test('keeps the request fingerprint stable and generates a usable key', async () => {
    const payload = buildGenerationPayloadFromIntent(intent('Escócia, Reino Unido'));
    expect(await fingerprintGenerationPayload(payload)).toBe(await fingerprintGenerationPayload(payload));
    expect(createGenerationIntentKey().length).toBeGreaterThanOrEqual(16);
  });
});
