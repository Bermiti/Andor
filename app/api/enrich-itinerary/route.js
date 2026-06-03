import { NextResponse } from 'next/server';
import { readJsonBody, apiError } from '../../lib/api-utils';
import { enrichActivityData, enrichRestaurantsData, enrichTransportData } from '../../lib/enrichment-services';

export async function POST(req) {
  try {
    const body = await readJsonBody(req, 'enrich_itinerary');
    if (!body || !body.itinerary) {
      return apiError('MALFORMED_JSON', 'Falta o objeto "itinerary" no corpo do pedido.', 400, false);
    }

    const { itinerary } = body;
    const destinationCity = itinerary.destination?.city || itinerary.destination?.name || 'Lisboa';
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
              act.hours = enrichedAct.hours || act.hours || '09:00 - 18:00';
              act.cost = act.cost ?? (enrichedAct.fee || 0);
              act.rating = enrichedAct.rating || act.rating || 4.5;
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
            stop.hours = enrichedStop.hours || stop.hours || '09:00 - 18:00';
            stop.cost = stop.cost ?? (enrichedStop.fee || 0);
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

      // 2. Enrich restaurants for lunch/dinner using day coordinates
      // Default to city center coordinates if not specified
      const lat = day.stops?.[0]?.coordinates?.[0] || itinerary.destination?.coordinates?.[0] || 38.7223;
      const lng = day.stops?.[0]?.coordinates?.[1] || itinerary.destination?.coordinates?.[1] || -9.1393;

      try {
        const restaurants = await enrichRestaurantsData(lat, lng, destinationCity);
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
      const fromCity = body.preferences?.departureCity || 'Lisboa';
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
      accommodation: {
        recommendedArea: 'Centro da Cidade',
        whyRecommended: 'Excelente acesso a transportes e proximidade a pé para a maioria das atrações sugeridas.',
        hotels: [
          { name: 'Andor Boutique Stay', stars: 4, rating: 9.2, pricePerNight: '€95', description: 'Boutique hotel charmoso com pequeno-almoço artesanal incluído.', source: 'estimated' },
          { name: 'City Center Hostel', stars: 3, rating: 8.8, pricePerNight: '€35', description: 'Design hostel limpo e moderno, ideal para viajantes individuais e jovens casais.', source: 'estimated' },
          { name: 'The Grand Palace Hotel', stars: 5, rating: 9.6, pricePerNight: '€220', description: 'Estadia de luxo com spa completo, bar no rooftop e vistas deslumbrantes.', source: 'estimated' }
        ]
      }
    });
  } catch (error) {
    console.error('Enrichment route error:', error);
    return apiError('ENRICHMENT_FAILED', 'Erro ao enriquecer o itinerário com dados reais.', 500, true);
  }
}
