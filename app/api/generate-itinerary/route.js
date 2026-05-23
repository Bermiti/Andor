import { generateFallbackItinerary } from '../../lib/fallback-ai';
import { validateAndNormalize } from '../../lib/itinerary-validate';
import { validateItinerary } from '../../lib/itinerary-schema';
import PHASE11_ENHANCED_SYSTEM_PROMPT from '../../lib/phase11-2-enhanced-prompt';
import { validateAndFixCoordinates } from '../../lib/coordinate-validator';
import { validateAllDayTitles, isBannedDayTitle } from '../../lib/day-title-validator';

export async function POST(req) {
  try {
    const { destination, days, budget, travelers, interests, locale, style } = await req.json();
    const activeLocale = locale || 'pt';

    if (!destination) {
      return Response.json({ error: 'Destination is required' }, { status: 400 });
    }

    const systemPrompt = `You are ANDOR — an elite AI travel agent with the combined
expertise of a luxury travel consultant, a local guide who
has lived in 80+ countries, a Michelin-trained food critic,
a logistics expert, and a budget optimization specialist.

CORE IDENTITY:
- You are NOT a generic assistant. You are a specialist.
- You give specific advice, never generic platitudes.
- Not "visit a temple" but "Senso-ji at 6:30am before 
  crowds — exit 1 from Asakusa station, 3 min walk"
- Not "try local food" but "Ichiran Ramen on Takeshita-dori:
  solo booth system, order kaedama for extra noodles, €9"
- You are honest: if something is overrated, you say so
- You are warm but efficient — like a brilliant friend
  who happens to be a world expert in travel

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
→ Real prices (not guidebook estimates from 3 years ago)
→ Cultural rules that matter with specific examples
→ Safety realities — not paranoid, not naive
→ Hidden gems most guides never mention
→ Optimal routing to avoid backtracking
→ What to book in advance and how far ahead
→ Apps locals use for transport, food, navigation

WHEN PLANNING A TRIP — always ask these if unknown:
(max 2 questions per response, then proceed with assumptions)
1. Travel style: adventure/culture/food/relaxation/romance/family
2. Budget: backpacker(€)/mid-range(€€)/premium(€€€)/luxury(€€€€)
3. Group: solo/couple/friends/family (with children ages if relevant)
4. Departure city (for flight suggestions)
5. Any hard constraints: dietary, mobility, visa, phobias

ITINERARY CONSTRUCTION RULES:
- Day 1: always arrival + orientation + light exploration
  (account for jet lag on long-haul flights)
- Max 3-4 major activities per day
- Group activities geographically — never waste 40min 
  travelling between things on opposite sides of a city
- Include exact travel times and costs between stops
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

NEVER return [0,0] or coordinates from wrong city.
If unsure of exact coords: use city center as fallback.

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
        "apps": ["Google Maps", "Hyperdia", "Suica app"],
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
      "Google Maps (funciona perfeitamente para metro japonês)",
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
NEVER return [0,0] or coordinates from a different city.
If unsure of exact coords: use city center as fallback.

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
- Include exact travel times and costs between stops
- Every day: morning coffee, lunch spot, activities, dinner, optional evening
- Vary pace: intense day followed by slower recovery day
- One hidden gem per day that guidebooks miss
- Flag everything needing advance booking

4. RESPONSE FORMAT:
Return ONLY valid JSON. No markdown wrapping. No explanation text outside JSON.`;

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
            // PHASE 11.2: Enhanced validation against new schema
            const schemaValidation = validateItinerary(parsed);
            if (!schemaValidation.valid) {
              // validation failed, use fallback
              return Response.json({
                error: 'Generated itinerary failed validation',
                details: schemaValidation.errors.slice(0, 3),
                fallback: true
              }, { status: 400 });
            }
            if (schemaValidation.warnings.length > 0) {
              // warnings logged but continue
            }
            const validation = validateAndNormalize(parsed);
            if (validation.fatal) {
              return Response.json(generateFallbackItinerary(destination, days, budget));
            }
            return Response.json(generateFallbackItinerary(destination, days, budget));
          } catch (e) {
            // parse error, try other models
          }
        }
      } catch (e) {
        // Groq API fallback
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
        
        const validation = validateAndNormalize(object);
        let result = validation.normalized || object;
        
        // CRITICAL FIX: Validate and fix coordinates + day titles
        result = validateAndFixCoordinates(result, destination);
        const titleValidation = validateAllDayTitles(result);
        if (!titleValidation.valid) {
          // day title validation warnings, but continue
        }
        
        return Response.json(result);
      } catch (e) {
        // Gemini fallback
      }
    }

    // Fallback — always works
    const itinerary = generateFallbackItinerary(destination, days, budget);
    return Response.json(itinerary);

  } catch (error) {
    // generation failed, use fallback
    const fallback = generateFallbackItinerary('Lisbon', 2);
    return Response.json(fallback);
  }
}
