const { test, expect } = require('@playwright/test');
const tokyoFixture = require('../scripts/eval-fixtures/tokyo-7-days.json');

async function expectNoHorizontalOverflow(page) {
  const widths = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(widths.scrollWidth).toBeLessThanOrEqual(widths.clientWidth + 1);
}

async function openFixtureItinerary(page, baseURL) {
  const email = `launch-${Date.now()}-${Math.round(Math.random() * 10000)}@andor.test`;
  const password = 'Andor-Segura-2026';
  await page.request.post('/api/auth/local/register', {
    data: { name: 'Launch Tester', email, password },
  });

  const tripRes = await page.request.post('/api/itineraries', {
    data: { itinerary: tokyoFixture, source: 'manual' },
  });
  const { trip } = await tripRes.json();

  await page.goto(`${baseURL}/itinerary/${trip.id}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Tokyo/i }).first()).toBeVisible({ timeout: 15000 });
}

test.describe('Launch mobile regression suite', () => {
  test('homepage search is mobile-safe and opens the wizard', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await expect(page.getByRole('heading', { name: /Descobre/i })).toBeVisible();
    await expect(page.getByTestId('home-search-form')).toBeVisible();
    const homeDestinationInput = page.getByTestId('home-destination-input');
    const homeExploreButton = page.getByTestId('home-explore-button');
    await expect(homeDestinationInput).toBeVisible();
    await expect(homeDestinationInput).toBeEnabled();
    await expect(homeExploreButton).toBeVisible();
    await expect(homeExploreButton).toBeEnabled();

    await homeDestinationInput.pressSequentially('Tokyo');
    await expect(page.getByRole('option', { name: /Tokyo/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await homeExploreButton.click();
    await expect(page.getByTestId('creation-wizard')).toBeVisible({ timeout: 15000 });
    await expectNoHorizontalOverflow(page);
  });

  test('wizard steps remain usable on iPhone width', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/?wizard=true&dest=Tokyo&step=1`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('creation-wizard')).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Criar itinerário' })).toBeVisible();
    await expect(page.getByTestId('wizard-destination-input')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByTestId('wizard-next').click();
    await expect(page.getByText(/Quando/i)).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByTestId('wizard-dates-unknown').check();
    await page.getByTestId('wizard-next').click();
    await page.getByTestId('wizard-style-gastronomia').click();
    await expectNoHorizontalOverflow(page);

    await page.getByTestId('wizard-next').click();
    await page.getByTestId('wizard-budget-comfort').click();
    await expect(page.getByTestId('wizard-next')).toBeVisible();
    await expect(page.getByTestId('wizard-submit')).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test('build trip page opens the creation wizard on mobile', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/itineraries`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Constrói a tua viagem/i })).toBeVisible();
    await page.getByTestId('build-trip-destination').pressSequentially('Lisboa');
    await expectNoHorizontalOverflow(page);
    await page.getByTestId('build-trip-primary').click();
    await expect(page.getByTestId('creation-wizard')).toBeVisible();
    await expect(page.getByTestId('wizard-destination-input')).toHaveValue('Lisboa');
    await expectNoHorizontalOverflow(page);
  });

  test('destination plan CTA opens the creation wizard', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/itineraries`, { waitUntil: 'domcontentloaded' });
    await page.getByTestId('plan-lisboa').click();
    await expect(page.getByTestId('creation-wizard')).toBeVisible();
    await expect(page.getByTestId('wizard-destination-input')).toHaveValue('Lisboa, Portugal');
  });

  test('my journey lists saved generated trips', async ({ page, baseURL }) => {
    const savedTrip = {
      destination: { city: 'Lisboa', country: 'Portugal' },
      savedAt: '2026-05-29T10:00:00.000Z',
      style: 'Cultural',
      totalCost: '€320',
      days: [
        {
          title: 'Dia 1 — Alfama e Belém',
          stops: [
            { time: '09:00', name: 'Miradouro da Graça', type: 'Vista' },
            { time: '12:30', name: 'Pastéis de Belém', type: 'Pausa local' },
          ],
        },
      ],
    };

    await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
    const email = `journey-${Date.now()}-${Math.round(Math.random() * 10000)}@andor.test`;
    await page.request.post('/api/auth/local/register', {
      data: { name: 'Maria Tester', email, password: 'Andor-Segura-2026' },
    });

    await page.request.post('/api/itineraries', {
      data: { itinerary: savedTrip, source: 'manual' },
    });

    await page.goto(`${baseURL}/my-trips`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /A tua jornada/i })).toBeVisible();
    await expect(page.getByText('Lisboa, Portugal')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('shared itinerary core interactions are mobile-safe', async ({ page, baseURL }) => {
    await page.goto('/');
    await openFixtureItinerary(page, baseURL);
    await expect(page.getByTestId('day-tabs')).toBeVisible();
    await expect(page.getByTestId('day-tab-2')).toBeVisible();
    await page.getByTestId('day-tab-2').click();

    const map = page.getByTestId('itinerary-map-container');
    await expect(map).toBeVisible();
    await expect(map.getByTestId('leaflet-map-surface')).toBeVisible();

    const firstActivity = page.getByTestId('activity-card').first();
    await expect(firstActivity).toBeVisible();
    const bookingButton = page.getByTestId('booking-button').first();
    if (!(await bookingButton.isVisible().catch(() => false))) {
      await firstActivity.locator('button').first().click();
    }
    await expect(bookingButton).toBeVisible();

    const mobileBudgetToggle = page.getByTestId('mobile-budget-toggle');
    if (await mobileBudgetToggle.isVisible()) {
      await mobileBudgetToggle.click();
      await expect(page.getByText(/Ajustar/i).first()).toBeVisible();
    }
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
    await page.getByTestId('floating-ai-input').pressSequentially('Sugere uma viagem surpresa em outubro');
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
