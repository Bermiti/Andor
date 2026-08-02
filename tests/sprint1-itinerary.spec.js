const { test, expect } = require('@playwright/test');

const TOKYO_BOUNDS = { latMin: 35.0, latMax: 36.5, lngMin: 138.5, lngMax: 140.5 };

function makeTokyoItinerary() {
  return {
    destination: { city: 'Tokyo', country: 'Japan' },
    days: [
      { title: 'Asakusa Arrival', theme: 'culture', stops: [{ name: 'Sensoji', type: 'culture', coordinates: { lat: 35.7148, lng: 139.7967 } }] },
      { title: 'Shibuya Pulse', theme: 'nature', stops: [{ name: 'Shibuya Crossing', type: 'shopping', coordinates: { lat: 35.6595, lng: 139.7005 } }] }
    ]
  };
}

async function createOwnerTrip(page) {
  const email = `sprint1-${Date.now()}-${Math.round(Math.random() * 10000)}@andor.test`;
  const password = 'Andor-Segura-2026';
  await page.request.post('/api/auth/local/register', {
    data: { name: 'Tokyo Tester', email, password },
  });

  const tripRes = await page.request.post('/api/itineraries', {
    data: { itinerary: makeTokyoItinerary(), source: 'manual' },
  });
  const { trip } = await tripRes.json();
  return trip.id;
}

test.describe('Sprint 1 itinerary acceptance', () => {
  test('Tokyo itinerary page flows and mobile checks', async ({ page, baseURL }) => {
    // Programmatic coordinate validation before navigation
    const tokyo = makeTokyoItinerary();
    for (const day of tokyo.days) {
      for (const stop of day.stops) {
        const lat = stop.coordinates.lat;
        const lng = stop.coordinates.lng;
        expect(lat).toBeGreaterThanOrEqual(TOKYO_BOUNDS.latMin);
        expect(lat).toBeLessThanOrEqual(TOKYO_BOUNDS.latMax);
        expect(lng).toBeGreaterThanOrEqual(TOKYO_BOUNDS.lngMin);
        expect(lng).toBeLessThanOrEqual(TOKYO_BOUNDS.lngMax);
        expect(lat).not.toBeCloseTo(38.7, 0);
        expect(lng).not.toBeCloseTo(-9.1, 0);
      }
    }

    await page.goto('/');
    const tripId = await createOwnerTrip(page);
    await page.goto(`${baseURL}/itinerary/${tripId}`, { waitUntil: 'domcontentloaded' });

    // Verify page renders and shows Tokyo
    await expect(page.locator('h1')).toContainText(/Tokyo|Tóquio/i);

    // Verify day tabs present
    const day1Btn = page.getByText('DIA 1', { exact: false }).first();
    const day2Btn = page.getByText('DIA 2', { exact: false }).first();
    await expect(day1Btn).toBeVisible();
    await expect(day2Btn).toBeVisible();

    // Click day 2 and verify tab text changes
    await day2Btn.click();
    await expect(page.getByText('Shibuya', { exact: false }).first()).toBeVisible();

    await expect(page.getByTestId('itinerary-map-container')).toBeVisible();
    await expect(page.locator('.leaflet-container')).toHaveCount(1);

    // Verify activity cards render alongside the map
    const firstActivityCard = page.getByTestId('activity-card').first();
    await expect(firstActivityCard).toBeVisible();

    // Mobile checks at 375px
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(376);

    // Day tabs still usable on mobile
    await day1Btn.click();
    await expect(day1Btn).toBeVisible();

    await expect(page.getByTestId('itinerary-map-container')).toBeVisible();
    await expect(page.locator('.leaflet-container')).toHaveCount(1);
  });
});
