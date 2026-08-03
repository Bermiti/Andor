/**
 * Route Calculator Module
 * Handles client-side route calculation between consecutive stops in a day's itinerary.
 */

// Helper to calculate crow-flies distance as fallback
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function extractCoordinates(stop) {
  if (!stop) return null;
  
  if (typeof stop.lat === 'number' && typeof stop.lng === 'number') {
    return { lat: stop.lat, lng: stop.lng };
  }
  if (typeof stop.latitude === 'number' && typeof stop.longitude === 'number') {
    return { lat: stop.latitude, lng: stop.longitude };
  }
  if (stop.coordinates && typeof stop.coordinates.lat === 'number' && typeof stop.coordinates.lng === 'number') {
    return { lat: stop.coordinates.lat, lng: stop.coordinates.lng };
  }
  if (stop.location && typeof stop.location.lat === 'number' && typeof stop.location.lng === 'number') {
    return { lat: stop.location.lat, lng: stop.location.lng };
  }
  
  return null;
}

export function formatRouteDuration(minutes) {
  if (minutes == null || isNaN(minutes)) return '';
  const rounded = Math.round(minutes);
  if (rounded < 60) {
    return `${rounded} min`;
  }
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

export function formatRouteDistance(km) {
  if (km == null || isNaN(km)) return '';
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

export async function calculateDayRoutes(stops) {
  if (!Array.isArray(stops) || stops.length < 2) return [];

  const validStops = [];
  for (const stop of stops) {
    const coords = extractCoordinates(stop);
    if (coords) {
      validStops.push({
        name: stop.name || stop.title || 'Stop',
        lat: coords.lat,
        lng: coords.lng
      });
    }
  }

  if (validStops.length < 2) return [];

  const segments = [];

  for (let i = 0; i < validStops.length - 1; i++) {
    const from = validStops[i];
    const to = validStops[i + 1];
    
    // Estimate distance first to determine mode
    const estDistanceKm = calculateHaversineDistance(from.lat, from.lng, to.lat, to.lng);
    const mode = estDistanceKm > 5 ? 'driving' : 'walking';
    const modeText = mode === 'walking' ? 'a pé' : 'de carro';

    try {
      const response = await fetch(`/api/routing?fromLat=${from.lat}&fromLng=${from.lng}&toLat=${to.lat}&toLng=${to.lng}&mode=${mode}`);
      
      if (!response.ok) {
        throw new Error('Routing API failed');
      }
      
      const data = await response.json();
      
      segments.push({
        from,
        to,
        distance: {
          km: data.distance,
          text: formatRouteDistance(data.distance)
        },
        duration: {
          minutes: data.duration,
          text: `${formatRouteDuration(data.duration)} ${modeText}`
        },
        mode,
        geometry: data.geometry,
        provenance: 'osrm'
      });
    } catch (error) {
      // Fallback estimate
      const fallbackKm = estDistanceKm * 1.3; // Rough multiplier for actual road distance
      const fallbackMinutes = mode === 'walking' ? fallbackKm * 12 : fallbackKm * 2; // Rough estimate: 12 min/km walking, 2 min/km driving
      
      segments.push({
        from,
        to,
        distance: {
          km: fallbackKm,
          text: formatRouteDistance(fallbackKm)
        },
        duration: {
          minutes: fallbackMinutes,
          text: `${formatRouteDuration(fallbackMinutes)} ${modeText} (estimado)`
        },
        mode,
        geometry: null,
        provenance: 'estimate'
      });
    }
  }

  return segments;
}
