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
        status: 'invalid_coordinates',
        measurementType: 'seasonal_climate_estimate',
        estimate: getSeasonalClimateEstimate('general'),
      }, { status: 400 });
    }

    const result = await executeProviderRequest({
      providerId: 'provider-openmeteo',
      capability: 'weather_forecast',
      input: { lat, lng, timezone, days },
      executorFn: async (input) => fetchWeatherForecast(input),
    });

    if (!result.success) {
      return NextResponse.json({
        status: 'provider_unavailable',
        measurementType: 'weather_forecast',
        error: result.error,
        provenance: {
          sourceType: 'verified_provider',
          provider: 'open-meteo',
          retrievedAt: new Date().toISOString(),
          confidence: 0,
        },
      }, { status: 503 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json({
      status: 'error',
      measurementType: 'weather_forecast',
      error: error.message,
    }, { status: 500 });
  }
}
