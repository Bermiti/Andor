import { NextResponse } from 'next/server';
import { fetchWeatherForecast, getSeasonalClimateEstimate } from '../../lib/server/weather-provider';
import { executeProviderRequest } from '../../lib/server/provider-executor';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const timezone = searchParams.get('timezone') || 'UTC';
    const daysStr = searchParams.get('days') || '7';

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const days = parseInt(daysStr, 10);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({
        dataType: 'seasonal_climate_estimate',
        status: 'estimate_only',
        forecast: null,
        climate: null,
        estimate: getSeasonalClimateEstimate('general'),
        provenance: {
          sourceType: 'estimate',
          provider: 'andor_editorial_climate',
          retrievedAt: new Date().toISOString(),
          confidence: 0.6,
        },
      }, { status: 400 });
    }

    const result = await executeProviderRequest({
      providerId: 'provider-openmeteo',
      capability: 'weather_forecast',
      input: { lat, lng, timezone, days },
      executorFn: async (input) => fetchWeatherForecast(input),
    });

    if (!result.success || !result.data || result.data.status !== 'available') {
      return NextResponse.json({
        dataType: 'unavailable',
        status: 'provider_unavailable',
        forecast: null,
        climate: null,
        estimate: null,
        error: result.error || 'Provider unavailable',
        provenance: {
          sourceType: 'verified_provider',
          provider: 'open-meteo',
          retrievedAt: new Date().toISOString(),
          confidence: 0,
        },
      }, { status: 503 });
    }

    return NextResponse.json({
      dataType: 'weather_forecast',
      status: 'available',
      forecast: result.data,
      climate: null,
      estimate: null,
      provenance: result.data.provenance,
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json({
      dataType: 'unavailable',
      status: 'provider_unavailable',
      forecast: null,
      climate: null,
      estimate: null,
      error: error.message,
    }, { status: 500 });
  }
}
