import { NextResponse } from 'next/server';
import {
  calculateStraightLineDistance,
  calculateEstimatedRoute,
  fetchVerifiedOsrmRoute,
} from '../../lib/server/routing-provider';
import { executeProviderRequest } from '../../lib/server/provider-executor';

export async function POST(request) {
  try {
    const body = await request.json();
    const { origin, destination, mode = 'walking', forceEstimate = false } = body || {};

    if (!origin || !destination || typeof origin.lat !== 'number' || typeof destination.lat !== 'number') {
      return NextResponse.json({
        measurementType: 'route_unavailable',
        error: 'ROUTING_INVALID_INPUT',
        message: 'Origin and destination coordinates are required.',
      }, { status: 400 });
    }

    if (forceEstimate) {
      const estimated = calculateEstimatedRoute(origin, destination, mode);
      return NextResponse.json(estimated);
    }

    const execRes = await executeProviderRequest({
      providerId: 'provider-osrm',
      capability: 'routing',
      input: { origin, destination, mode },
      executorFn: async (input) => fetchVerifiedOsrmRoute(input),
    });

    if (execRes.success && execRes.data) {
      return NextResponse.json(execRes.data);
    }

    // Fallback to estimated route if provider is unavailable
    const fallbackEstimate = calculateEstimatedRoute(origin, destination, mode);
    return NextResponse.json({
      ...fallbackEstimate,
      providerFallbackReason: execRes.error || 'ROUTING_PROVIDER_UNAVAILABLE',
    });
  } catch (error) {
    console.error('Routing API error:', error);
    return NextResponse.json({
      measurementType: 'route_unavailable',
      error: 'ROUTING_UNAVAILABLE',
      message: error.message,
    }, { status: 500 });
  }
}
