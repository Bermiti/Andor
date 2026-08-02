import 'server-only';

import { createEmptyLedger, normalizeExpenseLedger } from '../expense-ledger';
import { logger } from '../logger';
import { createSupabaseServerClient } from '../supabase/server';
import { getDataBackendMode } from './backend-mode';
import { getLocalDatabase } from './local-db';
import { requireTripAction } from './trip-repository';

const LOCAL_LEDGER_TABLE = 'canonical_trip_ledgers';
let localLedgerTableReady = false;

function hasAuthenticatedIdentity(identity) {
  return Boolean(identity?.authenticated && identity?.userId);
}

function canonicalLocalDatabase() {
  const database = getLocalDatabase();
  if (!localLedgerTableReady) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS ${LOCAL_LEDGER_TABLE} (
        trip_id TEXT PRIMARY KEY REFERENCES itineraries(id) ON DELETE CASCADE,
        ledger_json TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    localLedgerTableReady = true;
  }
  return database;
}

function parseLocalLedger(row, tripId, correlationId) {
  if (!row) {
    return {
      ok: true,
      provider: 'sqlite',
      ledger: createEmptyLedger(),
      version: 0,
      updatedAt: null,
    };
  }

  try {
    return {
      ok: true,
      provider: 'sqlite',
      ledger: normalizeExpenseLedger(JSON.parse(row.ledger_json)),
      version: Number(row.version),
      updatedAt: row.updated_at,
    };
  } catch (error) {
    logger.warn('ledger_dal:local_ledger_corrupt', error, { tripId, correlationId });
    return { ok: false, status: 'storage_error' };
  }
}

function readLocalLedger(tripId, correlationId) {
  try {
    const row = canonicalLocalDatabase().prepare(`
      SELECT ledger_json, version, updated_at
      FROM ${LOCAL_LEDGER_TABLE}
      WHERE trip_id = ?
    `).get(tripId);
    return parseLocalLedger(row, tripId, correlationId);
  } catch (error) {
    logger.warn('ledger_dal:local_read_failed', error, { tripId, correlationId });
    return { ok: false, status: 'storage_error' };
  }
}

function saveLocalLedger(tripId, ledger, expectedVersion, correlationId) {
  const database = canonicalLocalDatabase();
  let transactionOpen = false;

  try {
    database.exec('BEGIN IMMEDIATE');
    transactionOpen = true;
    const current = database.prepare(`
      SELECT version
      FROM ${LOCAL_LEDGER_TABLE}
      WHERE trip_id = ?
    `).get(tripId);
    const currentVersion = current ? Number(current.version) : 0;

    if (currentVersion !== expectedVersion) {
      database.exec('ROLLBACK');
      transactionOpen = false;
      return { ok: false, status: 'conflict', currentVersion };
    }

    const now = new Date().toISOString();
    if (current) {
      database.prepare(`
        UPDATE ${LOCAL_LEDGER_TABLE}
        SET ledger_json = ?, version = version + 1, updated_at = ?
        WHERE trip_id = ? AND version = ?
      `).run(JSON.stringify(ledger), now, tripId, expectedVersion);
    } else {
      database.prepare(`
        INSERT INTO ${LOCAL_LEDGER_TABLE}
          (trip_id, ledger_json, version, created_at, updated_at)
        VALUES (?, ?, 1, ?, ?)
      `).run(tripId, JSON.stringify(ledger), now, now);
    }

    const saved = database.prepare(`
      SELECT ledger_json, version, updated_at
      FROM ${LOCAL_LEDGER_TABLE}
      WHERE trip_id = ?
    `).get(tripId);
    database.exec('COMMIT');
    transactionOpen = false;
    return parseLocalLedger(saved, tripId, correlationId);
  } catch (error) {
    if (transactionOpen) {
      try {
        database.exec('ROLLBACK');
      } catch (rollbackError) {
        logger.warn('ledger_dal:local_rollback_failed', rollbackError, { tripId, correlationId });
      }
    }
    logger.warn('ledger_dal:local_write_failed', error, { tripId, correlationId });
    return { ok: false, status: 'storage_error' };
  }
}

async function createRequestSupabaseClient() {
  const supabase = await createSupabaseServerClient();
  return supabase || null;
}

