import { describe, expect, test } from 'vitest';
import {
  getUnitedKingdomNumericCode,
  normalizeUnitedKingdomDestination,
} from '../app/lib/destination-geography';
import { getCountryCentroid } from '../app/lib/geocoding';
import { getDestinationCenter } from '../app/lib/coordinate-validator';
import { validateAndNormalize } from '../app/lib/itinerary-validate';

function itineraryFor(destination) {
  return {
    destination,
    days: [{
      title: 'Royal Mile and the Old Town',
      stops: [{
        name: 'Edinburgh Castle',
        coordinates: { lat: 55.9486, lng: -3.1999 },
      }],
    }],
  };
}

describe('Scotland and United Kingdom geography', () => {
  test.each([
    ['Scotland', ''],
    ['Edinburgh, Scotland', 'Edinburgh'],
    ['Glasgow', 'Glasgow'],
  ])('normalizes %s without flattening Scotland into a country', (input, city) => {
    expect(normalizeUnitedKingdomDestination(input)).toMatchObject({
      city,
      region: 'Scotland',
      country: 'United Kingdom',
      countryCode: 'GB',
      timezone: 'Europe/London',
      currency: { code: 'GBP', symbol: 'GBP' },
    });
  });

  test('preserves explicit country and region fields together', () => {
    const result = normalizeUnitedKingdomDestination({
      city: 'Edinburgh',
      region: 'Scotland',
      country: 'United Kingdom',
      name: 'Edinburgh, Scotland',
    });

    expect(result).toMatchObject({
      name: 'Edinburgh, Scotland',
      city: 'Edinburgh',
      region: 'Scotland',
      country: 'United Kingdom',
      countryCode: 'GB',
    });
  });

  test('does not rewrite an explicit foreign country from a city-name heuristic', () => {
    expect(normalizeUnitedKingdomDestination({
      city: 'Edinburgh',
      region: 'Scotland',
      country: 'Canada',
    })).toBeNull();
  });

  test.each([
    'Scotland',
    'Edinburgh, Scotland',
    { city: 'Edinburgh', region: 'Scotland' },
  ])('keeps the hierarchy through itinerary validation', (destination) => {
    const validation = validateAndNormalize(itineraryFor(destination));

    expect(validation.fatal).toBe(false);
    expect(validation.normalized.destination).toMatchObject({
      region: 'Scotland',
      country: 'United Kingdom',
      countryCode: 'GB',
      timezone: 'Europe/London',
      currency: { code: 'GBP', symbol: 'GBP' },
    });
  });

  test('uses the UK centroid as a coarse fallback without claiming city coverage', () => {
    expect(getCountryCentroid('Scotland')).toEqual(getCountryCentroid('United Kingdom'));
    expect(getDestinationCenter('Edinburgh, Scotland')).toEqual(getCountryCentroid('United Kingdom'));
  });

  test.each(['Scotland', 'Edinburgh, Scotland', 'Glasgow']) (
    'maps %s to the numeric GB code used by the journey globe',
    (destination) => {
      expect(getUnitedKingdomNumericCode(destination)).toBe('826');
    },
  );
});
