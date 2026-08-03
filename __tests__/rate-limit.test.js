import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  checkRateLimit,
  clearRateLimitStore,
  getRateLimitHeaders,
  resolveRateLimitKey,
} from '../app/lib/server/rate-limit';

describe('rate-limit server module', () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  it('derives user key for authenticated requests and IP key for guests', () => {
    const userKey = resolveRateLimitKey('ai_generate', { authenticated: true, userId: 'user-123' }, null);
    expect(userKey).toBe('ai_generate:user:user-123');

    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.195, 10.0.0.1' },
    });
    const ipKey = resolveRateLimitKey('ai_generate', null, req);
    expect(ipKey).toBe('ai_generate:ip:203.0.113.195');
  });

  it('allows requests within limit and blocks requests exceeding limit', async () => {
    const identity = { authenticated: true, userId: 'user-456' };
    const req = new Request('http://localhost');

    // Policy ai_generate max limit is 5 by default
    for (let i = 0; i < 5; i++) {
      const res = await checkRateLimit('ai_generate', identity, req);
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(5 - (i + 1));
    }

    const blockedRes = await checkRateLimit('ai_generate', identity, req);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remaining).toBe(0);
    expect(blockedRes.resetInSeconds).toBeGreaterThan(0);
  });

  it('generates standard X-RateLimit and Retry-After headers', async () => {
    const identity = { authenticated: true, userId: 'user-789' };
    const req = new Request('http://localhost');

    const allowedResult = await checkRateLimit('ai_generate', identity, req);
    const allowedHeaders = getRateLimitHeaders(allowedResult);
    expect(allowedHeaders['X-RateLimit-Limit']).toBe('5');
    expect(allowedHeaders['X-RateLimit-Remaining']).toBe('4');
    expect(allowedHeaders['Retry-After']).toBeUndefined();

    // Fill remaining allowance
    for (let i = 0; i < 4; i++) {
      await checkRateLimit('ai_generate', identity, req);
    }

    const blockedResult = await checkRateLimit('ai_generate', identity, req);
    const blockedHeaders = getRateLimitHeaders(blockedResult);
    expect(blockedHeaders['X-RateLimit-Remaining']).toBe('0');
    expect(blockedHeaders['Retry-After']).toBeDefined();
  });
});
