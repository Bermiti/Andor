import { describe, expect, test } from 'vitest';
import { generateFallbackItinerary } from '../app/lib/fallback-ai';
import { validateAndNormalize } from '../app/lib/itinerary-validate';

describe('fallback itinerary generation', () => {
  test('generates exactly the requested number of Tokyo days', () => {
    const itinerary = generateFallbackItinerary('Tokyo, Japan', 5, 'comfort');

    expect(itinerary.days).toHaveLength(5);
    expect(itinerary.trip.totalDays).toBe(5);
    expect(itinerary.currency).toBe('¥');
    expect(itinerary.trip.budgetBreakdown.currency).toBe('JPY');
    itinerary.days.forEach((day) => {
      expect(day.stops.length).toBeGreaterThan(0);
    });
  });

  test('keeps Tokyo costs in JPY after validation', () => {
    const itinerary = generateFallbackItinerary('Tokyo, Japan', 5, 'comfort');
    const result = validateAndNormalize(itinerary);

    expect(result.fatal).toBe(false);
    expect(result.normalized.destination.countryCode).toBe('JP');
    expect(result.normalized.destination.currency.code).toBe('JPY');
    expect(result.normalized.trip.budgetBreakdown.currency).toBe('JPY');
    expect(result.normalized.days[0].stops[0].currency).toBe('JPY');
  });

  test('caps generic fallback trips at fourteen days', () => {
    const itinerary = generateFallbackItinerary('Reykjavik, Iceland', 99, 'premium');

    expect(itinerary.days).toHaveLength(14);
    expect(itinerary.trip.totalDays).toBe(14);
  });
});
