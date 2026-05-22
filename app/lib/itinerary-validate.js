// Lightweight validator and normalizer for itineraries
const DESTINATION_BOUNDS = {
  tokyo: { latMin: 35.0, latMax: 36.5, lngMin: 138.5, lngMax: 140.5, center: { lat: 35.6762, lng: 139.6503 } },
  lisbon: { latMin: 38.4, latMax: 39.1, lngMin: -9.6, lngMax: -8.7, center: { lat: 38.7223, lng: -9.1393 } },
  paris: { latMin: 48.5, latMax: 49.1, lngMin: 1.8, lngMax: 2.8, center: { lat: 48.8566, lng: 2.3522 } },
  newyork: { latMin: 40.3, latMax: 41.0, lngMin: -74.3, lngMax: -73.5, center: { lat: 40.7128, lng: -74.0060 } },
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

  // Lightweight normalization: accept both legacy shape and new shape
  const normalized = {};

  // Destination handling
  let destName = itinerary.destination?.name || itinerary.destination || itinerary.city || null;
  if (typeof destName === 'object' && destName.name) destName = destName.name;
  if (!destName) {
    result.errors.push('Missing destination');
    result.fatal = true;
    return result;
  }
  normalized.destination = destName;

  const destKey = normalizeDestinationKey(destName);
  const bounds = DESTINATION_BOUNDS[destKey] || null;

  // Trip-level fields
  normalized.trip = itinerary.trip || { startDate: itinerary.startDate || '', endDate: itinerary.endDate || '', days: itinerary.days?.length || (itinerary.days?.length || 0) };
  normalized.summary = itinerary.summary || { title: itinerary.trip?.title || `${normalized.destination} trip`, estimatedTotalCost: itinerary.totalCost || itinerary.total_cost || 0 };

  // Days: various shapes -> unify to days[]. Each day should have stops/activities array
  const rawDays = itinerary.days || itinerary.days || itinerary.trip?.days || itinerary.days || [];
  if (!Array.isArray(rawDays)) {
    result.errors.push('Missing days array');
    result.fatal = true;
    return result;
  }

  // Build normalized days
  const seenTitles = new Map();
  normalized.days = rawDays.map((d, idx) => {
    const day = d || {};
    // Accept different property names
    const title = day.title || day.dayTitle || `Day ${idx + 1}`;
    let fixedTitle = title;
    if (seenTitles.has(title)) {
      // repair duplicate titles by suffixing
      const count = seenTitles.get(title) + 1;
      seenTitles.set(title, count);
      fixedTitle = `${title} — ${count}`;
      result.warnings.push(`Duplicate day title repaired: ${title} -> ${fixedTitle}`);
    } else {
      seenTitles.set(title, 1);
    }

    let activities = day.activities || day.stops || [];
    
    // If we have the new nested periods structure (morning, afternoon, evening)
    if (day.periods && typeof day.periods === 'object') {
      const allPeriodActivities = [];
      ['morning', 'afternoon', 'evening'].forEach(period => {
        if (day.periods[period] && Array.isArray(day.periods[period].activities)) {
          day.periods[period].activities.forEach(act => {
             // ensure period is assigned
             act.period = period;
             allPeriodActivities.push(act);
          });
        }
      });
      if (allPeriodActivities.length > 0) {
        activities = allPeriodActivities;
      }
    }

    const normalizedActivities = (Array.isArray(activities) ? activities : []).map((a, ai) => {
      const coordObj = a.coordinates || a.coords || a.location || a.coordinates || a.coordinate || null;
      let lat = coordObj?.lat ?? (Array.isArray(a.coordinates) ? a.coordinates[0] : undefined);
      let lng = coordObj?.lng ?? (Array.isArray(a.coordinates) ? a.coordinates[1] : undefined);
      if (typeof lat === 'string') lat = parseFloat(lat);
      if (typeof lng === 'string') lng = parseFloat(lng);

      const activity = {
        id: a.id || `d${idx}-a${ai}`,
        name: a.name || a.title || `Stop ${ai + 1}`,
        description: a.description || a.type || '',
        address: a.address || a.area || '',
        coordinates: isPlausibleCoord(lat, lng) ? { lat, lng } : null,
        startTime: a.startTime || a.time || a.hour || '',
        durationMinutes: a.durationMinutes || a.duration || a.durationMinutes || (a.durationHours ? parseInt(a.durationHours,10)*60 : undefined) || null,
        estimatedCost: a.estimatedCost || a.cost || a.price || null,
        category: a.category || a.type || null,
        period: a.period || (a.startTime ? (parseInt((a.startTime||'09:00').split(':')[0],10) < 12 ? 'morning' : 'afternoon') : null),
        localTip: a.localTip || a.localSecret || a.insiderTip || '',
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
