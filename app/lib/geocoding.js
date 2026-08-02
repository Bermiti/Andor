/**
 * Shared geocoding utilities for Andor
 */

// Mapping of 2-letter country codes (and lowercase country names) to centroids [lat, lng]
export const COUNTRY_CENTROIDS = {
  // Common codes
  pt: [39.3999, -8.2245], // Portugal
  es: [40.4637, -3.7492], // Spain
  fr: [46.2276, 2.2137], // France
  it: [41.8719, 12.5674], // Italy
  gb: [55.3781, -3.4360], // United Kingdom
  uk: [55.3781, -3.4360], // UK
  de: [51.1657, 10.4515], // Germany
  jp: [36.2048, 138.2529], // Japan
  us: [37.0902, -95.7129], // United States
  br: [-14.2350, -51.9253], // Brazil
  ca: [56.1304, -106.3468], // Canada
  au: [-25.2744, 133.7751], // Australia
  sg: [1.3521, 103.8198], // Singapore
  th: [15.8700, 100.9925], // Thailand
  ae: [23.4241, 53.8478], // UAE
  ma: [31.7917, -7.0926], // Morocco
  nl: [52.1326, 5.2913], // Netherlands
  ch: [46.8182, 8.2275], // Switzerland
  gr: [39.0742, 21.8243], // Greece
  tr: [38.9637, 35.2433], // Turkey
  id: [-0.7893, 113.9213], // Indonesia
  mx: [23.6345, -102.5528], // Mexico
  ar: [-38.4161, -63.6167], // Argentina
  za: [-30.5595, 22.9375], // South Africa
  in: [20.5937, 78.9629], // India
  cn: [35.8617, 104.1954], // China
  nz: [-40.9006, 174.8860], // New Zealand
  ie: [53.4129, -8.2439], // Ireland
  be: [50.5039, 4.4699], // Belgium
  at: [47.5162, 14.5501], // Austria
  se: [60.1282, 18.6435], // Sweden
  no: [60.4720, 8.4689], // Norway
  fi: [61.9241, 25.7482], // Finland
  dk: [56.2639, 9.5018], // Denmark
  pl: [51.9194, 19.1451], // Poland
  hr: [45.1000, 15.2000], // Croatia
  is: [64.9631, -19.0208], // Iceland
  eg: [26.8206, 30.8025], // Egypt
  ke: [-0.0236, 37.9062], // Kenya
  vn: [14.0583, 108.2772], // Vietnam
  ph: [12.8797, 121.7740], // Philippines
  my: [4.2105, 101.9758], // Malaysia
  kr: [35.9078, 127.7669], // South Korea
  pe: [-9.1900, -75.0152], // Peru
  cl: [-35.6751, -71.5430], // Chile
  co: [4.5709, -72.9565], // Colombia
  cr: [9.7489, -83.7534], // Costa Rica
  cz: [49.8175, 15.4730], // Czechia
  hu: [47.1625, 19.5033], // Hungary
  ro: [45.9432, 24.9668], // Romania
  ua: [48.3794, 31.1656], // Ukraine
  ge: [42.3154, 43.3569], // Georgia
  np: [28.3949, 84.1240], // Nepal
  lk: [7.8731, 80.7718], // Sri Lanka
  mv: [3.2028, 73.2207], // Maldives
  israel: [31.0461, 34.8516],
  sa: [23.8859, 45.0792], // Saudi Arabia
  qa: [25.3548, 51.1839], // Qatar
};

