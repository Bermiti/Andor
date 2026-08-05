import { randomUUID } from 'node:crypto';
import { generateDestinationAwareFallbackItinerary } from '../../lib/fallback-ai';
import { validateAndNormalize } from '../../lib/itinerary-validate';
import { validateAndFixCoordinates, getDestinationCenter } from '../../lib/coordinate-validator';
import { geocodeServerSide } from '../../lib/geocoding';
import { validateAllDayTitles, isBannedDayTitle, suggestDayTitle } from '../../lib/day-title-validator';
import { apiError, cleanInteger, cleanList, cleanLocale, cleanString, hasProviderKey, readJsonBody } from '../../lib/api-utils';
import { logger } from '../../lib/logger';
import { createItineraryRecord } from '../../lib/supabase/db';
import { ensureBookingReadyItinerary } from '../../lib/booking-ready';
import { AI_MODELS } from '../../lib/server/ai-models';
import { isJourneyV2, validateJourneyItinerary } from '../../lib/journey-model';
import { getRequestIdentity } from '../../lib/server/identity';
import {
  canonicalRequestHash,
  checkpointGenerationRequest,
  completeGenerationRequest,
  failGenerationRequest,
  reserveGenerationRequest,
} from '../../lib/server/generation-request-repository';
import {
  createPlanningPlaceholderStageItinerary,
  generateMultiDestinationItinerary,
} from '../../lib/server/multi-destination-generation';

const DESTINATION_CURRENCY_HINTS = [
  { match: /tokyo|kyoto|osaka|japan/i, code: 'JPY', symbol: 'JPY' },
  { match: /london|united kingdom|uk|scotland|edinburgh|glasgow/i, code: 'GBP', symbol: 'GBP' },
  { match: /new york|nyc|usa|united states/i, code: 'USD', symbol: 'USD' },
  { match: /bali|indonesia/i, code: 'IDR', symbol: 'IDR' },
  { match: /marrakech|morocco/i, code: 'MAD', symbol: 'MAD' },
];

const LOCAL_CURRENCY_SCALE = {
  JPY: { factor: 160, lowGrandTotal: 20000, lowActivity: 500 },
  IDR: { factor: 17000, lowGrandTotal: 1000000, lowActivity: 100000 },
  MAD: { factor: 11, lowGrandTotal: 10000, lowActivity: 250 },
};

function coordinatePair(value) {
  const lat = Array.isArray(value) ? Number(value[0]) : Number(value?.lat ?? value?.latitude);
  const lng = Array.isArray(value) ? Number(value[1]) : Number(value?.lng ?? value?.lon ?? value?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180 || (lat === 0 && lng === 0)) return null;
  return [lat, lng];
}

function cleanDestinationEntity(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const displayName = cleanString(value.displayName || value.name || value.canonicalName, '', 160);
  const canonicalName = cleanString(value.canonicalName || displayName.split(',')[0], '', 90);
  if (!displayName && !canonicalName) return null;
  const coordinates = coordinatePair(value.coordinates);
  const currencyCodes = cleanList(value.currencyCodes, 4, 3)
    .map((code) => code.toUpperCase())
    .filter((code) => /^[A-Z]{3}$/.test(code));
  return {
    entityId: cleanString(value.entityId, '', 120) || null,
    canonicalName: canonicalName || displayName,
    displayName: displayName || canonicalName,
    entityType: cleanString(value.entityType, '', 40) || null,
    countryCode: cleanString(value.countryCode, '', 3).toUpperCase() || null,
    regionCode: cleanString(value.regionCode, '', 80) || null,
    parentPath: cleanList(value.parentPath, 8, 80),
    coordinates: coordinates ? { lat: coordinates[0], lng: coordinates[1] } : null,
    timezone: cleanString(value.timezone, '', 80) || null,
    currencyCodes,
    resolutionStatus: cleanString(value.resolutionStatus, '', 40) || null,
    providerRefs: value.providerRefs && typeof value.providerRefs === 'object'
      ? Object.fromEntries(
        Object.entries(value.providerRefs)
          .slice(0, 5)
          .map(([key, ref]) => [cleanString(key, '', 40), cleanString(ref, '', 120)])
          .filter(([key, ref]) => key && ref),
      )
      : {},
  };
}

function parseMoneyValue(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getDestinationCurrency(destination, fallbackDestination = '') {
  const haystack = [
    destination?.city,
    destination?.name,
    destination?.country,
    fallbackDestination,
  ].filter(Boolean).join(' ');

  const hint = DESTINATION_CURRENCY_HINTS.find((item) => item.match.test(haystack));
  if (hint) return { code: hint.code, symbol: hint.symbol };

  const existing = typeof destination?.currency === 'object'
    ? destination.currency
    : null;
  if (existing?.code) return existing;
  if (typeof destination?.currency === 'string' && /^[A-Z]{3}$/i.test(destination.currency)) {
    return { code: destination.currency.toUpperCase(), symbol: destination.currency.toUpperCase() };
  }
  return { code: 'EUR', symbol: 'EUR' };
}

function maybeScaleCurrencyValues(itinerary, currency) {
  const scale = LOCAL_CURRENCY_SCALE[currency.code];
  if (!scale || !itinerary?.trip?.budgetBreakdown) return;

  const budget = itinerary.trip.budgetBreakdown;
  const grandMax = parseMoneyValue(budget.grandTotal?.max, 0);
  const shouldScaleBudget = grandMax > 0 && grandMax < scale.lowGrandTotal;
  const scaleValue = (value, lowThreshold = scale.lowActivity) => {
    const parsed = parseMoneyValue(value, null);
    if (parsed === null || parsed <= 0 || parsed >= lowThreshold) return value;
    return Math.round(parsed * scale.factor);
  };

  if (shouldScaleBudget) {
    ['flights', 'accommodation', 'food', 'transport', 'activities'].forEach((key) => {
      if (!budget[key]) return;
      ['min', 'max', 'total', 'perNight', 'perDay'].forEach((field) => {
        if (budget[key][field] !== undefined) budget[key][field] = scaleValue(budget[key][field], scale.lowGrandTotal);
      });
    });
    if (budget.grandTotal) {
      budget.grandTotal.min = scaleValue(budget.grandTotal.min, scale.lowGrandTotal);
      budget.grandTotal.max = scaleValue(budget.grandTotal.max, scale.lowGrandTotal);
    }
    if (budget.perPersonEstimate) {
      budget.perPersonEstimate.min = scaleValue(budget.perPersonEstimate.min, scale.lowGrandTotal);
      budget.perPersonEstimate.max = scaleValue(budget.perPersonEstimate.max, scale.lowGrandTotal);
    }
  }

  (itinerary.flightOptions || []).forEach((flight) => {
    if (!flight.estimatedPrice) return;
    ['economy', 'premiumEconomy', 'business'].forEach((field) => {
      if (flight.estimatedPrice[field] !== undefined) flight.estimatedPrice[field] = scaleValue(flight.estimatedPrice[field], scale.lowGrandTotal);
    });
  });
  if (itinerary.accommodation?.recommended?.pricePerNight !== undefined) {
    itinerary.accommodation.recommended.pricePerNight = scaleValue(itinerary.accommodation.recommended.pricePerNight, scale.lowGrandTotal);
  }

  (itinerary.days || []).forEach((day) => {
    if (day.budgetEstimate !== undefined) day.budgetEstimate = scaleValue(day.budgetEstimate);
    if (day.estimatedCost !== undefined) day.estimatedCost = scaleValue(day.estimatedCost);
    if (day.transport?.cost !== undefined) day.transport.cost = scaleValue(day.transport.cost);
    if (day.transport?.totalDayCost !== undefined) day.transport.totalDayCost = scaleValue(day.transport.totalDayCost);
    (day.stops || day.activities || []).forEach((activity) => {
      if (activity.cost !== undefined) activity.cost = scaleValue(activity.cost);
      if (activity.transportFromPrevious?.cost !== undefined) {
        activity.transportFromPrevious.cost = scaleValue(activity.transportFromPrevious.cost);
      }
    });
    Object.values(day.meals || {}).forEach((meal) => {
      if (meal?.cost !== undefined) meal.cost = scaleValue(meal.cost);
    });
  });
}

function ensureCurrencyOnItinerary(itinerary, currency) {
  if (!itinerary || !currency?.code) return itinerary;
  itinerary.destination = {
    ...(typeof itinerary.destination === 'object' ? itinerary.destination : { city: itinerary.destination }),
    currency,
  };

  const budget = itinerary.trip?.budgetBreakdown;
  if (budget) {
    budget.currency = currency.code;
    ['flights', 'accommodation', 'food', 'transport', 'activities', 'grandTotal'].forEach((key) => {
      if (budget[key]) budget[key].currency = currency.code;
    });
  }

  (itinerary.flightOptions || []).forEach((flight) => {
    if (flight.estimatedPrice) flight.estimatedPrice.currency = currency.code;
  });
  if (itinerary.accommodation?.recommended) {
    itinerary.accommodation.recommended.currency = currency.code;
  }

  (itinerary.days || []).forEach((day) => {
    if (day.transport) day.transport.currency = currency.code;
    (day.stops || day.activities || []).forEach((activity) => {
      activity.currency = currency.code;
      if (activity.transportFromPrevious) {
        activity.transportFromPrevious.currency = currency.code;
      }
    });
  });
  maybeScaleCurrencyValues(itinerary, currency);
  return itinerary;
}

function buildContextualSuggestions(destinationCity, profile = {}) {
  const city = destinationCity || 'este destino';
  const paceLabel = profile.pace || 'balanced';
  const walkingLabel = profile.walkingLevel || profile.kidsWalking || 'medium';
  return [
    `Versao mais local de ${city}`,
    `Menos caminhadas em ${city}`,
    `Mais comida tipica em ${city}`,
    `Plano chuva para ${city}`,
    `Ritmo ${paceLabel} com walking ${walkingLabel}`,
  ];
}

function repairGenericSuggestions(itinerary, destinationCity, profile = {}) {
  const generic = /adjust|pace|nearby escape|food-focused|more local|generic|itinerary|roteiro|ritmo|gastronom/i;
  const suggestions = Array.isArray(itinerary?.suggestions) ? itinerary.suggestions : [];
  const useful = suggestions
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item) => item.length <= 80)
    .filter((item) => !generic.test(item) || item.toLowerCase().includes(String(destinationCity || '').toLowerCase()));

  itinerary.suggestions = useful.length >= 3
    ? useful.slice(0, 5)
    : buildContextualSuggestions(destinationCity, profile).slice(0, 5);
  return itinerary;
}

