import { NextResponse } from 'next/server';
import { enrichActivityData } from '../../../lib/enrichment-services';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const city = searchParams.get('city') || 'Lisboa';
    const country = searchParams.get('country') || '';

    if (!name) {
      return NextResponse.json({ error: 'Parâmetro "name" é obrigatório.' }, { status: 400 });
    }

    const data = await enrichActivityData(name, city, country);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Activity api error:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados da atividade.' }, { status: 500 });
  }
}
