import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const maxDuration = 30; 

export async function POST(req) {
  try {
    const { destination, budget, days, style, travelers, interests } = await req.json();

    const { object } = await generateObject({
      model: google('gemini-1.5-pro'),
      schema: z.object({
        destination: z.string().describe('Nome do destino com país (ex: Roma, Itália)'),
        totalCost: z.string().describe('Custo total estimado da viagem (ex: €250)'),
        days: z.array(z.object({
          title: z.string().describe('Título atrativo para o dia (ex: Coração Histórico)'),
          stops: z.array(z.object({
            time: z.string().describe('Hora da paragem (ex: 09:00)'),
            name: z.string().describe('Nome real do local ou restaurante'),
            type: z.string().describe('Tipo de atividade com um emoji (ex: ☕ Pequeno-almoço)')
          }))
        }))
      }),
      prompt: `Gera um itinerário de viagem super detalhado e realista para ${destination}.
        Orçamento: ${budget}
        Duração: ${days} dias
        Estilo de Viagem: ${style}
        Viajantes: ${travelers}
        Interesses: ${interests.join(', ')}
        
        Usa o idioma principal do destino ou português de portugal. 
        Assegura-te que os tempos fazem sentido logisticamente e inclui restaurantes e locais reais com moradas precisas. Se for preciso andar, considera o tempo de deslocação.`
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error('Error generating itinerary:', error);
    return NextResponse.json({ error: 'Failed to generate itinerary' }, { status: 500 });
  }
}
