const { test, expect } = require('@playwright/test');
const tokyoFixture = require('../scripts/eval-fixtures/tokyo-7-days.json');

function encodeSharePayload(itinerary) {
  const json = JSON.stringify(itinerary);
  return Buffer.from(unescape(encodeURIComponent(json)), 'binary').toString('base64');
}

async function expectNoHorizontalOverflow(page) {
  const widths = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(widths.scrollWidth).toBeLessThanOrEqual(widths.clientWidth + 1);
}

async function openFixtureItinerary(page, baseURL) {
  await page.addInitScript((fixture) => {
    localStorage.setItem('andor_shared_launch_tokyo', JSON.stringify(fixture));
  }, tokyoFixture);
  await page.goto(`${baseURL}/itinerary/launch_tokyo`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Tokyo/i }).first()).toBeVisible({ timeout: 15000 });
}

test.describe('Launch mobile regression suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('homepage search is mobile-safe and opens the wizard', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Descobre/i })).toBeVisible();
    await expect(page.getByTestId('home-search-form')).toBeVisible();
    await expect(page.getByTestId('home-destination-input')).toBeVisible();
    await expect(page.getByTestId('home-date-input')).toBeVisible();
    await expect(page.getByTestId('home-travellers-input')).toBeVisible();
    await expect(page.getByTestId('home-explore-button')).toBeVisible();

    await page.getByTestId('home-destination-input').fill('Tokyo');
    await expectNoHorizontalOverflow(page);
    await page.getByTestId('home-explore-button').click();
    await expect(page.getByTestId('creation-wizard')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('wizard steps remain usable on iPhone width', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/?wizard=true&dest=Tokyo&step=1`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('creation-wizard')).toBeVisible();
    await expect(page.getByTestId('wizard-destination-input')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByTestId('wizard-next').click();
    await expect(page.getByText(/Quando/i)).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByTestId('wizard-next').click();
    await page.getByTestId('wizard-style-gastronomia').click();
    await expectNoHorizontalOverflow(page);

    await page.getByTestId('wizard-next').click();
    await page.getByTestId('wizard-budget-comfort').click();
    await expect(page.getByTestId('wizard-submit')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('shared itinerary core interactions are mobile-safe', async ({ page, baseURL }) => {
    await openFixtureItinerary(page, baseURL);
    await expect(page.getByTestId('day-tabs')).toBeVisible();
    await expect(page.getByTestId('day-tab-2')).toBeVisible();
    await page.getByTestId('day-tab-2').click();
    await expect(page.getByText(/Neon Crossings/i).first()).toBeVisible();

    const map = page.getByTestId('itinerary-map-container');
    await expect(map).toBeVisible();
    const mapBox = await map.boundingBox();
    expect(Math.round(mapBox.height)).toBe(240);

    const firstActivity = page.getByTestId('activity-card').first();
    await expect(firstActivity).toBeVisible();
    const bookingButton = page.getByTestId('booking-button').first();
    if (!(await bookingButton.isVisible().catch(() => false))) {
      await firstActivity.locator('button').first().click();
    }
    await expect(bookingButton).toBeVisible();

    await page.getByTestId('mobile-budget-toggle').click();
    await expect(page.getByText(/Ajustar/i).first()).toBeVisible();
    await page.getByRole('button', { name: /Partilhar/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await bookingButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.getByRole('button', { name: /Regenerar este dia/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test('chat opens fullscreen-like on mobile and keeps input usable', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
    const toggle = page.getByTestId('floating-ai-toggle');
    await toggle.waitFor({ state: 'visible', timeout: 15000 });
    await toggle.click();
    await expect(page.getByTestId('floating-ai-chat')).toBeVisible();
    await expect(page.getByTestId('floating-ai-input')).toBeVisible();
    await expect(page.getByTestId('floating-ai-send')).toBeVisible();
    await page.getByTestId('floating-ai-input').fill('Sugere uma viagem surpresa em outubro');
    await expect(page.getByTestId('floating-ai-send')).toBeEnabled();
    await expectNoHorizontalOverflow(page);
  });

  test('destination page has editorial content and no mobile overflow', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/destination/tokyo`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Tokyo' })).toBeVisible();
    await expect(page.getByText(/Honest Skip List/i)).toBeVisible();
    await expect(page.getByText(/Best Time Calendar/i)).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('corrupted local storage does not crash itinerary route', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('andor_favorites', '{broken');
      localStorage.setItem('andor_favorite_activities', '{broken');
      sessionStorage.setItem('andor_itinerary_gen-corrupt', '{broken');
    });
    await page.goto(`${baseURL}/itinerary/gen-corrupt`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
