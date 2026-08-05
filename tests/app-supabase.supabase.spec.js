import { expect, test } from '@playwright/test';

async function json(response) {
  const body = await response.json();
  expect(response.ok(), JSON.stringify(body)).toBeTruthy();
  return body;
}

test('the application persists and authorizes a complete trip workflow in Supabase', async ({ playwright, baseURL }) => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const password = `Andor-${suffix}-Aa1!`;
  const ownerEmail = `app-owner-${suffix}@andor.invalid`;
  const viewerEmail = `app-viewer-${suffix}@andor.invalid`;
  const owner = await playwright.request.newContext({ baseURL });
  const viewer = await playwright.request.newContext({ baseURL });

  try {
    const ownerRegistration = await json(await owner.post('/api/auth/register', {
      data: { name: 'App Owner', email: ownerEmail, password },
    }));
    expect(ownerRegistration).toMatchObject({ authenticated: true, provider: 'supabase' });

    const generated = await json(await owner.post('/api/generate-itinerary', {
      data: {
        destination: 'Lisbon, Portugal',
        destinationEntity: {
          entityId: 'geo-e2e-lisbon',
          canonicalName: 'Lisbon',
          displayName: 'Lisbon, Portugal',
          entityType: 'city',
          countryCode: 'PT',
          coordinates: { lat: 38.7223, lng: -9.1393 },
          resolutionStatus: 'resolved',
        },
        days: 2,
        travelers: 2,
        forceFallback: true,
      },
    }));
    expect(generated.persistence).toEqual({
      mode: 'durable',
      provider: 'supabase',
      persisted: true,
      reason: null,
    });
    expect(generated.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(generated.days).toHaveLength(2);
    const tripId = generated.id;

    const ownerTrip = await json(await owner.get(`/api/itineraries/${tripId}`));
    expect(ownerTrip.trip).toMatchObject({ id: tripId, permission: 'owner', persistence: 'supabase' });

    const viewerRegistration = await json(await viewer.post('/api/auth/register', {
      data: { name: 'App Viewer', email: viewerEmail, password },
    }));
    expect(viewerRegistration).toMatchObject({ authenticated: true, provider: 'supabase' });

    const privateRead = await viewer.get(`/api/itineraries/${tripId}`);
    expect(privateRead.status()).toBe(404);
    expect(await privateRead.json()).toMatchObject({ error: { code: 'TRIP_NOT_FOUND' } });

    const invitation = await json(await owner.post(`/api/itineraries/${tripId}/members`, {
      data: { email: viewerEmail, role: 'viewer' },
    }));
    expect(invitation.persistence).toBe('supabase');
    const invitationToken = new URL(invitation.acceptUrl).pathname.split('/').pop();
    expect(invitationToken).toBeTruthy();

    const accepted = await json(await viewer.post(`/api/invitations/${invitationToken}`));
    expect(accepted).toMatchObject({ ok: true, tripId, role: 'viewer', persistence: 'supabase' });
    const replay = await json(await viewer.post(`/api/invitations/${invitationToken}`));
    expect(replay).toMatchObject({ ok: true, status: 'already_accepted', tripId, role: 'viewer' });

    const viewerTrip = await json(await viewer.get(`/api/itineraries/${tripId}`));
    expect(viewerTrip.trip).toMatchObject({ id: tripId, permission: 'viewer', persistence: 'supabase' });

    await json(await owner.post('/api/auth/logout'));
    expect((await owner.get(`/api/itineraries/${tripId}`)).status()).toBe(401);

    const relogin = await json(await owner.post('/api/auth/login', {
      data: { email: ownerEmail, password },
    }));
    expect(relogin).toMatchObject({ authenticated: true, provider: 'supabase' });
    const reloaded = await json(await owner.get(`/api/itineraries/${tripId}`));
    expect(reloaded.trip).toMatchObject({ id: tripId, permission: 'owner' });

    const deleted = await json(await owner.delete(`/api/itineraries/${tripId}`));
    expect(deleted).toMatchObject({ ok: true, deleteMode: 'soft' });
    expect((await viewer.get(`/api/itineraries/${tripId}`)).status()).toBe(404);
  } finally {
    await owner.dispose();
    await viewer.dispose();
  }
});
