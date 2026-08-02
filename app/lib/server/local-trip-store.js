import 'server-only';

import { canPerformTripAction, normalizeTripRole } from '../trip-permissions';
import { getLocalDatabase } from './local-db';
import { createIdentifier } from './security';

function parseJson(value, fallback = null) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapTripRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    ownerId: row.owner_id,
    destination: row.destination,
    itinerary: parseJson(row.itinerary_json, null),
    metadata: parseJson(row.metadata_json, {}),
    visibility: row.visibility || 'private',
    status: row.status || 'draft',
    currency: row.currency || null,
    schemaVersion: Number(row.schema_version) || 1,
    version: Number(row.version) || 1,
    deletedAt: row.deleted_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    role: normalizeTripRole(row.role) || (row.owner_id === row.member_user_id ? 'owner' : null),
  };
}

function safeAuditMetadata(metadata = {}) {
  const allowed = new Set([
    'role',
    'previousRole',
    'source',
    'result',
    'version',
    'reason',
    'audience',
    'importCount',
  ]);
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([key]) => allowed.has(key))
      .map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, 120) : value])
  );
}

export function insertLocalAuditEvent({
  actorUserId = null,
  action,
  resourceType = 'trip',
  resourceId,
  correlationId = null,
  metadata = {},
}) {
  const id = createIdentifier();
  getLocalDatabase().prepare(`
    INSERT INTO audit_events
      (id, actor_user_id, action, resource_type, resource_id, correlation_id, metadata_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    actorUserId,
    String(action).slice(0, 80),
    String(resourceType).slice(0, 40),
    String(resourceId).slice(0, 200),
    correlationId ? String(correlationId).slice(0, 100) : null,
    JSON.stringify(safeAuditMetadata(metadata)),
    new Date().toISOString()
  );
  return id;
}

function readTripForUser(id, userId, includeDeleted = false) {
  const row = getLocalDatabase().prepare(`
    SELECT i.*, m.role, m.user_id AS member_user_id
    FROM itineraries i
    JOIN trip_members m ON m.trip_id = i.id
    WHERE i.id = ?
      AND m.user_id = ?
      AND m.revoked_at IS NULL
      AND (? = 1 OR i.deleted_at IS NULL)
  `).get(String(id), String(userId), includeDeleted ? 1 : 0);
  return mapTripRow(row);
}

export function getLocalTripForUser(id, userId, options = {}) {
  if (!id || !userId) return null;
  return readTripForUser(id, userId, Boolean(options.includeDeleted));
}

export function listLocalTripsForUser(userId) {
  if (!userId) return [];
  return getLocalDatabase().prepare(`
    SELECT i.*, m.role, m.user_id AS member_user_id
    FROM itineraries i
    JOIN trip_members m ON m.trip_id = i.id
    WHERE m.user_id = ?
      AND m.revoked_at IS NULL
      AND i.deleted_at IS NULL
    ORDER BY i.updated_at DESC
  `).all(String(userId)).map(mapTripRow);
}

export function createLocalTrip({
  id = createIdentifier(),
  ownerId,
  destination = '',
  itinerary,
  metadata = {},
  visibility = 'private',
  status = 'draft',
  currency = null,
  schemaVersion = 1,
  correlationId = null,
}) {
  if (!ownerId || !itinerary || typeof itinerary !== 'object') {
    return { ok: false, status: 'invalid' };
  }

  const db = getLocalDatabase();
  const now = new Date().toISOString();
  try {
    db.exec('BEGIN IMMEDIATE');
    db.prepare(`
      INSERT INTO itineraries
        (id, owner_key, owner_id, user_id, destination, itinerary_json, metadata_json,
         visibility, status, currency, schema_version, version, deleted_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NULL, ?, ?)
    `).run(
      id,
      `local:${ownerId}`,
      ownerId,
      ownerId,
      destination,
      JSON.stringify(itinerary),
      JSON.stringify(metadata),
      visibility === 'public' ? 'public' : 'private',
      status,
      currency,
      Number(schemaVersion) || 1,
      now,
      now
    );
    db.prepare(`
      INSERT INTO trip_members
        (trip_id, user_id, role, invited_by, created_at, updated_at, revoked_at)
      VALUES (?, ?, 'owner', ?, ?, ?, NULL)
    `).run(id, ownerId, ownerId, now, now);
    insertLocalAuditEvent({
      actorUserId: ownerId,
      action: 'trip.created',
      resourceId: id,
      correlationId,
      metadata: { source: metadata.source || 'unknown', version: 1 },
    });
    db.exec('COMMIT');
    return { ok: true, trip: readTripForUser(id, ownerId) };
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch {}
    if (/UNIQUE|PRIMARY KEY/i.test(error?.message || '')) {
      return { ok: false, status: 'conflict' };
    }
    return { ok: false, status: 'storage_error', error };
  }
}

export function updateLocalTrip({ id, userId, itinerary, expectedVersion, correlationId = null }) {
  const current = readTripForUser(id, userId);
  if (!current) return { ok: false, status: 'not_found' };
  if (!canPerformTripAction(current.role, 'edit')) return { ok: false, status: 'forbidden' };
  if (current.version !== Number(expectedVersion)) {
    return { ok: false, status: 'conflict', currentVersion: current.version, trip: current };
  }

  const now = new Date().toISOString();
  const result = getLocalDatabase().prepare(`
    UPDATE itineraries
    SET itinerary_json = ?, version = version + 1, updated_at = ?
    WHERE id = ? AND version = ? AND deleted_at IS NULL
  `).run(JSON.stringify(itinerary), now, id, current.version);
  if (!result.changes) {
    const latest = readTripForUser(id, userId);
    return latest
      ? { ok: false, status: 'conflict', currentVersion: latest.version, trip: latest }
      : { ok: false, status: 'not_found' };
  }

  const updated = readTripForUser(id, userId);
  insertLocalAuditEvent({
    actorUserId: userId,
    action: 'trip.updated',
    resourceId: id,
    correlationId,
    metadata: { version: updated.version },
  });
  return { ok: true, trip: updated };
}

export function softDeleteLocalTrip({ id, userId, correlationId = null }) {
  const current = readTripForUser(id, userId);
  if (!current) return { ok: false, status: 'not_found' };
  if (!canPerformTripAction(current.role, 'delete')) return { ok: false, status: 'forbidden' };
  const now = new Date().toISOString();
  const db = getLocalDatabase();
  try {
    db.exec('BEGIN IMMEDIATE');
    db.prepare(`
      UPDATE itineraries
      SET deleted_at = ?, version = version + 1, updated_at = ?
      WHERE id = ? AND owner_id = ? AND deleted_at IS NULL
    `).run(now, now, id, userId);
    db.prepare(`
      UPDATE trip_share_links SET revoked_at = ?
      WHERE trip_id = ? AND revoked_at IS NULL
    `).run(now, id);
    insertLocalAuditEvent({ actorUserId: userId, action: 'trip.deleted', resourceId: id, correlationId });
    db.exec('COMMIT');
    return { ok: true, deletedAt: now };
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch {}
    return { ok: false, status: 'storage_error', error };
  }
}

export function listLocalTripMembers(tripId, actorUserId) {
  const trip = readTripForUser(tripId, actorUserId);
  if (!trip) return { ok: false, status: 'not_found', members: [] };
  if (!canPerformTripAction(trip.role, 'manage_members')) {
    return { ok: false, status: 'forbidden', members: [] };
  }
  const members = getLocalDatabase().prepare(`
    SELECT user_id, role, invited_by, created_at, updated_at, revoked_at
    FROM trip_members WHERE trip_id = ? AND revoked_at IS NULL
    ORDER BY CASE role WHEN 'owner' THEN 0 WHEN 'editor' THEN 1 ELSE 2 END, created_at
  `).all(tripId).map((row) => ({
    userId: row.user_id,
    role: row.role,
    invitedBy: row.invited_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
  return { ok: true, members };
}

export function createLocalInvitation(record) {
  const trip = readTripForUser(record.tripId, record.invitedBy);
  if (!trip) return { ok: false, status: 'not_found' };
  if (!canPerformTripAction(trip.role, 'manage_members')) return { ok: false, status: 'forbidden' };
  if (!['editor', 'viewer'].includes(record.role)) return { ok: false, status: 'invalid' };
  try {
    getLocalDatabase().prepare(`
      INSERT INTO trip_invitations
        (id, trip_id, email_hash, role, invited_by, token_hash, expires_at, revoked_at,
         accepted_by, accepted_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?)
    `).run(
      record.id,
      record.tripId,
      record.emailHash,
      record.role,
      record.invitedBy,
      record.tokenHash,
      record.expiresAt,
      record.createdAt
    );
    insertLocalAuditEvent({
      actorUserId: record.invitedBy,
      action: 'trip.invitation_created',
      resourceType: 'trip_invitation',
      resourceId: record.id,
      metadata: { role: record.role },
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, status: /UNIQUE/i.test(error?.message || '') ? 'conflict' : 'storage_error', error };
  }
}

export function getLocalInvitationByTokenHash(tokenHash) {
  const row = getLocalDatabase().prepare('SELECT * FROM trip_invitations WHERE token_hash = ?').get(tokenHash);
  if (!row) return null;
  return {
    id: row.id,
    tripId: row.trip_id,
    emailHash: row.email_hash,
    role: row.role,
    invitedBy: row.invited_by,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    acceptedBy: row.accepted_by,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  };
}

export function listLocalInvitations(tripId, actorUserId) {
  const trip = readTripForUser(tripId, actorUserId);
  if (!trip) return { ok: false, status: 'not_found', invitations: [] };
  if (!canPerformTripAction(trip.role, 'manage_members')) {
    return { ok: false, status: 'forbidden', invitations: [] };
  }
  const invitations = getLocalDatabase().prepare(`
    SELECT id, trip_id, role, invited_by, expires_at, revoked_at, accepted_by, accepted_at, created_at
    FROM trip_invitations WHERE trip_id = ? ORDER BY created_at DESC
  `).all(tripId).map((row) => ({
    id: row.id,
    tripId: row.trip_id,
    role: row.role,
    invitedBy: row.invited_by,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    acceptedBy: row.accepted_by,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  }));
  return { ok: true, invitations };
}

export function revokeLocalInvitation({ tripId, invitationId, actorUserId }) {
  const trip = readTripForUser(tripId, actorUserId);
  if (!trip) return { ok: false, status: 'not_found' };
  if (!canPerformTripAction(trip.role, 'manage_members')) return { ok: false, status: 'forbidden' };
  const now = new Date().toISOString();
  const result = getLocalDatabase().prepare(`
    UPDATE trip_invitations SET revoked_at = ?
    WHERE id = ? AND trip_id = ? AND revoked_at IS NULL AND accepted_at IS NULL
  `).run(now, invitationId, tripId);
  if (!result.changes) return { ok: false, status: 'not_found' };
  insertLocalAuditEvent({
    actorUserId,
    action: 'trip.invitation_revoked',
    resourceType: 'trip_invitation',
    resourceId: invitationId,
  });
  return { ok: true, revokedAt: now };
}

export function acceptLocalInvitation({ tokenHash, userId, emailHash }) {
  const invitation = getLocalInvitationByTokenHash(tokenHash);
  if (!invitation) return { ok: false, status: 'not_found' };
  if (invitation.revokedAt) return { ok: false, status: 'revoked' };
  if (invitation.acceptedAt) return invitation.acceptedBy === userId
    ? { ok: true, status: 'already_accepted', tripId: invitation.tripId, role: invitation.role }
    : { ok: false, status: 'not_found' };
  if (new Date(invitation.expiresAt).getTime() <= Date.now()) return { ok: false, status: 'expired' };
  if (invitation.emailHash !== emailHash) return { ok: false, status: 'forbidden' };

  const db = getLocalDatabase();
  const now = new Date().toISOString();
  try {
    db.exec('BEGIN IMMEDIATE');
    db.prepare(`
      INSERT INTO trip_members
        (trip_id, user_id, role, invited_by, created_at, updated_at, revoked_at)
      VALUES (?, ?, ?, ?, ?, ?, NULL)
      ON CONFLICT(trip_id, user_id) DO UPDATE SET
        role = CASE WHEN trip_members.role = 'owner' THEN 'owner' ELSE excluded.role END,
        invited_by = excluded.invited_by,
        updated_at = excluded.updated_at,
        revoked_at = NULL
    `).run(invitation.tripId, userId, invitation.role, invitation.invitedBy, now, now);
    db.prepare(`
      UPDATE trip_invitations SET accepted_by = ?, accepted_at = ?
      WHERE id = ? AND accepted_at IS NULL AND revoked_at IS NULL
    `).run(userId, now, invitation.id);
    insertLocalAuditEvent({
      actorUserId: userId,
      action: 'trip.invitation_accepted',
      resourceType: 'trip_invitation',
      resourceId: invitation.id,
      metadata: { role: invitation.role },
    });
    db.exec('COMMIT');
    return { ok: true, tripId: invitation.tripId, role: invitation.role };
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch {}
    return { ok: false, status: 'storage_error', error };
  }
}

export function updateLocalTripMember({ tripId, actorUserId, memberUserId, role }) {
  const trip = readTripForUser(tripId, actorUserId);
  if (!trip) return { ok: false, status: 'not_found' };
  if (!canPerformTripAction(trip.role, 'manage_members')) return { ok: false, status: 'forbidden' };
  if (!['editor', 'viewer'].includes(role)) return { ok: false, status: 'invalid' };
  const current = getLocalDatabase().prepare(`
    SELECT role FROM trip_members WHERE trip_id = ? AND user_id = ? AND revoked_at IS NULL
  `).get(tripId, memberUserId);
  if (!current) return { ok: false, status: 'not_found' };
  if (current.role === 'owner') return { ok: false, status: 'owner_immutable' };
  const now = new Date().toISOString();
  getLocalDatabase().prepare(`
    UPDATE trip_members SET role = ?, updated_at = ?
    WHERE trip_id = ? AND user_id = ? AND role <> 'owner' AND revoked_at IS NULL
  `).run(role, now, tripId, memberUserId);
  insertLocalAuditEvent({
    actorUserId,
    action: 'trip.member_role_changed',
    resourceType: 'trip_member',
    resourceId: `${tripId}:${memberUserId}`,
    metadata: { previousRole: current.role, role },
  });
  return { ok: true, role };
}

export function revokeLocalTripMember({ tripId, actorUserId, memberUserId }) {
  const trip = readTripForUser(tripId, actorUserId);
  if (!trip) return { ok: false, status: 'not_found' };
  if (!canPerformTripAction(trip.role, 'manage_members')) return { ok: false, status: 'forbidden' };
  const current = getLocalDatabase().prepare(`
    SELECT role FROM trip_members WHERE trip_id = ? AND user_id = ? AND revoked_at IS NULL
  `).get(tripId, memberUserId);
  if (!current) return { ok: false, status: 'not_found' };
  if (current.role === 'owner') return { ok: false, status: 'owner_immutable' };
  const now = new Date().toISOString();
  getLocalDatabase().prepare(`
    UPDATE trip_members SET revoked_at = ?, updated_at = ?
    WHERE trip_id = ? AND user_id = ? AND role <> 'owner' AND revoked_at IS NULL
  `).run(now, now, tripId, memberUserId);
  insertLocalAuditEvent({
    actorUserId,
    action: 'trip.member_revoked',
    resourceType: 'trip_member',
    resourceId: `${tripId}:${memberUserId}`,
    metadata: { previousRole: current.role },
  });
  return { ok: true, revokedAt: now };
}

export function insertLocalTripShareLink(record) {
  const trip = readTripForUser(record.tripId, record.createdBy);
  if (!trip) return { ok: false, status: 'not_found' };
  if (!canPerformTripAction(trip.role, 'manage_shares')) return { ok: false, status: 'forbidden' };
  try {
    getLocalDatabase().prepare(`
      INSERT INTO trip_share_links
        (id, trip_id, token_hash, permission, audience, expires_at, revoked_at,
         created_by, created_at, last_accessed_at)
      VALUES (?, ?, ?, 'viewer', 'client', ?, NULL, ?, ?, NULL)
    `).run(record.id, record.tripId, record.tokenHash, record.expiresAt, record.createdBy, record.createdAt);
    insertLocalAuditEvent({
      actorUserId: record.createdBy,
      action: 'trip.share_link_created',
      resourceType: 'trip_share_link',
      resourceId: record.id,
      metadata: { audience: 'client' },
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, status: 'storage_error', error };
  }
}

function mapShareLink(row) {
  if (!row) return null;
  return {
    id: row.id,
    tripId: row.trip_id,
    tokenHash: row.token_hash,
    permission: row.permission,
    audience: row.audience,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    lastAccessedAt: row.last_accessed_at,
  };
}

export function getLocalTripShareLinkByHash(tokenHash) {
  return mapShareLink(getLocalDatabase().prepare('SELECT * FROM trip_share_links WHERE token_hash = ?').get(tokenHash));
}

export function listLocalTripShareLinks(tripId, actorUserId) {
  const trip = readTripForUser(tripId, actorUserId);
  if (!trip) return { ok: false, status: 'not_found', shares: [] };
  if (!canPerformTripAction(trip.role, 'manage_shares')) return { ok: false, status: 'forbidden', shares: [] };
  const shares = getLocalDatabase().prepare(`
    SELECT * FROM trip_share_links WHERE trip_id = ? ORDER BY created_at DESC
  `).all(tripId).map(mapShareLink);
  return { ok: true, shares };
}

export function revokeLocalTripShareLink({ tripId, shareId, actorUserId }) {
  const trip = readTripForUser(tripId, actorUserId);
  if (!trip) return { ok: false, status: 'not_found' };
  if (!canPerformTripAction(trip.role, 'manage_shares')) return { ok: false, status: 'forbidden' };
  const now = new Date().toISOString();
  const result = getLocalDatabase().prepare(`
    UPDATE trip_share_links SET revoked_at = ?
    WHERE id = ? AND trip_id = ? AND revoked_at IS NULL
  `).run(now, shareId, tripId);
  if (!result.changes) return { ok: false, status: 'not_found' };
  insertLocalAuditEvent({
    actorUserId,
    action: 'trip.share_link_revoked',
    resourceType: 'trip_share_link',
    resourceId: shareId,
  });
  return { ok: true, revokedAt: now };
}

export function touchLocalTripShareLink(id) {
  getLocalDatabase().prepare('UPDATE trip_share_links SET last_accessed_at = ? WHERE id = ?')
    .run(new Date().toISOString(), id);
}

export function getLocalTripImport(userId, idempotencyKey) {
  const row = getLocalDatabase().prepare(`
    SELECT * FROM trip_imports WHERE user_id = ? AND idempotency_key = ?
  `).get(userId, idempotencyKey);
  if (!row) return null;
  return {
    userId: row.user_id,
    idempotencyKey: row.idempotency_key,
    payloadHash: row.payload_hash,
    tripId: row.trip_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function recordLocalTripImport({ userId, idempotencyKey, payloadHash, tripId, status = 'completed' }) {
  const now = new Date().toISOString();
  getLocalDatabase().prepare(`
    INSERT INTO trip_imports
      (user_id, idempotency_key, payload_hash, trip_id, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, idempotency_key) DO UPDATE SET
      updated_at = excluded.updated_at
  `).run(userId, idempotencyKey, payloadHash, tripId, status, now, now);
}
