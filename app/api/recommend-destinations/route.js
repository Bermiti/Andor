import Groq from 'groq-sdk';
import { cleanLocale, cleanString, cleanList, cleanInteger, hasProviderKey, readJsonBody } from '../../lib/api-utils';
import { logger } from '../../lib/logger';
import { destinationsData } from '../../lib/destinations';

// ---------------------------------------------------------------------------
// System prompt builder — locale-aware
// ---------------------------------------------------------------------------

function buildSystemPrompt(locale) {
  const langMap = {
    pt: 'European Portuguese',
    'pt-PT': 'European Portuguese',
    'pt-BR': 'Brazilian Portuguese',
    en: 'English',
    es: 'Spanish',
    fr: 'French',
  };
  const lang = langMap[locale] || 'European Portuguese';

  return `You are an elite travel consultant with 20+ years of experience. You have personally visited 120+ countries and have deep knowledge of every destination's culture, costs, climate, safety, and hidden gems.

TASK:
Analyze the traveler's profile and recommend EXACTLY 10–12 destinations that genuinely match their preferences. Return a JSON object — no markdown, no commentary.

LANGUAGE — CRITICAL:
ALL text output (profile summary, destination names, explanations, tags, strengths, everything) MUST be written in ${lang}. Never mix languages.

RESPONSE FORMAT — return EXACTLY this JSON structure:
{
  "userProfile": "<2–3 sentence summary of the traveler's profile>",
  "destinations": [
    {
      "name": "<city/region name>",
      "country": "<country>",
      "score": <0–100 integer reflecting real compatibility>,
      "explanation": "<2–3 sentences explaining WHY this destination fits their profile>",
      "tags": ["<tag1>", "<tag2>", "<tag3>"],
      "idealDuration": "<e.g. 5–7 dias>",
      "estimatedBudget": "<e.g. €1200–1600>",
      "bestTime": "<e.g. Maio a Outubro>",
      "strengths": ["<strength1>", "<strength2>"],
      "consideration": "<one potential drawback, or null if none>"
    }
  ]
}

SCORING RULES:
- 90–100: Near-perfect match on all criteria (travel style, budget, climate, duration, flight time)
- 80–89: Strong match, one minor compromise
- 70–79: Good match, two compromises
- 60–69: Decent option with notable trade-offs
- Below 60: Do NOT include

DIVERSITY RULES:
- Mix continents/regions (don't put 8 European destinations unless the user specifically limits to Europe)
- Mix price ranges within the user's budget tolerance
- Mix popular and lesser-known destinations based on their preference
- Include at least 2 unexpected/creative picks the user might not have considered

QUALITY RULES:
- estimatedBudget must reflect REAL costs for the stated duration, number of travelers, and budget tier
- Account for departure city when estimating flight costs
- bestTime must be factually correct for that destination's climate
- Tags should be specific (not just "Culture" — use "Street Art", "Wine Region", "Surf", etc.)
- Strengths should be concrete and specific, not generic
- consideration should flag real issues (monsoon season, visa requirements, overtourism, etc.)

BUDGET REFERENCE (per person, approximate):
- economic: up to €500
- moderate: €500–€1500
- comfortable: €1500–€3000
- premium: €3000–€5000
- luxury: €5000+

When budgetType is "total", divide accordingly by number of travelers.`;
}

// ---------------------------------------------------------------------------
// Build the user message from the profile
// ---------------------------------------------------------------------------

