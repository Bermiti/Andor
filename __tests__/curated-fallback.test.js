import { describe, expect, test } from 'vitest';
import { generateDestinationAwareFallbackItinerary } from '../app/lib/fallback-ai';

describe('curated itinerary fallback quality', () => {
  test('uses specific Lisbon places and includes an actionable evening stop', async () => {
    const itinerary = await generateDestinationAwareFallbackItinerary('Lisboa, Portugal', 3, 'confortável');
    const names = itinerary.days.flatMap((day) => day.stops?.map((stop) => stop.name) || []);

    expect(itinerary.metadata.source).toBe('curated-demo-fallback');
    expect(names).toContain('Se Cathedral and Alfama Lanes');
    expect(names.join(' ')).not.toMatch(/local quarter|historic center walking tour/i);
    expect(itinerary.days[0].stops.some((stop) => stop.period === 'evening')).toBe(true);
  });

  test('serves seven distinct, specific Tokyo days without network place lookup', async () => {
    const itinerary = await generateDestinationAwareFallbackItinerary('Tokyo, Japan', 7, 'mid-range');
    const titles = itinerary.days.map((day) => day.title);
    const names = itinerary.days.flatMap((day) => day.stops?.map((stop) => stop.name) || []);

    expect(new Set(titles).size).toBe(7);
    expect(names).toContain('Senso-ji Temple at Dawn');
    expect(names).toContain('Shibuya Sky Sunset Slot');
    expect(names.join(' ')).not.toMatch(/local quarter/i);
  });
});
