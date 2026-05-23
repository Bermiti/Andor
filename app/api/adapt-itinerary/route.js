import { generateFallbackAdaptedDay } from '../../lib/fallback-adapt';

export async function POST(req) {
  try {
    const { itinerary, activeDayIndex, context } = await req.json();

    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (geminiKey && geminiKey !== 'cola_aqui_a_tua_chave_gemini') {
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
          model: google('gemini-1.5-pro'),
          prompt: systemPrompt,
        });
        
        // Clean JSON if needed
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Invalid AI response");
        
        const newDay = JSON.parse(jsonMatch[0]);
        return Response.json(newDay);
      } catch (e) {
        // Fallback used
      }
    }

    // Smart fallback adaptation
    const newDay = generateFallbackAdaptedDay(itinerary, activeDayIndex, context);
    return Response.json(newDay);

  } catch (error) {
    console.error("AI Adaptation Error:", error);
    return Response.json({ error: "Failed to adapt itinerary" }, { status: 500 });
  }
}

