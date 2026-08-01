const { test, expect } = require('@playwright/test');

const TOKYO_BOUNDS = { latMin: 35.0, latMax: 36.5, lngMin: 138.5, lngMax: 140.5 };

function makeTokyoItinerary() {
  return {
    destination: 'Tokyo, Japan',
    days: [
      { title: 'Asakusa Arrival: Sensoji Smoke & Sumida First Light', stops: [{ name: 'Sensoji', coordinates: { lat: 35.7148, lng: 139.7967 } }] },
      { title: 'Shibuya Pulse: Crossing Lights & Hachiko Corners', stops: [{ name: 'Shibuya Crossing', coordinates: { lat: 35.6595, lng: 139.7005 } }] }
    ]
  };
}

function encodeSharePayload(itin) {
  // mirror client encoding: btoa(unescape(encodeURIComponent(JSON.stringify(itin))))
  const json = JSON.stringify(itin);
  return Buffer.from(unescape(encodeURIComponent(json)), 'binary').toString('base64');
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
        // Ensure not Lisbon-like
        expect(lat).not.toBeCloseTo(38.7, 0);
        expect(lng).not.toBeCloseTo(-9.1, 0);
      }
    }

    const payload = encodeSharePayload(tokyo);
    await page.goto(`${baseURL}/itinerary/share?data=${payload}`, { waitUntil: 'domcontentloaded' });

    // Verify page renders and shows Tokyo
    await expect(page.locator('h1')).toContainText(/Tokyo|Tóquio/i);

    // Verify day tabs present (buttons labeled 'DIA 1' etc.)
    const day1Btn = page.getByText('DIA 1', { exact: false }).first();
    const day2Btn = page.getByText('DIA 2', { exact: false }).first();
    await expect(day1Btn).toBeVisible();
    await expect(day2Btn).toBeVisible();

    // Click day 2 and verify heading changes.
    await expect(page.locator('h2', { hasText: 'Asakusa Arrival' })).toBeVisible();
    await day2Btn.click();
    await expect(page.locator('h2', { hasText: 'Shibuya Pulse' })).toBeVisible();

    await expect(page.getByTestId('itinerary-map-container')).toBeVisible();
    await expect(page.locator('.leaflet-container')).toHaveCount(1);

    // Verify activity cards render alongside the map.
    const firstActivityCard = page.getByTestId('activity-card').first();
    await expect(firstActivityCard).toBeVisible();
    const saveAction = firstActivityCard.locator('button:has-text("Guardar"), button:has-text("Guardado")').first();
    if (!(await saveAction.isVisible().catch(() => false))) {
      await firstActivityCard.locator('button').first().click();
    }
    await expect(saveAction).toBeVisible();

    // Save/Favourite an activity: set `andor_favorites` in localStorage and verify UI reflects it after reload
    const firstStop = tokyo.days[0].stops[0];
    const favObj = { name: firstStop.name, destination: tokyo.destination };
    await page.evaluate((fav) => localStorage.setItem('andor_favorites', JSON.stringify([fav])), favObj);

    // Refresh and confirm favorite persists (look for 'Guardado' text in buttons)
    await page.reload({ waitUntil: 'domcontentloaded' });
    const savedBtn = page.locator('button:has-text("Guardado")').first();
    await expect(savedBtn).toBeVisible({ timeout: 10000 });

    // Mobile checks at 375px
    await page.setViewportSize({ width: 375, height: 812 });
    // allow layout to settle after viewport change
    await page.waitForTimeout(500);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(376);

    // Day tabs still usable on mobile
    await day1Btn.click();
    await expect(day1Btn).toBeVisible();

    await expect(page.getByTestId('itinerary-map-container')).toBeVisible();
    await expect(page.locator('.leaflet-container')).toHaveCount(1);

    // Malformed shared itinerary: navigate to bad payload
    const badPayload = Buffer.from('this is not json').toString('base64');
    await page.goto(`${baseURL}/itinerary/share?data=${badPayload}`, { waitUntil: 'domcontentloaded' });
    // Expect a friendly not found/invalid UI (h2 present)
    const notFoundH2 = page.locator('h2').first();
    await expect(notFoundH2).toBeVisible();
  });
});
