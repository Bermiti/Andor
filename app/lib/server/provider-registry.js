import 'server-only';

import { logger } from '../logger';

/**
 * Server-side Central Provider Registry.
 * Registers external APIs, datasets, and internal fallback engines.
 * Exposes capability resolution and provider health tracking.
 */
class ProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.registerDefaults();
  }

  registerDefaults() {
    // OpenStreetMap Nominatim Geography Provider
    this.registerProvider({
      id: 'provider-nominatim',
      name: 'OpenStreetMap Nominatim',
      capabilities: ['geography', 'places'],
      supportedCountries: ['*'],
      environment: 'production',
      attributionRequirements: '© OpenStreetMap contributors',
      cachePolicy: { ttlSeconds: 86400 * 30 }, // 30 days
      healthStatus: 'healthy',
    });

    // OpenTripMap POI Provider
    this.registerProvider({
      id: 'provider-opentripmap',
      name: 'OpenTripMap API',
      capabilities: ['activities', 'places'],
      supportedCountries: ['*'],
      environment: 'production',
      attributionRequirements: 'Data by OpenTripMap / OpenStreetMap',
      cachePolicy: { ttlSeconds: 86400 * 7 },
      healthStatus: 'healthy',
    });

    // Google Gemini / Groq AI Provider
    this.registerProvider({
      id: 'provider-llm-engine',
      name: 'Andor Multi-LLM Engine (Gemini / Groq)',
      capabilities: ['geography', 'places', 'restaurants', 'activities'],
      supportedCountries: ['*'],
      environment: 'production',
      attributionRequirements: 'AI-assisted travel itinerary proposal',
      cachePolicy: { ttlSeconds: 3600 },
      healthStatus: 'healthy',
    });
  }

  registerProvider(provider) {
    this.providers.set(provider.id, {
      lastVerifiedAt: new Date().toISOString(),
      ...provider,
    });
  }

  getProvidersForCapability(capability) {
    const matched = [];
    for (const provider of this.providers.values()) {
      if (provider.capabilities.includes(capability) && provider.healthStatus === 'healthy') {
        matched.push(provider);
      }
    }
    return matched;
  }

  getProviderCoverage(countryCode) {
    const coverage = {
      geography: 'available',
      places: 'available',
      restaurants: 'partial',
      activities: 'available',
      accommodation: 'blocked_by_credentials',
      flights: 'blocked_by_credentials',
      carRental: 'blocked_by_credentials',
      weather: 'available',
      currency: 'available',
      publicTransport: 'partial',
    };
    return coverage;
  }

  isProviderHealthy(providerId) {
    const provider = this.providers.get(providerId);
    return provider ? provider.healthStatus === 'healthy' : false;
  }
}

const centralRegistry = new ProviderRegistry();

export function getCentralProviderRegistry() {
  return centralRegistry;
}
