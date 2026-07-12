const { test, expect } = require('@playwright/test');

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
  const json = JSON.stringify(itin);
  return Buffer.from(unescape(encodeURIComponent(json)), 'binary').toString('base64');
}

test.describe('Andor Transactional Travel Agency Flows', () => {
  test('Search rates, select items, select insurance, pay, and check backoffice analytics', async ({ page, baseURL }) => {
    const tokyo = makeTokyoItinerary();
    const payload = encodeSharePayload(tokyo);

    // 1. Go to shared itinerary page
    await page.goto(`${baseURL}/itinerary/share?data=${payload}`, { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText(/Tokyo|Tóquio/i);

    // 2. Search for live rates
    const searchRatesBtn = page.locator('button:has-text("Verificar Tarifas Atuais")').first();
    await expect(searchRatesBtn).toBeVisible();
    await searchRatesBtn.click();

    // 3. Select flight
    const flightCard = page.locator('text=TAP Air Portugal').first();
    await expect(flightCard).toBeVisible();
    await flightCard.click();

    // 4. Select hotel room
    const hotelCard = page.locator('text=Grand Palace Hotel').first();
    await expect(hotelCard).toBeVisible();
    await hotelCard.click();

    // 5. Select premium travel insurance
    const insuranceCard = page.locator('text=Seguro Premium (Allianz)').first();
    await expect(insuranceCard).toBeVisible();
    await insuranceCard.click();

    // 6. Verify checkout card visibility & totals
    const checkoutCard = page.getByTestId('checkout-summary-card');
    await expect(checkoutCard).toBeVisible();
    await expect(checkoutCard.locator('text=Carrinho de Viagem')).toBeVisible();

    // 7. Click pay & confirm booking button
    const payBtn = page.getByTestId('pay-confirm-button');
    await expect(payBtn).toBeVisible();
    await payBtn.click();

    // 8. Expect simulated checkout modal success
    const successModal = page.getByTestId('booking-success-modal');
    await expect(successModal).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Reserva Confirmada!')).toBeVisible();
    await expect(successModal.locator('text=A tua viagem está reservada com sucesso!')).toBeVisible();

    // Close success modal
    const closeBtn = page.locator('button:has-text("Ver Itinerário")').first();
    await closeBtn.click();
    await expect(successModal).not.toBeVisible();

    // 9. Navigate to Backoffice and check statistics
    await page.goto(`${baseURL}/backoffice`, { waitUntil: 'networkidle' });
    await expect(page.locator('h3', { hasText: 'Backoffice Andor' })).toBeVisible();
    
    // Check main stats render
    await expect(page.locator('text=Volume Transacionado')).toBeVisible();
    await expect(page.locator('text=Comissões Estimadas')).toBeVisible();
    await expect(page.locator('text=Taxa de Conversão')).toBeVisible();

    // Verify chat tab switch
    const conciergeTab = page.locator('button:has-text("Concierge Chat")');
    await conciergeTab.click();
    await expect(page.locator('text=Pedro Silva')).toBeVisible();
  });
});
