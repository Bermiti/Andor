import { NextResponse } from 'next/server';
import { resolveGlobalGeographicEntity } from '../../lib/server/global-geography';
import { executeProviderRequest } from '../../lib/server/provider-executor';

const cache = new Map();
const MAX_CACHE_SIZE = 100;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    if (!q || q.length < 2) return NextResponse.json([]);

    const cacheKey = q.toLowerCase();
    if (cache.has(cacheKey)) {
      return NextResponse.json(cache.get(cacheKey));
    }

    // 1. Try resolving against Global Geographic Model first
    const resolvedLocal = resolveGlobalGeographicEntity(q);
    const results = [];

    if (resolvedLocal) {
      results.push({
        entityId: resolvedLocal.id,
        canonicalName: resolvedLocal.canonicalName,
        displayName: `${resolvedLocal.canonicalName}, ${resolvedLocal.countryCode}`,
        localizedNames: resolvedLocal.localizedNames,
        entityType: resolvedLocal.entityType,
        countryCode: resolvedLocal.countryCode,
        regionCode: resolvedLocal.regionCode || null,
        parentPath: resolvedLocal.parentPath || [],
        coordinates: resolvedLocal.coordinates,
        timezone: resolvedLocal.timezone,
        currencyCodes: resolvedLocal.currencyCodes,
        providerRefs: resolvedLocal.providerRefs || {},
        provenance: resolvedLocal.provenance,
        resolutionStatus: 'resolved',
      });
    }

    // 2. Fetch external Nominatim via central ProviderExecutor
    const execRes = await executeProviderRequest({
      providerId: 'provider-nominatim',
      capability: 'geography',
      input: { query: q },
      executorFn: async () => {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Andor-Travel-App/1.0',
            'Accept-Language': 'pt,en;q=0.9',
          },
        });
        if (!res.ok) return [];
        return await res.json();
      },
    });

    if (execRes.success && Array.isArray(execRes.data)) {
      for (const item of execRes.data) {
        const city =
          item.address?.city ||
          item.address?.town ||
          item.address?.municipality ||
          item.address?.village ||
          item.display_name.split(',')[0];
        const country = item.address?.country || '';
        const countryCode = item.address?.country_code?.toUpperCase() || 'XX';

        if (city && !results.some((r) => r.canonicalName.toLowerCase() === city.toLowerCase())) {
          results.push({
            entityId: `geo-ext-${item.place_id}`,
            canonicalName: city,
            displayName: `${city}, ${country}`,
            localizedNames: { pt: city, en: city },
            entityType: item.type || item.class || 'city',
            countryCode,
            regionCode: item.address?.state || null,
            parentPath: [countryCode],
            coordinates: {
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            },
            timezone: 'UTC',
            currencyCodes: ['EUR'],
            providerRefs: { nominatim: String(item.place_id) },
            provenance: {
              sourceType: 'verified_provider',
              provider: 'provider-nominatim',
              providerRecordId: String(item.place_id),
              retrievedAt: new Date().toISOString(),
              isOfficial: false,
              confidence: 0.9,
              attribution: '© OpenStreetMap contributors',
            },
            resolutionStatus: 'partially_resolved',
          });
        }
      }
    }

    if (cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey !== undefined) {
        cache.delete(oldestKey);
      }
    }
    cache.set(cacheKey, results);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Autocomplete API error:', error);
    return NextResponse.json([]);
  }
}
