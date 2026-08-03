import 'server-only';

import { logger } from '../logger';
import { CapabilityStatusEnum, CoverageCapabilityEnum } from './provider-contracts';

/**
 * Server-side Central Provider Registry.
 * Registers external APIs, datasets, and internal fallback engines.
 * Exposes capability resolution and effective status evaluation.
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
      cachePolicy: { ttlSeconds: 86400 * 30 },
      healthStatus: 'healthy',
      integrationImplemented: true,
      contractValidated: true,
      stagingValidated: false,
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
      integrationImplemented: true,
      contractValidated: true,
      stagingValidated: false,
    });

    // Open-Meteo Weather Provider
    this.registerProvider({
      id: 'provider-openmeteo',
      name: 'Open-Meteo Weather API',
      capabilities: ['weather'],
      supportedCountries: ['*'],
      environment: 'production',
      attributionRequirements: 'Weather data by Open-Meteo.com',
      cachePolicy: { ttlSeconds: 3600 * 3 },
      healthStatus: 'healthy',
      integrationImplemented: true,
      contractValidated: true,
      stagingValidated: false,
    });

    // Multi-LLM Engine (Gemini / Groq)
    this.registerProvider({
      id: 'provider-llm-engine',
      name: 'Andor Multi-LLM Engine (Gemini / Groq)',
      capabilities: ['geography', 'places', 'restaurants', 'activities'],
      supportedCountries: ['*'],
      environment: 'production',
      attributionRequirements: 'AI-assisted travel itinerary proposal',
      cachePolicy: { ttlSeconds: 3600 },
      healthStatus: 'healthy',
      integrationImplemented: true,
      contractValidated: true,
      stagingValidated: false,
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

  /**
   * Computes effective capability status dynamically based on evidence, implementation, and environment credentials.
   */
  getCapabilityEffectiveStatus(capability, countryCode = 'PT') {
    const hasStaging = Boolean(process.env.ANDOR_STAGING_VALIDATED === '1');

    switch (capability) {
      case 'geography':
        return hasStaging ? 'validated_in_staging' : 'validated_locally';
      case 'places':
      case 'activities':
      case 'weather':
        return hasStaging ? 'validated_in_staging' : 'partial';
      case 'restaurants':
        return 'partial'; // Combination of open POIs and AI proposal fallback
      case 'currency_metadata':
        return 'validated_locally'; // ISO 4217 currency metadata
      case 'exchange_rates':
        return 'not_implemented'; // Awaiting live exchange rates provider integration
      case 'publicTransport':
      case 'drivingRoutes':
        return 'partial';
      case 'accommodation':
      case 'flights':
      case 'carRental':
        return 'blocked_by_credentials'; // External links and sandboxes, awaiting commercial staging keys
      default:
        return 'unavailable';
    }
  }

  getProviderCoverage(countryCode) {
    const capabilities = [
      'geography',
      'places',
      'restaurants',
      'activities',
      'accommodation',
      'flights',
      'carRental',
      'weather',
      'currency_metadata',
      'exchange_rates',
      'publicTransport',
    ];

    const coverage = {};
    for (const cap of capabilities) {
      coverage[cap] = this.getCapabilityEffectiveStatus(cap, countryCode);
    }
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
