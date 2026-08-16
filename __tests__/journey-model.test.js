import { describe, expect, test } from 'vitest';
import {
  buildJourneyPlan,
  createJourneyItinerary,
  createStableJourneyId,
  upgradeLegacyItineraryToJourneyV2,
  validateJourneyItinerary,
} from '../app/lib/journey-model';
import {
  getActiveStageContext,
  getDaysForStage,
  getDestinationForDayIndex,
  getJourneyRouteLabel,
  getJourneyStages,
  getMapContextForDayIndex,
  getStageForDayIndex,
  getTransfersForDayIndex,
} from '../app/lib/journey-selectors';

function destination(name, lat, lng, extra = {}) {
  return {
    entityId: extra.entityId || `geo-${name.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-')}`,
    canonicalName: name,
    displayName: extra.displayName || name,
    entityType: extra.entityType || 'city',
    city: extra.city || name,
    region: extra.region || null,
    country: extra.country || null,
    countryCode: extra.countryCode || null,
    regionCode: extra.regionCode || null,
    coordinates: { lat, lng },
    timezone: extra.timezone || null,
    currencyCodes: extra.currencyCodes || ['EUR'],
    resolutionStatus: 'resolved',
    provenance: {
      sourceType: 'verified_provider',
      provider: 'test-geocoder',
      confidence: 1,
    },
  };
}

function stage(destinationValue, nights, extra = {}) {
  return { destination: destinationValue, nights, ...extra };
}

function activityDay(title, coordinates, extra = {}) {
  return {
    title,
    localSecret: extra.localSecret,
    activities: [{
      name: `${title} stop`,
      period: extra.period || 'morning',
      coordinates,
      customFact: extra.customFact,
    }],
  };
}

const LISBON = destination('Lisboa', 38.7223, -9.1393, {
  displayName: 'Lisboa, Portugal', country: 'Portugal', countryCode: 'PT', timezone: 'Europe/Lisbon',
});
const PORTO = destination('Porto', 41.1579, -8.6291, {
  displayName: 'Porto, Portugal', country: 'Portugal', countryCode: 'PT', timezone: 'Europe/Lisbon',
});
const MADRID = destination('Madrid', 40.4168, -3.7038, {
  displayName: 'Madrid, Espanha', country: 'Espanha', countryCode: 'ES', timezone: 'Europe/Madrid',
});
const BARCELONA = destination('Barcelona', 41.3874, 2.1686, {
  displayName: 'Barcelona, Espanha', country: 'Espanha', countryCode: 'ES', timezone: 'Europe/Madrid',
});

function daysNear(destinationValue, count) {
  return Array.from({ length: count }, (_, index) => activityDay(
    `${destinationValue.canonicalName} ${index + 1}`,
    {
      lat: destinationValue.coordinates.lat + index * 0.001,
      lng: destinationValue.coordinates.lng + index * 0.001,
    },
  ));
}

