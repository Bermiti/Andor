const { test, expect } = require('@playwright/test');

function makeTokyoItinerary() {
  return {
    destination: { city: 'Tokyo', country: 'Japan' },
    days: [
      {
        title: 'Arrival',
        stops: [
          { name: 'Sensoji', coordinates: { lat: 35.7148, lng: 139.7967 } },
          { name: 'Shibuya Crossing', coordinates: { lat: 35.6595, lng: 139.7005 } },
        ],
      },
    ],
  };
}

async function createOwnerTrip(page) {
  const email = `overflow-${Date.now()}-${Math.round(Math.random() * 10000)}@andor.test`;
  const password = 'Andor-Segura-2026';
  await page.request.post('/api/auth/local/register', {
    data: { name: 'Overflow Tester', email, password },
  });

  const tripRes = await page.request.post('/api/itineraries', {
    data: { itinerary: makeTokyoItinerary(), source: 'manual' },
  });
  const { trip } = await tripRes.json();
  return trip.id;
}

test.describe('Mobile overflow regression', () => {
  test('shared itinerary stays inside a 375px viewport', async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/');
    const tripId = await createOwnerTrip(page);

    await page.goto(`${baseURL}/itinerary/${tripId}`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByTestId('itinerary-map-container')).toBeVisible();
    await expect(page.getByTestId('activity-card')).toHaveCount(2);

    const layout = await page.evaluate(() => {
      const boxes = [...document.querySelectorAll('[data-testid="activity-card"], [data-testid="itinerary-map-container"]')]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return { left: rect.left, right: rect.right, width: rect.width };
        });

      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        boxes,
      };
    });

    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
    for (const box of layout.boxes) {
      expect(box.left).toBeGreaterThanOrEqual(-1);
      expect(box.right).toBeLessThanOrEqual(layout.viewportWidth + 1);
      expect(box.width).toBeGreaterThan(0);
    }
  });
});
