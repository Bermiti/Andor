import { NextResponse } from 'next/server';
import { enrichRestaurantsData } from '../../../lib/enrichment-services';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));
    const city = searchParams.get('city') || 'Lisboa';

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'Parâmetros "lat" e "lng" são obrigatórios e devem ser numéricos.' }, { status: 400 });
    }

    const data = await enrichRestaurantsData(lat, lng, city);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Restaurant api error:', error);
    return NextResponse.json({ error: 'Erro ao buscar restaurantes.' }, { status: 500 });
  }
}
