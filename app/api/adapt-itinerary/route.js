import { generateFallbackAdaptedDay } from '../../lib/fallback-adapt';
import { apiError, cleanInteger, cleanString, hasProviderKey, readJsonBody } from '../../lib/api-utils';
import { logger } from '../../lib/logger';
import { AI_MODELS } from '../../lib/server/ai-models';

export async function POST(req) {
  try {
    const body = await readJsonBody(req, 'adapt_itinerary');
    if (!body || typeof body !== 'object') {
      return apiError('MALFORMED_JSON', 'Pedido inválido. Tenta novamente.', 400, false);
    }
    const itinerary = body.itinerary && typeof body.itinerary === 'object' ? body.itinerary : null;
    const activeDayIndex = cleanInteger(body.activeDayIndex, 0, 0, 13);
    const context = cleanString(body.context, '', 500);
    if (!itinerary || !Array.isArray(itinerary.days) || !itinerary.days[activeDayIndex]) {
      return apiError('INVALID_ITINERARY', 'Não encontrei este dia no itinerário.', 400, false);
    }
    if (!context) {
      return apiError('ADAPT_CONTEXT_REQUIRED', 'Diz o que mudou para adaptarmos o dia.', 400, false);
    }

    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (hasProviderKey(geminiKey)) {
      try {
        const { google } = await import('@ai-sdk/google');
        const { generateText } = await import('ai');

        const systemPrompt = `
          You are a world-class travel expert. A traveler is currently on a trip and needs to ADAPT their itinerary for today.
          
          CURRENT ITINERARY FOR TODAY:
          ${JSON.stringify(itinerary.days[activeDayIndex])}
          
          ADAPTATION CONTEXT:
          "${context}"
          
          TASK:
          Modify the REMAINING part of today's itinerary to accommodate the context.
          - If it's raining, suggest indoor activities.
          - If they are tired, suggest more relaxing stops.
          - If they want more nature, swap some urban stops for parks.
          - Keep the general vibe but be smart about the change.
          
          Return ONLY a JSON object representing the NEW version of this specific day.
          Follow this EXACT format:
          {
            "title": "Day Title (can be modified)",
            "stops": [
              { 
                "time": "HH:MM", 
                "name": "Place Name", 
                "type": "Short description with emoji",
                "isRestaurant": false,
                "estimatedCost": "€15",
                "localSecret": "Interesting local tip",
                "coordinates": { "lat": 38.72, "lng": -9.13 }
              }
            ]
          }
          Include about 5-6 stops for a full day. Make sure coordinates are realistic for the region.
        `;

        const { text } = await generateText({
          model: google(AI_MODELS.google),
          prompt: systemPrompt,
        });
        
        // Clean JSON if needed
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Invalid AI response");
        
        const newDay = JSON.parse(jsonMatch[0]);
        return Response.json(newDay);
      } catch (e) {
        logger.warn('adapt_itinerary:gemini_provider_failed', e, { activeDayIndex });
      }
    }

    // Smart fallback adaptation
    const newDay = generateFallbackAdaptedDay(itinerary, activeDayIndex, context);
    return Response.json(newDay);

  } catch (error) {
    const errorId = logger.error('adapt_itinerary:unhandled', error);
    return apiError('ITINERARY_ADAPTATION_FAILED', 'Não foi possível adaptar o itinerário. Tenta novamente.', 500, true, { errorId });
  }
}
