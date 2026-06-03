/**
 * CRITICAL: City coordinates validator and fixer
 * Ensures map ALWAYS shows correct city, never zero-zero or out-of-bounds
 */

import { getCountryCentroid } from './geocoding';

export const CITY_BOUNDS = {
  tokyo: { lat: [35.0, 36.5], lng: [139.0, 140.5], center: [35.6762, 139.6503] },
  paris: { lat: [48.5, 49.2], lng: [2.0, 2.7], center: [48.8566, 2.3522] },
  bali: { lat: [-9.0, -8.0], lng: [114.5, 116.0], center: [-8.3405, 115.0920] },
  london: { lat: [51.2, 51.8], lng: [-0.5, 0.3], center: [51.5074, -0.1278] },
  "new york": { lat: [40.4, 41.0], lng: [-74.5, -73.5], center: [40.7128, -74.0060] },
  newyork: { lat: [40.4, 41.0], lng: [-74.5, -73.5], center: [40.7128, -74.0060] },
  barcelona: { lat: [41.3, 41.5], lng: [2.0, 2.3], center: [41.3874, 2.1686] },
  rome: { lat: [41.8, 42.0], lng: [12.4, 12.6], center: [41.9028, 12.4964] },
  roma: { lat: [41.8, 42.0], lng: [12.4, 12.6], center: [41.9028, 12.4964] },
  amsterdam: { lat: [52.3, 52.4], lng: [4.8, 5.0], center: [52.3676, 4.9041] },
  lisbon: { lat: [38.7, 38.8], lng: [-9.2, -9.0], center: [38.7223, -9.1393] },
  lisboa: { lat: [38.7, 38.8], lng: [-9.2, -9.0], center: [38.7223, -9.1393] },
  bangkok: { lat: [13.6, 13.9], lng: [100.4, 100.7], center: [13.7563, 100.5018] },
  dubai: { lat: [25.0, 25.4], lng: [55.1, 55.5], center: [25.2048, 55.2708] },
  marrakech: { lat: [31.5, 31.7], lng: [-8.1, -7.9], center: [31.6295, -8.0075] },
  sydney: { lat: [-34.0, -33.7], lng: [150.9, 151.3], center: [-33.8688, 151.2093] },
  singapore: { lat: [1.2, 1.5], lng: [103.6, 104.0], center: [1.3521, 103.8198] },
  berlin: { lat: [52.4, 52.6], lng: [13.2, 13.5], center: [52.5200, 13.4050] },
  praga: { lat: [50.0, 50.2], lng: [14.2, 14.6], center: [50.0755, 14.4378] },
  prague: { lat: [50.0, 50.2], lng: [14.2, 14.6], center: [50.0755, 14.4378] },
  istanbul: { lat: [40.8, 41.3], lng: [28.7, 29.3], center: [41.0082, 28.9784] },
  kyoto: { lat: [34.8, 35.2], lng: [135.5, 135.9], center: [35.0116, 135.7681] },
  osaka: { lat: [34.45, 34.9], lng: [135.25, 135.75], center: [34.6937, 135.5023] },
  porto: { lat: [41.0, 41.3], lng: [-8.8, -8.45], center: [41.1579, -8.6291] },
  madrid: { lat: [40.25, 40.6], lng: [-3.9, -3.45], center: [40.4168, -3.7038] },
  seul: { lat: [37.4, 37.7], lng: [126.7, 127.2], center: [37.5665, 126.9780] },
  "buenos aires": { lat: [-34.7, -34.5], lng: [-58.6, -58.3], center: [-34.6037, -58.3816] },
  "rio de janeiro": { lat: [-23.1, -22.8], lng: [-43.5, -43.1], center: [-22.9068, -43.1729] },
  mexico: { lat: [19.2, 19.6], lng: [-99.3, -98.9], center: [19.4326, -99.1332] },
  miami: { lat: [25.7, 25.9], lng: [-80.3, -80.1], center: [25.7617, -80.1918] },
  "los angeles": { lat: [33.9, 34.2], lng: [-118.5, -118.1], center: [34.0522, -118.2437] },
  sanfrancisco: { lat: [37.7, 37.8], lng: [-122.5, -122.4], center: [37.7749, -122.4194] },
  chicago: { lat: [41.8, 42.0], lng: [-87.8, -87.5], center: [41.8781, -87.6298] },
  boston: { lat: [42.3, 42.4], lng: [-71.1, -71.0], center: [42.3601, -71.0589] },
  santorini: { lat: [36.3, 36.5], lng: [25.4, 25.5], center: [36.3932, 25.4615] },
  venice: { lat: [45.4, 45.5], lng: [12.3, 12.4], center: [45.4408, 12.3155] },
  vienna: { lat: [48.1, 48.3], lng: [16.3, 16.5], center: [48.2082, 16.3738] },
  budapest: { lat: [47.4, 47.6], lng: [19.0, 19.2], center: [47.4979, 19.0402] },
};

