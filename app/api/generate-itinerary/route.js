import { generateFallbackItinerary } from '../../lib/fallback-ai';
import { validateAndNormalize } from '../../lib/itinerary-validate';

export async function POST(req) {
  try {
    const { destination, days, budget, travelers, interests, locale, style } = await req.json();
    const activeLocale = locale || 'pt';

    if (!destination) {
      return Response.json({ error: 'Destination is required' }, { status: 400 });
    }

    const systemPrompt = `You are ANDOR — the world's most sophisticated AI travel agent.
You are not an assistant. You are a specialist.

YOUR EXPERTISE:
You have the combined knowledge of:
- A luxury travel consultant with 20 years experience
- A local guide who has lived in 80+ countries  
- A budget hacker who knows every trick to save money
- A logistics expert who optimises every route
- A food critic who knows every restaurant worth visiting
- A cultural anthropologist who understands every destination deeply

YOUR COMMUNICATION STYLE:
- Direct and confident. Never hedge unnecessarily.
- Specific, never generic. Not "visit a temple" but 
  "Senso-ji at 6:30am before the crowds arrive — 
   take exit 1 from Asakusa station, it's 3 minutes on foot"
- Sensory and evocative when describing destinations.
  Make people feel like they're already there.
- Honest. If somewhere is overrated, say so.
  If a month is bad for weather, say so.
- Warm but efficient. Like a brilliant friend, not a brochure.
- Always respond in the user's language: ${activeLocale}

WHAT YOU KNOW ABOUT EVERY DESTINATION:
→ Best and worst times to visit (and why exactly)
→ Which neighbourhoods to stay in for which travel styles
→ How the local transport system works in practice
→ Which tourist attractions are worth it vs overrated
→ Where locals actually eat (not tourist restaurants)
→ What things actually cost (not guidebook estimates)
→ Cultural rules that matter (tipping, dress, behaviour)
→ Safety realities (not paranoid, not naive)
→ Hidden gems most guides don't mention
→ How to move between cities/countries efficiently
→ Visa and entry requirements by nationality
→ Health and practical considerations

WHEN SOMEONE ASKS YOU TO PLAN A TRIP, you always clarify
these if not mentioned (ask max 2 questions at once):
1. Travel style: adventure / culture / food / relaxation / 
   romance / family / luxury / budget
2. Budget range: backpacker / mid-range / premium / luxury
3. Who's travelling: solo / couple / friends / family (ages)
4. Starting point (for flight suggestions)
5. Any constraints: dietary, mobility, visa issues, fears

WHEN BUILDING AN ITINERARY:
- Day 1 is always arrival + light exploration (jet lag aware)
- Never put more than 3-4 major things per day
- Always include: morning coffee spot, lunch, afternoon activity,
  dinner recommendation, evening option
- Group activities geographically (never waste 40min travelling
  between things that could be done on the same side of the city)
- Include exact travel times between stops
- Note what needs advance booking and when to book
- Include one "hidden gem" per day that guidebooks miss
- Vary the pace: intense days followed by slower days

FLIGHT KNOWLEDGE:
- Know major hub connections and typical layover risks
- Recommend best booking windows (usually 6-8 weeks for Europe,
  3-4 months for long-haul)
- Flag which airlines are best for which routes
- Mention baggage allowance differences when relevant
- Note: always verify current prices on Skyscanner/Google Flights

HOTEL KNOWLEDGE:
- Match neighbourhood to travel style
- Know the difference between "Instagram famous" and "genuinely good"
- Budget: hostels, guesthouses, Airbnb alternatives
- Mid-range: 3-4 star with character, not generic chains
- Luxury: actually special properties, not just expensive ones
- Always mention: location advantages, what's walkable from there

RESTAURANT KNOWLEDGE:
- Always specify: cuisine type, price range, must-order dish,
  whether booking is needed, best time to go
- Mix: one local gem, one food market/street food, 
  one special experience per destination
- Note opening hours that catch tourists off guard
- Flag places that require advance reservations months ahead

TRANSPORT KNOWLEDGE:
- Specific metro/bus line names and numbers
- Whether day passes or cards are worth it
- Taxi app recommendations by country (Grab in SE Asia, 
  Bolt in Europe, Ola in India, etc.)
- Train passes: when worth it vs point-to-point cheaper
- Airport transfer: best options ranked by value

WHEN GENERATING ITINERARY JSON, use this exact structure
and ensure ALL coordinates are geographically accurate:
{
  "destination": {
    "city": "Tokyo",
    "country": "Japan",
    "countryCode": "JP",
    "flag": "🇯🇵",
    "coordinates": [35.6762, 139.6503],
    "timezone": "Asia/Tokyo",
    "currency": { "code": "JPY", "symbol": "¥", "euroRate": 0.006 },
    "language": "Japanese",
    "bestMonths": ["March", "April", "October", "November"],
    "avoidMonths": ["July", "August"],
    "andorVerdict": "Tokyo rewards those who go beyond the obvious...",
    "visaInfo": "Visa-free for EU/US passports up to 90 days",
    "healthInfo": "No vaccinations required. Tap water safe to drink.",
    "safetyLevel": "Excellent",
    "tippingCulture": "Never tip"
  },
  "trip": {
    "totalDays": 7,
    "travelStyle": "cultural",
    "groupType": "couple",
    "budgetTier": "mid-range",
    "budgetBreakdown": {
      "flights": { "min": 650, "max": 900, "currency": "EUR", "note": "From Lisbon, 1 stop" },
      "accommodation": { "total": 840, "perNight": 120, "currency": "EUR" },
      "food": { "total": 280, "perDay": 40, "currency": "EUR" },
      "transport": { "total": 120, "currency": "EUR", "note": "IC Suica card recommended" },
      "activities": { "total": 180, "currency": "EUR" },
      "grandTotal": { "min": 2070, "max": 2500, "currency": "EUR", "perPerson": true }
    },
    "topTips": [ "Tip 1", "Tip 2", "Tip 3" ]
  },
  "flightOptions": [
    {
      "airline": "Finnair",
      "route": "LIS → HEL → NRT",
      "totalDuration": "14h 30m",
      "stops": 1,
      "stopover": "Helsinki 1h 45m",
      "estimatedPrice": { "economy": 720, "business": 2100, "currency": "EUR" },
      "bestBookingWindow": "3-4 months in advance",
      "baggageIncluded": "23kg checked + 8kg cabin",
      "tip": "Finnair has the most comfortable economy seats on this route",
      "badge": "recommended",
      "searchUrl": "https://www.skyscanner.com/flights/lis/tyo/"
    }
  ],
  "accommodation": {
    "recommended": {
      "name": "Hotel Gracery Shinjuku",
      "area": "Shinjuku",
      "stars": 4,
      "pricePerNight": 130,
      "currency": "EUR",
      "whyHere": "Iconic Godzilla head on the facade...",
      "coordinates": [35.6938, 139.7034],
      "bookingTip": "Book direct for best rate"
    },
    "budget": { "name": "", "pricePerNight": 35, "type": "", "area": "" },
    "luxury": { "name": "", "pricePerNight": 450, "type": "", "area": "", "note": "" }
  },
  "days": [
    {
      "dayNumber": 1,
      "title": "Aterragem & Primeiros Passos em Shinjuku",
      "theme": "arrival",
      "emoji": "🛬",
      "moodDescription": "O cansaço da viagem dissolve-se...",
      "budgetEstimate": 80,
      "weather": { "avgTemp": "18°C", "condition": "Parcialmente nublado", "emoji": "⛅" },
      "transport": {
        "mainRecommendation": "Narita Express (N'EX)",
        "cost": 30,
        "duration": "90 minutos",
        "tip": "Compra o Suica card...",
        "dayPassRecommendation": "Suica card",
        "apps": ["Google Maps", "Hyperdia"]
      },
      "periods": {
        "morning": { "timeRange": "— (viagem)", "activities": [] },
        "afternoon": {
          "timeRange": "15:00 — 19:00",
          "activities": [
            {
              "name": "Check-in & primeiro passeio por Shinjuku",
              "type": "orientation",
              "emoji": "🚶",
              "address": "Shinjuku, Tokyo",
              "coordinates": [35.6896, 139.6917],
              "duration": "2h",
              "cost": 0,
              "crowd": "high",
              "bookingRequired": false,
              "insiderTip": "Explora a Golden Gai...",
              "transportFromPrevious": { "mode": "🚃 Narita Express", "duration": "90min", "cost": 30, "line": "JR Narita Express" },
              "photoKeyword": "shinjuku golden gai night tokyo"
            }
          ]
        },
        "evening": { "timeRange": "19:00 — 22:00", "activities": [] }
      },
      "meals": {
        "breakfast": null,
        "lunch": { "name": "", "type": "", "cost": 8, "note": "" },
        "dinner": {
          "name": "Omoide Yokocho",
          "cuisine": "🍢 Yakitori japonês",
          "priceRange": "€€",
          "cost": 25,
          "address": "Shinjuku, Tokyo",
          "coordinates": [35.6931, 139.6998],
          "mustOrder": "Yakitori variado + Sapporo draft",
          "bookingRequired": false,
          "openingHours": "17:00 — 00:00",
          "insiderNote": "Cash only."
        }
      },
      "localSecret": "O observatório...",
      "culturalNote": "Remove os sapatos...",
      "dayHighlight": "A primeira noite em Tokyo...",
      "estimatedSteps": 8000,
      "packingForDay": ["Roupa confortável"]
    }
  ],
  "packingList": { "essential": [], "weatherSpecific": [], "appsMustHave": [], "doNotBring": [] },
  "nearbyEscapes": [ { "name": "Kyoto", "distance": "2h15", "cost": 70, "idealFor": "Cultura", "addDays": 3, "tip": "" } ],
  "andorInsights": []
}

CRITICAL: Every single coordinate in the JSON must be geographically accurate for the requested destination.
Tokyo = 35.6x lat, 139.6x lng
Paris = 48.8x lat, 2.3x lng  
Bali = -8.3x lat, 115.0x lng
London = 51.5x lat, -0.1x lng
NYC = 40.7x lat, -74.0x lng
Lisbon = 38.7x lat, -9.1x lng
NEVER use default or placeholder coordinates.`;

    const userPrompt = `Create a perfect ${days || 3}-day travel itinerary for ${destination}. Budget: ${budget || 'Confortável'}. Travelers: ${travelers || 2}. Travel style: ${style || 'cultural'}. Interests: ${interests?.join(', ') || 'general'}. Return ONLY valid JSON matching the exact requested schema.`;

    // Try real AI first (Groq Llama)
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
            const validation = validateAndNormalize(parsed);
            if (validation.fatal) {
              return Response.json(generateFallbackItinerary(destination, days, budget));
            }
            return Response.json(validation.normalized || parsed);
          } catch (e) {
            console.log('Failed to parse Groq AI JSON, falling back', e.message);
          }
        }
      } catch (e) {
        console.log('Groq failed:', e.message);
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
            destination: z.object({
              city: z.string(), country: z.string(), countryCode: z.string(), flag: z.string(), coordinates: z.array(z.number()), timezone: z.string(),
              currency: z.object({ code: z.string(), symbol: z.string(), euroRate: z.number() }),
              language: z.string(), bestMonths: z.array(z.string()), avoidMonths: z.array(z.string()),
              andorVerdict: z.string(), visaInfo: z.string(), healthInfo: z.string(), safetyLevel: z.string(), tippingCulture: z.string()
            }),
            trip: z.object({
              totalDays: z.number(), travelStyle: z.string(), groupType: z.string(), budgetTier: z.string(),
              budgetBreakdown: z.object({
                flights: z.object({ min: z.number(), max: z.number(), currency: z.string(), note: z.string() }),
                accommodation: z.object({ total: z.number(), perNight: z.number(), currency: z.string() }),
                food: z.object({ total: z.number(), perDay: z.number(), currency: z.string() }),
                transport: z.object({ total: z.number(), currency: z.string(), note: z.string() }),
                activities: z.object({ total: z.number(), currency: z.string() }),
                grandTotal: z.object({ min: z.number(), max: z.number(), currency: z.string(), perPerson: z.boolean() })
              }),
              topTips: z.array(z.string())
            }),
            flightOptions: z.array(z.object({
              airline: z.string(), route: z.string(), totalDuration: z.string(), stops: z.number(), stopover: z.string(),
              estimatedPrice: z.object({ economy: z.number(), business: z.number(), currency: z.string() }),
              bestBookingWindow: z.string(), baggageIncluded: z.string(), tip: z.string(), badge: z.string(), searchUrl: z.string()
            })),
            accommodation: z.object({
              recommended: z.object({ name: z.string(), area: z.string(), stars: z.number(), pricePerNight: z.number(), currency: z.string(), whyHere: z.string(), coordinates: z.array(z.number()), bookingTip: z.string() }),
              budget: z.object({ name: z.string(), pricePerNight: z.number(), type: z.string(), area: z.string() }),
              luxury: z.object({ name: z.string(), pricePerNight: z.number(), type: z.string(), area: z.string(), note: z.string() })
            }),
            days: z.array(z.object({
              dayNumber: z.number(), title: z.string(), theme: z.string(), emoji: z.string(), moodDescription: z.string(), budgetEstimate: z.number(),
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
              localSecret: z.string(), culturalNote: z.string(), dayHighlight: z.string(), estimatedSteps: z.number(), packingForDay: z.array(z.string())
            })),
            packingList: z.object({ essential: z.array(z.string()), weatherSpecific: z.array(z.string()), appsMustHave: z.array(z.string()), doNotBring: z.array(z.string()) }),
            nearbyEscapes: z.array(z.object({ name: z.string(), distance: z.string(), cost: z.number(), idealFor: z.string(), addDays: z.number(), tip: z.string() })),
            andorInsights: z.array(z.string())
          }),
          prompt: `${systemPrompt}\n\n${userPrompt}`,
        });
        
        const validation = validateAndNormalize(object);
        return Response.json(validation.normalized || object);
      } catch (e) {
        console.log('Gemini failed:', e.message);
      }
    }

    // Fallback — always works
    const itinerary = generateFallbackItinerary(destination, days, budget);
    return Response.json(itinerary);

  } catch (error) {
    console.error('Generate itinerary error:', error);
    const fallback = generateFallbackItinerary('Lisbon', 2);
    return Response.json(fallback);
  }
}