async function readSupabaseLedger(supabase, tripId, correlationId) {
  const { data, error } = await supabase
    .from('trip_ledgers')
    .select('ledger, version, updated_at')
    .eq('itinerary_id', tripId)
    .maybeSingle();

  if (error) {
    logger.warn('ledger_dal:supabase_read_failed', error, { tripId, correlationId });
    return { ok: false, status: 'storage_error' };
  }
  if (!data) {
    return {
      ok: true,
      provider: 'supabase',
      ledger: createEmptyLedger(),
      version: 0,
      updatedAt: null,
    };
  }
  return {
    ok: true,
    provider: 'supabase',
    ledger: normalizeExpenseLedger(data.ledger),
    version: Number(data.version),
    updatedAt: data.updated_at,
  };
}

async function supabaseConflict(supabase, tripId, correlationId) {
  const current = await readSupabaseLedger(supabase, tripId, correlationId);
  if (!current.ok) return current;
  return { ok: false, status: 'conflict', currentVersion: current.version };
}

async function saveSupabaseLedger(supabase, tripId, ledger, expectedVersion, correlationId) {
  if (expectedVersion === 0) {
    const { data, error } = await supabase
      .from('trip_ledgers')
      .insert({ itinerary_id: tripId, ledger })
      .select('ledger, version, updated_at')
      .maybeSingle();

    if (error) {
      if (error.code === '23505') return supabaseConflict(supabase, tripId, correlationId);
      logger.warn('ledger_dal:supabase_insert_failed', error, { tripId, correlationId });
      return { ok: false, status: 'storage_error' };
    }
    if (!data) return supabaseConflict(supabase, tripId, correlationId);
    return {
      ok: true,
      provider: 'supabase',
      ledger: normalizeExpenseLedger(data.ledger),
      version: Number(data.version),
      updatedAt: data.updated_at,
    };
  }

  const { data, error } = await supabase
    .from('trip_ledgers')
    .update({ ledger })
    .eq('itinerary_id', tripId)
    .eq('version', expectedVersion)
    .select('ledger, version, updated_at')
    .maybeSingle();

  if (error) {
    logger.warn('ledger_dal:supabase_update_failed', error, { tripId, correlationId });
    return { ok: false, status: 'storage_error' };
  }
  if (!data) return supabaseConflict(supabase, tripId, correlationId);
  return {
    ok: true,
    provider: 'supabase',
    ledger: normalizeExpenseLedger(data.ledger),
    version: Number(data.version),
    updatedAt: data.updated_at,
  };
}

async function authorizeLedger(tripId, identity, action) {
  if (!hasAuthenticatedIdentity(identity)) return { ok: false, status: 'auth_required' };
  return requireTripAction(tripId, identity, action);
}

export async function getTripLedger(tripId, identity, metadata = {}) {
  const access = await authorizeLedger(tripId, identity, 'read');
  if (!access.ok) return access;

  const mode = getDataBackendMode();
  if (mode === 'sqlite') return readLocalLedger(tripId, metadata.correlationId);
  if (mode !== 'supabase') return { ok: false, status: 'persistence_unavailable' };

  const supabase = await createRequestSupabaseClient();
  if (!supabase) return { ok: false, status: 'persistence_unavailable' };
  return readSupabaseLedger(supabase, tripId, metadata.correlationId);
}

export async function saveTripLedger(tripId, input, expectedVersion, identity, metadata = {}) {
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0) {
    return { ok: false, status: 'invalid' };
  }

  const access = await authorizeLedger(tripId, identity, 'edit');
  if (!access.ok) return access;
  const ledger = normalizeExpenseLedger(input);
  const mode = getDataBackendMode();

  if (mode === 'sqlite') {
    return saveLocalLedger(tripId, ledger, expectedVersion, metadata.correlationId);
  }
  if (mode !== 'supabase') return { ok: false, status: 'persistence_unavailable' };

  const supabase = await createRequestSupabaseClient();
  if (!supabase) return { ok: false, status: 'persistence_unavailable' };
  return saveSupabaseLedger(
    supabase,
    tripId,
    ledger,
    expectedVersion,
    metadata.correlationId
  );
}
