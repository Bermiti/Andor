export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  return {
    url,
    publishableKey,
    secretKey,
    hasPublicConfig: Boolean(url && publishableKey),
    hasAdminConfig: Boolean(url && secretKey),
  };
}

export function hasSupabasePublicConfig() {
  return getSupabaseEnv().hasPublicConfig;
}

export function hasSupabaseAdminConfig() {
  return getSupabaseEnv().hasAdminConfig;
}
