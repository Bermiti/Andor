import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

export function readLocalSupabaseStatus() {
  const result = spawnSync(process.execPath, [
    resolve('node_modules/supabase/dist/supabase.js'),
    'status',
    '--output',
    'env',
  ], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error || result.status !== 0) {
    throw new Error('Local Supabase is not running. Run npm run db:start first.');
  }

  return Object.fromEntries(
    result.stdout
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Z0-9_]+)="?([^"\r\n]+)"?$/))
      .filter(Boolean)
      .map((match) => [match[1], match[2]])
  );
}

export function localSupabaseAppEnv(overrides = {}) {
  const status = readLocalSupabaseStatus();
  const apiUrl = status.API_URL;
  const publishableKey = status.PUBLISHABLE_KEY || status.ANON_KEY;
  const secretKey = status.SECRET_KEY || status.SERVICE_ROLE_KEY;

  if (!apiUrl || !publishableKey || !secretKey) {
    throw new Error('Supabase local status did not expose the required application credentials.');
  }

  return {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: apiUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publishableKey,
    SUPABASE_SECRET_KEY: secretKey,
    SUPABASE_SERVICE_ROLE_KEY: secretKey,
    GOOGLE_GENERATIVE_AI_API_KEY: '',
    GROQ_API_KEY: '',
    ANTHROPIC_API_KEY: '',
    OPENTRIPMAP_API_KEY: '',
    FOURSQUARE_API_KEY: '',
    AMADEUS_API_KEY: '',
    AMADEUS_API_SECRET: '',
    FLIGHTS_PROVIDER_SEARCH_URL: '',
    HOTELS_PROVIDER_SEARCH_URL: '',
    RENTAL_CARS_PROVIDER_SEARCH_URL: '',
    PLACES_PROVIDER_SEARCH_URL: '',
    ANDOR_DISABLE_EXTERNAL_ENRICHMENT: '1',
    ANDOR_E2E_LOCAL_AUTH: '0',
    ANDOR_EMAIL_HASH_SECRET: 'andor-local-integration-only-change-in-real-environments',
    RATE_LIMIT_AUTH_LOGIN_MAX: '1000',
    RATE_LIMIT_AUTH_REGISTER_MAX: '1000',
    RATE_LIMIT_AI_GENERATE_MAX: '1000',
    RATE_LIMIT_AI_REGENERATE_MAX: '1000',
    RATE_LIMIT_PUBLIC_SHARE_MAX: '1000',
    RATE_LIMIT_IMPORT_MAX: '1000',
    ...overrides,
  };
}
