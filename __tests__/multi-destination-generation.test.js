import { describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  generateMultiDestinationItinerary,
  normalizeJourneyGenerationRequest,
} from '../app/lib/server/multi-destination-generation';
import { validateJourneyItinerary } from '../app/lib/journey-model';

const DESTINATIONS = {
  Lisboa: { lat: 38.7223, lng: -9.1393, countryCode: 'PT', timezone: 'Europe/Lisbon', currencyCodes: ['EUR'] },
  Porto: { lat: 41.1579, lng: -8.6291, countryCode: 'PT', timezone: 'Europe/Lisbon', currencyCodes: ['EUR'] },
  Madrid: { lat: 40.4168, lng: -3.7038, countryCode: 'ES', timezone: 'Europe/Madrid', currencyCodes: ['EUR'] },
  'São Miguel': { lat: 37.7804, lng: -25.497, countryCode: 'PT', timezone: 'Atlantic/Azores', currencyCodes: ['EUR'] },
};

function destinationEntity(name) {
  const value = DESTINATIONS[name];
  return {
    entityId: `geo-${name.toLowerCase().replace(/\s+/g, '-')}`,
    canonicalName: name,
    displayName: name,
    entityType: 'city',
    countryCode: value.countryCode,
    coordinates: value,
    timezone: value.timezone,
    currencyCodes: value.currencyCodes,
    resolutionStatus: 'resolved',
    provenance: { sourceType: 'verified_provider', provider: 'test-geocoder', confidence: 1 },
  };
}

function stage(name, nights, transportMode = 'train') {
  return {
    id: `stage-${name.toLowerCase().replace(/\s+/g, '-')}`,
    destination: name,
    destinationEntity: destinationEntity(name),
    nights,
    arrivalWindow: 'afternoon',
    departureWindow: 'morning',
    transportMode,
  };
}

function fakeStageItinerary({ stage: stageValue, allocatedDays }) {
  const center = stageValue.destination.coordinates;
  return {
    destination: stageValue.destination,
    trip: { totalDays: allocatedDays },
    days: Array.from({ length: allocatedDays }, (_, index) => ({
      title: `${stageValue.destination.canonicalName} ${index + 1}`,
      activities: [{
        name: `Paragem ${index + 1}`,
        period: 'morning',
        coordinates: { lat: center.lat + index * 0.001, lng: center.lng + index * 0.001 },
      }],
    })),
    suggestions: [`Mais local em ${stageValue.destination.canonicalName}`],
    metadata: { generationSource: 'test-provider' },
  };
}

describe('multi-destination generation orchestration', () => {
  test('generates and validates Lisboa to Porto with an explicit transfer', async () => {
    const checkpoints = [];
    const generateStage = vi.fn(async (input) => fakeStageItinerary(input));
    const itinerary = await generateMultiDestinationItinerary({
      journey: { stages: [stage('Lisboa', 2), stage('Porto', 2)] },
      totalDays: 5,
      startDate: '2026-09-01',
      endDate: '2026-09-05',
      generateStage,
      onCheckpoint: async (value) => checkpoints.push(structuredClone(value)),
    });

    expect(generateStage).toHaveBeenCalledTimes(2);
    expect(generateStage.mock.calls.map(([input]) => input.allocatedDays)).toEqual([2, 3]);
    expect(itinerary.journey.routeLabel).toBe('Lisboa → Porto');
    expect(itinerary.journey.transfers[0]).toMatchObject({ mode: 'train', travelDayNumber: 3 });
    expect(itinerary.days[2].transferIds).toEqual([itinerary.journey.transfers[0].id]);
    expect(checkpoints.at(-1).completedStageIds).toHaveLength(2);
    expect(validateJourneyItinerary(itinerary)).toMatchObject({ valid: true, fatal: false });
  });

  test('resumes after failure in the second stage without regenerating the first', async () => {
    let durableCheckpoint = null;
    const firstAttempt = vi.fn(async (input) => {
      if (input.stageIndex === 1) throw new Error('provider timeout');
      return fakeStageItinerary(input);
    });

    await expect(generateMultiDestinationItinerary({
      journey: { stages: [stage('Lisboa', 2), stage('Madrid', 2), stage('Porto', 2)] },
      totalDays: 7,
      generateStage: firstAttempt,
      onCheckpoint: async (value) => { durableCheckpoint = structuredClone(value); },
    })).rejects.toThrow('provider timeout');
    expect(firstAttempt).toHaveBeenCalledTimes(2);
    expect(durableCheckpoint.completedStageIds).toEqual(['stage-lisboa']);

    const retry = vi.fn(async (input) => fakeStageItinerary(input));
    const itinerary = await generateMultiDestinationItinerary({
      journey: { stages: [stage('Lisboa', 2), stage('Madrid', 2), stage('Porto', 2)] },
      totalDays: 7,
      checkpoint: durableCheckpoint,
      generateStage: retry,
      onCheckpoint: async (value) => { durableCheckpoint = structuredClone(value); },
    });

    expect(retry).toHaveBeenCalledTimes(2);
    expect(retry.mock.calls.map(([input]) => input.stageIndex)).toEqual([1, 2]);
    expect(itinerary.days).toHaveLength(7);
    expect(validateJourneyItinerary(itinerary).valid).toBe(true);
  });

  test('keeps a long flight arrival day free of incompatible activities', async () => {
    const itinerary = await generateMultiDestinationItinerary({
      journey: { stages: [stage('Lisboa', 1, 'flight'), stage('Porto', 1)] },
      totalDays: 3,
      generateStage: async (input) => fakeStageItinerary(input),
    });
    const arrivalDay = itinerary.days[1];
    expect(arrivalDay.transferDay).toBe(true);
    expect(arrivalDay.activities).toEqual([]);
    expect(arrivalDay.transferIds).toHaveLength(1);
    expect(validateJourneyItinerary(itinerary).valid).toBe(true);
  });

  test('rejects ambiguous destinations and a night total that conflicts with duration', () => {
    try {
      normalizeJourneyGenerationRequest({ stages: [
        stage('Lisboa', 2),
        { ...stage('Porto', 2), destinationEntity: { ...destinationEntity('Porto'), resolutionStatus: 'ambiguous' } },
      ] }, 5);
      throw new Error('Expected ambiguous destination to be rejected');
    } catch (error) {
      expect(error.errors).toEqual(expect.arrayContaining([expect.stringMatching(/ambiguous/i)]));
    }

    try {
      normalizeJourneyGenerationRequest({
        stages: [stage('Lisboa', 1), stage('São Miguel', 1)],
      }, 5);
      throw new Error('Expected night allocation to be rejected');
    } catch (error) {
      expect(error.errors).toEqual(expect.arrayContaining([expect.stringMatching(/expected 4/i)]));
    }
  });
});
