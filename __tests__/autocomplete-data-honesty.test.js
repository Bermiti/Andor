import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('../app/lib/server/provider-executor', () => ({
  executeProviderRequest: vi.fn(async () => ({
    success: true,
    data: [{
      place_id: 4242,
      lat: '39.0000',
      lon: '-1.0000',
      display_name: 'Alpha, Exampleland',
      type: 'city',
      address: { city: 'Alpha', country: 'Exampleland', country_code: 'xz' },
    }],
  })),
}));

import { GET } from '../app/api/autocomplete/route';

describe('autocomplete data honesty', () => {
  it('does not invent timezone or currency metadata for Nominatim results', async () => {
    const response = await GET(new Request('http://localhost/api/autocomplete?q=Alpha'));
    const body = await response.json();
    const external = body.find((item) => item.providerRefs?.nominatim === '4242');

    expect(external).toMatchObject({
      canonicalName: 'Alpha',
      countryCode: 'XZ',
      timezone: null,
      currencyCodes: [],
      resolutionStatus: 'partially_resolved',
    });
  });
});
