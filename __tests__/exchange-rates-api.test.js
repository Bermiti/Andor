// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { GET } from '../app/api/exchange-rates/route';

describe('Exchange Rates API Route Test Suite', () => {
  it('returns rate 1.0 for same base and quote currency', async () => {
    const req = new Request('http://localhost:3000/api/exchange-rates?base=EUR&quote=EUR');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('available');
    expect(body.data.rate).toBe(1.0);
    expect(body.data.baseCurrency).toBe('EUR');
    expect(body.data.quoteCurrency).toBe('EUR');
  });

  it('returns 503 blocked_by_credentials when API key is missing for different currencies', async () => {
    delete process.env.EXCHANGE_RATES_API_KEY;
    const req = new Request('http://localhost:3000/api/exchange-rates?base=EUR&quote=USD');
    const res = await GET(req);
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.status).toBe('blocked_by_credentials');
    expect(body.data).toBeNull();
  });
});