export function getDestinationKey(destinationName) {
  if (!destinationName) return null;
  const key = destinationName.toLowerCase()
    .replace(/,.*$/, '')
    .replace(/\s+/g, '')
    .trim();
  
  // Try exact match first
  if (CITY_BOUNDS[key]) return key;
  
  // Try partial match
  for (const [k, v] of Object.entries(CITY_BOUNDS)) {
    if (key.includes(k) || k.includes(key)) return k;
  }
  return null;
}

export function isValidCoordinate(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (lat === 0 && lng === 0) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  return true;
}

export function isCoordinateInBounds(lat, lng, bounds) {
  if (!isValidCoordinate(lat, lng)) return false;
  const [latMin, latMax] = bounds.lat;
  const [lngMin, lngMax] = bounds.lng;
  return lat >= latMin && lat <= latMax && lng >= lngMin && lng <= lngMax;
}

export function validateAndFixCoordinates(itineraryData, destinationName) {
  if (!itineraryData || typeof itineraryData !== 'object') return itineraryData;
  
  const destKey = getDestinationKey(destinationName || itineraryData.destination?.name);
  const bounds = destKey ? CITY_BOUNDS[destKey] : null;
  const [centerLat, centerLng] = getDestinationCenter(destinationName || itineraryData.destination?.name);
  
  function fixCoord(coords) {
    if (!coords) return [centerLat, centerLng];
    
    if (Array.isArray(coords)) {
      const [lat, lng] = coords;
      if (bounds) {
        if (isCoordinateInBounds(lat, lng, bounds)) return coords;
      } else {
        if (isValidCoordinate(lat, lng)) return coords;
      }
      return [centerLat, centerLng];
    }
    
    if (typeof coords === 'object' && coords.lat !== undefined && coords.lng !== undefined) {
      const { lat, lng } = coords;
      if (bounds) {
        if (isCoordinateInBounds(lat, lng, bounds)) return coords;
      } else {
        if (isValidCoordinate(lat, lng)) return coords;
      }
      return { lat: centerLat, lng: centerLng };
    }
    
    return [centerLat, centerLng];
  }
  
  const result = JSON.parse(JSON.stringify(itineraryData));
  
  if (result.destination?.coordinates) {
    result.destination.coordinates = fixCoord(result.destination.coordinates);
  }
  
  if (Array.isArray(result.days)) {
    result.days.forEach(day => {
      if (!day) return;
      
      // Fix activities coordinates
      ['morning', 'afternoon', 'evening'].forEach(period => {
        if (day.periods?.[period]?.activities && Array.isArray(day.periods[period].activities)) {
          day.periods[period].activities.forEach(act => {
            if (act?.coordinates) {
              act.coordinates = fixCoord(act.coordinates);
            }
          });
        }
      });
      
      // Fix meal coordinates
      ['breakfast', 'lunch', 'dinner'].forEach(meal => {
        if (day.meals?.[meal]?.coordinates) {
          day.meals[meal].coordinates = fixCoord(day.meals[meal].coordinates);
        }
      });
      
      // Fix stops (legacy format)
      if (Array.isArray(day.stops)) {
        day.stops.forEach(stop => {
          if (stop?.coordinates) {
            stop.coordinates = fixCoord(stop.coordinates);
          }
        });
      }
    });
  }
  
  return result;
}

export function getDestinationCenter(destinationName) {
  const key = getDestinationKey(destinationName);
  if (key && CITY_BOUNDS[key]) {
    const [lat, lng] = CITY_BOUNDS[key].center;
    return [lat, lng];
  }
  
  if (destinationName) {
    // Try splitting by comma, check from right to left (usually city, country)
    const parts = destinationName.split(',').map(s => s.trim());
    for (let i = parts.length - 1; i >= 0; i--) {
      const centroid = getCountryCentroid(parts[i]);
      if (centroid) return centroid;
    }
    
    const centroid = getCountryCentroid(destinationName);
    if (centroid) return centroid;
  }
  
  return [51.5074, -0.1278]; // London fallback
}
