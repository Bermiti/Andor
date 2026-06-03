import { hasProviderKey, cleanString } from '../../lib/api-utils';
import { logger } from '../../lib/logger';
import { destinationsData } from '../../lib/destinations';

const SYSTEM_PROMPT = `You are ANDOR — an elite AI travel agent and luxury travel consultant.
Analyze the user's travel preferences questionnaire and recommend the best matching destinations.

You must reply with EXACTLY a valid JSON object in the following format:
{
  "userProfile": "Summary of the user profile based on questionnaire answers.",
  "destinations": [
    {
      "name": "Destination Name",
      "country": "Country",
      "score": 95,
      "explanation": "2-3 sentences explaining exactly why this destination matches their profile.",
      "tags": ["Tag1", "Tag2", "Tag3"],
      "idealDuration": "7 days",
      "estimatedBudget": "€1500–2000",
      "bestTime": "Best months to visit",
      "strengths": ["Key strength 1", "Key strength 2"],
      "consideration": "Subtle warning or caveat if any, or null"
    }
  ]
}

CRITICAL RULES:
1. Output MUST be a valid JSON object with EXACTLY the keys "userProfile" and "destinations".
2. Do NOT write any conversational text, markdown formatting blocks (like \`\`\`json), or explanations outside of the JSON object.
3. Recommend exactly 10 to 12 destinations.
4. Each destination must have all the fields: name, country, score (integer 0-100), explanation, tags, idealDuration, estimatedBudget, bestTime, strengths, and consideration (string or null).
5. All text content (userProfile, explanation, tags, idealDuration, estimatedBudget, bestTime, strengths, consideration) MUST be written in the specified locale/language:
   - If locale is 'pt', use European Portuguese.
   - If locale is 'pt-BR', use Brazilian Portuguese.
   - If locale is 'es', use Spanish.
   - If locale is 'fr', use French.
   - If locale is 'en', use English.
6. The score should represent compatibility (0-100) based on the user's preferences, styles, avoids, and budget.
7. The budget estimation should reflect the user's selected budget level and number of travelers.`;

function safeCleanAndParseJson(text) {
  let clean = text.trim();
  // Strip markdown code blocks if the model wrapped it
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }
  return JSON.parse(clean);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const profile = body.profile || {};
    const locale = body.locale || 'pt';

    const userPrompt = `Recomenda destinos para este perfil de utilizador:
${JSON.stringify(profile, null, 2)}

Idioma de resposta (locale): "${locale}"`;

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
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 3000,
            response_format: { type: "json_object" }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || '';
          if (content) {
            const parsed = safeCleanAndParseJson(content);
            if (parsed.destinations && Array.isArray(parsed.destinations)) {
              return Response.json(parsed);
            }
          }
        }
      } catch (e) {
        logger.warn('recommend-destinations:groq_failed', e);
      }
    }

    // Fallback: Anthropic
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (hasProviderKey(anthropicKey)) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const anthropic = new Anthropic({ apiKey: anthropicKey });
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }]
        });

        const content = response.content?.[0]?.text || '';
        if (content) {
          const parsed = safeCleanAndParseJson(content);
          if (parsed.destinations && Array.isArray(parsed.destinations)) {
            return Response.json(parsed);
          }
        }
      } catch (e) {
        logger.warn('recommend-destinations:anthropic_failed', e);
      }
    }

    // Curated Static Fallback
    logger.warn('recommend-destinations:using_static_fallback');
    
    // Simple logic to translate static fallback strings depending on locale
    const isEnglish = locale === 'en';
    const isSpanish = locale === 'es';
    const isFrench = locale === 'fr';

    const userProfileText = isEnglish
      ? `Traveler profile matching ${profile.travelers || 2} people departing from ${profile.departureCity || 'default city'} in ${profile.travelMonth || 'flexible'}.`
      : isSpanish
      ? `Perfil del viajero con ${profile.travelers || 2} personas saliendo de ${profile.departureCity || 'ciudad por defecto'} en ${profile.travelMonth || 'flexible'}.`
      : isFrench
      ? `Profil de voyageur avec ${profile.travelers || 2} personnes au départ de ${profile.departureCity || 'ville par défaut'} en ${profile.travelMonth || 'flexible'}.`
      : `Perfil de viajante correspondente a ${profile.travelers || 2} pessoas com partida de ${profile.departureCity || 'Lisboa'} em ${profile.travelMonth || 'setembro'}.`;

    const mappedDestinations = destinationsData.slice(0, 10).map((d) => {
      let explanation = d.description;
      let strengths = [d.badge || 'Excelente clima'];
      let idealDuration = profile.duration ? `${profile.duration} dias` : '7 dias';
      let bestTime = 'Maio a Outubro';

      if (isEnglish) {
        if (d.name === 'Kyoto') {
          explanation = 'Perfect match for cultural exploration, gardens and historical heritage.';
          strengths = ['Stunning historic temples', 'Beautiful zen gardens'];
          bestTime = 'April to November';
        } else if (d.name === 'Lisboa') {
          explanation = 'Incredible food, vibrant light, historic neighbourhoods and beach closeness.';
          strengths = ['Amazing gastronomy', 'Beautiful views and light'];
          bestTime = 'May to October';
        } else {
          explanation = `Great fit for your travel styles with beautiful landscapes.`;
        }
        idealDuration = profile.duration ? `${profile.duration} days` : '7 days';
        bestTime = 'May to October';
      }

      return {
        name: d.name,
        country: d.country,
        score: d.score || 90,
        explanation: explanation,
        tags: d.tags || [],
        idealDuration: idealDuration,
        estimatedBudget: d.price || '€1000',
        bestTime: bestTime,
        strengths: strengths,
        consideration: null
      };
    });

    return Response.json({
      userProfile: userProfileText,
      destinations: mappedDestinations
    });

  } catch (error) {
    logger.error('recommend-destinations:unhandled', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
