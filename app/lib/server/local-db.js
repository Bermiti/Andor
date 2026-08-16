import 'server-only';

import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createIdentifier } from './security';

let database = null;

function databasePath() {
  const configured = process.env.ANDOR_SQLITE_PATH?.trim();
  if (process.env.NODE_ENV === 'production' && !configured) {
    throw new Error(
      'Durable persistence is not configured. Set Supabase credentials or an explicit ANDOR_SQLITE_PATH for a persistent self-hosted deployment.'
    );
  }
  return configured ? resolve(configured) : join(process.cwd(), '.andor', 'andor.sqlite');
}

function parseJson(value, fallback = null) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

export function getLocalDatabase() {
  if (database) return database;

  const path = databasePath();
  mkdirSync(dirname(path), { recursive: true });
  database = new DatabaseSync(path);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS local_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS local_sessions_user_idx
      ON local_sessions(user_id, expires_at);

    CREATE TABLE IF NOT EXISTS itineraries (
      id TEXT PRIMARY KEY,
      owner_key TEXT NOT NULL,
      user_id TEXT,
      destination TEXT,
      itinerary_json TEXT NOT NULL,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS itineraries_owner_idx
      ON itineraries(owner_key, updated_at DESC);

    CREATE TABLE IF NOT EXISTS itinerary_shares (
      id TEXT PRIMARY KEY,
      source_key TEXT NOT NULL,
      owner_key TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      audience TEXT NOT NULL CHECK (audience IN ('client', 'internal')),
      payload_json TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      created_at TEXT NOT NULL,
      last_accessed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS itinerary_shares_owner_idx
      ON itinerary_shares(owner_key, source_key, created_at DESC);

    CREATE TABLE IF NOT EXISTS trip_ledgers (
      trip_key TEXT NOT NULL,
      owner_key TEXT NOT NULL,
      ledger_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (trip_key, owner_key)
    );

    CREATE TABLE IF NOT EXISTS trip_members (
      trip_id TEXT NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
      invited_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      revoked_at TEXT,
      PRIMARY KEY (trip_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS trip_members_user_idx
      ON trip_members(user_id, revoked_at, updated_at DESC);

    CREATE TABLE IF NOT EXISTS trip_invitations (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
      email_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
      invited_by TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      accepted_by TEXT,
      accepted_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS trip_invitations_trip_idx
      ON trip_invitations(trip_id, revoked_at, expires_at);

    CREATE TABLE IF NOT EXISTS trip_share_links (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      permission TEXT NOT NULL DEFAULT 'viewer' CHECK (permission = 'viewer'),
      audience TEXT NOT NULL DEFAULT 'client' CHECK (audience = 'client'),
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_accessed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS trip_share_links_trip_idx
      ON trip_share_links(trip_id, revoked_at, expires_at, created_at DESC);

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      actor_user_id TEXT,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      correlation_id TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS audit_events_resource_idx
      ON audit_events(resource_type, resource_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS trip_imports (
      user_id TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      payload_hash TEXT NOT NULL,
      trip_id TEXT REFERENCES itineraries(id) ON DELETE SET NULL,
      status TEXT NOT NULL CHECK (status IN ('completed', 'conflict', 'failed')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, idempotency_key)
    );

    CREATE TABLE IF NOT EXISTS generation_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      request_hash TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
      lease_token TEXT,
      lease_expires_at TEXT,
      attempt_count INTEGER NOT NULL DEFAULT 1 CHECK (attempt_count > 0),
      checkpoint_json TEXT NOT NULL DEFAULT '{}',
      trip_id TEXT REFERENCES itineraries(id) ON DELETE SET NULL,
      response_json TEXT,
      failure_code TEXT,
      retryable INTEGER NOT NULL DEFAULT 1 CHECK (retryable IN (0, 1)),
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (user_id, idempotency_key),
      CHECK (
        length(idempotency_key) BETWEEN 16 AND 128
        AND idempotency_key = trim(idempotency_key)
      ),
      CHECK (
        length(request_hash) = 64
        AND request_hash NOT GLOB '*[^0-9a-f]*'
      ),
      CHECK ((lease_token IS NULL) = (lease_expires_at IS NULL)),
      CHECK (
        failure_code IS NULL
        OR (
          length(failure_code) BETWEEN 3 AND 80
          AND failure_code GLOB '[A-Za-z]*'
          AND failure_code NOT GLOB '*[^A-Za-z0-9_.-]*'
        )
      ),
      CHECK (expires_at > created_at),
      CHECK (
        (
          status = 'pending'
          AND lease_token IS NOT NULL
          AND trip_id IS NULL
          AND response_json IS NULL
          AND failure_code IS NULL
          AND retryable = 1
        )
        OR (
          status = 'completed'
          AND lease_token IS NULL
          AND response_json IS NOT NULL
          AND failure_code IS NULL
          AND retryable = 0
        )
        OR (
          status = 'failed'
          AND lease_token IS NULL
          AND trip_id IS NULL
          AND response_json IS NULL
          AND failure_code IS NOT NULL
        )
      )
    );

    CREATE INDEX IF NOT EXISTS generation_requests_user_status_idx
      ON generation_requests(user_id, status, updated_at DESC);

    CREATE INDEX IF NOT EXISTS generation_requests_lease_idx
      ON generation_requests(status, lease_expires_at);

    CREATE INDEX IF NOT EXISTS generation_requests_expiry_idx
      ON generation_requests(expires_at);
  `);

  const itineraryColumns = new Set(
    database.prepare('PRAGMA table_info(itineraries)').all().map((column) => column.name)
  );
  const additiveColumns = [
    ['owner_id', 'TEXT'],
    ['visibility', "TEXT NOT NULL DEFAULT 'private'"],
    ['status', "TEXT NOT NULL DEFAULT 'draft'"],
    ['currency', 'TEXT'],
    ['schema_version', 'INTEGER NOT NULL DEFAULT 1'],
    ['version', 'INTEGER NOT NULL DEFAULT 1'],
    ['deleted_at', 'TEXT'],
  ];
  additiveColumns.forEach(([name, definition]) => {
    if (!itineraryColumns.has(name)) {
      database.exec(`ALTER TABLE itineraries ADD COLUMN ${name} ${definition}`);
    }
  });

  database.exec(`
    UPDATE itineraries
    SET owner_id = user_id
    WHERE owner_id IS NULL AND user_id IS NOT NULL;

    INSERT OR IGNORE INTO trip_members
      (trip_id, user_id, role, invited_by, created_at, updated_at, revoked_at)
    SELECT id, owner_id, 'owner', owner_id, created_at, updated_at, NULL
    FROM itineraries
    WHERE owner_id IS NOT NULL;
  `);

  return database;
}

export function createLocalUser({ id = createIdentifier(), name, email, passwordHash, passwordSalt }) {
  const db = getLocalDatabase();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO local_users (id, email, name, password_hash, password_salt, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, email.toLowerCase(), name, passwordHash, passwordSalt, now, now);
  return { id, name, email: email.toLowerCase(), createdAt: now };
}

export function getLocalUserByEmail(email) {
  const row = getLocalDatabase().prepare('SELECT * FROM local_users WHERE email = ?').get(String(email || '').toLowerCase());
  return row || null;
}

export function getLocalUserById(id) {
  const row = getLocalDatabase().prepare('SELECT id, email, name, created_at FROM local_users WHERE id = ?').get(id);
  if (!row) return null;
  return { id: row.id, email: row.email, name: row.name, createdAt: row.created_at };
}

export function createLocalSession({ tokenHash, userId, expiresAt }) {
  const now = new Date().toISOString();
  getLocalDatabase().prepare(`
    INSERT INTO local_sessions (token_hash, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).run(tokenHash, userId, expiresAt, now);
}

export function getLocalSession(tokenHash) {
  const row = getLocalDatabase().prepare(`
    SELECT s.token_hash, s.user_id, s.expires_at, u.email, u.name, u.created_at
    FROM local_sessions s
    JOIN local_users u ON u.id = s.user_id
    WHERE s.token_hash = ?
  `).get(tokenHash);
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    deleteLocalSession(tokenHash);
    return null;
  }
  return {
    tokenHash: row.token_hash,
    user: { id: row.user_id, email: row.email, name: row.name, createdAt: row.created_at },
    expiresAt: row.expires_at,
  };
}

export function deleteLocalSession(tokenHash) {
  getLocalDatabase().prepare('DELETE FROM local_sessions WHERE token_hash = ?').run(tokenHash);
}

export function upsertLocalItinerary({ id = createIdentifier(), ownerKey, userId = null, destination = '', itinerary, metadata = {} }) {
  const db = getLocalDatabase();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO itineraries (id, owner_key, user_id, destination, itinerary_json, metadata_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      owner_key = excluded.owner_key,
      user_id = excluded.user_id,
      destination = excluded.destination,
      itinerary_json = excluded.itinerary_json,
      metadata_json = excluded.metadata_json,
      updated_at = excluded.updated_at
  `).run(id, ownerKey, userId, destination, JSON.stringify(itinerary), JSON.stringify(metadata), now, now);
  return { id, createdAt: now, updatedAt: now };
}

export function getLocalItinerary(id) {
  const row = getLocalDatabase().prepare('SELECT * FROM itineraries WHERE id = ?').get(id);
  if (!row) return null;
  return {
    id: row.id,
    ownerKey: row.owner_key,
    userId: row.user_id,
    destination: row.destination,
    itinerary: parseJson(row.itinerary_json, null),
    metadata: parseJson(row.metadata_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function updateLocalItinerary(id, ownerKey, itinerary) {
  const result = getLocalDatabase().prepare(`
    UPDATE itineraries SET itinerary_json = ?, updated_at = ?
    WHERE id = ? AND owner_key = ?
  `).run(JSON.stringify(itinerary), new Date().toISOString(), id, ownerKey);
  return result.changes > 0;
}

export function insertLocalShare(record) {
  getLocalDatabase().prepare(`
    INSERT INTO itinerary_shares
      (id, source_key, owner_key, token_hash, audience, payload_json, expires_at, revoked_at, created_at, last_accessed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, NULL)
  `).run(
    record.id,
    record.sourceKey,
    record.ownerKey,
    record.tokenHash,
    record.audience,
    JSON.stringify(record.payload),
    record.expiresAt,
    record.createdAt
  );
}

function mapShareRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    sourceKey: row.source_key,
    ownerKey: row.owner_key,
    tokenHash: row.token_hash,
    audience: row.audience,
    payload: parseJson(row.payload_json, null),
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
    lastAccessedAt: row.last_accessed_at,
  };
}

export function getLocalShareByTokenHash(tokenHash) {
  return mapShareRow(getLocalDatabase().prepare('SELECT * FROM itinerary_shares WHERE token_hash = ?').get(tokenHash));
}

export function listLocalShares(sourceKey, ownerKey) {
  return getLocalDatabase().prepare(`
    SELECT * FROM itinerary_shares
    WHERE source_key = ? AND owner_key = ?
    ORDER BY created_at DESC
  `).all(sourceKey, ownerKey).map(mapShareRow);
}

export function touchLocalShare(id) {
  getLocalDatabase().prepare('UPDATE itinerary_shares SET last_accessed_at = ? WHERE id = ?')
    .run(new Date().toISOString(), id);
}

export function revokeLocalShare(id, ownerKey) {
  const result = getLocalDatabase().prepare(`
    UPDATE itinerary_shares SET revoked_at = ? WHERE id = ? AND owner_key = ?
  `).run(new Date().toISOString(), id, ownerKey);
  return result.changes > 0;
}

export function getLocalLedger(tripKey, ownerKey) {
  const row = getLocalDatabase().prepare(`
    SELECT ledger_json, created_at, updated_at FROM trip_ledgers
    WHERE trip_key = ? AND owner_key = ?
  `).get(tripKey, ownerKey);
  if (!row) return null;
  return {
    ledger: parseJson(row.ledger_json, null),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function upsertLocalLedger(tripKey, ownerKey, ledger) {
  const now = new Date().toISOString();
  getLocalDatabase().prepare(`
    INSERT INTO trip_ledgers (trip_key, owner_key, ledger_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(trip_key, owner_key) DO UPDATE SET
      ledger_json = excluded.ledger_json,
      updated_at = excluded.updated_at
  `).run(tripKey, ownerKey, JSON.stringify(ledger), now, now);
  return { ledger, updatedAt: now };
}