function buildUserMessage(profile, locale) {
  const parts = [];

  if (profile.travelMonth) parts.push(`Travel month: ${profile.travelMonth}`);
  if (profile.duration) parts.push(`Duration: ${profile.duration} days`);
  if (profile.departureCity) parts.push(`Departure city: ${profile.departureCity}`);
  if (profile.travelers) parts.push(`Number of travelers: ${profile.travelers}`);
  if (profile.budgetType) parts.push(`Budget type: ${profile.budgetType}`);
  if (profile.budget) parts.push(`Budget level: ${profile.budget}`);
  if (profile.travelStyles?.length) parts.push(`Travel styles: ${profile.travelStyles.join(', ')}`);
  if (profile.climate) parts.push(`Preferred climate: ${profile.climate}`);
  if (profile.maxFlightHours) parts.push(`Max flight duration: ${profile.maxFlightHours} hours`);
  if (profile.destinationPopularity) parts.push(`Destination type preference: ${profile.destinationPopularity}`);
  if (profile.avoid?.length) parts.push(`Wants to avoid: ${profile.avoid.join(', ')}`);
  if (profile.additionalInfo) parts.push(`Additional notes: ${profile.additionalInfo}`);

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Validate and clean the AI response
// ---------------------------------------------------------------------------

function validateDestinations(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;

  const userProfile = typeof parsed.userProfile === 'string' ? parsed.userProfile : '';
  let destinations = [];

  if (Array.isArray(parsed.destinations)) {
    destinations = parsed.destinations;
  } else if (Array.isArray(parsed)) {
    destinations = parsed;
  } else {
    // Try to find an array in the response
    const arrayValue = Object.values(parsed).find((v) => Array.isArray(v));
    if (arrayValue) destinations = arrayValue;
  }

  const cleaned = destinations
    .filter((d) => d && typeof d === 'object' && d.name && d.country)
    .map((d) => ({
      name: String(d.name),
      country: String(d.country),
      score: typeof d.score === 'number' ? Math.min(100, Math.max(0, Math.round(d.score))) : 80,
      explanation: String(d.explanation || ''),
      tags: Array.isArray(d.tags) ? d.tags.map(String).slice(0, 6) : [],
      idealDuration: String(d.idealDuration || ''),
      estimatedBudget: String(d.estimatedBudget || ''),
      bestTime: String(d.bestTime || ''),
      strengths: Array.isArray(d.strengths) ? d.strengths.map(String).slice(0, 4) : [],
      consideration: d.consideration ? String(d.consideration) : null,
    }))
    .slice(0, 14);

  if (cleaned.length === 0) return null;

  return { userProfile, destinations: cleaned };
}

// ---------------------------------------------------------------------------
// Static fallback — curated from destinations data
// ---------------------------------------------------------------------------

function buildStaticFallback(profile, locale) {
  const styleMap = {
    praia: ['Praia', 'Sol', 'Relax'],
    beach: ['Praia', 'Sol', 'Relax'],
    playa: ['Praia', 'Sol', 'Relax'],
    plage: ['Praia', 'Sol', 'Relax'],
    cidade: ['Cidade', 'Cultura'],
    city: ['Cidade', 'Cultura'],
    ciudad: ['Cidade', 'Cultura'],
    ville: ['Cidade', 'Cultura'],
    natureza: ['Natureza', 'Aventura'],
    nature: ['Natureza', 'Aventura'],
    naturaleza: ['Natureza', 'Aventura'],
    aventura: ['Aventura', 'Natureza'],
    adventure: ['Aventura', 'Natureza'],
    cultura: ['Cultura', 'História'],
    culture: ['Cultura', 'História'],
    gastronomia: ['Gastronomia'],
    gastronomy: ['Gastronomia'],
    luxo: ['Luxo', 'Romântico'],
    luxury: ['Luxo', 'Romântico'],
    lujo: ['Luxo', 'Romântico'],
    luxe: ['Luxo', 'Romântico'],
    descanso: ['Relax'],
    relax: ['Relax'],
    romântica: ['Romântico'],
    romantic: ['Romântico'],
    romántica: ['Romântico'],
    romantique: ['Romântico'],
    família: ['Natureza', 'Relax'],
    family: ['Natureza', 'Relax'],
    familia: ['Natureza', 'Relax'],
    amigos: ['Festa', 'Cidade'],
    friends: ['Festa', 'Cidade'],
    nightlife: ['Festa'],
    'vida noturna': ['Festa'],
  };

  const userTags = new Set();
  const styles = Array.isArray(profile.travelStyles) ? profile.travelStyles : [];
  for (const style of styles) {
    const mapped = styleMap[style.toLowerCase()] || [];
    mapped.forEach((t) => userTags.add(t));
  }

  const scored = destinationsData.map((dest) => {
    let matchScore = 0;
    const destTags = dest.tags || [];
    for (const tag of destTags) {
      if (userTags.has(tag)) matchScore += 15;
    }
    return { ...dest, matchScore };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore || b.score - a.score);

  const top = scored.slice(0, 12);

  const langLabel = {
    pt: 'Perfil gerado a partir das preferências indicadas.',
    'pt-BR': 'Perfil gerado a partir das preferências indicadas.',
    en: 'Profile generated from stated preferences.',
    es: 'Perfil generado a partir de las preferencias indicadas.',
    fr: 'Profil généré à partir des préférences indiquées.',
  };

  return {
    userProfile: langLabel[locale] || langLabel.pt,
    destinations: top.map((d, i) => ({
      name: d.name,
      country: d.country,
      score: Math.max(65, d.score - i * 2),
      explanation: d.description || '',
      tags: (d.tags || []).slice(0, 4),
      idealDuration: '5–7 dias',
      estimatedBudget: d.price || '€800–1200',
      bestTime: 'Abril a Outubro',
      strengths: (d.tags || []).slice(0, 2),
      consideration: null,
    })),
  };
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req) {
  try {
    const body = await readJsonBody(req, 'recommend-destinations');
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const profile = body.profile && typeof body.profile === 'object' ? body.profile : {};
    const locale = cleanLocale(body.locale);

    // Sanitize profile fields
    const cleanProfile = {
      travelMonth: cleanString(profile.travelMonth, '', 40),
      duration: cleanString(profile.duration, '', 20),
      departureCity: cleanString(profile.departureCity, '', 80),
      travelers: cleanInteger(profile.travelers, 2, 1, 20),
      budgetType: cleanString(profile.budgetType, 'total', 20),
      budget: cleanString(profile.budget, 'moderate', 30),
      travelStyles: cleanList(profile.travelStyles, 12, 40),
      climate: cleanString(profile.climate, '', 30),
      maxFlightHours: cleanString(profile.maxFlightHours, '', 10),
      destinationPopularity: cleanString(profile.destinationPopularity, 'balanced', 30),
      avoid: cleanList(profile.avoid, 10, 40),
      additionalInfo: cleanString(profile.additionalInfo, '', 500),
    };

    const systemPrompt = buildSystemPrompt(locale);
    const userMessage = buildUserMessage(cleanProfile, locale);

    // -----------------------------------------------------------------------
    // Provider 1: Groq SDK (primary)
    // -----------------------------------------------------------------------
    const groqKey = process.env.GROQ_API_KEY;
    if (hasProviderKey(groqKey)) {
      try {
        const groq = new Groq({ apiKey: groqKey });
        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 4000,
          response_format: { type: 'json_object' },
        });

        const content = completion.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const result = validateDestinations(parsed);
          if (result) {
            return Response.json(result);
          }
        }
      } catch (e) {
        logger.warn('recommend-destinations:groq_failed', e);
      }
    }

    // -----------------------------------------------------------------------
    // Provider 2: Anthropic Claude (fallback)
    // -----------------------------------------------------------------------
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (hasProviderKey(anthropicKey)) {
      try {
        // Dynamic import to avoid Turbopack resolution issues
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const anthropic = new Anthropic({ apiKey: anthropicKey });

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        });

        const content = message.content?.[0]?.text;
        if (content) {
          // Claude may wrap JSON in markdown code blocks — strip them
          const jsonStr = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
          const parsed = JSON.parse(jsonStr);
          const result = validateDestinations(parsed);
          if (result) {
            return Response.json(result);
          }
        }
      } catch (e) {
        logger.warn('recommend-destinations:anthropic_failed', e);
      }
    }

    // -----------------------------------------------------------------------
    // Provider 3: Static fallback
    // -----------------------------------------------------------------------
    logger.info('recommend-destinations:static_fallback', { locale });
    const fallback = buildStaticFallback(cleanProfile, locale);

    // Simulate processing time so the UI loading state feels natural
    await new Promise((r) => setTimeout(r, 1500));

    return Response.json(fallback);
  } catch (error) {
    logger.error('recommend-destinations:unhandled', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
