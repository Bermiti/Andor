// Lightweight validator and normalizer for itineraries
const DESTINATION_BOUNDS = {
  tokyo: { latMin: 35.0, latMax: 36.5, lngMin: 138.5, lngMax: 140.5, center: { lat: 35.6762, lng: 139.6503 } },
  lisbon: { latMin: 38.4, latMax: 39.1, lngMin: -9.6, lngMax: -8.7, center: { lat: 38.7223, lng: -9.1393 } },
  lisboa: { latMin: 38.4, latMax: 39.1, lngMin: -9.6, lngMax: -8.7, center: { lat: 38.7223, lng: -9.1393 } },
  paris: { latMin: 48.5, latMax: 49.1, lngMin: 1.8, lngMax: 2.8, center: { lat: 48.8566, lng: 2.3522 } },
  newyork: { latMin: 40.3, latMax: 41.0, lngMin: -74.3, lngMax: -73.5, center: { lat: 40.7128, lng: -74.0060 } },
  london: { latMin: 51.2, latMax: 51.7, lngMin: -0.5, lngMax: 0.3, center: { lat: 51.5074, lng: -0.1278 } },
  londres: { latMin: 51.2, latMax: 51.7, lngMin: -0.5, lngMax: 0.3, center: { lat: 51.5074, lng: -0.1278 } },
  barcelona: { latMin: 41.2, latMax: 41.6, lngMin: 1.8, lngMax: 2.4, center: { lat: 41.3874, lng: 2.1686 } },
  rome: { latMin: 41.7, latMax: 42.1, lngMin: 12.2, lngMax: 12.8, center: { lat: 41.9028, lng: 12.4964 } },
  roma: { latMin: 41.7, latMax: 42.1, lngMin: 12.2, lngMax: 12.8, center: { lat: 41.9028, lng: 12.4964 } },
  amsterdam: { latMin: 52.2, latMax: 52.5, lngMin: 4.7, lngMax: 5.1, center: { lat: 52.3676, lng: 4.9041 } },
  bangkok: { latMin: 13.5, latMax: 14.0, lngMin: 100.3, lngMax: 100.8, center: { lat: 13.7563, lng: 100.5018 } },
  bali: { latMin: -8.9, latMax: -8.0, lngMin: 114.8, lngMax: 115.8, center: { lat: -8.3405, lng: 115.0920 } },
  dubai: { latMin: 24.8, latMax: 25.4, lngMin: 54.9, lngMax: 55.6, center: { lat: 25.2048, lng: 55.2708 } },
  istanbul: { latMin: 40.8, latMax: 41.3, lngMin: 28.7, lngMax: 29.3, center: { lat: 41.0082, lng: 28.9784 } },
  kyoto: { latMin: 34.8, latMax: 35.2, lngMin: 135.5, lngMax: 135.9, center: { lat: 35.0116, lng: 135.7681 } },
  sydney: { latMin: -34.0, latMax: -33.6, lngMin: 150.9, lngMax: 151.4, center: { lat: -33.8688, lng: 151.2093 } },
};

function normalizeDestinationKey(dest) {
  if (!dest) return null;
  return dest.toString().toLowerCase().replace(/[ ,].*$/,'').replace(/\s+/g,'');
}

