const { test, expect } = require('@playwright/test');

function makeTokyoItinerary() {
  return {
    destination: { city: 'Tokyo', country: 'Japan' },
    days: [
      {
        title: 'Asakusa Arrival',
        stops: [{ name: 'Sensoji', coordinates: { lat: 35.7148, lng: 139.7967 } }],
      },
      {
        title: 'Shibuya Pulse',
        stops: [{ name: 'Shibuya Crossing', coordinates: { lat: 35.6595, lng: 139.7005 } }],
      },
    ],
  };
}

async function createServerShare(page) {
  const email = `booking-${Date.now()}-${Math.round(Math.random() * 10000)}@andor.test`;
  const password = 'Andor-Segura-2026';
  await page.request.post('/api/auth/local/register', {
    data: { name: 'Maria Teste', email, password },
  });

  const tripRes = await page.request.post('/api/itineraries', {
    data: { itinerary: makeTokyoItinerary(), source: 'manual' },
  });
  const { trip } = await tripRes.json();

  const shareRes = await page.request.post(`/api/itineraries/${trip.id}/shares`, {
    data: { expiresInDays: 7 },
  });
  const shareData = await shareRes.json();
  return shareData.token;
}

test.describe('Booking integrity boundary', () => {
  test('does not expose simulated rates, payment confirmation, or a public backoffice', async ({
    page,
    request,
    baseURL,
  }) => {
    await page.goto('/');
    const shareToken = await createServerShare(page);
    await page.goto(`${baseURL}/itinerary/share/${shareToken}`, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1')).toContainText(/Tokyo|Tóquio/i);
    await expect(page.getByText('Verificar Tarifas Atuais')).toHaveCount(0);
    await expect(page.getByTestId('checkout-summary-card')).toHaveCount(0);
    await expect(page.getByTestId('pay-confirm-button')).toHaveCount(0);
    await expect(page.getByText('Reserva Confirmada!')).toHaveCount(0);

    const checkoutResponse = await request.post(`${baseURL}/api/checkout`, {
      data: { itineraryId: 'test', items: [{ amountCents: 100 }] },
    });
    expect(checkoutResponse.status()).toBe(404);

    const flightsResponse = await request.post(`${baseURL}/api/enrich/flights`, {
      data: { destination: 'Tokyo' },
    });
    expect(flightsResponse.status()).toBe(404);

    const hotelsResponse = await request.post(`${baseURL}/api/enrich/hotels`, {
      data: { destination: 'Tokyo' },
    });
    expect(hotelsResponse.status()).toBe(404);

    const backofficeResponse = await page.goto(`${baseURL}/backoffice`, { waitUntil: 'domcontentloaded' });
    expect(backofficeResponse.status()).toBe(404);
  });
});
