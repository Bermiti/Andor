import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req) {
  const { messages, tripContext } = await req.json();

  const systemMessage = `Tu és o assistente de viagem Andor. Respondes em português de Portugal com entusiasmo e és super conhecedor de viagens, cultura, história e gastronomia.

${tripContext ? `O utilizador está atualmente a planear ou a viver uma viagem para ${tripContext.destination}. O itinerário atual tem ${tripContext.days?.length || 0} dias.` : 'O utilizador ainda não tem uma viagem ativa.'}

Regras:
- Sê conciso mas informativo
- Usa emojis moderadamente
- Se o utilizador perguntar sobre um monumento ou local, explica a história de forma cativante
- Se pedir alterações ao itinerário, sugere alternativas concretas com nomes reais de locais
- Se perguntar sobre a divisão de custos, ajuda com cálculos
- Nunca inventes factos históricos`;

  const result = streamText({
    model: google('gemini-1.5-pro'),
    system: systemMessage,
    messages,
  });

  return result.toDataStreamResponse();
}
