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

async function createShare(page, sourceKey, audience, expiresInDays = 7) {
  const response = await page.request.post(`/api/itineraries/${sourceKey}/shares`, {
    data: { itinerary: itineraryFixture(), audience, expiresInDays },
  });
  expect(response.status()).toBe(201);
  return response.json();
}

test.describe('server-backed itinerary share privacy', () => {
  test('uses password-backed local auth and HttpOnly server sessions', async ({ context, page }) => {
    await page.goto('/');
    const email = `privacy-${Date.now()}-${Math.round(Math.random() * 10000)}@andor.test`;
    const password = 'Andor-Segura-2026';
    const registration = await page.request.post('/api/auth/local/register', {
      data: { name: 'Maria Teste', email, password },
    });
    expect(registration.status()).toBe(201);

    const sessionCookie = (await context.cookies()).find((cookie) => cookie.name === 'andor_local_session');
    expect(sessionCookie).toBeTruthy();
    expect(sessionCookie.httpOnly).toBe(true);
    expect(sessionCookie.sameSite).toBe('Lax');
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

  test('enforces audience, ownership, expiry, revocation, and client sanitization', async ({ browser, page }) => {
    await page.goto('/');
    const sourceKey = `privacy-${Date.now()}`;

    const clientShare = await createShare(page, sourceKey, 'client');
    expect(clientShare.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(clientShare.url).toContain(`/itinerary/share/${clientShare.token}`);
    expect(clientShare.url).not.toContain(sourceKey);

    const outsiderContext = await browser.newContext();
    const outsider = await outsiderContext.newPage();
    await outsider.goto('/');

    const clientApiResponse = await outsider.request.get(`/api/shares/${clientShare.token}`);
    expect(clientApiResponse.status()).toBe(200);
    const clientPayload = await clientApiResponse.json();
    const serializedClient = JSON.stringify(clientPayload);
    expect(clientPayload.itinerary.version).toBe('1.0');
    expect(clientPayload.itinerary.mode).toBe('client');
    expect(serializedClient).not.toContain(secrets.internal);
    expect(serializedClient).not.toContain(secrets.supplier);
    expect(serializedClient).not.toContain(secrets.commission);
    expect(serializedClient).not.toMatch(/internalNotes|supplierNotes|commission|margin/i);

    await outsider.goto(`/itinerary/share/${clientShare.token}`);
    await expect(outsider.getByRole('heading', { level: 1, name: 'Lisboa, Portugal' })).toBeVisible();
    await expect(outsider.getByText('Maria Cliente')).toBeVisible();
    await expect(outsider.getByText(secrets.internal)).toHaveCount(0);
    await expect(outsider.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
    await expect(outsider.locator('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer');

    const internalShare = await createShare(page, sourceKey, 'internal');
    const outsiderInternalApi = await outsider.request.get(`/api/shares/${internalShare.token}`);
    expect(outsiderInternalApi.status()).toBe(403);
    await outsider.goto(`/itinerary/share/${internalShare.token}`);
    await expect(outsider.getByRole('heading', { name: 'Acesso reservado' })).toBeVisible();
    await expect(outsider.getByText(secrets.internal)).toHaveCount(0);

    const ownerInternalApi = await page.request.get(`/api/shares/${internalShare.token}`);
    expect(ownerInternalApi.status()).toBe(200);
    expect(JSON.stringify(await ownerInternalApi.json())).toContain(secrets.internal);
    await page.goto(`/itinerary/share/${internalShare.token}`);
    await expect(page.getByText(secrets.internal)).toBeVisible();

    const outsiderDelete = await outsider.request.delete(`/api/shares/${internalShare.token}`);
    expect(outsiderDelete.status()).toBe(403);
    expect((await page.request.get(`/api/shares/${internalShare.token}`)).status()).toBe(200);

    const listResponse = await page.request.get(`/api/itineraries/${sourceKey}/shares`);
    expect(listResponse.status()).toBe(200);
    const listedShares = JSON.stringify(await listResponse.json());
    expect(listedShares).not.toContain(clientShare.token);
    expect(listedShares).not.toContain(internalShare.token);
    expect(listedShares).not.toMatch(/tokenHash|token_hash|ownerKey|owner_key/);

    expect((await page.request.delete(`/api/shares/${clientShare.token}`)).status()).toBe(200);
    expect((await outsider.request.get(`/api/shares/${clientShare.token}`)).status()).toBe(410);
    await outsider.goto(`/itinerary/share/${clientShare.token}`);
    await expect(outsider.getByRole('heading', { name: 'Partilha revogada' })).toBeVisible();

    const expiredShare = await createShare(page, sourceKey, 'client', 0);
    expect((await outsider.request.get(`/api/shares/${expiredShare.token}`)).status()).toBe(410);
    await outsider.goto(`/itinerary/share/${expiredShare.token}`);
    await expect(outsider.getByRole('heading', { name: 'Partilha expirada' })).toBeVisible();

    await outsiderContext.close();
  });
});
