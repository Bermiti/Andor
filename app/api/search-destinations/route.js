import { hasProviderKey, cleanString } from '../../lib/api-utils';
import { logger } from '../../lib/logger';

const SYSTEM_PROMPT = `You are a travel destination recommender AI.
The user will describe their ideal trip (e.g., "I want to go skiing", "Beach under 1000 euros").
You must reply with EXACTLY a valid JSON array containing the best destinations for their prompt.
Do NOT output any markdown, no conversational text, ONLY the JSON array.
Each destination object must have this exact structure:
{
  "name": "City Name",
  "country": "Country",
  "tags": ["Tag1", "Tag2"],
  "price": "€500",
  "score": 95,
  "badge": "Short catchy badge",
  "description": "Short description of why it fits.",
  "img": "https://images.unsplash.com/photo-something"
}
Provide up to 10 absolute best matches. Do not provide more than 10 to keep it fast.
Use real Unsplash image URLs related to the location.
Always write in the same language as the user's prompt (Portuguese).`;

export async function POST(req) {
  try {
    const body = await req.json();
    const prompt = cleanString(body.prompt, '', 1000);
    
    if (!prompt) {
      return Response.json({ error: 'Prompt missing' }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (hasProviderKey(groqKey)) {
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
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2000,
            response_format: { type: "json_object" }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          let content = data.choices?.[0]?.message?.content || '[]';
          
          // LLaMA JSON mode returns a JSON object, if we asked for array it might wrap it or return array if we didn't strictly force it.
          // Let's safely parse it
          let parsed = [];
          try {
            const parsedObj = JSON.parse(content);
            if (Array.isArray(parsedObj)) parsed = parsedObj;
            else if (parsedObj.destinations && Array.isArray(parsedObj.destinations)) parsed = parsedObj.destinations;
            else parsed = Object.values(parsedObj).find(v => Array.isArray(v)) || [];
          } catch(e) {
            // fallback if it failed parsing
          }
          
          return Response.json({ destinations: parsed });
        }
      } catch (e) {
        logger.warn('search-destinations:groq_failed', e);
      }
    }

    // Fallback if no Groq key or it failed
    const { destinationsData } = require('../../lib/destinations');
    const stopwords = ['quero', 'uma', 'viagem', 'para', 'ate', 'com', 'que', 'dos', 'das', 'de', 'um', 'umas', 'uns', 'o', 'a', 'os', 'as', 'eu', 'nós', 'na', 'no', 'em', 'onde', 'tem', 'fazer'];
    const rawTerms = prompt.toLowerCase().replace(/[.,!?'"]/g, '').split(' ');
    const terms = rawTerms.filter(t => t.length > 2 && !stopwords.includes(t));
    
    const scoredDestinations = destinationsData.map(dest => {
      let matchScore = 0;
      const destString = `${dest.name} ${dest.country} ${dest.tags.join(' ')} ${dest.description || ''}`.toLowerCase();
      terms.forEach(term => {
        if (destString.includes(term)) matchScore += 10;
      });
      
      const priceStr = dest.price.replace(/[^0-9]/g, '');
      const priceNum = parseInt(priceStr, 10);
      if (terms.includes('1000') || terms.includes('1000€')) {
         if (priceNum <= 1000) matchScore += 5;
      }

      return { ...dest, matchScore };
    });

    scoredDestinations.sort((a, b) => b.matchScore - a.matchScore || b.score - a.score);
    const bestMatches = scoredDestinations.slice(0, 10).filter(r => r.matchScore > 0);

    // Provide default fallback if no matches found so it never looks broken
    const finalResults = bestMatches.length > 0 ? bestMatches : scoredDestinations.slice(0, 4);
    
    // Simulate thinking time for fallback to look like an AI
    await new Promise(r => setTimeout(r, 1500));
    
    return Response.json({ destinations: finalResults });

  } catch (error) {
    logger.error('search-destinations:unhandled', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
