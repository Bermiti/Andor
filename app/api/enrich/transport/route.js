import { NextResponse } from 'next/server';
import { enrichTransportData } from '../../../lib/enrichment-services';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromCity = searchParams.get('from') || 'Lisboa';
    const toCity = searchParams.get('to');
    const date = searchParams.get('date');

    if (!toCity) {
      return NextResponse.json({ error: 'Parâmetro "to" é obrigatório.' }, { status: 400 });
    }

    const data = await enrichTransportData(fromCity, toCity, date);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Transport api error:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados do transporte.' }, { status: 500 });
  }
}
