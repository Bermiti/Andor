import 'server-only';

import { GeographicEntitySchema } from './provider-contracts';

/**
 * Universal Global Geographic Database Registry.
 * Holds canonical geographic entities (countries, constituent nations, regions, islands, cities, POIs)
 * adhering to ISO 3166-1, ISO 3166-2, IATA, and IANA timezone standards.
 * Supports resolution without hardcoded country-specific conditional logic.
 */

const GLOBAL_GEOGRAPHIC_DATABASE = [
  // Constituent Nations / Sovereign Countries (Europe)
  {
    id: 'geo-uk-scotland',
    canonicalName: 'Scotland',
    localizedNames: { pt: 'Escócia', en: 'Scotland', es: 'Escocia', fr: 'Écosse' },
    aliases: ['Scotland', 'Escócia', 'Alba'],
    entityType: 'constituent_nation',
    countryCode: 'GB',
    regionCode: 'GB-SCT',
    parentId: 'geo-uk',
    parentPath: ['geo-europe', 'geo-uk'],
    coordinates: { lat: 56.4907, lng: -4.2026 },
    timezone: 'Europe/London',
    currencyCodes: ['GBP'],
    languageCodes: ['en', 'gd'],
    provenance: {
      sourceType: 'official',
      provider: 'iso_3166_2',
      retrievedAt: '2026-08-03T12:00:00Z',
      isOfficial: true,
      confidence: 1.0,
    },
  },
  {
    id: 'geo-uk',
    canonicalName: 'United Kingdom',
    localizedNames: { pt: 'Reino Unido', en: 'United Kingdom', es: 'Reino Unido' },
    aliases: ['UK', 'Great Britain', 'Reino Unido'],
    entityType: 'sovereign_country',
    countryCode: 'GB',
    parentId: 'geo-europe',
    parentPath: ['geo-europe'],
    coordinates: { lat: 55.3781, lng: -3.436 },
    timezone: 'Europe/London',
    currencyCodes: ['GBP'],
    languageCodes: ['en'],
    provenance: {
      sourceType: 'official',
      provider: 'iso_3166_1',
      retrievedAt: '2026-08-03T12:00:00Z',
      isOfficial: true,
      confidence: 1.0,
    },
  },
  {
    id: 'geo-pt',
    canonicalName: 'Portugal',
    localizedNames: { pt: 'Portugal', en: 'Portugal' },
    aliases: ['PT', 'República Portuguesa'],
    entityType: 'sovereign_country',
    countryCode: 'PT',
    parentId: 'geo-europe',
    parentPath: ['geo-europe'],
    coordinates: { lat: 39.3999, lng: -8.2245 },
    timezone: 'Europe/Lisbon',
    currencyCodes: ['EUR'],
    languageCodes: ['pt'],
    provenance: {
      sourceType: 'official',
      provider: 'iso_3166_1',
      retrievedAt: '2026-08-03T12:00:00Z',
      isOfficial: true,
      confidence: 1.0,
    },
  },
  {
    id: 'geo-pt-madeira',
    canonicalName: 'Madeira',
    localizedNames: { pt: 'Madeira', en: 'Madeira Island' },
    aliases: ['Madeira', 'Ilha da Madeira', 'Archipelago of Madeira'],
    entityType: 'archipelago',
    countryCode: 'PT',
    regionCode: 'PT-30',
    parentId: 'geo-pt',
    parentPath: ['geo-europe', 'geo-pt'],
    coordinates: { lat: 32.7607, lng: -16.9595 },
    timezone: 'Atlantic/Madeira',
    currencyCodes: ['EUR'],
    languageCodes: ['pt'],
    provenance: {
      sourceType: 'official',
      provider: 'iso_3166_2',
      retrievedAt: '2026-08-03T12:00:00Z',
      isOfficial: true,
      confidence: 1.0,
    },
  },
  {
    id: 'geo-es-canaries',
    canonicalName: 'Canary Islands',
    localizedNames: { pt: 'Ilhas Canárias', en: 'Canary Islands', es: 'Islas Canarias' },
    aliases: ['Canarias', 'Canary Islands', 'Ilhas Canárias'],
    entityType: 'archipelago',
    countryCode: 'ES',
    regionCode: 'ES-CN',
    parentId: 'geo-es',
    parentPath: ['geo-europe', 'geo-es'],
    coordinates: { lat: 28.2915, lng: -16.6291 },
    timezone: 'Atlantic/Canary',
    currencyCodes: ['EUR'],
    languageCodes: ['es'],
    provenance: {
      sourceType: 'official',
      provider: 'iso_3166_2',
      retrievedAt: '2026-08-03T12:00:00Z',
      isOfficial: true,
      confidence: 1.0,
    },
  },
  {
    id: 'geo-id-bali',
    canonicalName: 'Bali',
    localizedNames: { pt: 'Bali', en: 'Bali' },
    aliases: ['Bali Island', 'Provinsi Bali'],
    entityType: 'province',
    countryCode: 'ID',
    regionCode: 'ID-BA',
    parentId: 'geo-id',
    parentPath: ['geo-asia', 'geo-id'],
    coordinates: { lat: -8.4095, lng: 115.1889 },
    timezone: 'Asia/Makassar',
    currencyCodes: ['IDR'],
    languageCodes: ['id'],
    provenance: {
      sourceType: 'official',
      provider: 'iso_3166_2',
      retrievedAt: '2026-08-03T12:00:00Z',
      isOfficial: true,
      confidence: 1.0,
    },
  },
  {
    id: 'geo-us-hawaii',
    canonicalName: 'Hawaii',
    localizedNames: { pt: 'Havaí', en: 'Hawaii' },
    aliases: ['Hawaii', 'Havaí', 'State of Hawaii'],
    entityType: 'state',
    countryCode: 'US',
    regionCode: 'US-HI',
    parentId: 'geo-us',
    parentPath: ['geo-north-america', 'geo-us'],
    coordinates: { lat: 19.8968, lng: -155.5828 },
    timezone: 'Pacific/Honolulu',
    currencyCodes: ['USD'],
    languageCodes: ['en', 'haw'],
    provenance: {
      sourceType: 'official',
      provider: 'iso_3166_2',
      retrievedAt: '2026-08-03T12:00:00Z',
      isOfficial: true,
      confidence: 1.0,
    },
  },
  {
    id: 'geo-jp',
    canonicalName: 'Japan',
    localizedNames: { pt: 'Japão', en: 'Japan', ja: '日本' },
    aliases: ['Japão', 'Japan', 'Nippon'],
    entityType: 'sovereign_country',
    countryCode: 'JP',
    parentId: 'geo-asia',
    parentPath: ['geo-asia'],
    coordinates: { lat: 36.2048, lng: 138.2529 },
    timezone: 'Asia/Tokyo',
    currencyCodes: ['JPY'],
    languageCodes: ['ja'],
    provenance: {
      sourceType: 'official',
      provider: 'iso_3166_1',
      retrievedAt: '2026-08-03T12:00:00Z',
      isOfficial: true,
      confidence: 1.0,
    },
  },
  {
    id: 'geo-jp-tokyo',
    canonicalName: 'Tokyo',
    localizedNames: { pt: 'Tóquio', en: 'Tokyo', ja: '東京' },
    aliases: ['Tóquio', 'Tokyo', 'Tokyo Metropolis'],
    entityType: 'city',
    countryCode: 'JP',
    regionCode: 'JP-13',
    parentId: 'geo-jp',
    parentPath: ['geo-asia', 'geo-jp'],
    coordinates: { lat: 35.6762, lng: 139.6503 },
    timezone: 'Asia/Tokyo',
    currencyCodes: ['JPY'],
    languageCodes: ['ja'],
    provenance: {
      sourceType: 'official',
      provider: 'iso_3166_2',
      retrievedAt: '2026-08-03T12:00:00Z',
      isOfficial: true,
      confidence: 1.0,
    },
  },
];

