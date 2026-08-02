import 'server-only';

import { createHmac } from 'node:crypto';
import { createSupabaseAdminClient } from '../supabase/admin';
import { createSupabaseServerClient } from '../supabase/server';
import { logger } from '../logger';
import { getDataBackendMode } from './backend-mode';
import {
  acceptLocalInvitation,
  createLocalInvitation,
  getLocalInvitationByTokenHash,
  listLocalInvitations,
  listLocalTripMembers,
  revokeLocalInvitation,
  revokeLocalTripMember,
  updateLocalTripMember,
} from './local-trip-store';
import { requireTripAction } from './trip-repository';
import { createIdentifier, createOpaqueToken, hashOpaqueToken } from './security';

const INVITATION_TTL_DAYS = 7;

export function emailIdentityHash(email) {
  const normalized = String(email || '').trim().toLowerCase();
  const configured = process.env.ANDOR_EMAIL_HASH_SECRET?.trim();
  if (!configured && process.env.NODE_ENV === 'production' && process.env.ANDOR_E2E_LOCAL_AUTH !== '1') {
    const error = new Error('ANDOR_EMAIL_HASH_SECRET is required in production.');
    error.code = 'INVITATION_CONFIG_MISSING';
    throw error;
  }
  return createHmac('sha256', configured || 'andor-local-development-email-hash-v1')
    .update(normalized)
    .digest('hex');
}

function publicInvitation(row) {
  return {
    id: row.id,
    tripId: row.trip_id || row.tripId,
    role: row.role,
    invitedBy: row.invited_by || row.invitedBy,
    expiresAt: row.expires_at || row.expiresAt,
    revokedAt: row.revoked_at || row.revokedAt,
    acceptedBy: row.accepted_by || row.acceptedBy,
    acceptedAt: row.accepted_at || row.acceptedAt,
    createdAt: row.created_at || row.createdAt,
  };
}

