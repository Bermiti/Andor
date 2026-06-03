import { createClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './env';

let adminClient = null;

export function createSupabaseAdminClient() {
  const { url, secretKey, hasAdminConfig } = getSupabaseEnv();
  if (!hasAdminConfig) return null;
  if (!adminClient) {
    adminClient = createClient(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return adminClient;
}
