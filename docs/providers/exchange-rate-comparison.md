# Exchange Rate Provider Evaluation & Architecture Decision Record

**Date:** 2026-08-03
**Status:** Evaluation Completed & Strategy Adopted

## Options Evaluated

1. **ExchangeRate-API:**
   - **Coverage:** 160+ currencies
   - **Authentication:** API Key (`EXCHANGE_RATES_API_KEY`)
   - **Cost / Quota:** 1,500 requests/month free tier
   - **Suitability:** High (Primary live market exchange rate provider).

2. **Frankfurter API (European Central Bank data):**
   - **Coverage:** 30+ major currencies (ECB reference rates)
   - **Authentication:** None required / Open API
   - **Cost / Quota:** Free / Open Data
   - **Suitability:** High (Open fallback provider for ECB currencies).

3. **Fixer.io / APILayer:**
   - **Coverage:** 170+ currencies
   - **Authentication:** Requires API Key
   - **Cost / Quota:** 100 requests/month free tier (EUR base currency only)
   - **Suitability:** Medium.

## Selected Solution
- **Same Currency Identity:** `EUR` → `EUR`, `USD` → `USD`, `JPY` → `JPY` returns `rate: 1.0` immediately without external network call.
- **Live Provider:** ExchangeRate-API via `EXCHANGE_RATES_API_KEY`.
- **Missing Credentials:** Returns `status: 'blocked_by_credentials'` and `rate: null` without AI hallucination.
