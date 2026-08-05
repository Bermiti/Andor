import { beforeEach, describe, expect, test, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  createNewsletterSubscriber: vi.fn(),
  createCustomRequestRecord: vi.fn(),
}));

vi.mock('../app/lib/supabase/db', () => dbMocks);

import { POST as subscribeNewsletter } from '../app/api/newsletter/route';
import { POST as submitCustomRequest } from '../app/api/custom-requests/route';
import { normalizeTripForJourney } from '../app/lib/itinerary-store';

function jsonRequest(url, body) {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('persistence integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('newsletter never reports success when the subscriber was not stored', async () => {
    dbMocks.createNewsletterSubscriber.mockResolvedValue({
      ok: false,
      provider: 'local',
      reason: 'supabase_not_configured',
    });

    const response = await subscribeNewsletter(jsonRequest('http://localhost/api/newsletter', {
      email: 'traveler@example.com',
      consent: true,
    }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe('PERSISTENCE_UNAVAILABLE');
  });

  test('newsletter reports success only with a persisted id', async () => {
    dbMocks.createNewsletterSubscriber.mockResolvedValue({
      ok: true,
      provider: 'supabase',
      id: 'subscriber-1',
    });

    const response = await subscribeNewsletter(jsonRequest('http://localhost/api/newsletter', {
      email: 'traveler@example.com',
      consent: true,
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, provider: 'supabase', id: 'subscriber-1' });
  });

  test('newsletter requires explicit consent and redacts private route identifiers', async () => {
    const missingConsent = await subscribeNewsletter(jsonRequest('http://localhost/api/newsletter', {
      email: 'traveler@example.com',
      page: '/invitations/private-token',
    }));
    expect(missingConsent.status).toBe(422);
    expect(dbMocks.createNewsletterSubscriber).not.toHaveBeenCalled();

    dbMocks.createNewsletterSubscriber.mockResolvedValue({
      ok: true,
      provider: 'supabase',
      id: 'subscriber-2',
    });
    await subscribeNewsletter(jsonRequest('http://localhost/api/newsletter', {
      email: 'traveler@example.com',
      consent: true,
      page: '/invitations/private-token?email=hidden@example.com',
    }));
    expect(dbMocks.createNewsletterSubscriber).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({
        page: '/invitations/:token',
        consent: 'newsletter_marketing_v1',
      }),
    }));
  });

  test('custom requests never invent a local request id', async () => {
    dbMocks.createCustomRequestRecord.mockResolvedValue({
      ok: false,
      provider: 'local',
      reason: 'supabase_not_configured',
    });

    const response = await submitCustomRequest(jsonRequest('http://localhost/api/custom-requests', {
      destination: 'Edinburgh',
      startDate: '2026-09-01',
      endDate: '2026-09-05',
      budget: '1200',
      travelers: '2',
    }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe('PERSISTENCE_UNAVAILABLE');
    expect(body.request).toBeUndefined();
  });

  test('journey summaries preserve the structured budget currency', () => {
    const trip = normalizeTripForJourney({
      id: 'tokyo-budget',
      destination: { city: 'Tokyo', country: 'Japan', currency: { code: 'JPY', symbol: '¥' } },
      trip: {
        totalDays: 7,
        budgetBreakdown: {
          currency: 'JPY',
          grandTotal: { min: 376320, max: 413120 },
        },
      },
      days: [],
    });

    expect(trip.totalCost).toContain('¥376');
    expect(trip.totalCost).toContain('¥413');
    expect(trip.totalCost).not.toContain('€');
    expect(trip.destination).toBe('Tokyo, Japan');
  });
});
