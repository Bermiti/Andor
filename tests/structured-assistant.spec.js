const { test, expect } = require('@playwright/test');

test.describe('Andor Structured Assistant & Constraint Engine E2E Suite', () => {
  test('1. Executes adapt_to_weather structured operation via API endpoint', async ({ request }) => {
    const itinerary = {
      version: 1,
      days: [
        {
          activities: [
            { id: 'act-outdoor-1', name: 'Passeio no Parque', isOutdoor: true, locked: false },
          ],
        },
      ],
    };

    const res = await request.post('http://localhost:3000/api/assistant', {
      data: {
        itinerary,
        command: { action: 'adapt_to_weather', targetDayIndex: 0 },
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.itinerary.version).toBe(2);
    expect(body.itinerary.days[0].activities[0].adaptedForRain).toBe(true);
  });

  test('2. Prevents illegal modification of locked itinerary items', async ({ request }) => {
    const itinerary = {
      version: 1,
      days: [
        {
          activities: [
            { id: 'act-locked-item', name: 'Concerto Reservado', locked: true },
          ],
        },
      ],
    };

    const res = await request.post('http://localhost:3000/api/assistant', {
      data: {
        itinerary,
        command: {
          action: 'swap_activity',
          targetDayIndex: 0,
          targetActivityId: 'act-locked-item',
          alternativeCandidate: { id: 'alt-venue', name: 'Outro Espectáculo' },
        },
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('ASSISTANT_EXECUTION_FAILED');
  });
});