function isPlausibleCoord(lat, lng) {
  if (lat == null || lng == null) return false;
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (lat === 0 && lng === 0) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

export function validateAndNormalize(itinerary) {
  const result = { valid: true, warnings: [], errors: [], normalized: null, fatal: false };

  if (!itinerary || typeof itinerary !== 'object') {
    result.valid = false;
    result.fatal = true;
    result.errors.push('Itinerary is not an object or is null');
    return result;
  }

  // Lightweight normalization: accept both legacy shape and new rich shape
  const normalized = { ...itinerary };

  // Destination handling
  const destInput = itinerary.destination || itinerary.city || null;
  let destName = typeof destInput === 'object'
    ? (destInput.city || destInput.name || destInput.country)
    : destInput;
  if (!destName) {
    result.errors.push('Missing destination');
    result.fatal = true;
    return result;
  }
  normalized.destination = typeof destInput === 'object'
    ? { ...destInput, name: destInput.name || destInput.city || destName, city: destInput.city || destInput.name || destName }
    : { name: destName, city: String(destName).split(',')[0].trim() };

  const destKey = normalizeDestinationKey(destName);
  const bounds = DESTINATION_BOUNDS[destKey] || null;

  // Trip-level fields
  normalized.trip = itinerary.trip || { startDate: itinerary.startDate || '', endDate: itinerary.endDate || '', totalDays: itinerary.days?.length || 0 };
  normalized.summary = itinerary.summary || { title: itinerary.trip?.title || `${destName} trip`, estimatedTotalCost: itinerary.totalCost || itinerary.total_cost || 0 };

  // Days: various shapes -> unify to days[]. Each day should have stops/activities array
  const rawDays = itinerary.days || itinerary.trip?.days || itinerary.dailyPlan || [];
  if (!Array.isArray(rawDays)) {
    result.errors.push('Missing days array');
    result.fatal = true;
    return result;
  }

  const seenTitles = new Map();
  normalized.days = rawDays.map((d, idx) => {
    const day = d || {};
    const title = day.title || day.dayTitle || `Day ${idx + 1}`;
    let fixedTitle = title;

    const titleKey = String(fixedTitle).trim().toLowerCase();
    if (seenTitles.has(titleKey)) {
      fixedTitle = `${fixedTitle}: ${idx + 1}`;
      result.warnings.push(`Duplicate day title repaired for day ${idx + 1}`);
    }
    seenTitles.set(String(fixedTitle).trim().toLowerCase(), true);

    let activities = day.activities || day.stops || [];
    
    // If we have the new nested periods structure (morning, afternoon, evening)
    if (day.periods && typeof day.periods === 'object') {
      const allPeriodActivities = [];
      ['morning', 'afternoon', 'evening'].forEach(period => {
        if (day.periods[period] && Array.isArray(day.periods[period].activities)) {
          day.periods[period].activities.forEach(act => {
             allPeriodActivities.push({ ...act, period });
          });
        }
      });
      if (allPeriodActivities.length > 0) {
        activities = allPeriodActivities;
      }
    }

    const normalizedActivities = (Array.isArray(activities) ? activities : []).map((a, ai) => {
      const coordObj = a.coordinates || a.coords || a.location || a.coordinate || null;
      let lat = coordObj?.lat ?? (Array.isArray(a.coordinates) ? a.coordinates[0] : undefined);
      let lng = coordObj?.lng ?? (Array.isArray(a.coordinates) ? a.coordinates[1] : undefined);
      if (typeof lat === 'string') lat = parseFloat(lat);
      if (typeof lng === 'string') lng = parseFloat(lng);

      if (bounds) {
        if (lat < bounds.latMin || lat > bounds.latMax || lng < bounds.lngMin || lng > bounds.lngMax) {
          lat = bounds.center.lat;
          lng = bounds.center.lng;
        }
      }

      const activity = {
        ...a,
        id: a.id || `d${idx}-a${ai}`,
        name: a.name || a.title || `Stop ${ai + 1}`,
        description: a.description || a.type || '',
        address: a.address || a.area || '',
        coordinates: isPlausibleCoord(lat, lng) ? { lat, lng } : null,
        startTime: a.startTime || a.time || a.hour || '',
        time: a.time || a.startTime || a.hour || '',
        durationMinutes: a.durationMinutes || a.duration || (a.durationHours ? parseInt(a.durationHours,10)*60 : undefined) || null,
        estimatedCost: a.estimatedCost || a.cost || a.price || null,
        cost: a.cost ?? a.estimatedCost ?? a.price ?? null,
        category: a.category || a.type || null,
        type: a.type || a.category || null,
        period: a.period || (a.startTime ? (parseInt((a.startTime||'09:00').split(':')[0],10) < 12 ? 'morning' : 'afternoon') : null),
        localTip: a.localTip || a.localSecret || a.insiderTip || '',
        insiderTip: a.insiderTip || a.localTip || a.localSecret || '',
        transportFromPrevious: a.transportFromPrevious || a.transport || null,
        bookingUrl: a.bookingUrl || a.booking || null,
      };

      // Repair missing coordinates: use destination center if available
      if (!activity.coordinates && bounds) {
        activity.coordinates = { lat: bounds.center.lat, lng: bounds.center.lng };
        result.warnings.push(`Missing coordinates for activity '${activity.name}' — filled with destination center`);
      }

      return activity;
    });

    return {
      ...day,
      dayNumber: day.dayNumber || idx + 1,
      date: day.date || '',
      title: fixedTitle,
      emoji: day.emoji || '',
      estimatedCost: day.estimatedCost || day.budgetEstimate || 0,
      theme: day.theme || '',
      areaFocus: day.areaFocus || day.area || '',
      hotelSuggestion: day.hotelSuggestion || day.accommodation || null,
      // Provide both `activities` and `stops` for compatibility with legacy UI
      activities: normalizedActivities,
      stops: normalizedActivities,
      meals: day.meals || {},
      localSecret: day.localSecret || day.localSecrets || '',
    };
  });

  // Validate coordinates against bounds
  if (bounds) {
    normalized.days.forEach((d) => {
      d.activities.forEach((a) => {
        if (a.coordinates) {
          const { lat, lng } = a.coordinates;
          if (!(lat >= bounds.latMin && lat <= bounds.latMax && lng >= bounds.lngMin && lng <= bounds.lngMax)) {
            result.errors.push(`Activity '${a.name}' coordinates out of expected bounds for ${normalized.destination}`);
          }
        } else {
          result.errors.push(`Activity '${a.name}' missing coordinates and no fallback available`);
        }
      });
    });
  }

  // If we found errors about coordinates out of bounds, mark non-fatal but flag for regeneration
  if (result.errors.length > 0) {
    // Non-fatal: allow UI to attempt regeneration or show warnings
    result.valid = false;
    result.fatal = false;
  }

  result.normalized = normalized;
  return result;
}

export default validateAndNormalize;
