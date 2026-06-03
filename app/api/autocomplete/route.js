import { NextResponse } from 'next/server';

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

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Andor-Travel-App/1.0',
        'Accept-Language': 'pt,en;q=0.9',
      }
    });

    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();

    const results = data
      .map(item => {
        const city = item.address?.city || item.address?.town || item.address?.municipality || item.address?.village || item.address?.county || item.display_name.split(',')[0];
        const country = item.address?.country || '';
        const countryCode = item.address?.country_code?.toUpperCase() || '';

        // Convert ISO country code (2 letter) to Emoji flag
        const getFlagEmoji = (code) => {
          if (!code || code.length !== 2) return '📍';
          const codePoints = code
            .split('')
            .map(char => 127397 + char.charCodeAt(0));
          try {
            return String.fromCodePoint(...codePoints);
          } catch (e) {
            return '📍';
          }
        };

        return {
          name: `${city}, ${country}`,
          city,
          country,
          countryCode,
          flag: getFlagEmoji(countryCode),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          type: item.type || item.class || 'place'
        };
      })
      .filter(item => item.city && item.country); // only include complete records

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
