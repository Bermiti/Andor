import { beforeEach, describe, expect, test } from 'vitest';
import { getItinerary } from '../app/lib/itinerary-store';
import { validateAndNormalize } from '../app/lib/itinerary-validate';

describe('curated itinerary demos', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  test.each([
    ['tokyo-food', 'Tokyo'],
    ['hidden-gems-lisbon', 'Lisbon'],
  ])('%s remains map-ready after strict normalization', (id, city) => {
    const itinerary = getItinerary(id);
    const result = validateAndNormalize(itinerary);

    expect(itinerary.metadata.source).toBe('curated-demo');
    expect(result.fatal).toBe(false);
    expect(result.valid).toBe(true);
    expect(result.errors).not.toContain('No map-critical coordinates available after normalization');
    expect(result.normalized.destination.city).toBe(city);
    const activities = result.normalized.days.flatMap((day) => day.activities);
    expect(activities.length).toBeGreaterThan(0);
    activities.forEach((activity) => {
      expect(activity.coordinates).toEqual(expect.objectContaining({
        lat: expect.any(Number),
        lng: expect.any(Number),
      }));
    });
  });
});
