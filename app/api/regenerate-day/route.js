import { generateFallbackAdaptedDay } from '../../lib/fallback-adapt';

export async function POST(req) {
  try {
    const { destination, dayNumber, currentDay, feedback, allDays } = await req.json();

    if (!feedback) {
      return Response.json({ error: 'Feedback is required' }, { status: 400 });
    }

    const systemPrompt = `You are ANDOR — an elite AI travel agent.
You need to REGENERATE only ONE specific day of an itinerary, based on user feedback.

Destination: ${destination}
Day Number: ${dayNumber}
Current Day Data: ${JSON.stringify(currentDay)}
User Feedback on what to change: "${feedback}"
Total Itinerary Days Context: ${JSON.stringify(allDays.map(d => ({ dayNumber: d.dayNumber, title: d.title })))}

CRITICAL INSTRUCTION:
- Regenerate ONLY this day. DO NOT return the full itinerary. DO NOT modify other days.
- Return ONLY the JSON object for this specific day.
- Make sure coordinates are geographically accurate.
- Day title MUST be highly unique, cinematic, and story-driven.
  FORBIDDEN: "Explore Tokyo", "Day in Paris", "Visit Bali"
  REQUIRED: "Neon Cathedrals: Shibuya Crossing", "Ancient Kyoto at Dawn", "Cliffside Sunsets in Santorini"
- Ban all generic titles.
- Return ONLY valid JSON representing the new version of this day. Do not include markdown wraps or explanations.

Use this exact structure for the day object:
{
  "dayNumber": ${dayNumber},
  "title": "Evocative Day Title",
  "emoji": "☀️",
  "theme": "activity theme",
  "moodDescription": "Poetic description",
  "budgetEstimate": 85,
  "weather": { "avgTemp": "18°C", "condition": "Sunny", "emoji": "☀️" },
  "transport": {
    "mainRecommendation": "Metro",
    "cost": 5,
    "duration": "20 mins",
    "tip": "Useful tip",
    "dayPassRecommendation": "24h Pass",
    "apps": ["Google Maps"]
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
          "coordinates": [lat, lng],
          "duration": "2h",
          "cost": 10,
          "crowd": "medium",
          "bookingRequired": false,
          "insiderTip": "Insider tip",
          "transportFromPrevious": { "mode": "Walk", "duration": "10min", "cost": 0, "line": "" },
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
          "coordinates": [lat, lng],
          "duration": "2h",
          "cost": 10,
          "crowd": "medium",
          "bookingRequired": false,
          "insiderTip": "Insider tip",
          "transportFromPrevious": { "mode": "Walk", "duration": "10min", "cost": 0, "line": "" },
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
          "coordinates": [lat, lng],
          "duration": "2h",
          "cost": 10,
          "crowd": "medium",
          "bookingRequired": false,
          "insiderTip": "Insider tip",
          "transportFromPrevious": { "mode": "Walk", "duration": "10min", "cost": 0, "line": "" },
          "photoKeyword": "unsplashtag"
        }
      ]
    }
  },
  "meals": {
    "breakfast": { "name": "Cafe Name", "type": "Breakfast", "cost": 5, "note": "Order this" },
    "lunch": { "name": "Restaurant Name", "type": "Lunch", "cost": 15, "note": "Order this" },
    "dinner": { "name": "Restaurant Name", "cuisine": "Cuisine", "priceRange": "€€", "cost": 25, "address": "Address", "coordinates": [lat, lng], "mustOrder": "Must order", "bookingRequired": false, "openingHours": "18:00 - 22:00", "insiderNote": "Tip" }
  },
  "localSecret": "Secret",
  "culturalNote": "Note",
  "dayHighlight": "Highlight",
  "estimatedSteps": 10000,
  "packingForDay": ["Item 1"]
}`;

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (groqKey && groqKey !== 'cola_aqui_a_tua_chave') {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
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
            if (parsed.periods) {
              const allStops = [];
              ['morning', 'afternoon', 'evening'].forEach(p => {
                if (parsed.periods[p]?.activities) {
                  parsed.periods[p].activities.forEach(act => {
                    act.period = p;
                    allStops.push(act);
                  });
                }
              });
              parsed.stops = allStops;
              parsed.activities = allStops;
            }
            return Response.json({ day: parsed });
          } catch (e) {
            // parse error fallback
          }
        }
      } catch (e) {
        // groq failed
      }
    }

    if (geminiKey && geminiKey !== 'cola_aqui_a_tua_chave_gemini') {
      try {
        const { google } = await import('@ai-sdk/google');
        const { generateObject } = await import('ai');
        const { z } = await import('zod');

        const { object } = await generateObject({
          model: google('gemini-1.5-pro'),
          schema: z.object({
            dayNumber: z.number(),
            title: z.string(),
            theme: z.string(),
            emoji: z.string(),
            moodDescription: z.string(),
            budgetEstimate: z.number(),
            weather: z.object({ avgTemp: z.string(), condition: z.string(), emoji: z.string() }),
            transport: z.object({ mainRecommendation: z.string(), cost: z.number(), duration: z.string(), tip: z.string(), dayPassRecommendation: z.string(), apps: z.array(z.string()) }),
            periods: z.object({
              morning: z.object({ timeRange: z.string(), activities: z.array(z.object({ name: z.string(), type: z.string(), emoji: z.string(), address: z.string(), coordinates: z.array(z.number()), duration: z.string(), cost: z.number(), crowd: z.string(), bookingRequired: z.boolean(), insiderTip: z.string(), transportFromPrevious: z.object({ mode: z.string(), duration: z.string(), cost: z.number(), line: z.string() }).optional(), photoKeyword: z.string() })) }),
              afternoon: z.object({ timeRange: z.string(), activities: z.array(z.object({ name: z.string(), type: z.string(), emoji: z.string(), address: z.string(), coordinates: z.array(z.number()), duration: z.string(), cost: z.number(), crowd: z.string(), bookingRequired: z.boolean(), insiderTip: z.string(), transportFromPrevious: z.object({ mode: z.string(), duration: z.string(), cost: z.number(), line: z.string() }).optional(), photoKeyword: z.string() })) }),
              evening: z.object({ timeRange: z.string(), activities: z.array(z.object({ name: z.string(), type: z.string(), emoji: z.string(), address: z.string(), coordinates: z.array(z.number()), duration: z.string(), cost: z.number(), crowd: z.string(), bookingRequired: z.boolean(), insiderTip: z.string(), transportFromPrevious: z.object({ mode: z.string(), duration: z.string(), cost: z.number(), line: z.string() }).optional(), photoKeyword: z.string() })) }),
            }),
            meals: z.object({
              breakfast: z.object({ name: z.string(), type: z.string(), cost: z.number(), note: z.string() }).nullable(),
              lunch: z.object({ name: z.string(), type: z.string(), cost: z.number(), note: z.string() }).nullable(),
              dinner: z.object({ name: z.string(), cuisine: z.string(), priceRange: z.string(), cost: z.number(), address: z.string(), coordinates: z.array(z.number()), mustOrder: z.string(), bookingRequired: z.boolean(), openingHours: z.string(), insiderNote: z.string() }).nullable()
            }),
            localSecret: z.string(),
            culturalNote: z.string(),
            dayHighlight: z.string(),
            estimatedSteps: z.number(),
            packingForDay: z.array(z.string())
          }),
          prompt: systemPrompt,
        });

        if (object.periods) {
          const allStops = [];
          ['morning', 'afternoon', 'evening'].forEach(p => {
            if (object.periods[p]?.activities) {
              object.periods[p].activities.forEach(act => {
                act.period = p;
                allStops.push(act);
              });
            }
          });
          object.stops = allStops;
          object.activities = allStops;
        }

        return Response.json({ day: object });
      } catch (e) {
        // gemini failed
      }
    }

    // Offline fallback
    const itineraryMock = { days: allDays };
    const activeDayIndex = dayNumber - 1;
    const fallbackDay = generateFallbackAdaptedDay(itineraryMock, activeDayIndex, feedback);
    return Response.json({ day: fallbackDay });

  } catch (error) {
    return Response.json({ error: 'Failed to regenerate day' }, { status: 500 });
  }
}