// Also map lowercase country names to their centroids
export const COUNTRY_NAME_TO_CENTROID = {
  portugal: COUNTRY_CENTROIDS.pt,
  spain: COUNTRY_CENTROIDS.es,
  espanha: COUNTRY_CENTROIDS.es,
  france: COUNTRY_CENTROIDS.fr,
  frança: COUNTRY_CENTROIDS.fr,
  italy: COUNTRY_CENTROIDS.it,
  itália: COUNTRY_CENTROIDS.it,
  "united kingdom": COUNTRY_CENTROIDS.gb,
  "reino unido": COUNTRY_CENTROIDS.gb,
  scotland: COUNTRY_CENTROIDS.gb,
  germany: COUNTRY_CENTROIDS.de,
  alemanha: COUNTRY_CENTROIDS.de,
  japan: COUNTRY_CENTROIDS.jp,
  japão: COUNTRY_CENTROIDS.jp,
  "united states": COUNTRY_CENTROIDS.us,
  usa: COUNTRY_CENTROIDS.us,
  "estados unidos": COUNTRY_CENTROIDS.us,
  brazil: COUNTRY_CENTROIDS.br,
  brasil: COUNTRY_CENTROIDS.br,
  canada: COUNTRY_CENTROIDS.ca,
  canadá: COUNTRY_CENTROIDS.ca,
  australia: COUNTRY_CENTROIDS.au,
  austrália: COUNTRY_CENTROIDS.au,
  singapore: COUNTRY_CENTROIDS.sg,
  singapura: COUNTRY_CENTROIDS.sg,
  thailand: COUNTRY_CENTROIDS.th,
  tailândia: COUNTRY_CENTROIDS.th,
  uae: COUNTRY_CENTROIDS.ae,
  "united arab emirates": COUNTRY_CENTROIDS.ae,
  "emirados árabes unidos": COUNTRY_CENTROIDS.ae,
  morocco: COUNTRY_CENTROIDS.ma,
  marrocos: COUNTRY_CENTROIDS.ma,
  netherlands: COUNTRY_CENTROIDS.nl,
  holanda: COUNTRY_CENTROIDS.nl,
  switzerland: COUNTRY_CENTROIDS.ch,
  suíça: COUNTRY_CENTROIDS.ch,
  greece: COUNTRY_CENTROIDS.gr,
  grécia: COUNTRY_CENTROIDS.gr,
  turkey: COUNTRY_CENTROIDS.tr,
  turquia: COUNTRY_CENTROIDS.tr,
  indonesia: COUNTRY_CENTROIDS.id,
  indonésia: COUNTRY_CENTROIDS.id,
  mexico: COUNTRY_CENTROIDS.mx,
  méxico: COUNTRY_CENTROIDS.mx,
  argentina: COUNTRY_CENTROIDS.ar,
  "south africa": COUNTRY_CENTROIDS.za,
  "áfrica do sul": COUNTRY_CENTROIDS.za,
  india: COUNTRY_CENTROIDS.in,
  índia: COUNTRY_CENTROIDS.in,
  china: COUNTRY_CENTROIDS.cn,
  "new zealand": COUNTRY_CENTROIDS.nz,
  "nova zelândia": COUNTRY_CENTROIDS.nz,
  ireland: COUNTRY_CENTROIDS.ie,
  irlanda: COUNTRY_CENTROIDS.ie,
  iceland: COUNTRY_CENTROIDS.is,
  islandia: COUNTRY_CENTROIDS.is,
  islândia: COUNTRY_CENTROIDS.is,
  georgia: COUNTRY_CENTROIDS.ge,
};

/**
 * Normalizes coordinate inputs in various formats into standard { lat, lng } object.
 * @param {Array|Object} input 
 * @returns {Object|null} { lat, lng } or null if invalid
 */
export function normalizeCoords(input) {
  if (!input) return null;
  
  // Format [lat, lng]
  if (Array.isArray(input)) {
    if (input.length >= 2) {
      const lat = parseFloat(input[0]);
      const lng = parseFloat(input[1]);
      return validateCoords(lat, lng) ? { lat, lng } : null;
    }
    return null;
  }
  
  // Format { lat, lng } or { latitude, longitude }
  if (typeof input === 'object') {
    const lat = parseFloat(input.lat !== undefined ? input.lat : input.latitude);
    const lng = parseFloat(input.lng !== undefined ? input.lng : input.longitude);
    return validateCoords(lat, lng) ? { lat, lng } : null;
  }
  
  return null;
}