async function normalizeGeneratedItinerary(
  itinerary,
  requestedDestination,
  requestedDays,
  profile = {},
  requestedDestinationEntity = null,
) {
  if (!itinerary || typeof itinerary !== 'object') {
    throw new Error('Generated itinerary is not an object');
  }

  const fallbackDestination = requestedDestination || '';
  const destination = typeof itinerary.destination === 'object'
    ? { ...itinerary.destination }
    : { city: itinerary.destination || fallbackDestination };
  const selectedCity = requestedDestinationEntity?.canonicalName
    || requestedDestinationEntity?.displayName?.split(',')[0]?.trim()
    || '';
  destination.city = selectedCity || destination.city || destination.name || fallbackDestination;
  destination.name = requestedDestinationEntity?.displayName || destination.name || destination.city;
  if (requestedDestinationEntity) {
    destination.entityId = requestedDestinationEntity.entityId;
    destination.canonicalName = requestedDestinationEntity.canonicalName;
    destination.displayName = requestedDestinationEntity.displayName;
    destination.entityType = requestedDestinationEntity.entityType;
    destination.countryCode = requestedDestinationEntity.countryCode || destination.countryCode;
    destination.regionCode = requestedDestinationEntity.regionCode;
    destination.parentPath = requestedDestinationEntity.parentPath;
    destination.timezone = requestedDestinationEntity.timezone || destination.timezone;
    destination.currencyCodes = requestedDestinationEntity.currencyCodes;
    destination.resolutionStatus = requestedDestinationEntity.resolutionStatus;
    destination.providerRefs = requestedDestinationEntity.providerRefs;
  }
  const destinationCurrency = getDestinationCurrency(destination, fallbackDestination);
  destination.currency = destination.currency || destinationCurrency;

  const country = destination.countryCode || destination.country || '';
  
  // Dynamic geocoding for the destination
  let destCoords = coordinatePair(requestedDestinationEntity?.coordinates);
  let destinationCoordinateSource = destCoords ? 'selected_destination' : null;
  if (!destCoords) {
    try {
      const geoDest = await geocodeServerSide(destination.city, country);
      if (geoDest) {
        destCoords = coordinatePair(geoDest);
        if (destCoords) destinationCoordinateSource = 'geocoder';
      }
    } catch (err) {
      console.error('Failed to geocode destination city:', err);
    }
  }
  const knownCenter = getDestinationCenter(
    destination.city || fallbackDestination,
    { fallback: null },
  );
  const destinationCenter = destCoords || knownCenter;
  if (destinationCenter) {
    destination.coordinates = destinationCenter;
    destination.coordinateSource = destinationCoordinateSource || 'destination_registry';
  } else {
    destination.coordinates = null;
  }

  const days = Array.isArray(itinerary.days) ? itinerary.days : [];
  if (days.length === 0) {
    throw new Error('Generated itinerary has no days');
  }
  const expectedDays = Number(requestedDays) || days.length;
  if (days.length !== expectedDays) {
    throw new Error(`Expected exactly ${expectedDays} days, received ${days.length}`);
  }

  const isValidCoordinateLocal = (lat, lng) => {
    if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
    if (lat === 0 && lng === 0) return false;
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  };

  const seenTitles = new Set();
  const repairedDays = days.map((day, dayIndex) => {
    const nextDay = { ...day, dayNumber: day.dayNumber || dayIndex + 1 };
    if (!nextDay.title || isBannedDayTitle(nextDay.title) || seenTitles.has(nextDay.title.trim().toLowerCase())) {
      nextDay.title = suggestDayTitle({ ...nextDay, dayIndex }, destination.city);
    }
    seenTitles.add(String(nextDay.title).trim().toLowerCase());

    const periods = nextDay.periods || {};
    const periodKeys = ['morning', 'afternoon', 'evening'];
    const allActivities = [];

    periodKeys.forEach((periodKey) => {
      const period = periods[periodKey] || { label: periodKey, activities: [] };
      const activities = Array.isArray(period.activities) ? period.activities : [];
      period.activities = activities.slice(0, 4).map((activity, activityIndex) => {
        const nextActivity = { ...activity, period: periodKey };
        nextActivity.id = nextActivity.id || `d${dayIndex + 1}-${periodKey}-${activityIndex + 1}`;
        nextActivity.name = nextActivity.name || `Paragem ${activityIndex + 1}`;
        nextActivity.type = nextActivity.type || nextActivity.category || 'atividade';
        nextActivity.duration = nextActivity.duration || '';
        nextActivity.cost = typeof nextActivity.cost === 'number'
          ? nextActivity.cost
          : nextActivity.estimatedCost === undefined || nextActivity.estimatedCost === null
            ? null
            : parseMoneyValue(nextActivity.estimatedCost, null);
        nextActivity.currency = nextActivity.currency || destinationCurrency.code;
        nextActivity.address = nextActivity.address || '';
        nextActivity.coordinates = Array.isArray(nextActivity.coordinates) ? nextActivity.coordinates : null;
        nextActivity.bookingRequired = typeof nextActivity.bookingRequired === 'boolean' ? nextActivity.bookingRequired : null;
        nextActivity.crowd = nextActivity.crowd || '';
        nextActivity.insiderTip = nextActivity.insiderTip || nextActivity.localTip || '';
        nextActivity.photoKeyword = nextActivity.photoKeyword || '';
        allActivities.push(nextActivity);
        return nextActivity;
      });
      periods[periodKey] = period;
    });

    if (allActivities.length > 4) {
      const allowedIds = new Set(allActivities.slice(0, 4).map((activity) => activity.id));
      periodKeys.forEach((periodKey) => {
        periods[periodKey].activities = periods[periodKey].activities.filter((activity) => allowedIds.has(activity.id));
      });
    }

    nextDay.periods = periods;
    nextDay.stops = allActivities.slice(0, 4);
    nextDay.activities = nextDay.stops;
    nextDay.meals = nextDay.meals || {};
    nextDay.localSecret = nextDay.localSecret || '';
    nextDay.weather = nextDay.weather || null;
    nextDay.transport = nextDay.transport || null;
    return nextDay;
  });

  // Perform geocoding sequentially for all activities
  const activitiesToGeocode = [];
  repairedDays.forEach(day => {
    ['morning', 'afternoon', 'evening'].forEach(period => {
      if (day.periods?.[period]?.activities) {
        day.periods[period].activities.forEach(act => {
          activitiesToGeocode.push(act);
        });
      }
    });
  });

  for (const act of activitiesToGeocode) {
    if (act.type === 'planning_placeholder' || act.provenance?.sourceType === 'planning_placeholder') {
      act.coordinates = null;
      act.coordinateSource = 'not_applicable';
      continue;
    }
    try {
      const query = `${act.name}, ${destination.city}`;
      const geo = await geocodeServerSide(query, country);
      if (geo) {
        act.coordinates = [geo.lat, geo.lng];
        act.coordinateSource = 'nominatim';
      } else {
        const hasValidAiCoords = Array.isArray(act.coordinates) && 
                                 act.coordinates.length >= 2 && 
                                 isValidCoordinateLocal(act.coordinates[0], act.coordinates[1]);
        if (hasValidAiCoords) {
          act.coordinateSource = 'ai';
        } else {
          act.coordinates = null;
          act.coordinateSource = 'unavailable';
        }
      }
    } catch (err) {
      console.error(`Error geocoding activity ${act.name}:`, err);
      act.coordinates = null;
      act.coordinateSource = 'unavailable';
    }
  }

  const repaired = {
    ...itinerary,
    destination,
    trip: {
      ...itinerary.trip,
      totalDays: Number(requestedDays) || itinerary.trip?.totalDays || repairedDays.length,
      travelStyle: itinerary.trip?.travelStyle || '',
      groupType: itinerary.trip?.groupType || '',
      budgetTier: itinerary.trip?.budgetTier || '',
      topTips: itinerary.trip?.topTips || [],
    },
    days: repairedDays,
    flightOptions: Array.isArray(itinerary.flightOptions) ? itinerary.flightOptions : [],
    accommodation: itinerary.accommodation || {},
    packingList: itinerary.packingList || { essential: [], weatherSpecific: [], appsMustHave: [], doNotBring: [] },
    nearbyEscapes: Array.isArray(itinerary.nearbyEscapes) ? itinerary.nearbyEscapes : [],
    andorInsights: Array.isArray(itinerary.andorInsights) ? itinerary.andorInsights : [],
    suggestions: Array.isArray(itinerary.suggestions) ? itinerary.suggestions : [],
  };

  repairGenericSuggestions(repaired, destination.city, profile);

  const coordinateFixed = validateAndFixCoordinates(repaired, destination.city);
  const validation = validateAndNormalize(coordinateFixed, {
    expectedDays: requestedDays,
    requireDestinationCoordinate: true,
  });
  if (validation.fatal) {
    throw new Error(validation.errors.join('; '));
  }

  return ensureCurrencyOnItinerary(validation.normalized || coordinateFixed, destinationCurrency);
}

