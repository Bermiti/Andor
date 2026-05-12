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
                content: `You are a travel planning AI. Generate a detailed travel itinerary as JSON. The JSON must have this exact structure: {"destination": "City, Country", "days": [{"title": "Day 1 — Theme", "stops": [{"time": "09:00", "name": "Place Name", "type": "Category — Brief description"}]}], "totalCost": "€XXX"}. Use REAL places, restaurants and attractions. Be specific with names.`
              },
              {
                role: 'user',
                content: `Create a ${days || 2}-day itinerary for ${destination}. Budget: ${budget || 'moderate'}€. Travelers: ${travelers || 2}. Interests: ${interests?.join(', ') || 'general'}. Include 5-7 stops per day with real place names. Return ONLY valid JSON, no markdown.`
              }
            ],
            temperature: 0.7,
            max_tokens: 2000,
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
            days: z.array(z.object({
              title: z.string(),
              stops: z.array(z.object({
                time: z.string(),
                name: z.string(),
                type: z.string(),
              })),
            })),
            totalCost: z.string(),
          }),
          prompt: `Create a ${days || 2}-day travel itinerary for ${destination}. Budget: ${budget || 'moderate'}€. Travelers: ${travelers || 2}. Interests: ${interests?.join(', ') || 'general'}. Include 5-7 stops per day with REAL place names and restaurants.`,
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
