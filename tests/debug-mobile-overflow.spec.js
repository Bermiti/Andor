const { test, expect } = require('@playwright/test');

function encodeSharePayload(itinerary) {
  return Buffer.from(JSON.stringify(itinerary), 'utf8').toString('base64');
}

test.describe('Mobile overflow regression', () => {
  test('shared itinerary stays inside a 375px viewport', async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const payload = encodeSharePayload({
      destination: 'Tokyo, Japan',
      days: [
        {
          title: 'Arrival',
          stops: [
            { name: 'Sensoji', coordinates: { lat: 35.7148, lng: 139.7967 } },
            { name: 'Shibuya Crossing', coordinates: { lat: 35.6595, lng: 139.7005 } },
          ],
        },
      ],
    });

    await page.goto(`${baseURL}/itinerary/share?data=${encodeURIComponent(payload)}`, {
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