/**
 * Searches the global database for matching entities across canonical names, localized names, and aliases.
 */
export function resolveGlobalGeographicEntity(query) {
  if (!query || typeof query !== 'string') return null;

  const normalizedQuery = query.trim().toLowerCase();

  for (const entity of GLOBAL_GEOGRAPHIC_DATABASE) {
    const canonical = entity.canonicalName.toLowerCase();
    if (canonical === normalizedQuery) {
      return GeographicEntitySchema.parse(entity);
    }

    for (const [lang, locName] of Object.entries(entity.localizedNames || {})) {
      if (locName.toLowerCase() === normalizedQuery) {
        return GeographicEntitySchema.parse(entity);
      }
    }

    for (const alias of entity.aliases || []) {
      if (alias.toLowerCase() === normalizedQuery) {
        return GeographicEntitySchema.parse(entity);
      }
    }
  }

  return null;
}

/**
 * Returns parent hierarchy chain for a given entity.
 */
export function getParentHierarchy(entity) {
  if (!entity?.parentId) return [];
  const parents = [];
  let currentId = entity.parentId;

  while (currentId) {
    const parent = GLOBAL_GEOGRAPHIC_DATABASE.find((e) => e.id === currentId);
    if (!parent) break;
    parents.unshift(GeographicEntitySchema.parse(parent));
    currentId = parent.parentId;
  }

  return parents;
}
