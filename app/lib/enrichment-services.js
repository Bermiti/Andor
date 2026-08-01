/**
 * Provider-backed itinerary enrichment.
 *
 * Missing providers return missing data. They must never synthesize a plausible
 * rating, price, opening time, venue, flight, or availability result.
 */

async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function hasUsableKey(value, placeholder) {
  return Boolean(value && value !== placeholder && !value.startsWith('cola_aqui'));
}

function parseCoordinates(value) {
  if (Array.isArray(value) && value.length >= 2) {
    const lat = Number(value[0]);
    const lng = Number(value[1]);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }
  if (value && typeof value === 'object') {
    const lat = Number(value.lat ?? value.latitude);
    const lng = Number(value.lng ?? value.lon ?? value.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }
  return null;
}

export async function enrichActivityData(activityName, destinationCity) {
  const result = {
    name: activityName,
    description: null,
    thumbnail: null,
    wikipediaUrl: null,
    source: 'unavailable',
    rating: null,
    hours: null,
    fee: null,
  };

  const wikiTitles = [
    activityName,
    destinationCity ? `${activityName} (${destinationCity})` : null,
    String(activityName || '').replace(/\s+/g, '_'),
  ].filter(Boolean);

  for (const lang of ['pt', 'en']) {
    for (const title of wikiTitles) {
      try {
        const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        const response = await fetchWithTimeout(url, {
          headers: { 'User-Agent': 'Andor-Travel-App/1.0 (contact@andor.travel)' },
        }, 3000);
        if (!response.ok) continue;

        const data = await response.json();
        if (data.extract) {
          result.description = data.extract;
          result.thumbnail = data.thumbnail?.source || null;
          result.wikipediaUrl = data.content_urls?.desktop?.page || null;
          result.source = 'wikipedia';
          break;
        }
      } catch (error) {
        // Try the next public source without inventing replacement data.
      }
    }
    if (result.description) break;
  }

  const openTripMapKey = process.env.OPENTRIPMAP_API_KEY;
  if (!destinationCity || !hasUsableKey(openTripMapKey, '5ae2e3...')) return result;

  try {
    const cityResponse = await fetchWithTimeout(
      `https://api.opentripmap.com/0.1/en/places/geoname?name=${encodeURIComponent(destinationCity)}&apikey=${openTripMapKey}`
    );
    if (!cityResponse.ok) return result;

    const city = await cityResponse.json();
    if (!Number.isFinite(Number(city.lat)) || !Number.isFinite(Number(city.lon))) return result;

    const placesResponse = await fetchWithTimeout(
      `https://api.opentripmap.com/0.1/en/places/radius?radius=5000&lon=${city.lon}&lat=${city.lat}&name=${encodeURIComponent(activityName)}&limit=1&apikey=${openTripMapKey}`
    );
    if (!placesResponse.ok) return result;

    const places = await placesResponse.json();
    const xid = places.features?.[0]?.properties?.xid;
    if (!xid) return result;

    const detailsResponse = await fetchWithTimeout(
      `https://api.opentripmap.com/0.1/en/places/xid/${xid}?apikey=${openTripMapKey}`
    );
    if (!detailsResponse.ok) return result;

    const details = await detailsResponse.json();
    result.source = 'opentripmap';
    result.fee = details.admission || null;
    result.hours = details.opening_hours || null;
    result.description = result.description || details.wikipedia_extracts?.text || null;
    result.thumbnail = result.thumbnail || details.preview?.source || null;
    result.wikipediaUrl = result.wikipediaUrl || details.wikipedia || null;
  } catch (error) {
    // Return only the fields a provider already supplied.
  }

  return result;
}

export async function enrichRestaurantsData(lat, lng) {
  const coordinates = parseCoordinates({ lat, lng });
  if (!coordinates) return [];

  const foursquareKey = process.env.FOURSQUARE_API_KEY;
  if (hasUsableKey(foursquareKey, 'fsq3...')) {
    try {
      const url = `https://api.foursquare.com/v3/places/search?query=restaurant&ll=${coordinates.lat},${coordinates.lng}&radius=1000&categories=13000&sort=RATING&limit=3`;
      const response = await fetchWithTimeout(url, {
        headers: { Authorization: foursquareKey, Accept: 'application/json' },
      }, 3000);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.results) && data.results.length > 0) {
          return data.results.map((restaurant) => ({
            name: restaurant.name,
            cuisine: restaurant.categories?.[0]?.name || null,
            rating: Number.isFinite(Number(restaurant.rating))
              ? (Number(restaurant.rating) / 2).toFixed(1)
              : null,
            priceLevel: Number.isInteger(restaurant.price) && restaurant.price > 0
              ? '€'.repeat(Math.min(4, restaurant.price))
              : null,
            address: restaurant.location?.formatted_address
              || restaurant.location?.address
              || null,
            hours: restaurant.hours?.display || null,
            mustTry: null,
            source: 'foursquare',
          }));
        }
      }
    } catch (error) {
      // Continue to the next configured provider.
    }
  }

  const openTripMapKey = process.env.OPENTRIPMAP_API_KEY;
  if (!hasUsableKey(openTripMapKey, '5ae2e3...')) return [];

  try {
    const radiusUrl = `https://api.opentripmap.com/0.1/en/places/radius?radius=1000&lon=${coordinates.lng}&lat=${coordinates.lat}&kinds=foods&rate=2&limit=3&apikey=${openTripMapKey}`;
    const radiusResponse = await fetchWithTimeout(radiusUrl);
    if (!radiusResponse.ok) return [];

    const radiusData = await radiusResponse.json();
    const features = Array.isArray(radiusData.features) ? radiusData.features.slice(0, 3) : [];
    const results = [];
    for (const feature of features) {
      const xid = feature.properties?.xid;
      if (!xid) continue;
      const detailsResponse = await fetchWithTimeout(
        `https://api.opentripmap.com/0.1/en/places/xid/${xid}?apikey=${openTripMapKey}`
      );
      if (!detailsResponse.ok) continue;

      const details = await detailsResponse.json();
      if (!details.name) continue;
      results.push({
        name: details.name,
        cuisine: details.kinds?.split(',').find((kind) => !['foods', 'restaurants'].includes(kind)) || null,
        rating: null,
        priceLevel: null,
        address: details.address?.road || details.address?.city || null,
        hours: details.opening_hours || null,
        mustTry: null,
        source: 'opentripmap',
      });
    }
    return results;
  } catch (error) {
    return [];
  }
}

