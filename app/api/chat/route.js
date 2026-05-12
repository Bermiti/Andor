import { generateChatResponse } from '../../lib/fallback-ai';

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || '';

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
                content: `You are the Andor travel assistant. You respond in English with enthusiasm. You are super knowledgeable about travel, culture, history, and food. Be concise but informative. Use emojis moderately. Never make up false historical facts.`
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
        console.log('Groq chat failed:', e.message);
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
          system: `You are the Andor travel assistant. You respond in English with enthusiasm. Be concise but informative. Use emojis moderately.`,
          messages,
        });
        return result.toDataStreamResponse();
      } catch (e) {
        console.log('Gemini chat failed:', e.message);
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
