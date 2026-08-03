import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  getParentHierarchy,
  resolveGlobalGeographicEntity,
} from '../app/lib/server/global-geography';
import { GeographicEntitySchema } from '../app/lib/server/provider-contracts';
import { getCentralProviderRegistry } from '../app/lib/server/provider-registry';

describe('Global Geographic Resolution & Provider Contract Suite', () => {
  it('resolves constituent nations without special hardcoded conditional logic', () => {
    const scotlandPt = resolveGlobalGeographicEntity('Escócia');
    expect(scotlandPt).not.toBeNull();
    expect(scotlandPt.canonicalName).toBe('Scotland');
    expect(scotlandPt.countryCode).toBe('GB');
    expect(scotlandPt.entityType).toBe('constituent_nation');

    const scotlandEn = resolveGlobalGeographicEntity('Scotland');
    expect(scotlandEn).not.toBeNull();
    expect(scotlandEn.canonicalName).toBe('Scotland');
  });

  it('resolves island territories, archipelagos, and provinces correctly', () => {
    const madeira = resolveGlobalGeographicEntity('Madeira');
    expect(madeira).not.toBeNull();
    expect(madeira.countryCode).toBe('PT');
    expect(madeira.entityType).toBe('archipelago');

    const bali = resolveGlobalGeographicEntity('Bali');
    expect(bali).not.toBeNull();
    expect(bali.countryCode).toBe('ID');
    expect(bali.currencyCodes).toContain('IDR');

    const hawaii = resolveGlobalGeographicEntity('Havaí');
    expect(hawaii).not.toBeNull();
    expect(hawaii.countryCode).toBe('US');
    expect(hawaii.entityType).toBe('state');
  });

  it('returns parent hierarchy chain up to top-level sovereign country', () => {
    const scotland = resolveGlobalGeographicEntity('Scotland');
    const hierarchy = getParentHierarchy(scotland);

    expect(hierarchy.length).toBeGreaterThan(0);
    expect(hierarchy[0].canonicalName).toBe('United Kingdom');
    expect(hierarchy[0].countryCode).toBe('GB');
  });

  it('queries central provider registry for capabilities and coverage status', () => {
    const registry = getCentralProviderRegistry();
    const geoProviders = registry.getProvidersForCapability('geography');
    expect(geoProviders.length).toBeGreaterThan(0);

    const ptCoverage = registry.getProviderCoverage('PT');
    expect(ptCoverage.geography).toBe('validated_locally');
    expect(ptCoverage.accommodation).toBe('blocked_by_credentials');
  });
});