export async function enrichTransportData(fromCity, toCity, date) {
  const dateSuffix = /^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) ? ` em ${date}` : '';
  const query = `Voos de ${fromCity || 'origem por definir'} para ${toCity || 'destino por definir'}${dateSuffix}`;
  const googleFlightsUrl = `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}`;
  const result = {
    overview: 'Pesquisa externa disponível; preços e disponibilidade não foram consultados.',
    skyscannerUrl: 'https://www.skyscanner.pt/transport/voos/',
    googleFlightsUrl,
    options: [],
  };

  const amadeusKey = process.env.AMADEUS_API_KEY;
  const amadeusSecret = process.env.AMADEUS_API_SECRET;
  const hasIataCodes = /^[A-Z]{3}$/i.test(String(fromCity || ''))
    && /^[A-Z]{3}$/i.test(String(toCity || ''));
  const hasDate = /^\d{4}-\d{2}-\d{2}$/.test(String(date || ''));
  if (!hasUsableKey(amadeusKey, '') || !amadeusSecret || !hasIataCodes || !hasDate) return result;

  const baseUrl = (process.env.AMADEUS_API_BASE_URL || 'https://test.api.amadeus.com').replace(/\/$/, '');
  try {
    const tokenParams = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: amadeusKey,
      client_secret: amadeusSecret,
    });
    const tokenResponse = await fetchWithTimeout(`${baseUrl}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams,
    }, 3000);
    if (!tokenResponse.ok) return result;

    const { access_token: accessToken } = await tokenResponse.json();
    if (!accessToken) return result;
    const offersUrl = `${baseUrl}/v2/shopping/flight-offers?originLocationCode=${fromCity.toUpperCase()}&destinationLocationCode=${toCity.toUpperCase()}&departureDate=${date}&adults=1&max=2`;
    const offersResponse = await fetchWithTimeout(offersUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }, 3000);
    if (!offersResponse.ok) return result;

    const offers = await offersResponse.json();
    result.options = (offers.data || []).map((offer) => {
      const itinerary = offer.itineraries?.[0];
      const segments = itinerary?.segments || [];
      const first = segments[0];
      const last = segments[segments.length - 1];
      return {
        operator: first?.carrierCode ? `Carrier ${first.carrierCode}` : null,
        type: 'flight',
        timing: first?.departure?.at && last?.arrival?.at
          ? `${first.departure.at.split('T')[1]?.slice(0, 5)} → ${last.arrival.at.split('T')[1]?.slice(0, 5)}`
          : null,
        duration: itinerary?.duration?.replace('PT', '').toLowerCase() || null,
        stops: segments.length ? Math.max(0, segments.length - 1) : null,
        estimatedPrice: offer.price?.total && offer.price?.currency
          ? `${offer.price.currency} ${offer.price.total}`
          : null,
        bookingUrl: googleFlightsUrl,
        source: baseUrl === 'https://api.amadeus.com' ? 'amadeus' : 'amadeus-test',
      };
    });
    result.overview = result.options.length
      ? `Ofertas recebidas do ambiente ${baseUrl === 'https://api.amadeus.com' ? 'de produção' : 'de teste'} da Amadeus.`
      : result.overview;
  } catch (error) {
    // Preserve the external search links and an empty result set.
  }

  return result;
}