export async function POST(req) {
  let generationReservation = null;
  let generationIdentity = null;
  try {
    const markGenerationFailed = async (failureCode, retryable = true) => {
      if (!generationReservation?.requestId || !generationReservation?.leaseToken || !generationIdentity) return;
      await failGenerationRequest({
        requestId: generationReservation.requestId,
        leaseToken: generationReservation.leaseToken,
        failureCode,
        retryable,
      }, generationIdentity).catch(() => null);
    };
    const body = await readJsonBody(req, 'generate_itinerary');
    if (!body || typeof body !== 'object') {
      return apiError('MALFORMED_JSON', 'Pedido inválido. Verifica os dados e tenta novamente.', 400, false);
    }

    const destinationEntity = cleanDestinationEntity(body.destinationEntity);
    const destination = cleanString(
      body.destination || destinationEntity?.displayName || destinationEntity?.canonicalName,
      '',
      160,
    );
    const days = cleanInteger(body.days, 5, 1, 14);
    const budget = cleanString(body.budget || body.budgetTier, 'comfort', 40);
    const travelers = cleanInteger(body.travelers ?? body.travellerCount ?? body.people, 2, 1, 12);
    const interests = cleanList(body.interests || body.travelStyle, 8, 60);
    const style = cleanString(body.style || interests.join(', '), 'culture', 120);
    const activeLocale = cleanLocale(body.locale);
    const startDate = cleanString(body.startDate || body.dates?.start, '', 20);
    const endDate = cleanString(body.endDate || body.dates?.end, '', 20);
    const originCity = cleanString(body.originCity || body.departureCity || body.origin, '', 80);
    const arrivalTime = cleanString(body.arrivalTime || body.arrivalWindow, '', 40);
    const departureTime = cleanString(body.departureTime || body.departureWindow, '', 40);
    const mustSee = cleanList(body.mustSee || body.mustSeeList, 8, 90);
    const avoid = cleanList(body.avoid || body.avoidList, 8, 90);
    const authenticityLevel = cleanString(body.authenticityLevel, 'balanced', 40);
    const walkingLevel = cleanString(body.walkingLevel, 'medium', 40);
    const foodAdventure = cleanString(body.foodAdventure, 'balanced', 40);
    const memoryMode = cleanString(body.memoryMode, 'none', 20);

    const travelerType = cleanString(body.travelerType, 'couple', 40);
    const dietaryRestrictions = cleanList(body.dietaryRestrictions || body.dietary, 6, 60);
    const mobilityReduced = Boolean(body.mobilityReduced ?? body.reducedMobility);
    const transportPreference = cleanString(body.transportPreference || body.transport, 'any', 40);
    const budgetPerDay = cleanInteger(body.budgetPerDay, 0, 0, 5000);
    const budgetIncludesFlights = cleanString(body.budgetIncludesFlights, 'unknown', 20);
    const pace = cleanString(body.pace || body.tripPace, 'balanced', 40);
    const childrenAges = cleanString(body.childrenAges, '', 80);
    const kidsWalking = cleanString(body.kidsWalking, 'medium', 40);
    const personalityContext = {
      arrivalInstinct: cleanString(body.personalityContext?.arrivalInstinct || body.arrivalInstinct, '', 80),
      memoryPreference: cleanString(body.personalityContext?.memoryPreference || body.memoryPreference, '', 80),
      hotelPreference: cleanString(body.personalityContext?.hotelPreference || body.hotelPreference, '', 80),
    };
    const companyMode = Boolean(body.companyMode || body.b2bMode || body.clientMode);
    const clientName = cleanString(body.clientName, '', 90);
    const companyName = cleanString(body.companyName, '', 90);
    const preparedBy = cleanString(body.preparedBy, '', 90);
    const internalNotes = cleanString(body.internalNotes, '', 600);
    const clientFacingNotes = cleanString(body.clientFacingNotes, '', 600);
    const budgetApprovalStatus = cleanString(body.budgetApprovalStatus, 'not_requested', 40);
    const bookingStatus = cleanString(body.bookingStatus, 'not_started', 40);
    const exportPreference = cleanString(body.exportPreference || body.pdfPreference, 'client_pdf', 40);
    const forceFallback = body.forceFallback === true;

    const respondWithItinerary = async (itinerary, source = 'generated') => {
      const basePayload = {
        ...itinerary,
        trip: {
          ...(itinerary.trip || {}),
          totalDays: Number(days) || itinerary.trip?.totalDays || itinerary.days?.length || 0,
          budgetTier: budget,
          groupType: `${travelers} viajante${travelers === 1 ? '' : 's'}`,
          travelStyle: style,
          tripPace: pace,
          startDate: startDate || itinerary.trip?.startDate || null,
          endDate: endDate || itinerary.trip?.endDate || null,
          travelerProfile: {
            travelerType,
            travelers,
            childrenAges: childrenAges || null,
            kidsWalking,
            dietaryRestrictions,
            mobilityReduced,
            transportPreference,
            budgetPerDay,
            budgetIncludesFlights,
            pace,
            originCity,
            arrivalTime,
            departureTime,
            mustSee,
            avoid,
            authenticityLevel,
            walkingLevel,
            foodAdventure,
            memoryMode,
            personalityContext,
            companyMode,
            clientName,
            companyName,
            preparedBy,
            internalNotes,
            clientFacingNotes,
            budgetApprovalStatus,
            bookingStatus,
            exportPreference,
          },
        },
        metadata: {
          ...(itinerary.metadata || {}),
          dataHonesty: {
            verifiedBadge: 'Fonte externa identificada',
            suggestionBadge: 'Estimativa Andor',
          },
          travelerProfileSource: 'conversational-wizard',
          memoryMode,
          generationSource: source,
          destinationSelection: destinationEntity
            ? {
              entityId: destinationEntity.entityId,
              resolutionStatus: destinationEntity.resolutionStatus,
            }
            : null,
        },
      };
      const finalValidation = isJourneyV2(basePayload)
        ? validateJourneyItinerary(basePayload)
        : validateAndNormalize(basePayload, {
          expectedDays: days,
          requireDestinationCoordinate: true,
        });
      if (finalValidation.fatal) {
        await markGenerationFailed('generated_itinerary_invalid', true);
        return apiError(
          'ITINERARY_DATA_INVALID',
          'Os dados gerados nÃ£o formam um roteiro completo para todos os dias pedidos.',
          503,
          true,
          { errors: finalValidation.errors },
        );
      }
      const validatedPayload = finalValidation.normalized || basePayload;
      const payload = ensureBookingReadyItinerary(validatedPayload, {
        profile: validatedPayload.trip.travelerProfile,
      });

      if (generationReservation) {
        const checkpoint = await checkpointGenerationRequest({
          requestId: generationReservation.requestId,
          leaseToken: generationReservation.leaseToken,
          checkpoint: {
            phase: 'validated',
            source,
            completedStageIds: payload.journey?.stages?.map((stage) => stage.id) || [],
          },
        }, generationIdentity);
        if (!checkpoint.ok) {
          return apiError(
            checkpoint.status === 'lease_lost' ? 'GENERATION_LEASE_LOST' : 'ITINERARY_PERSISTENCE_FAILED',
            checkpoint.status === 'lease_lost'
              ? 'Outra tentativa retomou esta geraÃ§Ã£o. Aguarda um momento antes de voltar a tentar.'
              : 'NÃ£o foi possÃ­vel guardar o progresso da geraÃ§Ã£o com seguranÃ§a.',
            checkpoint.status === 'lease_lost' ? 409 : 503,
            true,
          );
        }

        const tripId = randomUUID();
        const saved = { ...payload, id: tripId, shareToken: null };
        const responsePayload = {
          ...saved,
          itinerary: saved,
          persistence: {
            mode: 'durable',
            provider: generationReservation.provider,
            persisted: true,
            reason: null,
          },
        };
        const completed = await completeGenerationRequest({
          requestId: generationReservation.requestId,
          leaseToken: generationReservation.leaseToken,
          tripRecord: {
            id: tripId,
            itinerary: saved,
            schemaVersion: saved.schemaVersion || saved.dataVersion || 1,
            metadata: {
              days,
              budget,
              travelers,
              style,
              startDate: startDate || null,
              endDate: endDate || null,
              source,
            },
            responsePayload,
          },
        }, generationIdentity);
        if (!completed.ok) {
          logger.warn('generate_itinerary:atomic_completion_failed', null, {
            destination,
            days,
            status: completed.status,
          });
          return apiError(
            completed.status === 'lease_lost' ? 'GENERATION_LEASE_LOST' : 'ITINERARY_PERSISTENCE_FAILED',
            completed.status === 'lease_lost'
              ? 'Outra tentativa retomou esta geraÃ§Ã£o. Aguarda um momento antes de voltar a tentar.'
              : 'O roteiro foi gerado, mas nÃ£o foi possÃ­vel guardÃ¡-lo de forma atÃ³mica.',
            completed.status === 'lease_lost' ? 409 : 503,
            true,
          );
        }
        return Response.json(completed.response || responsePayload);
      }

      let persisted;
      try {
        persisted = await createItineraryRecord(payload, {
          days,
          budget,
          travelers,
          style,
          startDate: startDate || null,
          endDate: endDate || null,
          source,
        });
      } catch (error) {
        logger.warn('generate_itinerary:persistence_failed', error, { destination, days });
        return apiError(
          'ITINERARY_PERSISTENCE_FAILED',
          'O roteiro foi gerado, mas nÃ£o foi possÃ­vel guardÃ¡-lo com seguranÃ§a. Tenta novamente.',
          503,
          true,
          { reason: 'storage_error' },
        );
      }

      if (!persisted?.ok && persisted?.reason !== 'auth_required') {
        logger.warn('generate_itinerary:persistence_failed', null, {
          destination,
          days,
          reason: persisted?.reason || 'unknown',
        });
        return apiError(
          'ITINERARY_PERSISTENCE_FAILED',
          'O roteiro foi gerado, mas nÃ£o foi possÃ­vel guardÃ¡-lo com seguranÃ§a. Tenta novamente.',
          503,
          true,
          { reason: persisted?.reason || 'unknown' },
        );
      }
      if (persisted.ok && !cleanString(persisted.id, '', 120)) {
        logger.warn('generate_itinerary:persistence_missing_id', null, {
          destination,
          days,
          provider: persisted.provider || 'unknown',
        });
        return apiError(
          'ITINERARY_PERSISTENCE_FAILED',
          'O roteiro foi gerado, mas o armazenamento nÃ£o devolveu um identificador vÃ¡lido. Tenta novamente.',
          503,
          true,
          { reason: 'missing_persisted_id' },
        );
      }

      const persistence = persisted.ok
        ? {
          mode: 'durable',
          provider: persisted.provider,
          persisted: true,
          reason: null,
        }
        : {
          mode: 'local_draft',
          provider: 'browser',
          persisted: false,
          reason: 'auth_required',
        };

      const saved = persisted.ok
        ? { ...payload, id: persisted.id, shareToken: persisted.shareToken }
        : {
          ...payload,
          metadata: {
            ...(payload.metadata || {}),
            persistenceMode: 'local_draft',
          },
        };

      return Response.json({
        ...saved,
        itinerary: saved,
        persistence,
      });
    };

    if (destination.length < 2) {
      return apiError('DESTINATION_REQUIRED', 'Indica um destino para criar o itinerário.', 400, false);
    }

    if (/https?:\/\/|<script|ignore previous/i.test(destination)) {
      return apiError('INVALID_DESTINATION', 'O destino parece inválido. Usa apenas o nome da cidade ou região.', 400, false);
    }

    generationIdentity = await getRequestIdentity();
    if (generationIdentity?.authenticated && generationIdentity.userId) {
      const rawIdempotencyKey = req.headers.get('idempotency-key') || '';
      const idempotencyKey = rawIdempotencyKey.trim();
      if (
        rawIdempotencyKey !== idempotencyKey
        || idempotencyKey.length < 16
        || idempotencyKey.length > 128
        || /[\u0000-\u001f\u007f]/.test(idempotencyKey)
      ) {
        return apiError(
          'IDEMPOTENCY_KEY_REQUIRED',
          'Envia uma Idempotency-Key válida para guardar uma geração autenticada com segurança.',
          428,
          false,
        );
      }

      const requestHash = canonicalRequestHash({
        schemaVersion: 2,
        destination,
        destinationEntity,
        journey: body.journey || null,
        days,
        budget,
        travelers,
        style,
        locale: activeLocale,
        startDate: startDate || null,
        endDate: endDate || null,
        originCity,
        arrivalTime,
        departureTime,
        mustSee,
        avoid,
        travelerType,
        dietaryRestrictions,
        mobilityReduced,
        transportPreference,
        budgetPerDay,
        budgetIncludesFlights,
        pace,
        childrenAges,
        kidsWalking,
        personalityContext,
        authenticityLevel,
        walkingLevel,
        foodAdventure,
        memoryMode,
        companyMode,
        clientName,
        companyName,
        preparedBy,
        internalNotes,
        clientFacingNotes,
        budgetApprovalStatus,
        bookingStatus,
        exportPreference,
        forceFallback,
      });
      const reservation = await reserveGenerationRequest({
        key: idempotencyKey,
        requestHash,
      }, generationIdentity);

      if (reservation.status === 'replay' && reservation.response) {
        return Response.json(reservation.response, {
          headers: { 'Idempotency-Replayed': 'true' },
        });
      }
      if (reservation.status === 'mismatch') {
        return apiError(
          'IDEMPOTENCY_KEY_REUSED',
          'Esta Idempotency-Key já foi usada para um pedido diferente.',
          409,
          false,
        );
      }
      if (reservation.status === 'in_progress') {
        return Response.json({
          error: {
            code: 'GENERATION_IN_PROGRESS',
            message: 'Esta geração ainda está em curso. Volta a tentar após o intervalo indicado.',
            retryable: true,
          },
        }, {
          status: 409,
          headers: { 'Retry-After': String(reservation.retryAfterSeconds || 2) },
        });
      }
      if (!reservation.ok || reservation.status !== 'reserved') {
        const terminal = reservation.status === 'failed' && reservation.retryable === false;
        return apiError(
          terminal ? 'GENERATION_PREVIOUSLY_FAILED' : 'ITINERARY_PERSISTENCE_FAILED',
          terminal
            ? 'Esta geração terminou com uma falha não repetível. Inicia um novo pedido.'
            : 'Não foi possível reservar a geração com segurança.',
          terminal ? 409 : 503,
          !terminal,
        );
      }
      generationReservation = reservation;
    }

    const systemPrompt = `You are ANDOR, an AI travel-planning assistant. You do not have live inventory, booking access, payment access, or automatic knowledge of current prices, schedules, disruptions, entry rules, or weather.

CORE IDENTITY:
- Build a useful proposal from the current request while preserving an explicit provenance boundary.
- You do not reuse previous itineraries, saved memory, or canned city templates.
- Every output is generated from the current request only.
- Never invent a business, price, rating, opening hour, availability, booking deadline, journey time, safety alert, legal requirement, or coordinate.
- Planning times and costs are allowed only as clearly labelled estimates with assumptions.
- Omit unsupported fields and direct the traveler to a named official source or provider for confirmation.

LANGUAGE RULE:
Always respond in: ${activeLocale}
If language is 'pt' use European Portuguese.
If language is 'pt-BR' use Brazilian Portuguese.
Never mix languages in the same response.

DESTINATION EXPERTISE — for every place you know:
→ Best/worst months to visit and exactly why
→ Which neighbourhoods match which travel styles
→ How local transport works in practice
→ Which attractions are worth it vs tourist traps
→ Where locals actually eat (not tourist restaurants)
→ Price estimates only when clearly labelled; provider values only when a named provider supplied them
→ Cultural rules that matter with specific examples
→ Safety realities — not paranoid, not naive
→ Hidden gems most guides never mention
→ Optimal routing to avoid backtracking
→ What to book in advance and how far ahead
→ Apps locals use for transport, food, navigation

CURRENT REQUEST ONLY:
- Do not ask follow-up questions. Return JSON now.
- Use only the destination and preferences in this request.
- If a detail is missing, make a clearly labelled sensible assumption in metadata.assumptions.
- The same preferences in two different cities must produce recognisably different neighbourhoods, food, transport, safety notes, and day rhythm.
- Avoid template language such as "historic center", "traditional restaurant", "main cathedral/temple" unless it is the real local name.
- suggestions must be contextual chips for THIS destination and THIS traveler profile, never generic actions.
- photoKeyword must include the exact place name + destination city + country + visual category.

ITINERARY CONSTRUCTION RULES:
- Day 1: always arrival + orientation + light exploration
  (account for jet lag on long-haul flights)
- Max 3-4 major activities per day
- Group activities geographically — never waste 40min 
  travelling between things on opposite sides of a city
- Include travel-time and cost estimates only when labelled; omit values that cannot be supported
- Every day needs: morning coffee, lunch spot, 2-3 activities,
  dinner recommendation, optional evening activity
- Vary pace: intense day → slower recovery day
- One "hidden gem" per day that guidebooks miss
- Flag everything that needs advance booking
- DAY TITLES — ABSOLUTE RULE, NEVER BREAK:
  Every day title must be unique, cinematic, and evocative.
  It must make someone excited to live that specific day.
  It must reference specific places or experiences from that day.
  Required format: '[Atmospheric Hook]: [Specific Places & Moments]'

  Examples of required quality:
  - 'The City Wakes Up: Tsukiji at Dawn & Senso-ji in Silence'
  - 'Neon Cathedrals: Shibuya Crossing & Harajuku After Dark'
  - 'Ancient Kyoto Hiding Inside Modern Tokyo'
  - 'Last Morning Light: Market Breakfast & Airport Farewell'

  PERMANENTLY BANNED (never use these patterns):
  - 'Explore [City]'
  - 'Day [N] in [City]'
  - 'Visit [City]'
  - '[City] Day [N]'
  - 'Discover [City]'
  - Any title identical or similar to another day in the same itinerary

COORDINATE RULES — CRITICAL, NEVER BREAK:
Every coordinate must be geographically accurate.
Tokyo activities: lat 35.6-35.8, lng 139.5-139.9
Paris activities: lat 48.8-48.9, lng 2.2-2.5
Bali activities: lat -8.8 to -8.1, lng 114.9-115.7
London activities: lat 51.4-51.6, lng -0.3 to 0.1
NYC activities: lat 40.6-40.9, lng -74.1 to -73.7
Barcelona: lat 41.3-41.5, lng 2.0-2.3
Lisbon: lat 38.7-38.8, lng -9.2 to -9.0
Rome: lat 41.8-42.0, lng 12.4-12.6
Amsterdam: lat 52.3-52.4, lng 4.8-5.0
Bangkok: lat 13.6-13.9, lng 100.4-100.7

NEVER return zero-zero coordinates or coordinates from wrong city.
If unsure of exact coordinates, omit them. Never place an activity at the city centroid.

FLIGHT KNOWLEDGE:
- Know major hub connections and realistic prices
- Recommend booking windows (6-8w Europe, 3-4m long-haul)
- Flag best airlines per route with specific reasons
- Note baggage policy differences when relevant
- Always add: "Verify current prices on Skyscanner/Google Flights"

HOTEL KNOWLEDGE — 3 tiers per destination:
Budget: hostels/guesthouses with character, not just cheap
Mid-range: 3-4★ with soul, avoid generic chains
Luxury: genuinely special, not just expensive
Always explain: why this neighbourhood, what's walkable

RESTAURANT KNOWLEDGE — per recommendation include:
- Cuisine type, price range (€/€€/€€€), must-order dish
- Whether booking needed and how far in advance
- Opening hours that catch tourists off guard
- Cash vs card policy
- Local tip about the best table/time to go

TRANSPORT KNOWLEDGE:
- Specific metro/bus lines with numbers
- Whether passes/cards are worth it with math proof
- Best local taxi/rideshare apps by country
- Train passes: when worth it vs point-to-point
- Airport transfer options ranked by value

BOOKING-READY RULES:
- Never claim flights, hotels, restaurants, activities, cars, or transfers are booked.
- Do not request, store, or infer payment card data.
- Return search links or provider links for flights, hotels, rental cars, restaurants, and activities when possible.
- Every booking task starts with status "not_started" unless the user explicitly supplied a real confirmation.
- Include manual fields the traveler can fill later: reference, price, notes, and status.
- If live provider data is missing, use honest fallback search links and label them as estimates.
- Include airport arrival/departure planning, local transport, rental car advice, documents, alerts, and contingency plans.

WHEN GENERATING ITINERARY JSON:
Return ONLY valid JSON. No markdown. No explanation text.
Use this exact structure:

{
  "destination": {
    "city": "Tokyo",
    "country": "Japan",
    "countryCode": "JP",
    "flag": "🇯🇵",
    "coordinates": [35.6762, 139.6503],
    "timezone": "Asia/Tokyo",
    "currency": {
      "code": "JPY",
      "symbol": "¥",
      "euroRate": 0.006,
      "usdRate": 0.0067
    },
    "language": "Japanese",
    "bestMonths": ["March", "April", "October", "November"],
    "avoidMonths": ["July", "August"],
    "andorVerdict": "Tokyo rewards those who go beyond the obvious — the real city lives in its backstreets, 24h konbinis, and the silence of pre-dawn shrines",
    "visaInfo": "Visa-free for EU/US passports, 90 days",
    "healthInfo": "No vaccinations required. Tap water safe.",
    "safetyLevel": "Exceptional — one of the safest cities on earth",
    "tippingCulture": "Never tip — considered rude or confusing",
    "electricityPlug": "Type A/B, 100V",
    "simCard": "IIJmio or Mobal — buy at airport"
  },
  "trip": {
    "totalDays": 7,
    "travelStyle": "cultural",
    "groupType": "couple",
    "budgetTier": "mid-range",
    "budgetBreakdown": {
      "flights": {
        "min": 650, "max": 900,
        "currency": "EUR",
        "note": "From Lisbon, 1 stop via Helsinki or Frankfurt",
        "bookingWindow": "3-4 months ahead"
      },
      "accommodation": {
        "total": 840, "perNight": 120,
        "currency": "EUR",
        "nights": 7
      },
      "food": {
        "total": 280, "perDay": 40,
        "currency": "EUR",
        "note": "Mix of convenience stores, ramen shops, izakayas"
      },
      "transport": {
        "total": 120,
        "currency": "EUR",
        "note": "Suica card covers everything"
      },
      "activities": {
        "total": 180,
        "currency": "EUR",
        "note": "Most temples free or under €5"
      },
      "grandTotal": {
        "min": 2070, "max": 2520,
        "currency": "EUR",
        "perPerson": true,
        "includes": "flights + hotel + food + transport + activities"
      }
    },
    "topTips": [
      "Get a Suica card the moment you exit immigration — use it for everything including convenience stores",
      "Book teamLab Planets 6-8 weeks ahead — it sells out completely every weekend",
      "7-Eleven and Lawson onigiri at 6am before stock runs out — genuinely one of Tokyo's great food experiences"
    ]
  },
  "flightOptions": [
    {
      "airline": "Finnair",
      "route": "LIS → HEL → NRT",
      "totalDuration": "14h 30m",
      "stops": 1,
      "layover": "Helsinki, 1h 45m",
      "estimatedPrice": {
        "economy": 720,
        "premiumEconomy": 1200,
        "business": 2100,
        "currency": "EUR"
      },
      "bestBookingWindow": "3-4 months in advance",
      "baggage": "23kg checked + 8kg cabin",
      "prosAndCons": "Comfortable A350, good food, tight connection risk",
      "badge": "recommended",
      "skyscannerUrl": "https://www.skyscanner.com/flights/lis/tyo/"
    },
    {
      "airline": "Lufthansa",
      "route": "LIS → FRA → NRT",
      "totalDuration": "15h 50m",
      "stops": 1,
      "layover": "Frankfurt, 2h 10m",
      "estimatedPrice": {
        "economy": 680,
        "business": 1950,
        "currency": "EUR"
      },
      "badge": "best_price",
      "skyscannerUrl": "https://www.skyscanner.com/flights/lis/tyo/"
    }
  ],
  "accommodation": {
    "recommended": {
      "name": "Hotel Gracery Shinjuku",
      "area": "Shinjuku",
      "stars": 4,
      "pricePerNight": 130,
      "currency": "EUR",
      "coordinates": [35.6938, 139.7034],
      "address": "1-19-1 Kabukicho, Shinjuku-ku, Tokyo",
      "whyHere": "Iconic Godzilla head on facade. 8 min walk to Shinjuku station. Perfect base for exploring both east and west Tokyo.",
      "bookingTip": "Book direct for best rate + free early check-in if available",
      "bookingUrl": "https://www.booking.com/hotel/jp/gracery-shinjuku.html",
      "checkIn": "15:00",
      "checkOut": "11:00"
    },
    "budget": {
      "name": "Khaosan Tokyo Kabuki",
      "type": "Boutique Hostel",
      "area": "Asakusa",
      "pricePerNight": 35,
      "currency": "EUR",
      "whyHere": "Best location in Asakusa, 2 min from Senso-ji, great common areas",
      "bookingUrl": "https://www.booking.com/hotel/jp/khaosan-tokyo-kabuki.html"
    },
    "luxury": {
      "name": "Park Hyatt Tokyo",
      "type": "5★ Iconic",
      "area": "Shinjuku",
      "pricePerNight": 480,
      "currency": "EUR",
      "whyHere": "The hotel from Lost in Translation. Bar on 52nd floor. Unbeatable skyline views.",
      "bookingUrl": "https://www.hyatt.com/en-US/hotel/japan/park-hyatt-tokyo"
    }
  },
  "airportTransfer": {
    "overview": "Arrival and departure transfer strategy",
    "options": [
      {
        "tier": "budget",
        "name": "Public transport",
        "description": "How to get from the airport to the base area",
        "estimatedCost": 12,
        "estimatedDuration": "45 min",
        "bestFor": "lowest cost"
      }
    ],
    "tips": ["Save hotel address offline before landing"]
  },
  "localTransport": {
    "overview": "How to move day to day",
    "passes": [{ "name": "Transit card", "cost": 10, "validity": "stored value", "includes": ["metro", "bus"], "recommendation": "Worth it for 3+ rides/day" }],
    "apps": [{ "name": "Local transit app", "purpose": "public transport schedules" }],
    "tips": ["Group each day by neighborhood"]
  },
  "rentalCar": {
    "recommended": false,
    "strategy": "Use only for regional day trips if public transport is weak",
    "pickup": "Airport or city pickup advice",
    "insuranceNote": "Verify excess and coverage; do not store payment data",
    "parkingNote": "Check hotel parking and city restrictions",
    "searchLinks": { "rentalCars": "https://www.rentalcars.com/" },
    "bookingStatus": "not_started"
  },
  "bookingChecklist": {
    "items": [
      {
        "id": "flights",
        "category": "flights",
        "task": "Search and select flights",
        "description": "Compare live prices, baggage, arrival time, and cancellation rules",
        "priority": "critical",
        "status": "not_started",
        "daysBeforeDeparture": 90,
        "searchUrl": "https://www.google.com/travel/flights",
        "reference": "",
        "price": "",
        "notes": ""
      }
    ],
    "notes": "Manual checklist only; nothing is booked by Andor"
  },
  "documentsChecklist": {
    "items": [
      {
        "id": "passport",
        "category": "identity",
        "title": "Passport or national ID valid for entry",
        "description": "Confirm accepted ID, validity window, blank-page rules, and name spelling",
        "importance": "required",
        "whoNeedsIt": "Every traveler",
        "timing": "60+ days before departure",
        "status": "needed",
        "notes": "",
        "sourceReason": "Core travel document; verify official entry rules"
      }
    ]
  },
  "backupPlans": {
    "items": [
      {
        "id": "bad_weather",
        "category": "weather",
        "severity": "medium",
        "trigger": "Bad weather or unsafe outdoor conditions",
        "replacementPlan": "Same-area indoor/covered route",
        "costImpact": "Neutral to moderate",
        "timeImpact": "Keep same half-day block",
        "moveOrCancel": "Move exposed outdoor stops first",
        "practicalNote": "Check hours and transport the night before",
        "clientFacing": "If weather turns, the day pivots to covered stops without losing the main rhythm",
        "sourceReason": "Weather-safe operating fallback"
      }
    ],
    "notes": "Backup plans are operational fallbacks; verify provider policies and live conditions"
  },
  "warnings": [
    { "type": "practical", "title": "Verify live details", "description": "Prices and opening hours can change", "advice": "Confirm before paying" }
  ],
  "contingencyPlans": {
    "rainyDay": "Specific rainy-day replacement plan",
    "delayRecovery": "What to move if arrival is delayed",
    "tiredDay": "Lower-energy version",
    "lowerBudget": "How to reduce cost without ruining the day"
  },
  "exportMetadata": {
    "brand": "Andor",
    "clientName": "",
    "companyName": "",
    "preparedBy": "",
    "budgetApprovalStatus": "not_requested",
    "bookingStatus": "not_started",
    "clientFacingNotes": "",
    "internalNotes": ""
  },
  "days": [
    {
      "dayNumber": 1,
      "title": "Aterragem & Primeiros Passos em Shinjuku",
      "emoji": "🛬",
      "theme": "arrival",
      "moodDescription": "O cansaço de 14 horas dissolve-se quando o skyline de Tokyo aparece à janela do táxi",
      "budgetEstimate": 85,
      "weather": {
        "avgTemp": "18°C",
        "condition": "Parcialmente nublado",
        "emoji": "⛅",
        "tip": "Leva uma camada leve para a noite"
      },
      "transport": {
        "mainMode": "Narita Express (N'EX)",
        "fromAirport": {
          "option": "Narita Express",
          "duration": "90 min",
          "cost": 30,
          "currency": "EUR",
          "tip": "Compra o Suica card antes de apanhar o comboio"
        },
        "dayCard": {
          "name": "Suica Card",
          "cost": 5,
          "note": "Carrega €30 — usa em metro, comboio e convenience stores"
        },
        "apps": ["Hyperdia", "Suica app"],
        "totalDayCost": 35
      },
      "periods": {
        "morning": {
          "label": "Manhã",
          "emoji": "🌅",
          "timeRange": "— em viagem —",
          "activities": []
        },
        "afternoon": {
          "label": "Tarde",
          "emoji": "☀️",
          "timeRange": "15:00 — 19:00",
          "activities": [
            {
              "id": "d1-af-1",
              "name": "Check-in & Exploração de Shinjuku",
              "type": "orientation",
              "emoji": "🏙️",
              "address": "Shinjuku, Tokyo",
              "coordinates": [35.6896, 139.6917],
              "startTime": "15:30",
              "duration": "2h 30m",
              "cost": 0,
              "currency": "EUR",
              "bookingRequired": false,
              "crowd": "high",
              "crowdTip": "Más horas: 17-19h (hora de ponta). Melhor: 15-17h",
              "insiderTip": "Explora a Golden Gai — 6 ruas com 200+ micro-bares. Não entres no primeiro que vês, caminha até ao fundo onde os locais vão",
              "skipIf": "Estás completamente esgotado — nesse caso vai directo ao hotel",
              "transportFromPrevious": {
                "mode": "🚃 Narita Express",
                "line": "JR Narita Express",
                "duration": "90 min",
                "cost": 30,
                "currency": "EUR",
                "directions": "Aeroporto Narita → Shinjuku Station"
              },
              "photoKeyword": "shinjuku neon night tokyo cityscape"
            }
          ]
        },
        "evening": {
          "label": "Noite",
          "emoji": "🌙",
          "timeRange": "19:00 — 23:00",
          "activities": [
            {
              "id": "d1-ev-1",
              "name": "Omoide Yokocho (Ruela da Memória)",
              "type": "food",
              "emoji": "🍢",
              "address": "1 Chome-2 Nishishinjuku, Shinjuku City, Tokyo",
              "coordinates": [35.6931, 139.6998],
              "startTime": "19:30",
              "duration": "1h 30m",
              "cost": 25,
              "currency": "EUR",
              "bookingRequired": false,
              "crowd": "high",
              "mustOrder": "Yakitori variado + Sapporo draft",
              "insiderTip": "Senta no balcão da tasca com mais fumo a sair — estão a grelhar ao momento. Cash only — ATM no 7-Eleven a 50m",
              "transportFromPrevious": {
                "mode": "🚶 A pé",
                "duration": "5 min",
                "cost": 0,
                "directions": "Hotel → Omoide Yokocho, saída oeste da Shinjuku Station"
              },
              "photoKeyword": "omoide yokocho yakitori smoke shinjuku"
            },
            {
              "id": "d1-ev-2",
              "name": "Observatório Tokyo Metropolitan Government",
              "type": "viewpoint",
              "emoji": "🌆",
              "address": "2-8-1 Nishishinjuku, Shinjuku City, Tokyo",
              "coordinates": [35.6896, 139.6921],
              "startTime": "21:00",
              "duration": "45 min",
              "cost": 0,
              "currency": "EUR",
              "bookingRequired": false,
              "crowd": "medium",
              "insiderTip": "GRÁTIS. Mesma vista que o Tokyo Skytree que custa €15. Abre até às 22:30. North Tower tem menos fila que South Tower.",
              "transportFromPrevious": {
                "mode": "🚶 A pé",
                "duration": "8 min",
                "cost": 0
              },
              "photoKeyword": "tokyo skyline night observation deck shinjuku"
            }
          ]
        }
      },
      "meals": {
        "breakfast": null,
        "lunch": {
          "name": "7-Eleven no Aeroporto Narita",
          "type": "convenience",
          "emoji": "🍙",
          "cost": 8,
          "mustOrder": "Onigiri de salmão + chá verde quente",
          "note": "Os onigiri japoneses são genuinamente bons — não é fast food, é cultura"
        },
        "dinner": {
          "name": "Omoide Yokocho",
          "cuisine": "Yakitori japonês",
          "emoji": "🍢",
          "priceRange": "€€",
          "cost": 25,
          "address": "1-2 Nishishinjuku, Shinjuku, Tokyo",
          "coordinates": [35.6931, 139.6998],
          "mustOrder": "Yakitori misto (negima, tsukune, kawa) + Sapporo",
          "bookingRequired": false,
          "openingHours": "17:00 — 00:00",
          "paymentNote": "Cash only. ATM no 7-Eleven ao lado.",
          "insiderNote": "Escolhe a tasca mais pequena e fumegante — as grandes viraram turísticas"
        }
      },
      "localSecret": "O observatório do Tokyo Metropolitan Government Building é completamente gratuito e fecha às 22:30 — tens a mesma vista do Skytree mas sem pagar os €15 de entrada.",
      "culturalNote": "Remove sempre os sapatos ao entrar em espaços com tatami. Nunca dês gorjeta — pode ser interpretado como insulto.",
      "packingForDay": ["Suica card carregado", "Yen em notas pequenas (muitos sítios só aceitam cash)", "Camada leve"],
      "emergencyInfo": {
        "policeNumber": "110",
        "ambulanceNumber": "119",
        "nearestHospital": "Tokyo Medical University Hospital (3km)",
        "embassyPT": "Embaixada de Portugal em Tokyo: +81-3-5212-7322"
      }
    }
  ],
  "packingList": {
    "essential": [
      "Adaptador tipo A/B (100V japonês — carregadores europeus funcionam mas verifica voltagem)",
      "Bolsa pequena de ombro (metros japoneses são lotados, mochila grande é problema)",
      "Carteira extra para yen em notas"
    ],
    "weatherSpecific": [
      "Camada leve para noites de Março/Abril",
      "Guarda-chuva compacto (chuva imprevisível)"
    ],
    "appsMustHave": [
      "App oficial/local de transportes para horarios recentes",
      "Google Translate — modo câmara para menus em japonês",
      "Tabelog — avaliações de restaurantes pelos locais",
      "Hyperdia — horários de comboios precisos"
    ],
    "doNotBring": [
      "Mala grande — os metros e ryokans não têm espaço",
      "Dinheiro em excesso à vista — é o país mais seguro do mundo mas não precisas"
    ]
  },
  "nearbyEscapes": [
    {
      "name": "Kyoto",
      "country": "Japan",
      "distance": "2h 15m de Shinkansen",
      "transportCost": 70,
      "currency": "EUR",
      "idealFor": "Cultura, templos, geishas, jardins zen",
      "addDays": 3,
      "mustSee": "Fushimi Inari ao nascer do sol, Arashiyama bamboo grove",
      "andorVerdict": "Vale MUITO a pena como extensão — é o oposto de Tokyo e complementa perfeitamente"
    },
    {
      "name": "Hakone",
      "country": "Japan",
      "distance": "1h 30m de comboio",
      "transportCost": 25,
      "currency": "EUR",
      "idealFor": "Vista do Monte Fuji, onsen, natureza",
      "addDays": 1,
      "tip": "Fica o dia todo — o Fuji aparece melhor de manhã cedo antes das nuvens"
    }
  ],
  "andorInsights": [
    "Tokyo tem mais estrelas Michelin do que qualquer outra cidade do mundo — e come-se excepcionalmente bem por €8 num ramen local sem estrelas",
    "O metro de Tokyo é intimidante ao primeiro olhar mas tem sinalização em inglês em toda a parte. Em 20 minutos já navegas com confiança",
    "As máquinas de venda automática vendem cerveja quente, sopa miso e ovos cozidos. São parte da cultura, não uma curiosidade — usa-as"
  ],
  "suggestions": [
    "Adicionar dia em Kyoto (+€70 transporte)?",
    "Versão mais económica do orçamento?",
    "Foco especial em gastronomia?"
  ]
}

CRITICAL RULES — NEVER BREAK THESE:

1. COORDINATE ACCURACY (MANDATORY):
Every coordinate must be geographically accurate for the destination.
Tokyo: lat 35.6-35.8, lng 139.5-139.9
Paris: lat 48.8-48.9, lng 2.2-2.5
Bali: lat -8.8 to -8.1, lng 114.9-115.7
London: lat 51.4-51.6, lng -0.3 to 0.1
NYC: lat 40.6-40.9, lng -74.1 to -73.7
Barcelona: lat 41.3-41.5, lng 2.0-2.3
Lisbon: lat 38.7-38.8, lng -9.2 to -9.0
Rome: lat 41.8-42.0, lng 12.4-12.6
Amsterdam: lat 52.3-52.4, lng 4.8-5.0
Bangkok: lat 13.6-13.9, lng 100.4-100.7
NEVER return zero-zero coordinates or coordinates from a different city.
If unsure of exact coordinates, omit them. Never place an activity at the city centroid.

2. UNIQUE DAY TITLES (MANDATORY):
DAY TITLES — ABSOLUTE RULE, NEVER BREAK:
Every day title must be unique, cinematic, and evocative.
It must make someone excited to live that specific day.
It must reference specific places or experiences from that day.
Required format: '[Atmospheric Hook]: [Specific Places & Moments]'

Examples of required quality:
- 'The City Wakes Up: Tsukiji at Dawn & Senso-ji in Silence'
- 'Neon Cathedrals: Shibuya Crossing & Harajuku After Dark'
- 'Ancient Kyoto Hiding Inside Modern Tokyo'
- 'Last Morning Light: Market Breakfast & Airport Farewell'

PERMANENTLY BANNED (never use these patterns):
- 'Explore [City]'
- 'Day [N] in [City]'
- 'Visit [City]'
- '[City] Day [N]'
- 'Discover [City]'
- Any title identical or similar to another day in the same itinerary
3. ITINERARY QUALITY:
- Day 1: always arrival + orientation + light exploration
- Max 3-4 major activities per day
- Group activities geographically — never backtrack
- Include travel-time and cost estimates only when labelled; omit values that cannot be supported
- Every day: morning coffee, lunch spot, activities, dinner, optional evening
- Vary pace: intense day followed by slower recovery day
- One hidden gem per day that guidebooks miss
- Flag everything needing advance booking

4. RESPONSE FORMAT:
Return ONLY valid JSON. No markdown wrapping. No explanation text outside JSON.`;

    const userPrompt = `Create a perfect ${days || 3}-day travel itinerary for ${destination}. 
Memory mode: ${memoryMode}. Do not use saved memory, previous itineraries, or canned examples. Treat this as a fresh request.
Budget tier/preference: ${budget || 'Confortável'}.${budgetPerDay > 0 ? ` Target Budget per day: ${budgetPerDay} EUR per person.` : ''}
Travelers: ${travelers || 2} (${travelerType}). 
Travel style/interests: ${style || 'cultural'}. Interests: ${interests?.join(', ') || 'general'}.
Trip pace: ${pace}. Budget includes flights: ${budgetIncludesFlights}.
Origin/departure city for flight and arrival assumptions: ${originCity || 'not specified'}.
Arrival window: ${arrivalTime || 'not specified'}.
Departure/last-day window: ${departureTime || 'not specified'}.
Must-see or must-do requests: ${mustSee.length > 0 ? mustSee.join('; ') : 'none specified'}.
Things to avoid: ${avoid.length > 0 ? avoid.join('; ') : 'none specified'}.
Authenticity vs icons preference: ${authenticityLevel}.
Walking tolerance: ${walkingLevel}. Food adventure level: ${foodAdventure}.
Family context: ${childrenAges ? `children ages around ${childrenAges}; walking tolerance ${kidsWalking}` : 'no specific children-age context'}.
Qualitative traveler personality:
- First instinct on arrival: ${personalityContext.arrivalInstinct || 'not specified'}
- Favorite travel memory type: ${personalityContext.memoryPreference || 'not specified'}
- Accommodation philosophy: ${personalityContext.hotelPreference || 'not specified'}
Use these qualitative answers to tune tone, pacing, neighborhoods, hotel tier, and hidden-gem choices. Do not treat them as rigid filters.
Constraints:
- Dietary restrictions: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(', ') : 'None'}. Make sure all recommended meals/restaurants accommodate these restrictions.
- Reduced mobility: ${mobilityReduced ? 'YES (Strict accessibility constraint. Only include wheelchair/mobility accessible activities, avoid steep hikes, long stairs, or excessive walking. Prioritize ground/accessible transport).' : 'No special mobility constraints.'}
- Transport preference: ${transportPreference === 'public' ? 'Prefer public transport with exact lines/passes.' : transportPreference === 'car' ? 'Prefer rent-a-car where useful; include parking/logistics.' : transportPreference === 'walk' ? 'Prefer walkable neighborhood clusters and short transfers.' : transportPreference === 'avoid flights' ? 'Prefer ground transport (trains, buses) over domestic flights.' : transportPreference === 'ground only' ? 'Strictly ground transport only.' : 'Any transport mode allowed.'}
- Location data: include addresses when useful, but do not promise live navigation or turn-by-turn directions.
- Images: every activity photoKeyword must be specific enough for image search: exact place + city + country + category. Never use just "travel", "landmark", "food", or a city name alone.
- Suggestions: return 3-5 chips that are natural next actions for this exact itinerary, e.g. neighbourhood swap, food upgrade, rainy-day version, child-friendly pacing, not generic "adjust itinerary".
- Booking-ready: include flight search strategy, hotel area/options, airport transfers, local transport, rental-car recommendation, restaurant reservation advice, documents, alerts, contingencies, and manual booking checklist items. Do not say anything is booked or confirmed.
- Client/company mode: if requested, use professional client-ready wording and include exportMetadata fields for client name, company name, prepared by, budget approval, booking status, client-facing notes, and internal notes.

Return ONLY valid JSON matching the exact requested schema.`;

    // Try real AI first (Groq Llama)
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const generationProfile = {
      travelerType,
      travelers,
      childrenAges,
      kidsWalking,
      dietaryRestrictions,
      mobilityReduced,
      transportPreference,
      budgetPerDay,
      budgetIncludesFlights,
      pace,
      originCity,
      arrivalTime,
      departureTime,
      mustSee,
      avoid,
      authenticityLevel,
      walkingLevel,
      foodAdventure,
      memoryMode,
      personalityContext,
    };

    if (Array.isArray(body.journey?.stages) && body.journey.stages.length > 1) {
      try {
        const itinerary = await generateMultiDestinationItinerary({
          journey: body.journey,
          totalDays: days,
          startDate: startDate || null,
          endDate: endDate || null,
          generationProfile,
          checkpoint: generationReservation?.checkpoint || null,
          generateStage: async ({ stage, allocatedDays, destination: stageDestination }) => {
            const stageLabel = stageDestination.displayName || stageDestination.canonicalName;
            const stageFallback = await generateDestinationAwareFallbackItinerary(
              stageLabel,
              allocatedDays,
              budget,
              {
                ...generationProfile,
                arrivalTime: stage.arrivalWindow,
                departureTime: stage.departureWindow,
              },
            );
            const stageDraft = stageFallback?.days?.length
              ? stageFallback
              : createPlanningPlaceholderStageItinerary(stageDestination, allocatedDays);
            return normalizeGeneratedItinerary(
              stageDraft,
              stageLabel,
              allocatedDays,
              generationProfile,
              stageDestination,
            );
          },
          onCheckpoint: async (checkpoint) => {
            if (!generationReservation) return;
            const saved = await checkpointGenerationRequest({
              requestId: generationReservation.requestId,
              leaseToken: generationReservation.leaseToken,
              checkpoint,
            }, generationIdentity);
            if (!saved.ok) {
              const error = new Error(`GENERATION_CHECKPOINT_${saved.status || 'FAILED'}`);
              error.code = saved.status;
              throw error;
            }
          },
        });
        return respondWithItinerary(itinerary, 'multi-destination');
      } catch (error) {
        logger.warn('generate_itinerary:multi_destination_failed', error, {
          stageCount: body.journey.stages.length,
          days,
        });
        await markGenerationFailed('multi_destination_generation_failed', true);
        return apiError(
          'MULTI_DESTINATION_GENERATION_FAILED',
          'NÃ£o foi possÃ­vel concluir todas as etapas. O progresso seguro foi mantido para nova tentativa.',
          503,
          true,
          { errors: error?.errors || [error?.code || error?.message || 'unknown'] },
        );
      }
    }

    if (!forceFallback && hasProviderKey(groqKey)) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: AI_MODELS.groq,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 3000,
            response_format: { type: 'json_object' },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          try {
            const parsed = JSON.parse(data.choices[0].message.content);
            const result = await normalizeGeneratedItinerary(
              parsed,
              destination,
              days,
              generationProfile,
              destinationEntity,
            );
            return respondWithItinerary(result, 'groq');
          } catch (e) {
            logger.warn('generate_itinerary:groq_parse_failed', e, { destination, days });
          }
        }
      } catch (e) {
        logger.warn('generate_itinerary:groq_provider_failed', e, { destination, days });
      }
    }

    if (!forceFallback && hasProviderKey(geminiKey)) {
      try {
        const { google } = await import('@ai-sdk/google');
        const { generateObject } = await import('ai');
        const { z } = await import('zod');

        const { object } = await generateObject({
          model: google(AI_MODELS.google),
          schema: z.object({
            destination: z.object({
              city: z.string(),
              country: z.string(),
              countryCode: z.string(),
              flag: z.string(),
              coordinates: z.array(z.number()),
              timezone: z.string(),
              currency: z.object({
                code: z.string(),
                symbol: z.string(),
                euroRate: z.number(),
                usdRate: z.number().optional()
              }),
              language: z.string(),
              bestMonths: z.array(z.string()),
              avoidMonths: z.array(z.string()),
              andorVerdict: z.string(),
              visaInfo: z.string(),
              healthInfo: z.string(),
              safetyLevel: z.string(),
              tippingCulture: z.string(),
              electricityPlug: z.string().optional(),
              simCard: z.string().optional()
            }),
            trip: z.object({
              totalDays: z.number(),
              travelStyle: z.string(),
              groupType: z.string(),
              budgetTier: z.string(),
              budgetBreakdown: z.object({
                flights: z.object({ min: z.number(), max: z.number(), currency: z.string(), note: z.string(), bookingWindow: z.string().optional() }),
                accommodation: z.object({ total: z.number(), perNight: z.number(), currency: z.string(), nights: z.number().optional() }),
                food: z.object({ total: z.number(), perDay: z.number(), currency: z.string(), note: z.string().optional() }),
                transport: z.object({ total: z.number(), currency: z.string(), note: z.string().optional() }),
                activities: z.object({ total: z.number(), currency: z.string(), note: z.string().optional() }),
                grandTotal: z.object({ min: z.number(), max: z.number(), currency: z.string(), perPerson: z.boolean(), includes: z.string().optional() })
              }),
              topTips: z.array(z.string())
            }),
            flightOptions: z.array(z.object({
              airline: z.string(),
              route: z.string(),
              totalDuration: z.string(),
              stops: z.number(),
              layover: z.string().optional(),
              estimatedPrice: z.object({
                economy: z.number(),
                premiumEconomy: z.number().optional(),
                business: z.number(),
                currency: z.string()
              }),
              bestBookingWindow: z.string().optional(),
              baggage: z.string().optional(),
              prosAndCons: z.string().optional(),
              badge: z.string(),
              skyscannerUrl: z.string()
            })),
            accommodation: z.object({
              recommended: z.object({
                name: z.string(),
                area: z.string(),
                stars: z.number(),
                pricePerNight: z.number(),
                currency: z.string(),
                coordinates: z.array(z.number()),
                address: z.string().optional(),
                whyHere: z.string(),
                bookingTip: z.string().optional(),
                bookingUrl: z.string().optional(),
                checkIn: z.string().optional(),
                checkOut: z.string().optional()
              }),
              budget: z.object({
                name: z.string(),
                pricePerNight: z.number(),
                type: z.string(),
                area: z.string(),
                whyHere: z.string().optional(),
                bookingUrl: z.string().optional()
              }),
              luxury: z.object({
                name: z.string(),
                pricePerNight: z.number(),
                type: z.string(),
                area: z.string(),
                whyHere: z.string().optional(),
                bookingUrl: z.string().optional()
              })
            }),
            days: z.array(z.object({
              dayNumber: z.number(),
              title: z.string(),
              theme: z.string(),
              emoji: z.string(),
              moodDescription: z.string(),
              budgetEstimate: z.number(),
              weather: z.object({ avgTemp: z.string(), condition: z.string(), emoji: z.string(), tip: z.string().optional() }),
              transport: z.object({
                mainMode: z.string().optional(),
                fromAirport: z.object({ option: z.string(), duration: z.string(), cost: z.number(), currency: z.string(), tip: z.string().optional() }).optional(),
                dayCard: z.object({ name: z.string(), cost: z.number(), note: z.string().optional() }).optional(),
                apps: z.array(z.string()),
                totalDayCost: z.number().optional()
              }),
              periods: z.object({
                morning: z.object({
                  label: z.string().optional(),
                  emoji: z.string().optional(),
                  timeRange: z.string(),
                  activities: z.array(z.object({
                    id: z.string().optional(),
                    name: z.string(),
                    type: z.string(),
                    emoji: z.string(),
                    address: z.string(),
                    coordinates: z.array(z.number()),
                    startTime: z.string().optional(),
                    duration: z.string(),
                    cost: z.number(),
                    currency: z.string().optional(),
                    bookingRequired: z.boolean(),
                    crowd: z.string(),
                    crowdTip: z.string().optional(),
                    insiderTip: z.string().optional(),
                    skipIf: z.string().optional(),
                    transportFromPrevious: z.object({
                      mode: z.string(),
                      line: z.string().optional(),
                      duration: z.string(),
                      cost: z.number(),
                      currency: z.string().optional(),
                      directions: z.string().optional()
                    }).optional(),
                    photoKeyword: z.string()
                  }))
                }),
                afternoon: z.object({
                  label: z.string().optional(),
                  emoji: z.string().optional(),
                  timeRange: z.string(),
                  activities: z.array(z.object({
                    id: z.string().optional(),
                    name: z.string(),
                    type: z.string(),
                    emoji: z.string(),
                    address: z.string(),
                    coordinates: z.array(z.number()),
                    startTime: z.string().optional(),
                    duration: z.string(),
                    cost: z.number(),
                    currency: z.string().optional(),
                    bookingRequired: z.boolean(),
                    crowd: z.string(),
                    crowdTip: z.string().optional(),
                    insiderTip: z.string().optional(),
                    skipIf: z.string().optional(),
                    transportFromPrevious: z.object({
                      mode: z.string(),
                      line: z.string().optional(),
                      duration: z.string(),
                      cost: z.number(),
                      currency: z.string().optional(),
                      directions: z.string().optional()
                    }).optional(),
                    photoKeyword: z.string()
                  }))
                }),
                evening: z.object({
                  label: z.string().optional(),
                  emoji: z.string().optional(),
                  timeRange: z.string(),
                  activities: z.array(z.object({
                    id: z.string().optional(),
                    name: z.string(),
                    type: z.string(),
                    emoji: z.string(),
                    address: z.string(),
                    coordinates: z.array(z.number()),
                    startTime: z.string().optional(),
                    duration: z.string(),
                    cost: z.number(),
                    currency: z.string().optional(),
                    bookingRequired: z.boolean(),
                    crowd: z.string(),
                    crowdTip: z.string().optional(),
                    insiderTip: z.string().optional(),
                    skipIf: z.string().optional(),
                    transportFromPrevious: z.object({
                      mode: z.string(),
                      line: z.string().optional(),
                      duration: z.string(),
                      cost: z.number(),
                      currency: z.string().optional(),
                      directions: z.string().optional()
                    }).optional(),
                    photoKeyword: z.string()
                  }))
                })
              }),
              meals: z.object({
                breakfast: z.object({ name: z.string(), type: z.string(), emoji: z.string().optional(), cost: z.number(), mustOrder: z.string().optional(), note: z.string().optional() }).nullable(),
                lunch: z.object({ name: z.string(), type: z.string(), emoji: z.string().optional(), cost: z.number(), mustOrder: z.string().optional(), note: z.string().optional() }).nullable(),
                dinner: z.object({
                  name: z.string(),
                  cuisine: z.string(),
                  emoji: z.string().optional(),
                  priceRange: z.string(),
                  cost: z.number(),
                  address: z.string().optional(),
                  coordinates: z.array(z.number()).optional(),
                  mustOrder: z.string().optional(),
                  bookingRequired: z.boolean(),
                  openingHours: z.string().optional(),
                  paymentNote: z.string().optional(),
                  insiderNote: z.string().optional()
                }).nullable()
              }),
              localSecret: z.string(),
              culturalNote: z.string(),
              dayHighlight: z.string().optional(),
              estimatedSteps: z.number().optional(),
              packingForDay: z.array(z.string()).optional(),
              emergencyInfo: z.object({
                policeNumber: z.string().optional(),
                ambulanceNumber: z.string().optional(),
                nearestHospital: z.string().optional(),
                embassyPT: z.string().optional()
              }).optional()
            })),
            packingList: z.object({
              essential: z.array(z.string()),
              weatherSpecific: z.array(z.string()),
              appsMustHave: z.array(z.string()),
              doNotBring: z.array(z.string())
            }),
            nearbyEscapes: z.array(z.object({
              name: z.string(),
              country: z.string().optional(),
              distance: z.string(),
              transportCost: z.number().optional(),
              currency: z.string().optional(),
              idealFor: z.string(),
              addDays: z.number(),
              mustSee: z.string().optional(),
              tip: z.string().optional(),
              andorVerdict: z.string().optional()
            })),
            andorInsights: z.array(z.string()),
            suggestions: z.array(z.string()).optional()
          }),
          prompt: `${systemPrompt}\n\n${userPrompt}`,
        });
        
        let result = await normalizeGeneratedItinerary(
          object,
          destination,
          days,
          generationProfile,
          destinationEntity,
        );
        const titleValidation = validateAllDayTitles(result);
        if (!titleValidation.valid) {
          // day title validation warnings, but continue
        }
        
        return respondWithItinerary(result, 'gemini');
      } catch (e) {
        logger.warn('generate_itinerary:gemini_provider_failed', e, { destination, days });
      }
    }

    // Demonstration fallback uses curated fixtures or real geocoded places only.
    const fallbackPreferences = {
      originCity,
      arrivalTime,
      departureTime,
      mustSee,
      avoid,
      authenticityLevel,
      walkingLevel,
      foodAdventure,
      pace,
      memoryMode,
    };
    let itinerary = await generateDestinationAwareFallbackItinerary(destination, days, budget, fallbackPreferences);
    if (!itinerary?.days?.length) {
      return apiError(
        'ITINERARY_DATA_UNAVAILABLE',
        'Não há dados suficientes para criar um roteiro responsável para este destino sem um fornecedor de IA ativo. Configura um fornecedor ou tenta outro destino.',
        503,
        true
      );
    }
    try {
      itinerary = await normalizeGeneratedItinerary(
        itinerary,
        destination,
        days,
        generationProfile,
        destinationEntity,
      );
    } catch (error) {
      logger.warn('generate_itinerary:fallback_normalization_failed', error, { destination, days });
      return apiError(
        'ITINERARY_DATA_INVALID',
        'Os dados disponÃ­veis nÃ£o permitem construir todos os dias pedidos com localizaÃ§Ãµes coerentes.',
        503,
        true,
      );
    }
    const validation = validateAndNormalize(itinerary, {
      expectedDays: days,
      requireDestinationCoordinate: true,
    });
    if (validation.fatal) {
      return apiError(
        'ITINERARY_DATA_INVALID',
        'Os dados disponíveis não permitem construir um roteiro com localizações válidas.',
        503,
        true
      );
    }
    return respondWithItinerary(validation.normalized || itinerary, 'fallback');

  } catch (error) {
    if (generationReservation?.requestId && generationReservation?.leaseToken && generationIdentity) {
      await failGenerationRequest({
        requestId: generationReservation.requestId,
        leaseToken: generationReservation.leaseToken,
        failureCode: 'generation_unhandled_error',
        retryable: true,
      }, generationIdentity).catch(() => null);
    }
    const errorId = logger.error('generate_itinerary:unhandled', error);
    return apiError(
      'ITINERARY_GENERATION_FAILED',
      'Não foi possível gerar o itinerário. Tenta novamente.',
      500,
      true,
      { errorId }
    );
  }
}