export async function listTripAccess(tripId, identity) {
  const permission = await requireTripAction(tripId, identity, 'manage_members');
  if (!permission.ok) return permission;
  const mode = getDataBackendMode();
  if (mode === 'sqlite') {
    const members = listLocalTripMembers(tripId, identity.userId);
    const invitations = listLocalInvitations(tripId, identity.userId);
    return {
      ok: true,
      provider: 'sqlite',
      members: members.members,
      invitations: invitations.invitations.map(publicInvitation),
    };
  }
  if (mode !== 'supabase') return { ok: false, status: 'persistence_unavailable' };
  const supabase = await createSupabaseServerClient();
  const [{ data: members, error: memberError }, { data: invitations, error: invitationError }] = await Promise.all([
    supabase
      .from('trip_members')
      .select('user_id, role, invited_by, created_at, updated_at, revoked_at')
      .eq('trip_id', tripId)
      .is('revoked_at', null),
    supabase
      .from('trip_invitations')
      .select('id, trip_id, role, invited_by, expires_at, revoked_at, accepted_by, accepted_at, created_at')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false }),
  ]);
  if (memberError || invitationError) {
    logger.warn('membership_repository:list_failed', memberError || invitationError, { tripId });
    return { ok: false, status: 'storage_error' };
  }
  return {
    ok: true,
    provider: 'supabase',
    members: (members || []).map((row) => ({
      userId: row.user_id,
      role: row.role,
      invitedBy: row.invited_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    invitations: (invitations || []).map(publicInvitation),
  };
}

export async function createTripInvitation({ tripId, email, role }, identity) {
  const permission = await requireTripAction(tripId, identity, 'manage_members');
  if (!permission.ok) return permission;
  if (!['editor', 'viewer'].includes(role)) return { ok: false, status: 'invalid' };
  let emailHash;
  try {
    emailHash = emailIdentityHash(email);
  } catch {
    return { ok: false, status: 'configuration_error' };
  }
  const token = createOpaqueToken(32);
  const record = {
    id: createIdentifier(),
    tripId,
    emailHash,
    role,
    invitedBy: identity.userId,
    tokenHash: hashOpaqueToken(token),
    expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  const mode = getDataBackendMode();
  if (mode === 'sqlite') {
    const result = createLocalInvitation(record);
    return result.ok
      ? { ok: true, provider: 'sqlite', token, invitation: publicInvitation(record) }
      : result;
  }
  if (mode !== 'supabase') return { ok: false, status: 'persistence_unavailable' };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('trip_invitations').insert({
    id: record.id,
    trip_id: record.tripId,
    email_hash: record.emailHash,
    role: record.role,
    invited_by: record.invitedBy,
    token_hash: record.tokenHash,
    expires_at: record.expiresAt,
    created_at: record.createdAt,
  });
  if (error) {
    logger.warn('membership_repository:invite_failed', error, { tripId });
    return { ok: false, status: error.code === '23505' ? 'conflict' : 'storage_error' };
  }
  await supabase.from('audit_events').insert({
    actor_user_id: identity.userId,
    action: 'trip.invitation_created',
    resource_type: 'trip_invitation',
    resource_id: record.id,
    metadata: { role },
  });
  return { ok: true, provider: 'supabase', token, invitation: publicInvitation(record) };
}

export async function acceptTripInvitation(token, identity) {
  if (!identity?.authenticated || !identity.userId) return { ok: false, status: 'auth_required' };
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return { ok: false, status: 'not_found' };
  const email = identity.email || identity.user?.email;
  if (!email) return { ok: false, status: 'forbidden' };
  let emailHash;
  try {
    emailHash = emailIdentityHash(email);
  } catch {
    return { ok: false, status: 'configuration_error' };
  }
  const tokenHash = hashOpaqueToken(token);
  const mode = getDataBackendMode();
  if (mode === 'sqlite') {
    if (!getLocalInvitationByTokenHash(tokenHash)) return { ok: false, status: 'not_found' };
    return { ...acceptLocalInvitation({ tokenHash, userId: identity.userId, emailHash }), provider: 'sqlite' };
  }
  if (mode !== 'supabase') return { ok: false, status: 'persistence_unavailable' };

  // Narrow service-role boundary: resolve one opaque invitation hash, verify the
  // authenticated user's email fingerprint, and create only the role stored by the owner.
  const admin = createSupabaseAdminClient();
  if (!admin) return { ok: false, status: 'persistence_unavailable' };
  const { data: invitation, error } = await admin
    .from('trip_invitations')
    .select('*')
    .eq('token_hash', tokenHash)
    .maybeSingle();
  if (error || !invitation) return { ok: false, status: 'not_found' };
  if (invitation.revoked_at) return { ok: false, status: 'revoked' };
  if (invitation.accepted_at) return invitation.accepted_by === identity.userId
    ? { ok: true, status: 'already_accepted', provider: 'supabase', tripId: invitation.trip_id, role: invitation.role }
    : { ok: false, status: 'not_found' };
  if (new Date(invitation.expires_at).getTime() <= Date.now()) return { ok: false, status: 'expired' };
  if (invitation.email_hash !== emailHash) return { ok: false, status: 'forbidden' };
  if (!['editor', 'viewer'].includes(invitation.role)) return { ok: false, status: 'forbidden' };

  const now = new Date().toISOString();
  const { error: memberError } = await admin.from('trip_members').upsert({
    trip_id: invitation.trip_id,
    user_id: identity.userId,
    role: invitation.role,
    invited_by: invitation.invited_by,
    updated_at: now,
    revoked_at: null,
  }, { onConflict: 'trip_id,user_id' });
  if (memberError) return { ok: false, status: 'storage_error' };
  const { error: acceptError } = await admin
    .from('trip_invitations')
    .update({ accepted_by: identity.userId, accepted_at: now })
    .eq('id', invitation.id)
    .is('accepted_at', null)
    .is('revoked_at', null);
  if (acceptError) return { ok: false, status: 'storage_error' };
  await admin.from('audit_events').insert({
    actor_user_id: identity.userId,
    action: 'trip.invitation_accepted',
    resource_type: 'trip_invitation',
    resource_id: invitation.id,
    metadata: { role: invitation.role },
  });
  return { ok: true, provider: 'supabase', tripId: invitation.trip_id, role: invitation.role };
}

export async function updateTripMember({ tripId, memberUserId, role }, identity) {
  const permission = await requireTripAction(tripId, identity, 'manage_members');
  if (!permission.ok) return permission;
  if (!['editor', 'viewer'].includes(role)) return { ok: false, status: 'invalid' };
  const mode = getDataBackendMode();
  if (mode === 'sqlite') return { ...updateLocalTripMember({ tripId, actorUserId: identity.userId, memberUserId, role }), provider: 'sqlite' };
  if (mode !== 'supabase') return { ok: false, status: 'persistence_unavailable' };
  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', memberUserId)
    .is('revoked_at', null)
    .maybeSingle();
  if (!current) return { ok: false, status: 'not_found' };
  if (current.role === 'owner') return { ok: false, status: 'owner_immutable' };
  const { data, error } = await supabase
    .from('trip_members')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('trip_id', tripId)
    .eq('user_id', memberUserId)
    .neq('role', 'owner')
    .select('role')
    .maybeSingle();
  if (error) return { ok: false, status: 'storage_error' };
  if (!data) return { ok: false, status: 'not_found' };
  return { ok: true, provider: 'supabase', role: data.role };
}

export async function revokeTripMember({ tripId, memberUserId }, identity) {
  const permission = await requireTripAction(tripId, identity, 'manage_members');
  if (!permission.ok) return permission;
  const mode = getDataBackendMode();
  if (mode === 'sqlite') return { ...revokeLocalTripMember({ tripId, actorUserId: identity.userId, memberUserId }), provider: 'sqlite' };
  if (mode !== 'supabase') return { ok: false, status: 'persistence_unavailable' };
  const supabase = await createSupabaseServerClient();
  const revokedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('trip_members')
    .update({ revoked_at: revokedAt, updated_at: revokedAt })
    .eq('trip_id', tripId)
    .eq('user_id', memberUserId)
    .neq('role', 'owner')
    .is('revoked_at', null)
    .select('user_id')
    .maybeSingle();
  if (error) return { ok: false, status: 'storage_error' };
  return data ? { ok: true, provider: 'supabase', revokedAt } : { ok: false, status: 'not_found' };
}

export async function revokeTripInvitation({ tripId, invitationId }, identity) {
  const permission = await requireTripAction(tripId, identity, 'manage_members');
  if (!permission.ok) return permission;
  const mode = getDataBackendMode();
  if (mode === 'sqlite') return { ...revokeLocalInvitation({ tripId, invitationId, actorUserId: identity.userId }), provider: 'sqlite' };
  if (mode !== 'supabase') return { ok: false, status: 'persistence_unavailable' };
  const supabase = await createSupabaseServerClient();
  const revokedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('trip_invitations')
    .update({ revoked_at: revokedAt })
    .eq('id', invitationId)
    .eq('trip_id', tripId)
    .is('revoked_at', null)
    .is('accepted_at', null)
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, status: 'storage_error' };
  return data ? { ok: true, provider: 'supabase', revokedAt } : { ok: false, status: 'not_found' };
}
