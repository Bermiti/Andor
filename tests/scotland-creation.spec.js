const { test, expect } = require('@playwright/test');
const scotlandFixture = require('./fixtures/scotland-itinerary.json');

async function expectNoHorizontalOverflow(page) {
  const widths = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(widths.scrollWidth).toBeLessThanOrEqual(widths.clientWidth + 1);
}

test.describe('Scotland itinerary creation', () => {
  test('creates, persists, refreshes and reopens a Scotland trip', async ({ page }) => {
    const email = `scotland-${Date.now()}-${Math.round(Math.random() * 10000)}@andor.test`;
    const register = await page.request.post('/api/auth/local/register', {
      data: { name: 'Scotland E2E', email, password: 'Andor-Segura-2026' },
    });
    expect(register.status()).toBe(201);

    let requestCount = 0;
    const idempotencyKeys = [];
    let persistedTripId = null;
    await page.route('**/api/generate-itinerary', async (route) => {
      requestCount += 1;
      const request = route.request();
      const body = request.postDataJSON();
      idempotencyKeys.push(request.headers()['idempotency-key']);

      expect(body).toMatchObject({
        destination: 'Escócia, Reino Unido',
        days: 7,
        travelers: 4,
        budget: 'moderate',
        style: 'nature',
        pace: 'balanced',
      });

      if (requestCount === 1) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'AI_TIMEOUT',
              message: 'O fornecedor demorou demasiado. Tenta novamente.',
              retryable: true,
            },
          }),
        });
        return;
      }

      const persisted = await page.request.post('/api/itineraries', {
        data: { itinerary: scotlandFixture, source: 'manual' },
      });
      expect(persisted.status()).toBe(201);
      const persistedBody = await persisted.json();
      persistedTripId = persistedBody.trip.id;
      const itinerary = { ...scotlandFixture, id: persistedTripId };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...itinerary,
          itinerary,
          persistence: {
            mode: 'durable',
            provider: 'sqlite',
            persisted: true,
            reason: null,
          },
        }),
      });
    });

    await page.goto('/');
    await page.getByRole('button', { name: '7 dias na Escócia em família com natureza' }).click();
    await page.getByRole('button', { name: /continuar e ajustar lacunas/i }).click();
    await page.getByText(/dividir noites entre várias cidades/i).click();
    await page.getByText(/equilibrado \(ritmo ideal\)/i).click();
    await page.getByRole('button', { name: /ver resumo da viagem/i }).click();
    await page.getByRole('button', { name: /gerar roteiro personalizado/i }).click();

    await expect(page.getByText('O fornecedor demorou demasiado. Tenta novamente.')).toBeVisible();
    await expect(page.getByText('Escócia, Reino Unido')).toBeVisible();
    await page.getByRole('button', { name: /gerar roteiro personalizado/i }).click();

    await expect.poll(() => persistedTripId, { timeout: 20000 }).toBeTruthy();
    await expect(page).toHaveURL(new RegExp(`/itinerary/${persistedTripId}$`), { timeout: 20000 });
    expect(requestCount).toBe(2);
    expect(idempotencyKeys[0]).toBeTruthy();
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
    await expect(page.getByRole('heading', { name: /Escócia/i }).first()).toBeVisible();
    await expect(page.getByTestId('day-tabs')).toBeVisible();
    await expect(page.getByTestId('day-tab-7')).toBeVisible();
    await expect(page.getByTestId('activity-card')).toHaveCount(2);

    await page.getByTestId('day-tab-5').click();
    await expect(page.getByText('Eilean Donan Castle').first()).toBeVisible();
    await expect(page.getByText('Portree').first()).toBeVisible();
    await expect(page.getByTestId('itinerary-map-container')).toBeVisible();
    await expect(page.getByTestId('leaflet-map-surface')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    for (const width of [320, 375, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(page.getByTestId('day-tabs')).toBeVisible();
      await expect(page.getByTestId('itinerary-map-container')).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }

    await page.reload();
    await expect(page.getByRole('heading', { name: /Escócia/i }).first()).toBeVisible();
    await expect(page.getByTestId('day-tab-7')).toBeVisible();

    await page.goto('/my-trips');
    await expect(page.getByText(/Escócia, Reino Unido/i).first()).toBeVisible();
    await page.getByRole('link', { name: /ver roteiro completo/i }).first().click();
    await expect(page).toHaveURL(new RegExp(`/itinerary/${persistedTripId}$`));
    await expect(page.getByRole('heading', { name: /Escócia/i }).first()).toBeVisible();
  });
});
