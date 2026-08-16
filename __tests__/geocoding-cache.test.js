import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { geocodeServerSide, resetServerGeocodingCacheForTests } from '../app/lib/geocoding';

describe('server geocoding cache', () => {
  beforeEach(() => {
    resetServerGeocodingCacheForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes keys and deduplicates concurrent requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{
        lat: '38.7242',
        lon: '-9.1138',
        type: 'museum',
        display_name: 'Museu Nacional do Azulejo, Lisboa',
      }],
    });
    vi.stubGlobal('fetch', fetchMock);

    const first = geocodeServerSide('  Museu   Nacional do Azulejo ', 'PT');
    const second = geocodeServerSide('museu nacional do azulejo', 'pt');
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual(secondResult);
    expect(firstResult).toMatchObject({ lat: 38.7242, lng: -9.1138 });

    const cached = await geocodeServerSide('MUSEU NACIONAL DO AZULEJO', 'Pt');
    expect(cached).toEqual(firstResult);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('caches an empty provider result to avoid repeated slow lookups', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);

    expect(await geocodeServerSide('Unknown candidate', 'PT')).toBeNull();
    expect(await geocodeServerSide(' unknown   candidate ', 'pt')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

