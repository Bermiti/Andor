import { NextResponse } from 'next/server';
import { readJsonBody, apiError } from '../../lib/api-utils';
import { enrichActivityData, enrichRestaurantsData, enrichTransportData } from '../../lib/enrichment-services';

export async function POST(req) {
  try {
    const body = await readJsonBody(req, 'enrich_itinerary');
    if (!body || !body.itinerary) {
      return apiError('MALFORMED_JSON', 'Falta o objeto "itinerary" no corpo do pedido.', 400, false);
    }

    if (process.env.ANDOR_DISABLE_EXTERNAL_ENRICHMENT === '1') {
      return NextResponse.json({
        enriched: false,
        source: 'external-enrichment-disabled',
        days: body.itinerary.days || [],
        transport: null,
        accommodation: null,
      });
    }

    const { itinerary } = body;
    const destinationCity = itinerary.destination?.city || itinerary.destination?.name || '';
    const country = itinerary.destination?.country || '';
    const startDate = itinerary.trip?.startDate || '';

    // Create shallow copies to mutate during enrichment
    const enrichedDays = JSON.parse(JSON.stringify(itinerary.days || []));

    // Parallel enrichment of activities and restaurants per day
    const dayEnrichments = enrichedDays.map(async (day, dayIndex) => {
      // 1. Enrich activities in periods (morning, afternoon, evening)
      const periods = ['morning', 'afternoon', 'evening'];
      for (const period of periods) {
        if (day.periods?.[period]?.activities) {
          const activities = day.periods[period].activities;
          for (const act of activities) {
            try {
              const enrichedAct = await enrichActivityData(act.name, destinationCity, country);
              act.description = enrichedAct.description || act.description;
              act.hours = enrichedAct.hours || act.hours;
              act.cost = act.cost ?? enrichedAct.fee;
              if (enrichedAct.thumbnail) {
                act.photo = enrichedAct.thumbnail;
              }
              act.wikipediaUrl = enrichedAct.wikipediaUrl;
              act.enrichmentSource = enrichedAct.source;
              act.enriched = true;
            } catch (err) {
              console.error(`Failed to enrich activity ${act.name}:`, err);
            }
          }
        }
      }

      // Also enrich stops list if it exists (legacy/flat representation)
      if (day.stops) {
        for (const stop of day.stops) {
          try {
            const enrichedStop = await enrichActivityData(stop.name, destinationCity, country);
            stop.description = enrichedStop.description || stop.description;
            stop.hours = enrichedStop.hours || stop.hours;
            stop.cost = stop.cost ?? enrichedStop.fee;
            if (enrichedStop.thumbnail) {
              stop.photo = enrichedStop.thumbnail;
            }
            stop.wikipediaUrl = enrichedStop.wikipediaUrl;
            stop.enrichmentSource = enrichedStop.source;
            stop.enriched = true;
          } catch (err) {
            console.error(`Failed to enrich stop ${stop.name}:`, err);
          }
        }
      }

      const coordinates = day.stops?.[0]?.coordinates || itinerary.destination?.coordinates;
      const lat = Array.isArray(coordinates) ? coordinates[0] : coordinates?.lat ?? coordinates?.latitude;
      const lng = Array.isArray(coordinates) ? coordinates[1] : coordinates?.lng ?? coordinates?.lon ?? coordinates?.longitude;

      try {
        const restaurants = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
          ? await enrichRestaurantsData(Number(lat), Number(lng), destinationCity)
          : [];
        day.enrichedRestaurants = restaurants;
      } catch (err) {
        console.error(`Failed to enrich restaurants for day ${dayIndex + 1}:`, err);
        day.enrichedRestaurants = [];
      }

      return day;
    });

    // 3. Enrich transport flights
    let transportResult = null;
    try {
      const fromCity = body.preferences?.departureCity || '';
      transportResult = await enrichTransportData(fromCity, destinationCity, startDate);
    } catch (err) {
      console.error('Failed to enrich transport:', err);
    }

    // Wait for all days to finish enriching
    await Promise.all(dayEnrichments);

    return NextResponse.json({
      enriched: true,
      days: enrichedDays,
      transport: transportResult,
      accommodation: null,
    });
  } catch (error) {
    console.error('Enrichment route error:', error);
    return apiError('ENRICHMENT_FAILED', 'Erro ao enriquecer o itinerário com dados reais.', 500, true);
  }
}
