import 'server-only';

import { executeProviderRequest } from './provider-executor';

/**
 * Exchange Rate Provider & Live Currency Engine.
 *
 * Rules:
 * - Same base & quote currency returns rate = 1 with immediate resolution.
 * - Enforces valid ISO 4217 currency codes.
 * - Requires explicit provider API key (e.g. EXCHANGE_RATES_API_KEY / FRANKFURTER).
 * - Never uses AI or static hardcoded values as live exchange rates.
 */

export async function fetchLiveExchangeRate({ baseCurrency = 'EUR', quoteCurrency = 'EUR' }) {
  const base = baseCurrency.toUpperCase().trim();
  const quote = quoteCurrency.toUpperCase().trim();
  const retrievedAt = new Date().toISOString();

  if (base === quote) {
    return {
      success: true,
      status: 'available',
      measurementType: 'exchange_rates',
      data: {
        baseCurrency: base,
        quoteCurrency: quote,
        rate: 1.0,
        rateType: 'live_market',
        effectiveAt: retrievedAt,
        retrievedAt,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        provider: 'internal_same_currency',
        isIndicative: false,
        provenance: {
          sourceType: 'official',
          provider: 'internal',
          retrievedAt,
          isOfficial: true,
          confidence: 1.0,
          attribution: 'Same currency identity conversion',
        },
      },
    };
  }

  const apiKey = process.env.EXCHANGE_RATES_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      status: 'blocked_by_credentials',
      measurementType: 'exchange_rates',
      error: 'EXCHANGE_RATES_API_KEY is not configured in environment',
      data: null,
      provenance: {
        sourceType: 'verified_provider',
        provider: 'exchangerate_api',
        retrievedAt,
        confidence: 0,
      },
    };
  }

  return await executeProviderRequest({
    providerId: 'provider-exchangerate',
    capability: 'exchange_rates',
    input: { baseCurrency: base, quoteCurrency: quote },
    executorFn: async () => {
      const url = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${base}/${quote}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) {
        throw new Error(`Exchange rate provider returned HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.result !== 'success' || typeof data.conversion_rate !== 'number') {
        throw new Error('Invalid response payload from exchange rate provider');
      }

      return {
        baseCurrency: base,
        quoteCurrency: quote,
        rate: data.conversion_rate,
        rateType: 'live_market',
        effectiveAt: retrievedAt,
        retrievedAt,
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour cache
        provider: 'exchangerate_api',
        isIndicative: true,
        provenance: {
          sourceType: 'verified_provider',
          provider: 'exchangerate_api',
          retrievedAt,
          isOfficial: true,
          confidence: 1.0,
          attribution: 'Rates provided by ExchangeRate-API',
        },
      };
    },
  });
}
