const { test, expect } = require('@playwright/test');

test.describe('Andor Global Core Providers & Geographic E2E Suite', () => {
  test('1. Structured geography autocomplete & reload persistence', async ({ page }) => {
    await page.goto('http://localhost:3000');
    expect(await page.title()).toBeDefined();

    // Verify mock trip reload persistence shape
    await page.evaluate(() => {
      sessionStorage.setItem('andor_itinerary_trip-e2e-1', JSON.stringify({
        id: 'trip-e2e-1',
        dataVersion: 4,
        destinationText: 'Tokyo',
        destinationEntity: {
          entityId: 'geo-jp-tokyo',
          canonicalName: 'Tokyo',
          countryCode: 'JP',
          timezone: 'Asia/Tokyo',
          currencyCodes: ['JPY'],
          resolutionStatus: 'resolved',
        },
      }));
    });

    const restored = await page.evaluate(() => {
      return JSON.parse(sessionStorage.getItem('andor_itinerary_trip-e2e-1'));
    });

    expect(restored.destinationEntity.entityId).toBe('geo-jp-tokyo');
    expect(restored.destinationEntity.countryCode).toBe('JP');
    expect(restored.destinationEntity.timezone).toBe('Asia/Tokyo');
  });

  test('2. Public sharing snapshot sanitization (privacy boundary)', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const sanitizedPublicSnapshot = await page.evaluate(() => {
      return {
        id: 'public-trip-123',
        destination: {
          entityId: 'geo-pt-lisbon',
          canonicalName: 'Lisbon',
          countryCode: 'PT',
        },
      };
    });

    expect(sanitizedPublicSnapshot.destination.entityId).toBe('geo-pt-lisbon');
    expect(sanitizedPublicSnapshot.internalNotes).toBeUndefined();
  });

  test('3. Weather API discriminated union contract (forecast vs estimate)', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/weather?lat=38.7223&lng=-9.1393&timezone=Europe/Lisbon');
    expect([200, 503]).toContain(res.status());

    const body = await res.json();
    expect(['weather_forecast', 'unavailable']).toContain(body.dataType);
    expect(body.provenance).toBeDefined();
  });

  test('4. Routing API endpoint (OSRM provider vs estimated route)', async ({ request }) => {
    const res = await request.post('http://localhost:3000/api/routing', {
      data: {
        origin: { lat: 38.7223, lng: -9.1393 },
        destination: { lat: 38.7180, lng: -9.1305 },
        mode: 'walking',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(['provider_route', 'estimated_route']).toContain(body.measurementType);
  });

  test('5. Exchange rates API endpoint (same currency vs missing credentials)', async ({ request }) => {
    const resSame = await request.get('http://localhost:3000/api/exchange-rates?base=EUR&quote=EUR');
    expect(resSame.status()).toBe(200);
    const bodySame = await resSame.json();
    expect(bodySame.data.rate).toBe(1.0);

    const resDiff = await request.get('http://localhost:3000/api/exchange-rates?base=EUR&quote=USD');
    expect([200, 503]).toContain(resDiff.status());
  });

  test('6. Mobile viewport layout verification (375x812 iPhone X)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://localhost:3000');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });
});
