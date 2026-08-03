import { NextResponse } from 'next/server';
import { fetchLiveExchangeRate } from '../../lib/server/exchange-rate-provider';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const base = searchParams.get('base') || searchParams.get('from') || 'EUR';
    const quote = searchParams.get('quote') || searchParams.get('to') || 'EUR';

    const result = await fetchLiveExchangeRate({
      baseCurrency: base,
      quoteCurrency: quote,
    });

    if (!result.success) {
      return NextResponse.json({
        status: result.status || 'rate_unavailable',
        measurementType: 'exchange_rates',
        error: result.error || 'Exchange rate unavailable',
        data: null,
        provenance: result.provenance,
      }, { status: result.status === 'blocked_by_credentials' ? 503 : 400 });
    }

    return NextResponse.json({
      status: 'available',
      measurementType: 'exchange_rates',
      data: result.data,
      provenance: result.data.provenance,
    });
  } catch (error) {
    console.error('Exchange rates API error:', error);
    return NextResponse.json({
      status: 'rate_unavailable',
      measurementType: 'exchange_rates',
      error: error.message,
      data: null,
    }, { status: 500 });
  }
}