describe('multi-destination journey model v2', () => {
  test('distributes Lisboa to Porto as [2, 3] and puts the transfer on Porto day one', () => {
    const itinerary = createJourneyItinerary({
      stages: [stage(LISBON, 2), stage(PORTO, 2)],
      transfers: [{ mode: 'train', departureWindow: 'morning', arrivalWindow: 'afternoon' }],
      startDate: '2026-09-01',
      endDate: '2026-09-05',
      daysByStage: [daysNear(LISBON, 2), daysNear(PORTO, 3)],
    });

    expect(itinerary.journey.stages.map((item) => item.allocatedDays)).toEqual([2, 3]);
    expect(itinerary.days.map((day) => day.stageId)).toEqual([
      itinerary.journey.stages[0].id,
      itinerary.journey.stages[0].id,
      itinerary.journey.stages[1].id,
      itinerary.journey.stages[1].id,
      itinerary.journey.stages[1].id,
    ]);
    expect(itinerary.journey.transfers).toHaveLength(1);
    expect(itinerary.journey.transfers[0]).toMatchObject({
      travelDayNumber: 3,
      travelDate: '2026-09-03',
      mode: 'train',
      toStageId: itinerary.journey.stages[1].id,
    });
    expect(itinerary.days[2].transferIds).toEqual([itinerary.journey.transfers[0].id]);
    expect(getJourneyRouteLabel(itinerary)).toBe('Lisboa → Porto');
    expect(getDestinationForDayIndex(itinerary, 2).canonicalName).toBe('Porto');
    expect(getMapContextForDayIndex(itinerary, 2).center).toEqual(PORTO.coordinates);
    expect(getTransfersForDayIndex(itinerary, 2)).toHaveLength(1);
  });

  test('distributes Lisboa to Madrid to Barcelona as [2, 2, 3]', () => {
    const itinerary = createJourneyItinerary({
      stages: [stage(LISBON, 2), stage(MADRID, 2), stage(BARCELONA, 2)],
      transfers: [{ mode: 'train' }, { mode: 'train' }],
      startDate: '2026-09-01',
      endDate: '2026-09-07',
      daysByStage: [daysNear(LISBON, 2), daysNear(MADRID, 2), daysNear(BARCELONA, 3)],
    });

    expect(itinerary.journey.stages.map((item) => item.allocatedDays)).toEqual([2, 2, 3]);
    expect(itinerary.journey.transfers.map((item) => item.travelDayNumber)).toEqual([3, 5]);
    expect(itinerary.days.map((day) => day.stageDayNumber)).toEqual([1, 2, 1, 2, 1, 2, 3]);
    expect(getDaysForStage(itinerary, itinerary.journey.stages[1])).toHaveLength(2);
    expect(getStageForDayIndex(itinerary, 4).destination.canonicalName).toBe('Barcelona');
    expect(getActiveStageContext(itinerary, 4).incomingTransfer.id).toBe(itinerary.journey.transfers[1].id);
  });

  test('uses the same generic allocation for Alpha, Beta and Gamma', () => {
    const alpha = destination('Alpha', 10, 10, { countryCode: 'AA', currencyCodes: [] });
    const beta = destination('Beta', 20, 20, { countryCode: 'BB', currencyCodes: [] });
    const gamma = destination('Gamma', 30, 30, { countryCode: 'CC', currencyCodes: [] });
    const itinerary = createJourneyItinerary({
      stages: [stage(alpha, 2), stage(beta, 2), stage(gamma, 2)],
      totalDays: 7,
      daysByStage: [daysNear(alpha, 2), daysNear(beta, 2), daysNear(gamma, 3)],
    });

    expect(itinerary.journey.stages.map((item) => item.allocatedDays)).toEqual([2, 2, 3]);
    expect(itinerary.journey.transfers.map((item) => item.travelDayNumber)).toEqual([3, 5]);
    expect(itinerary.journey.baseCurrency).toBeNull();
    expect(validateJourneyItinerary(itinerary)).toMatchObject({ valid: true, fatal: false });
  });

  test('keeps Unicode labels and generates stable deterministic IDs', () => {
    const saoMiguel = destination('São Miguel', 37.7804, -25.4970, {
      entityType: 'island', displayName: 'São Miguel, Açores', countryCode: 'PT',
    });
    const terceira = destination('Angra do Heroísmo', 38.6555, -27.2178, {
      displayName: 'Angra do Heroísmo, Açores', countryCode: 'PT',
    });
    const first = buildJourneyPlan({ stages: [stage(saoMiguel, 2), stage(terceira, 2)], totalDays: 5 });
    const second = buildJourneyPlan({ stages: [stage(saoMiguel, 2), stage(terceira, 2)], totalDays: 5 });

    expect(first.routeLabel).toBe('São Miguel → Angra do Heroísmo');
    expect(first.stages.map((item) => item.id)).toEqual(second.stages.map((item) => item.id));
    expect(first.transfers[0].id).toBe(second.transfers[0].id);
    expect(createStableJourneyId('stage', 'São Miguel')).toBe(createStableJourneyId('stage', 'São Miguel'));
  });

  test('rejects orphan stages and transfers', () => {
    const itinerary = createJourneyItinerary({
      stages: [stage(LISBON, 2), stage(PORTO, 2)],
      totalDays: 5,
      daysByStage: [daysNear(LISBON, 2), daysNear(PORTO, 3)],
    });
    const orphanDay = structuredClone(itinerary);
    orphanDay.days[0].stageId = 'stage-does-not-exist';
    const dayResult = validateJourneyItinerary(orphanDay);
    expect(dayResult.valid).toBe(false);
    expect(dayResult.errors).toContain('Day ' + orphanDay.days[0].id + ' references an unknown stage: stage-does-not-exist');

    const orphanTransfer = structuredClone(itinerary);
    orphanTransfer.journey.transfers[0].toStageId = 'stage-does-not-exist';
    const transferResult = validateJourneyItinerary(orphanTransfer);
    expect(transferResult.valid).toBe(false);
    expect(transferResult.errors).toContain('Transfer ' + orphanTransfer.journey.transfers[0].id + ' has an invalid toStageId');

    const orphanBoundary = structuredClone(itinerary);
    orphanBoundary.journey.stages[1].arrival.transferId = 'transfer-does-not-exist';
    const boundaryResult = validateJourneyItinerary(orphanBoundary);
    expect(boundaryResult.valid).toBe(false);
    expect(boundaryResult.errors).toContain(
      `Stage ${orphanBoundary.journey.stages[1].id} has an invalid arrival boundary`,
    );
  });

  test('rejects a wrong night sum and uncovered days', () => {
    expect(() => buildJourneyPlan({
      stages: [stage(LISBON, 1), stage(PORTO, 1)],
      totalDays: 5,
    })).toThrowError(/Cannot build journey plan/);

    const itinerary = createJourneyItinerary({
      stages: [stage(LISBON, 2), stage(PORTO, 2)],
      totalDays: 5,
      daysByStage: [daysNear(LISBON, 2), daysNear(PORTO, 3)],
    });
    const corrupted = structuredClone(itinerary);
    corrupted.journey.stages[0].nights = 3;
    const result = validateJourneyItinerary(corrupted);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.stringContaining('allocatedDays must be 3'),
      'Stage nights do not match journey.totalNights',
    ]));
  });

  test('validates activity geography against its own stage rather than the first destination', () => {
    const valid = createJourneyItinerary({
      stages: [stage(LISBON, 2), stage(PORTO, 2)],
      totalDays: 5,
      daysByStage: [daysNear(LISBON, 2), daysNear(PORTO, 3)],
    });
    expect(validateJourneyItinerary(valid).valid).toBe(true);

    const invalid = structuredClone(valid);
    invalid.days[2].activities[0].coordinates = LISBON.coordinates;
    const result = validateJourneyItinerary(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      `Activity ${invalid.days[2].activities[0].id} coordinates are outside stage ${invalid.journey.stages[1].id}`,
    );
  });

  test('accepts a transfer-only arrival day but rejects a truly empty day', () => {
    const transferOnly = createJourneyItinerary({
      stages: [stage(LISBON, 1), stage(PORTO, 1)],
      totalDays: 3,
      daysByStage: [
        daysNear(LISBON, 1),
        [{ title: 'Transfer e chegada' }, ...daysNear(PORTO, 1)],
      ],
    });
    expect(transferOnly.days[1].activities).toEqual([]);
    expect(transferOnly.days[1].transferIds).toHaveLength(1);
    expect(validateJourneyItinerary(transferOnly).valid).toBe(true);

    const empty = structuredClone(transferOnly);
    empty.days[2].activities = [];
    const result = validateJourneyItinerary(empty);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Day 3 has no activities or transfer');
  });

  test('upgrades legacy v1 without duplicating or losing activities', () => {
    const legacy = {
      id: 'legacy-trip-1',
      destination: {
        city: 'Coimbra',
        name: 'Coimbra, Portugal',
        country: 'Portugal',
        countryCode: 'PT',
        coordinates: [40.2033, -8.4103],
        currency: { code: 'EUR', symbol: '€' },
      },
      trip: { totalDays: 2, startDate: '2026-10-01', endDate: '2026-10-02' },
      days: [{
        title: 'Universidade e Alta',
        localSecret: 'Preservar esta nota',
        periods: {
          morning: {
            timeRange: '09:00 - 12:00',
            activities: [{
              id: 'coimbra-university',
              name: 'Universidade de Coimbra',
              coordinates: [40.2074, -8.4265],
              insiderTip: 'Biblioteca primeiro',
            }],
          },
        },
        stops: [{
          id: 'coimbra-university',
          name: 'Universidade de Coimbra',
          coordinates: [40.2074, -8.4265],
          customStopField: 'preserved',
        }],
      }, {
        title: 'Baixa e Mondego',
        activities: [{
          name: 'Mosteiro de Santa Clara-a-Velha',
          coordinates: { lat: 40.2015, lng: -8.4325 },
          customFact: 'preserved too',
        }],
      }],
      customTripField: { keep: true },
    };

    const first = upgradeLegacyItineraryToJourneyV2(legacy);
    const second = upgradeLegacyItineraryToJourneyV2(legacy);

    expect(first.schemaVersion).toBe(2);
    expect(first.journey.stages).toHaveLength(1);
    expect(first.journey.stages[0].allocatedDays).toBe(2);
    expect(first.days).toHaveLength(2);
    expect(first.days[0].activities).toHaveLength(1);
    expect(first.days[0].activities[0]).toMatchObject({
      id: 'coimbra-university',
      insiderTip: 'Biblioteca primeiro',
      customStopField: 'preserved',
    });
    expect(first.days[0].periods.morning).toEqual({ timeRange: '09:00 - 12:00' });
    expect(first.days[0].localSecret).toBe('Preservar esta nota');
    expect(first.days[1].activities[0].customFact).toBe('preserved too');
    expect(first.customTripField).toEqual({ keep: true });
    expect(first.journey.stages[0].id).toBe(second.journey.stages[0].id);
    expect(first.days.map((day) => day.id)).toEqual(second.days.map((day) => day.id));
    expect(getJourneyStages(legacy)[0].destination.canonicalName).toBe('Coimbra');
    expect(getJourneyRouteLabel(legacy)).toBe('Coimbra');
    expect(validateJourneyItinerary(first)).toMatchObject({ valid: true, fatal: false });
  });
});
