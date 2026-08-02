'use client';

// Authentication is intentionally handled by same-origin Route Handlers. The
// browser never receives a Supabase client capable of reading session cookies.
export function createSupabaseBrowserClient() {
  return null;
}
