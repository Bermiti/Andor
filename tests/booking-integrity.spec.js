const { test, expect } = require('@playwright/test');

function makeTokyoItinerary() {
  return {
    destination: 'Tokyo, Japan',
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

function encodeSharePayload(itinerary) {
  const json = JSON.stringify(itinerary);
  return Buffer.from(unescape(encodeURIComponent(json)), 'binary').toString('base64');
}

test.describe('Booking integrity boundary', () => {
  test('does not expose simulated rates, payment confirmation, or a public backoffice', async ({
    page,
    request,
    baseURL,
  }) => {
    const payload = encodeSharePayload(makeTokyoItinerary());
    await page.goto(`${baseURL}/itinerary/share?data=${payload}`, { waitUntil: 'domcontentloaded' });

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
