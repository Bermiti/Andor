import { generateFallbackItinerary } from '../../lib/fallback-ai';

export async function POST(req) {
  try {
    const { destination, days, budget, travelers, interests } = await req.json();

    if (!destination) {
      return Response.json({ error: 'Destination is required' }, { status: 400 });
    }

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
              {
                role: 'system',
                content: `You are a premium travel agency AI. Generate a perfect travel itinerary as JSON.
                The JSON must have this exact structure:
                {
                  "destination": "City, Country",
                  "tripOverview": "Catchy summary",
                  "flights": {"suggestion": "Arrival/Departure tips", "averagePrice": "€XXX"},
                  "accommodation": {"hotelName": "Name", "type": "Luxury/Boutique/Budget", "reason": "Why stay here?"},
                  "days": [{
                    "title": "Day 1 — Theme",
                    "transportTip": "Best way to move today",
                    "stops": [{"time": "09:00", "name": "Place Name", "type": "Category — Description", "isRestaurant": true/false}]
                  }],
                  "mustEat": ["Dish/Restaurant 1", "Dish/Restaurant 2"],
                  "contingency": {"emergencyInfo": "Local emergency info", "unexpectedTips": "Safety/Fallback tips"},
                  "totalCost": "€XXX"
                }
                Use REAL places and current trends.`
              },
              {
                role: 'user',
                content: `Create a ${days || 2}-day "Travel Agency" grade itinerary for ${destination}. Budget: ${budget || 'moderate'}€. Travelers: ${travelers || 2}. Interests: ${interests?.join(', ') || 'general'}. Return ONLY valid JSON.`
              }
            ],
            temperature: 0.7,
            max_tokens: 2500,
            response_format: { type: 'json_object' },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const itinerary = JSON.parse(data.choices[0].message.content);
          return Response.json(itinerary);
        }
      } catch (e) {
        console.log('Groq failed, using fallback:', e.message);
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
            destination: z.string(),
            tripOverview: z.string(),
            flights: z.object({
              suggestion: z.string(),
              averagePrice: z.string(),
            }),
            accommodation: z.object({
              hotelName: z.string(),
              type: z.string(),
              reason: z.string(),
            }),
            days: z.array(z.object({
              title: z.string(),
              transportTip: z.string(),
              stops: z.array(z.object({
                time: z.string(),
                name: z.string(),
                type: z.string(),
                isRestaurant: z.boolean().optional(),
              })),
            })),
            mustEat: z.array(z.string()),
            contingency: z.object({
              emergencyInfo: z.string(),
              unexpectedTips: z.string(),
            }),
            totalCost: z.string(),
          }),
          prompt: `You are a premium travel agency AI. Create a perfect ${days || 2}-day travel itinerary for ${destination}.
          Budget: ${budget || 'moderate'}€. Travelers: ${travelers || 2}. Interests: ${interests?.join(', ') || 'general'}.
          Include flights, specific hotel, must-eat restaurants, transport tips for each day, and a safety contingency section.`,
        });
        return Response.json(object);
      } catch (e) {
        console.log('Gemini failed, using fallback:', e.message);
      }
    }

    // Fallback — always works
    const itinerary = generateFallbackItinerary(destination, days, budget);
    return Response.json(itinerary);

  } catch (error) {
    console.error('Generate itinerary error:', error);
    // Even on total failure, return something useful
    const fallback = generateFallbackItinerary('Lisbon', 2);
    return Response.json(fallback);
  }
}
