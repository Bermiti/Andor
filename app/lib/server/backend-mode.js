import 'server-only';

import { hasSupabasePublicConfig } from '../supabase/env';

export function isLocalAdapterEnabled() {
  return process.env.NODE_ENV !== 'production' || process.env.ANDOR_E2E_LOCAL_AUTH === '1';
}

export function getDataBackendMode() {
  if (hasSupabasePublicConfig()) return 'supabase';
  if (isLocalAdapterEnabled()) return 'sqlite';
  return 'unavailable';
}

export function assertDataBackendAvailable() {
  const mode = getDataBackendMode();
  if (mode === 'unavailable') {
    const error = new Error('Durable Supabase persistence is not configured.');
    error.code = 'PERSISTENCE_UNAVAILABLE';
    error.status = 503;
    throw error;
  }
  return mode;
}
