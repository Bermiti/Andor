import { generateFallbackAdaptedDay } from '../../lib/fallback-adapt';
import { apiError, cleanInteger, cleanString, hasProviderKey, readJsonBody } from '../../lib/api-utils';
import { logger } from '../../lib/logger';
import { AI_MODELS } from '../../lib/server/ai-models';
import { geocodeServerSide } from '../../lib/geocoding';
import { verifyActivityCoordinates } from '../../lib/server/coordinate-verification';

async function finalizeRegeneratedDay(
  day,
  destination,
  { allowExistingVerifiedCoordinates = false, preferStops = false } = {},
) {
  if (!day || typeof day !== 'object') return day;
  const allStops = [];
  if (preferStops && Array.isArray(day.stops)) {
    day.stops.forEach((activity) => allStops.push(activity));
  } else {
    ['morning', 'afternoon', 'evening'].forEach((period) => {
      (day.periods?.[period]?.activities || []).forEach((activity) => {
        activity.period = period;
        allStops.push(activity);
      });
    });
  }

  await verifyActivityCoordinates(allStops, {
    destinationCity: destination,
    geocode: geocodeServerSide,
    allowExistingVerifiedCoordinates,
  });

  Object.values(day.meals || {}).forEach((meal) => {
    if (!meal || typeof meal !== 'object') return;
    meal.coordinates = null;
    meal.coordinateSource = 'unavailable';
  });

  day.stops = allStops;
  day.activities = allStops;
  return day;
}

