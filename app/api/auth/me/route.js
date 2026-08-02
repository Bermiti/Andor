import { z } from 'zod';
import { apiError, readJsonBody } from '../../../lib/api-utils';
import {
  getOptionalAuthenticatedUser,
  isAuthBoundaryError,
  requireAuthenticatedUser,
  toPublicAuthUser,
} from '../../../lib/server/identity';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export const runtime = 'nodejs';

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  bio: z.string().trim().max(600).optional(),
  interests: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  visitedCountries: z.array(z.string().trim().min(2).max(8)).max(250).optional(),
  lookingForBuddy: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0);

async function loadSupabaseProfile(identity) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('profiles')
    .select('name, email, bio, interests, visited_countries, looking_for_buddy, created_at')
    .eq('id', identity.userId)
    .maybeSingle();
  return data || null;
}

export async function GET() {
  const identity = await getOptionalAuthenticatedUser();
  if (!identity) return apiError('AUTH_REQUIRED', 'Sessao nao autenticada.', 401, false);

  const profile = identity.provider === 'supabase'
    ? await loadSupabaseProfile(identity).catch(() => null)
    : null;
  return Response.json(
    {
      authenticated: true,
      provider: identity.provider,
      user: toPublicAuthUser(identity.user, profile || {}),
    },
    { headers: { 'Cache-Control': 'no-store, private' } }
  );
}

export async function PATCH(req) {
  let identity;
  try {
    identity = await requireAuthenticatedUser();
  } catch (error) {
    if (isAuthBoundaryError(error)) {
      return apiError(error.code, error.message, error.status, false);
    }
    throw error;
  }

  const parsed = profileSchema.safeParse(await readJsonBody(req, 'auth_profile_update'));
  if (!parsed.success) {
    return apiError('INVALID_PROFILE', 'Perfil invalido.', 400, false);
  }

  if (identity.provider === 'local') {
    return Response.json(
      {
        user: toPublicAuthUser({ ...identity.user, ...parsed.data }),
        provider: 'local',
        persistence: 'session-only',
      },
      { headers: { 'Cache-Control': 'no-store, private' } }
    );
  }

  const supabase = await createSupabaseServerClient();
  const row = {
    id: identity.userId,
    email: identity.user.email,
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.name !== undefined) row.name = parsed.data.name;
  if (parsed.data.bio !== undefined) row.bio = parsed.data.bio;
  if (parsed.data.interests !== undefined) row.interests = parsed.data.interests;
  if (parsed.data.visitedCountries !== undefined) row.visited_countries = parsed.data.visitedCountries;
  if (parsed.data.lookingForBuddy !== undefined) row.looking_for_buddy = parsed.data.lookingForBuddy;

  const { data, error } = await supabase
    .from('profiles')
    .upsert(row, { onConflict: 'id' })
    .select('name, email, bio, interests, visited_countries, looking_for_buddy, created_at')
    .single();
  if (error) {
    return apiError('PROFILE_UPDATE_FAILED', 'Nao foi possivel guardar o perfil.', 503, true);
  }

  return Response.json(
    { user: toPublicAuthUser(identity.user, data), provider: 'supabase', persistence: 'supabase' },
    { headers: { 'Cache-Control': 'no-store, private' } }
  );
}