/**
 * Validates check for valid latitude and longitude ranges.
 * Rejects [0,0] as it usually denotes geocoding failure.
 * @param {number} lat 
 * @param {number} lng 
 * @returns {boolean}
 */
export function validateCoords(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat === 0 && lng === 0) return false; // reject 0,0
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Resolves a country code or name to a default centroid.
 * @param {string} country 
 * @returns {Array|null} [lat, lng] or null
 */
export function getCountryCentroid(country) {
  if (!country) return null;
  const clean = country.toLowerCase().trim();
  
  if (COUNTRY_CENTROIDS[clean]) {
    return COUNTRY_CENTROIDS[clean];
  }
  
  if (COUNTRY_NAME_TO_CENTROID[clean]) {
    return COUNTRY_NAME_TO_CENTROID[clean];
  }
  
  // Try standard iso code lookup or fallback
  return null;
}

/**
 * Normalizes zoom level based on the Nominatim address type.
 * @param {string} type 
 * @returns {number}
 */
export function getZoomForType(type) {
  if (!type) return 13;
  
  switch (type.toLowerCase()) {
    case 'country':
      return 6;
    case 'state':
    case 'region':
      return 8;
    case 'county':
    case 'province':
      return 10;
    case 'city':
    case 'town':
    case 'municipality':
      return 12;
    case 'suburb':
    case 'neighbourhood':
    case 'quarter':
      return 14;
    default:
      return 15; // POIs, attractions, restaurants
  }
}

/**
 * Helper to process batch geocoding client-side or server-side by routing
 * geocode requests through our geocode proxy, spacing requests to avoid rate limits.
 * @param {Array} places [{ name, query }]
 * @param {string} country 
 * @returns {Promise<Array>} enriched places with coordinates
 */
export async function geocodeBatch(places, country = '') {
  const results = [];
  
  for (let i = 0; i < places.length; i++) {
    const place = places[i];
    
    // Rate limit delay: wait 1 second between requests (Nominatim requirement)
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    try {
      const q = encodeURIComponent(place.query || place.name);
      const countryParam = country ? `&country=${encodeURIComponent(country)}` : '';
      const response = await fetch(`/api/geocode?q=${q}${countryParam}`);
      if (response.ok) {
        const data = await response.json();
        results.push({
          ...place,
          coordinates: data ? [data.lat, data.lng] : null,
          coordinateSource: data ? 'nominatim' : 'failed',
          nominatimType: data?.type || null
        });
      } else {
        results.push({
          ...place,
          coordinates: null,
          coordinateSource: 'failed'
        });
      }
    } catch (error) {
      console.error(`Geocoding error for ${place.name}:`, error);
      results.push({
        ...place,
        coordinates: null,
        coordinateSource: 'failed'
      });
    }
  }
  
  return results;
}

let serverQueue = Promise.resolve();
let lastServerRequestTime = 0;

export async function geocodeServerSide(q, country = '') {
  return new Promise((resolve) => {
    serverQueue = serverQueue
      .then(async () => {
        const now = Date.now();
        const timeSinceLast = now - lastServerRequestTime;
        const delay = Math.max(0, 1000 - timeSinceLast);
        if (delay > 0) {
          await new Promise((r) => setTimeout(r, delay));
        }
        lastServerRequestTime = Date.now();

        let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
        if (country) {
          if (country.length === 2) {
            url += `&countrycodes=${encodeURIComponent(country.toLowerCase())}`;
          } else {
            url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${q}, ${country}`)}&format=json&limit=1`;
          }
        }

        const headers = {
          'User-Agent': 'Andor-Travel-App/1.0',
          'Accept-Language': 'en,pt;q=0.9',
        };

        const res = await fetch(url, { headers });
        if (!res.ok) {
          return null;
        }
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            type: data[0].type || data[0].class || 'place',
            displayName: data[0].display_name
          };
        }
        return null;
      })
      .then(resolve)
      .catch((err) => {
        console.error('Server-side geocoding error:', err);
        resolve(null);
      });
  });
}

