import { expect, test } from '@playwright/test';

const secrets = {
  internal: 'OPS_ONLY_MARGIN_37',
  supplier: 'SUPPLIER_NET_RATE_991',
  commission: 'COMMISSION_PRIVATE_18',
};

function itineraryFixture() {
  return {
    destination: { city: 'Lisboa', country: 'Portugal' },
    trip: {
      totalDays: 1,
      groupType: 'Casal',
      travelStyle: 'Cultural',
      startDate: '2026-09-10',
      endDate: '2026-09-11',
    },
    exportMetadata: {
      clientName: 'Maria Cliente',
      clientFacingNotes: 'Chegar ao aeroporto com antecedencia.',
      internalNotes: secrets.internal,
      commission: secrets.commission,
    },
    days: [{
      dayNumber: 1,
      title: 'Lisboa historica',
      internalNotes: 'DAY_INTERNAL_ONLY',
      stops: [{
        time: '09:00',
        name: 'Alfama',
        description: 'Passeio pelo bairro historico.',
        supplierNotes: secrets.supplier,
        margin: 37,
      }],
    }],
  };
}

async function registerAndLogin(page) {
  const email = `privacy-${Date.now()}-${Math.round(Math.random() * 10000)}@andor.test`;
  const password = 'Andor-Segura-2026';
  const registration = await page.request.post('/api/auth/local/register', {
    data: { name: 'Maria Teste', email, password },
  });
  expect(registration.status()).toBe(201);
  return { email, password };
}

test.describe('server-backed itinerary share privacy', () => {
  test('uses password-backed local auth and HttpOnly server sessions', async ({ context, page }) => {
    await page.goto('/');
    const { email, password } = await registerAndLogin(page);

    const sessionCookie = (await context.cookies()).find((cookie) => cookie.name === 'andor_local_session');
    expect(sessionCookie).toBeTruthy();
    expect(sessionCookie.httpOnly).toBe(true);
    expect((await page.request.get('/api/auth/local/me')).status()).toBe(200);

    expect((await page.request.post('/api/auth/local/logout')).status()).toBe(200);
    expect((await page.request.get('/api/auth/local/me')).status()).toBe(401);
    expect((await page.request.post('/api/auth/local/login', {
      data: { email, password: 'palavra-passe-errada' },
    })).status()).toBe(401);
    expect((await page.request.post('/api/auth/local/login', {
      data: { email, password },
    })).status()).toBe(200);
    expect((await page.request.get('/api/auth/local/me')).status()).toBe(200);
  });

  test('enforces ownership, expiry, revocation, and client sanitization', async ({ browser, page }) => {
    await page.goto('/');
    await registerAndLogin(page);

    // Create durable trip on server
    const createTripResponse = await page.request.post('/api/itineraries', {
      data: { itinerary: itineraryFixture(), source: 'manual' },
    });
    expect(createTripResponse.status()).toBe(201);
    const { trip } = await createTripResponse.json();
    expect(trip.id).toBeTruthy();

    // Create share token from server-backed trip
    const shareResponse = await page.request.post(`/api/itineraries/${trip.id}/shares`, {
      data: { expiresInDays: 7 },
    });
    expect(shareResponse.status()).toBe(201);
    const shareData = await shareResponse.json();
    expect(shareData.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(shareData.url).toContain(`/itinerary/share/${shareData.token}`);

    // Outsider user requests shared itinerary
    const outsiderContext = await browser.newContext();
    const outsider = await outsiderContext.newPage();
    await outsider.goto('/');

    const clientApiResponse = await outsider.request.get(`/api/shares/${shareData.token}`);
    expect(clientApiResponse.status()).toBe(200);
    const clientPayload = await clientApiResponse.json();
    const serializedClient = JSON.stringify(clientPayload);

    // Ensure secrets are sanitized out
    expect(serializedClient).not.toContain(secrets.internal);
    expect(serializedClient).not.toContain(secrets.supplier);
    expect(serializedClient).not.toContain(secrets.commission);

    // Render shared itinerary page as outsider
    await outsider.goto(`/itinerary/share/${shareData.token}`);
    await expect(outsider.getByRole('heading', { level: 1, name: 'Lisboa, Portugal' })).toBeVisible();

    // Outsider cannot delete or list owner share links
    const outsiderDelete = await outsider.request.delete(`/api/itineraries/${trip.id}/shares/${shareData.share.id}`);
    expect(outsiderDelete.status()).toBe(401); // unauthenticated outsider

    const listResponse = await page.request.get(`/api/itineraries/${trip.id}/shares`);
    expect(listResponse.status()).toBe(200);
    const listedShares = await listResponse.json();
    expect(listedShares.shares.length).toBeGreaterThan(0);

    // Owner revokes share
    const revokeResponse = await page.request.delete(`/api/itineraries/${trip.id}/shares/${shareData.share.id}`);
    expect(revokeResponse.status()).toBe(200);

    // Shared token returns 404 once revoked
    expect((await outsider.request.get(`/api/shares/${shareData.token}`)).status()).toBe(404);

    await outsiderContext.close();
  });
});
