// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { fetchLiveExchangeRate } from '../app/lib/server/exchange-rate-provider';

describe('Exchange Rate Provider Test Suite', () => {
  it('returns rate 1.0 immediately for same base and quote currency', async () => {
    const res = await fetchLiveExchangeRate({ baseCurrency: 'EUR', quoteCurrency: 'EUR' });
    expect(res.success).toBe(true);
    expect(res.data.rate).toBe(1.0);
    expect(res.data.baseCurrency).toBe('EUR');
    expect(res.data.quoteCurrency).toBe('EUR');
  });

  it('returns status blocked_by_credentials when EXCHANGE_RATES_API_KEY is not set', async () => {
    delete process.env.EXCHANGE_RATES_API_KEY;
    const res = await fetchLiveExchangeRate({ baseCurrency: 'EUR', quoteCurrency: 'USD' });
    expect(res.success).toBe(false);
    expect(res.status).toBe('blocked_by_credentials');
    expect(res.data).toBeNull();
  });
});
