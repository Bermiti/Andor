import 'server-only';

import { createHash } from 'node:crypto';
import { logger } from '../logger';

// In-memory idempotency store for local dev and testing.
// Stores cached response payloads keyed by hash(idempotencyKey + payloadHash).
class IdempotencyStore {
  constructor() {
    this.records = new Map();
  }

  hashPayload(payload) {
    return createHash('sha256').update(JSON.stringify(payload || {})).digest('hex');
  }

  get(key, payload) {
    if (!key) return null;
    const record = this.records.get(key);
    if (!record) return null;

    // Expire after 24 hours
    if (Date.now() - record.timestamp > 86400 * 1000) {
      this.records.delete(key);
      return null;
    }

    const payloadHash = this.hashPayload(payload);
    if (record.payloadHash !== payloadHash) {
      return { status: 'mismatch' };
    }

    return { status: 'hit', response: record.response };
  }

  set(key, payload, response) {
    if (!key) return;
    const payloadHash = this.hashPayload(payload);
    this.records.set(key, {
      payloadHash,
      response,
      timestamp: Date.now(),
    });
  }

  clear() {
    this.records.clear();
  }
}

const idempotencyStore = new IdempotencyStore();

export function clearIdempotencyStore() {
  idempotencyStore.clear();
}

/**
 * Checks an incoming request for an Idempotency-Key header.
 * Returns cached response if matched, or mismatch error if payload differs.
 */
export function checkIdempotency(req, payload) {
  const key = req?.headers?.get('idempotency-key') || req?.headers?.get('x-idempotency-key');
  if (!key) return { isIdempotent: false };

  const result = idempotencyStore.get(key, payload);
  if (result?.status === 'mismatch') {
    logger.warn('idempotency_key_mismatch', { key });
    const error = new Error('Chave de idempotencia reutilizada com um payload diferente.');
    error.code = 'IDEMPOTENCY_MISMATCH';
    error.status = 422;
    return { isIdempotent: true, error };
  }

  if (result?.status === 'hit') {
    logger.info('idempotency_cache_hit', { key });
    return { isIdempotent: true, cachedResponse: result.response };
  }

  return { isIdempotent: true, key };
}

/**
 * Records a successful response under an Idempotency-Key.
 */
export function recordIdempotency(key, payload, response) {
  if (!key) return;
  idempotencyStore.set(key, payload, response);
}
