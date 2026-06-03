import { NextResponse } from 'next/server';

const cache = new Map();
const MAX_CACHE_SIZE = 100;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

let lastRequestTime = 0;
let queue = Promise.resolve();

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(key, value) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }
  cache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL,
  });
}

async function rateLimitedFetch(url, headers) {
  return new Promise((resolve, reject) => {
    queue = queue
      .then(async () => {
        const now = Date.now();
        const timeSinceLast = now - lastRequestTime;
        const delay = Math.max(0, 1000 - timeSinceLast);
        if (delay > 0) {
          await new Promise((r) => setTimeout(r, delay));
        }
        lastRequestTime = Date.now();
        const res = await fetch(url, { headers });
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    const country = searchParams.get('country')?.trim();

    if (!q) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    const cacheKey = `${q.toLowerCase()}:${(country || '').toLowerCase()}`;
    const cached = getCache(cacheKey);
    if (cached !== null) {
      return NextResponse.json(cached);
    }

    // Build Nominatim query URL
    // Nominatim expects ISO codes for countrycodes, let's pass it if it looks like a 2-char code,
    // otherwise if country is provided, we can append it to the query or use countrycodes parameter.
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
    if (country) {
      if (country.length === 2) {
        url += `&countrycodes=${encodeURIComponent(country.toLowerCase())}`;
      } else {
        // If it's a full country name, we can append it to the query for better accuracy
        url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${q}, ${country}`)}&format=json&limit=1`;
      }
    }

    const headers = {
      'User-Agent': 'Andor-Travel-App/1.0',
      'Accept-Language': 'en,pt;q=0.9',
    };

    const response = await rateLimitedFetch(url, headers);
    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(null);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      setCache(cacheKey, null);
      return NextResponse.json(null);
    }

    const result = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      type: data[0].type || data[0].class || 'place',
      displayName: data[0].display_name,
    };

    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Geocoding endpoint error:', error);
    return NextResponse.json(null);
  }
}