export async function POST(req) {
  try {
    const body = await readJsonBody(req, 'regenerate_day');
    if (!body || typeof body !== 'object') {
      return apiError('MALFORMED_JSON', 'Pedido inválido. Tenta novamente.', 400, false);
    }
    const destination = cleanString(body.destination, 'Lisbon', 90);
    const dayNumber = cleanInteger(body.dayNumber, 1, 1, 14);
    const currentDay = body.currentDay && typeof body.currentDay === 'object' ? body.currentDay : {};
    const feedback = cleanString(body.feedback, '', 600);
    const tripContext = body.tripContext && typeof body.tripContext === 'object' ? body.tripContext : {};

    if (!feedback) {
      return apiError('FEEDBACK_REQUIRED', 'Escolhe ou escreve o que queres mudar neste dia.', 400, false);
    }

    const systemPrompt = `You are ANDOR — an elite AI travel agent.
You need to REGENERATE only ONE specific day of an itinerary, based on user feedback.

Destination: ${destination}
Day Number: ${dayNumber}
Current Day Data: ${JSON.stringify(currentDay)}
User Feedback on what to change: "${feedback}"
Trip Context: ${JSON.stringify({
  totalDays: cleanInteger(tripContext.totalDays, dayNumber, 1, 14),
  travelStyle: cleanString(tripContext.travelStyle, '', 80),
  groupType: cleanString(tripContext.groupType, '', 80),
  budget: cleanString(tripContext.budget, '', 120),
  existingDayTitles: Array.isArray(tripContext.existingDayTitles)
    ? tripContext.existingDayTitles.map((title) => cleanString(title, '', 120)).slice(0, 14)
    : [],
})}

CRITICAL INSTRUCTION:
- Regenerate ONLY this day. DO NOT return the full itinerary. DO NOT modify other days.
- Return ONLY the JSON object for this specific day.
- Never invent prices, ratings, schedules, opening hours, booking requirements, transport lines, or coordinates.
- Named venues are ai_proposal candidates. Mutable facts are null unless current provider data was supplied in this request.
- Return coordinates=null. The server resolves named places with a trusted geocoder after generation.
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
- Return ONLY valid JSON representing the new version of this day. Do not include markdown wraps or explanations.

Use this exact structure for the day object:
{
  "dayNumber": ${dayNumber},
  "title": "Evocative Day Title",
  "emoji": "☀️",
  "theme": "activity theme",
  "moodDescription": "Poetic description",
  "budgetEstimate": null,
  "weather": { "avgTemp": null, "condition": null, "emoji": "" },
  "transport": {
    "mainRecommendation": "Metro",
    "cost": null,
    "duration": null,
    "tip": "Verify the current route, fare, and accessibility with the transport provider",
    "dayPassRecommendation": null,
    "apps": []
  },
  "periods": {
    "morning": {
      "timeRange": "09:00 — 12:00",
      "activities": [
        {
          "id": "d${dayNumber}-am-1",
          "name": "Activity Name",
          "type": "culture|food|nature|etc",
          "emoji": "🏛️",
          "address": "Address",
          "coordinates": null,
          "duration": "2h",
          "cost": null,
          "crowd": "medium",
          "bookingRequired": null,
          "insiderTip": "Generated planning note; verify mutable details",
          "transportFromPrevious": { "mode": "Walk", "duration": null, "cost": null, "line": null },
          "photoKeyword": "unsplashtag"
        }
      ]
    },
    "afternoon": {
      "timeRange": "13:00 — 18:00",
      "activities": [
        {
          "id": "d${dayNumber}-af-1",
          "name": "Activity Name",
          "type": "culture|food|nature|etc",
          "emoji": "🏛️",
          "address": "Address",
          "coordinates": null,
          "duration": "2h",
          "cost": null,
          "crowd": "medium",
          "bookingRequired": null,
          "insiderTip": "Generated planning note; verify mutable details",
          "transportFromPrevious": { "mode": "Walk", "duration": null, "cost": null, "line": null },
          "photoKeyword": "unsplashtag"
        }
      ]
    },
    "evening": {
      "timeRange": "18:00 — 22:00",
      "activities": [
        {
          "id": "d${dayNumber}-ev-1",
          "name": "Activity Name",
          "type": "culture|food|nature|etc",
          "emoji": "🏛️",
          "address": "Address",
          "coordinates": null,
          "duration": "2h",
          "cost": null,
          "crowd": "medium",
          "bookingRequired": null,
          "insiderTip": "Generated planning note; verify mutable details",
          "transportFromPrevious": { "mode": "Walk", "duration": null, "cost": null, "line": null },
          "photoKeyword": "unsplashtag"
        }
      ]
    }
  },
  "meals": {
    "breakfast": { "name": "Cafe candidate", "type": "Breakfast", "cost": null, "note": "Verify menu and allergens" },
    "lunch": { "name": "Restaurant candidate", "type": "Lunch", "cost": null, "note": "Verify menu and allergens" },
    "dinner": { "name": "Restaurant candidate", "cuisine": "Cuisine", "priceRange": null, "cost": null, "address": "Candidate area", "coordinates": null, "mustOrder": "Dish category", "bookingRequired": null, "openingHours": null, "insiderNote": "Verify directly with the venue" }
  },
  "localSecret": "Generated planning note, not a claim about local preference",
  "culturalNote": "Check current official visitor guidance",
  "dayHighlight": "Highlight",
  "estimatedSteps": null,
  "packingForDay": ["Item 1"]
}`;

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (hasProviderKey(groqKey)) {
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
              { role: 'user', content: `Regenerate day ${dayNumber} according to constraints and user feedback.` }
            ],
            temperature: 0.7,
            max_tokens: 2000,
            response_format: { type: 'json_object' },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          try {
            const parsed = JSON.parse(data.choices[0].message.content);
            const verifiedDay = await finalizeRegeneratedDay(parsed, destination);
            return Response.json({ day: verifiedDay });
          } catch (e) {
            logger.warn('regenerate_day:groq_parse_failed', e, { destination, dayNumber });
          }
        }
      } catch (e) {
        logger.warn('regenerate_day:groq_provider_failed', e, { destination, dayNumber });
      }
    }

    if (hasProviderKey(geminiKey)) {
      try {
        const { google } = await import('@ai-sdk/google');
        const { generateObject } = await import('ai');
        const { z } = await import('zod');

        const { object } = await generateObject({
          model: google(AI_MODELS.google),
          schema: z.object({
            dayNumber: z.number(),
            title: z.string(),
            theme: z.string(),
            emoji: z.string(),
            moodDescription: z.string(),
            budgetEstimate: z.number().nullable(),
            weather: z.object({ avgTemp: z.string().nullable(), condition: z.string().nullable(), emoji: z.string() }),
            transport: z.object({ mainRecommendation: z.string(), cost: z.number().nullable(), duration: z.string().nullable(), tip: z.string(), dayPassRecommendation: z.string().nullable(), apps: z.array(z.string()) }),
            periods: z.object({
              morning: z.object({ timeRange: z.string(), activities: z.array(z.object({ name: z.string(), type: z.string(), emoji: z.string(), address: z.string(), coordinates: z.array(z.number()).nullable().optional(), duration: z.string(), cost: z.number().nullable(), crowd: z.string(), bookingRequired: z.boolean().nullable(), insiderTip: z.string(), transportFromPrevious: z.object({ mode: z.string(), duration: z.string().nullable(), cost: z.number().nullable(), line: z.string().nullable() }).optional(), photoKeyword: z.string() })) }),
              afternoon: z.object({ timeRange: z.string(), activities: z.array(z.object({ name: z.string(), type: z.string(), emoji: z.string(), address: z.string(), coordinates: z.array(z.number()).nullable().optional(), duration: z.string(), cost: z.number().nullable(), crowd: z.string(), bookingRequired: z.boolean().nullable(), insiderTip: z.string(), transportFromPrevious: z.object({ mode: z.string(), duration: z.string().nullable(), cost: z.number().nullable(), line: z.string().nullable() }).optional(), photoKeyword: z.string() })) }),
              evening: z.object({ timeRange: z.string(), activities: z.array(z.object({ name: z.string(), type: z.string(), emoji: z.string(), address: z.string(), coordinates: z.array(z.number()).nullable().optional(), duration: z.string(), cost: z.number().nullable(), crowd: z.string(), bookingRequired: z.boolean().nullable(), insiderTip: z.string(), transportFromPrevious: z.object({ mode: z.string(), duration: z.string().nullable(), cost: z.number().nullable(), line: z.string().nullable() }).optional(), photoKeyword: z.string() })) }),
            }),
            meals: z.object({
              breakfast: z.object({ name: z.string(), type: z.string(), cost: z.number().nullable(), note: z.string() }).nullable(),
              lunch: z.object({ name: z.string(), type: z.string(), cost: z.number().nullable(), note: z.string() }).nullable(),
              dinner: z.object({ name: z.string(), cuisine: z.string(), priceRange: z.string().nullable(), cost: z.number().nullable(), address: z.string(), coordinates: z.array(z.number()).nullable().optional(), mustOrder: z.string(), bookingRequired: z.boolean().nullable(), openingHours: z.string().nullable(), insiderNote: z.string() }).nullable()
            }),
            localSecret: z.string(),
            culturalNote: z.string(),
            dayHighlight: z.string(),
            estimatedSteps: z.number().nullable(),
            packingForDay: z.array(z.string())
          }),
          prompt: systemPrompt,
        });

        const verifiedDay = await finalizeRegeneratedDay(object, destination);
        return Response.json({ day: verifiedDay });
      } catch (e) {
        logger.warn('regenerate_day:gemini_provider_failed', e, { destination, dayNumber });
      }
    }

    // Offline fallback
    const totalDays = cleanInteger(tripContext.totalDays, dayNumber, 1, 14);
    const itineraryMock = {
      days: Array.from({ length: totalDays }, (_, index) => (
        index === dayNumber - 1 ? currentDay : { dayNumber: index + 1, title: `Day ${index + 1}`, stops: [] }
      )),
    };
    const activeDayIndex = dayNumber - 1;
    const fallbackDay = generateFallbackAdaptedDay(itineraryMock, activeDayIndex, feedback);
    const verifiedDay = await finalizeRegeneratedDay(fallbackDay, destination, {
      allowExistingVerifiedCoordinates: true,
      preferStops: true,
    });
    return Response.json({ day: verifiedDay });

  } catch (error) {
    const errorId = logger.error('regenerate_day:unhandled', error);
    return apiError('DAY_REGENERATION_FAILED', 'Não foi possível regenerar o dia. Tenta novamente.', 500, true, { errorId });
  }
}
