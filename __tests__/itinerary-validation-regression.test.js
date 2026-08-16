import { describe, expect, test } from 'vitest';
import { validateAndNormalize } from '../app/lib/itinerary-validate';

const MENORCA = {
  city: 'Menorca',
  name: 'Menorca, Spain',
  entityType: 'island',
  coordinates: [39.9496, 4.1104],
};

function activity(name, coordinates) {
  return { name, coordinates };
}

function day(title, activities) {
  return { title, stops: activities };
}

function itinerary(days, destination = MENORCA, totalDays = days.length) {
  return {
    destination,
    trip: { totalDays },
    days,
  };
}

describe('itinerary structural and geographic validation', () => {
  test('requires exactly the explicitly requested number of days', () => {
    const result = validateAndNormalize(itinerary([
      day('Ciutadella Harbour and Old Town', [activity('Ciutadella', [40.0011, 3.8389])]),
      day('Mahon Waterfront and Market', [activity('Mahon', [39.8885, 4.2658])]),
    ], MENORCA, 2), { expectedDays: 3 });

    expect(result.fatal).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Expected exactly 3 days, received 2');
    expect(result.normalized.trip.totalDays).toBe(3);
  });

  test('treats every empty requested day as a fatal error', () => {
    const result = validateAndNormalize(itinerary([
      day('Ciutadella Harbour and Old Town', [activity('Ciutadella', [40.0011, 3.8389])]),
      day('A Quiet Day in Menorca', []),
    ]), { expectedDays: 2 });

    expect(result.fatal).toBe(true);
    expect(result.errors).toContain('Day 2 has no activities');
  });

  test('rejects globally plausible coordinates that are incoherent with an arbitrary destination', () => {
    const result = validateAndNormalize(itinerary([
      day('An Island Morning', [activity('Wrong-city stop', [35.6762, 139.6503])]),
    ]), { expectedDays: 1, requireDestinationCoordinate: true });

    expect(result.fatal).toBe(true);
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.stringContaining('not coherent with the destination'),
      'No map-critical coordinates available after normalization',
    ]));
    expect(result.normalized.days[0].stops[0].coordinates).toBeNull();
  });

  test('keeps nearby coordinates for a destination that has no hardcoded bounds', () => {
    const result = validateAndNormalize(itinerary([
      day('Mahon Waterfront and Market', [activity('Mercat des Claustre', [39.8902, 4.2671])]),
    ]), { expectedDays: 1, requireDestinationCoordinate: true });

    expect(result.fatal).toBe(false);
    expect(result.valid).toBe(true);
    expect(result.normalized.days[0].stops[0].coordinates).toEqual({
      lat: 39.8902,
      lng: 4.2671,
    });
  });

  test('fails closed when geographic coherence is required but the destination has no coordinates', () => {
    const result = validateAndNormalize(itinerary([
      day('Coimbra Old Town', [activity('University of Coimbra', [40.2074, -8.4265])]),
    ], { city: 'Coimbra', name: 'Coimbra, Portugal' }), {
      expectedDays: 1,
      requireDestinationCoordinate: true,
    });

    expect(result.fatal).toBe(true);
    expect(result.errors).toContain('Destination coordinates are required to verify geographic coherence');
  });
});
