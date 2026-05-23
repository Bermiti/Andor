import { generateChatResponse } from '../../lib/fallback-ai';

const SYSTEM_PROMPT = `You are ANDOR — an elite AI travel agent with the combined
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
Always respond in the user's selected language.
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
- Day titles must be unique and evocative:
  FORBIDDEN: "Explore Tokyo", "Day in Paris", "Visit Bali"
  REQUIRED: "Neon Dreams of Shibuya", "Ancient Kyoto at Dawn",
  "Cliffside Sunsets in Santorini"

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

APPLICATION ACTIONS INTEGRATION:
You can perform actions by appending at the end of your response:
- [ACTION:save_itinerary] - Save current itinerary
- [ACTION:open_map:lat,lng] - Center map on coordinates
- [ACTION:add_favorites:slug] - Add to favorites
- [ACTION:compare_destinations] - Compare destinations

RESPONSE FORMAT RULES:
- For questions: conversational but precise, use formatting when it helps
- For recommendations: lead with best option, explain WHY, offer alternatives
- Always end with one unexpected insight they didn't ask for
- Be decisive. Never hedge unnecessarily.

WHAT YOU NEVER DO:
- Never say "I don't have real-time data" — work with what you know
- Never give generic advice — give specific advice
- Never recommend the obvious tourist trap as a highlight
- Never forget the user's context from earlier in the conversation`;

export async function POST(req) {
  try {
    const { messages, locale } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || '';
    const userLocale = locale || 'pt';
    
    // Dynamically append the language guideline to the system prompt
    const activeSystemPrompt = `${SYSTEM_PROMPT}\n\nAlways respond in the user's selected language: ${userLocale}. If locale is 'pt', use European Portuguese. If 'pt-BR', use Brazilian Portuguese.`;

    // Try Groq Llama first
    const groqKey = process.env.GROQ_API_KEY;

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
                content: activeSystemPrompt
              },
              ...messages,
            ],
            temperature: 0.7,
            max_tokens: 1000,
            stream: true,
          }),
        });

        if (response.ok) {
          // Stream the Groq response
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              const reader = response.body.getReader();
              const decoder = new TextDecoder();

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

                for (const line of lines) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  try {
                    const parsed = JSON.parse(data);
                    const text = parsed.choices?.[0]?.delta?.content || '';
                    if (text) {
                      controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`));
                    }
                  } catch {}
                }
              }
              controller.close();
            },
          });

          return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        }
      } catch (e) {
        // console.log('Groq chat failed:', e.message);
      }
    }

    // Try Gemini
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (geminiKey && geminiKey !== 'cola_aqui_a_tua_chave_gemini') {
      try {
        const { google } = await import('@ai-sdk/google');
        const { streamText } = await import('ai');

        const result = streamText({
          model: google('gemini-1.5-pro'),
          system: activeSystemPrompt,
          messages,
        });
        return result.toDataStreamResponse();
      } catch (e) {
        // console.log('Gemini chat failed:', e.message);
      }
    }

    // Fallback — smart pre-built responses
    const reply = generateChatResponse(lastMessage);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Simulate streaming word by word for a natural feel
        const words = reply.split(' ');
        let i = 0;
        const interval = setInterval(() => {
          if (i >= words.length) {
            clearInterval(interval);
            controller.close();
            return;
          }
          const word = (i === 0 ? '' : ' ') + words[i];
          controller.enqueue(encoder.encode(`0:${JSON.stringify(word)}\n`));
          i++;
        }, 30);
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error) {
    console.error('Chat error:', error);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`0:${JSON.stringify("Sorry, something went wrong. Please try again!")}\n`));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
