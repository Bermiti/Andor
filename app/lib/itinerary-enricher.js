/**
 * Shape-only itinerary enrichment.
 *
 * This module intentionally does not invent travel facts. Provider enrichment
 * belongs in /api/enrich-itinerary; absent prices, ratings, coordinates,
 * durations, meals and transport details stay absent here.
 */

function clone(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function destinationObject(destination) {
  if (destination && typeof destination === 'object') return destination;
  const label = typeof destination === 'string' ? destination.trim() : '';
  const [city = '', ...countryParts] = label.split(',').map((part) => part.trim());
  return {
    name: label || city,
    city,
    country: countryParts.join(', '),
  };
}

function activitiesForDay(day) {
  if (Array.isArray(day?.stops)) return day.stops;
  if (Array.isArray(day?.activities)) return day.activities;

  const activities = [];
  for (const period of ['morning', 'afternoon', 'evening']) {
    const periodActivities = day?.periods?.[period]?.activities;
    if (!Array.isArray(periodActivities)) continue;
    periodActivities.forEach((activity) => {
      activities.push({ ...activity, period: activity?.period || period });
    });
  }
  return activities;
}

function normalizeDay(day, index) {
  const source = day && typeof day === 'object' ? day : {};
  const stops = activitiesForDay(source).map((activity, activityIndex) => ({
    ...activity,
    id: activity?.id || `d${index + 1}-a${activityIndex + 1}`,
    period: activity?.period || (activityIndex === 0 ? 'morning' : activityIndex === 1 ? 'afternoon' : 'evening'),
  }));

  const periods = {};
  for (const period of ['morning', 'afternoon', 'evening']) {
    periods[period] = {
      ...(source.periods?.[period] || {}),
      activities: stops.filter((activity) => activity.period === period),
    };
  }

  return {
    ...source,
    dayNumber: source.dayNumber || index + 1,
    periods,
    activities: stops,
    stops,
    meals: source.meals || { breakfast: null, lunch: null, dinner: null },
  };
}

export function enrichItinerary(rawItinerary) {
  if (!rawItinerary || typeof rawItinerary !== 'object') return rawItinerary;

  const itinerary = clone(rawItinerary);
  const days = Array.isArray(itinerary.days) ? itinerary.days.map(normalizeDay) : [];
  const destination = destinationObject(itinerary.destination);

  return {
    ...itinerary,
    destination,
    trip: {
      ...(itinerary.trip || {}),
      totalDays: itinerary.trip?.totalDays || days.length,
    },
    days,
    flightOptions: Array.isArray(itinerary.flightOptions) ? itinerary.flightOptions : [],
    accommodation: itinerary.accommodation || { hotels: [] },
    bookingChecklist: itinerary.bookingChecklist || { items: [] },
    documentsChecklist: itinerary.documentsChecklist || { items: [] },
    backupPlans: itinerary.backupPlans || { items: [] },
    warnings: Array.isArray(itinerary.warnings) ? itinerary.warnings : [],
    metadata: {
      ...(itinerary.metadata || {}),
      structuralNormalization: 'shape-only',
    },
  };
}

export default enrichItinerary;
