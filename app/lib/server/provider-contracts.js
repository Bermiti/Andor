import { z } from 'zod';

export const ProvenanceSchema = z.object({
  sourceType: z.enum(['official', 'verified_provider', 'user', 'ai_proposal', 'estimate', 'legacy', 'demo', 'unknown']),
  provider: z.string(),
  providerRecordId: z.string().optional(),
  retrievedAt: z.string(),
  lastVerifiedAt: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  isOfficial: z.boolean().default(false),
  isCommercial: z.boolean().default(false),
  isEstimated: z.boolean().default(false),
  isAiGenerated: z.boolean().default(false),
  attribution: z.string().optional(),
  license: z.string().optional(),
  confidence: z.number().min(0).max(1).default(1.0),
});

export const GeographicEntitySchema = z.object({
  id: z.string(),
  canonicalName: z.string(),
  localizedNames: z.record(z.string(), z.string()).default({}),
  aliases: z.array(z.string()).default([]),
  entityType: z.enum([
    'continent',
    'subcontinent',
    'sovereign_country',
    'constituent_nation',
    'territory',
    'state',
    'region',
    'province',
    'district',
    'municipality',
    'island',
    'archipelago',
    'city',
    'town',
    'neighborhood',
    'national_park',
    'scenic_route',
    'airport',
    'train_station',
    'port',
    'poi',
  ]),
  countryCode: z.string().regex(/^[A-Z]{2}$/i), // ISO 3166-1 alpha-2
  regionCode: z.string().optional(), // ISO 3166-2 if applicable
  parentId: z.string().nullable().optional(),
  parentPath: z.array(z.string()).default([]),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  boundingBox: z.object({
    minLat: z.number(),
    maxLat: z.number(),
    minLng: z.number(),
    maxLng: z.number(),
  }).optional(),
  timezone: z.string(), // IANA timezone e.g. "Europe/London"
  currencyCodes: z.array(z.string().regex(/^[A-Z]{3}$/i)).default(['EUR']), // ISO 4217
  languageCodes: z.array(z.string()).default(['en']), // BCP 47
  providerRefs: z.record(z.string(), z.string()).default({}),
  provenance: ProvenanceSchema,
});

export const PoiSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  subcategories: z.array(z.string()).default([]),
  description: z.string().optional(),
  countryCode: z.string(),
  regionCode: z.string().optional(),
  locality: z.string().optional(),
  address: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  timezone: z.string().optional(),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  openingHours: z.string().optional(),
  accessibility: z.object({
    wheelchair: z.boolean().optional(),
    mobilityNotes: z.string().optional(),
  }).optional(),
  priceLevel: z.number().min(0).max(4).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().min(0).optional(),
  images: z.array(z.object({
    url: z.string().url(),
    caption: z.string().optional(),
    attribution: z.string().optional(),
  })).default([]),
  provenance: ProvenanceSchema,
});

export const ExchangeRateSchema = z.object({
  baseCurrency: z.string().regex(/^[A-Z]{3}$/i),
  quoteCurrency: z.string().regex(/^[A-Z]{3}$/i),
  rate: z.number().positive(),
  rateType: z.enum(['indicative', 'reference', 'market', 'commercial', 'estimate']),
  effectiveAt: z.string(),
  retrievedAt: z.string(),
  provider: z.string(),
  providerRecordId: z.string().optional(),
  isIndicative: z.boolean().default(true),
  provenance: ProvenanceSchema,
});

export const RouteSchema = z.object({
  origin: z.object({ lat: z.number(), lng: z.number() }),
  destination: z.object({ lat: z.number(), lng: z.number() }),
  mode: z.enum(['walking', 'driving', 'bicycling', 'transit']),
  distanceMeters: z.number().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  geometry: z.string().optional(), // Encoded polyline or GeoJSON string
  provider: z.string(),
  retrievedAt: z.string(),
  trafficIncluded: z.boolean().default(false),
  timetableIncluded: z.boolean().default(false),
  provenance: ProvenanceSchema,
});

export const CoverageCapabilityEnum = z.enum([
  'geography',
  'places',
  'restaurants',
  'activities',
  'accommodation',
  'flights',
  'carRental',
  'weather',
  'publicTransport',
  'drivingRoutes',
  'currency_metadata',
  'exchange_rates',
  'socialSignals',
  'officialTourism',
]);

export const CapabilityStatusEnum = z.enum([
  'verified',
  'available',
  'partial',
  'sandbox_only',
  'provider_unavailable',
  'blocked_by_credentials',
  'blocked_by_contract',
  'not_implemented',
  'unknown',
]);
