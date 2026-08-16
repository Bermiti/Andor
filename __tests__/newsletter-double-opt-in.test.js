import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('../app/lib/supabase/db', () => ({
  createNewsletterSubscriber: vi.fn(),
}));

vi.mock('../app/lib/server/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, limit: 3, remaining: 2, resetInSeconds: 86400 }),
  getRateLimitHeaders: vi.fn().mockReturnValue({}),
}));

vi.mock('../app/lib/logger', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  };
});

const { POST } = await import('../app/api/newsletter/route');
const { createNewsletterSubscriber } = await import('../app/lib/supabase/db');
const { checkRateLimit } = await import('../app/lib/server/rate-limit');

function createRequest(body) {
  return new Request('http://localhost/api/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('newsletter route — double opt-in', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createNewsletterSubscriber.mockResolvedValue({ ok: true, provider: 'sqlite', id: 'test-id' });
    checkRateLimit.mockResolvedValue({ allowed: true, limit: 3, remaining: 2, resetInSeconds: 86400 });
  });

  it('rejects missing consent', async () => {
    const res = await POST(createRequest({ email: 'test@example.com' }));
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error.code).toBe('CONSENT_REQUIRED');
  });

  it('rejects invalid email', async () => {
    const res = await POST(createRequest({ email: 'not-an-email', consent: true }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('INVALID_EMAIL');
  });

  it('creates subscription with pending_verification status', async () => {
    const res = await POST(createRequest({ email: 'test@example.com', consent: true }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.status).toBe('pending_verification');

    expect(createNewsletterSubscriber).toHaveBeenCalledTimes(1);
    const call = createNewsletterSubscriber.mock.calls[0][0];
    expect(call.status).toBe('pending_verification');
    expect(call.verificationTokenHash).toBeDefined();
    expect(call.verificationTokenHash).toHaveLength(64); // SHA-256 hex
    expect(call.verificationExpiresAt).toBeDefined();
    expect(call.metadata.doubleOptIn).toBe(true);
    expect(call.metadata.consent).toBe('newsletter_marketing_v1');
    expect(call.metadata.consentedAt).toBeDefined();
  });

  it('does not expose verification token in non-dev mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const res = await POST(createRequest({ email: 'test@example.com', consent: true }));
      const data = await res.json();
      expect(data._devVerificationToken).toBeUndefined();
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('enforces rate limiting', async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, limit: 3, remaining: 0, resetInSeconds: 3600 });
    const res = await POST(createRequest({ email: 'test@example.com', consent: true }));
    expect(res.status).toBe(429);
    expect(createNewsletterSubscriber).not.toHaveBeenCalled();
  });

  it('handles persistence failure', async () => {
    createNewsletterSubscriber.mockResolvedValue({ ok: false });
    const res = await POST(createRequest({ email: 'test@example.com', consent: true }));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error.code).toBe('PERSISTENCE_UNAVAILABLE');
  });
});
