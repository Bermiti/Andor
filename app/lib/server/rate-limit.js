import 'server-only';

import { logger } from '../logger';

// ---------------------------------------------------------------------------
// Rate Limit Store Interface
// ---------------------------------------------------------------------------
// Every store must implement: checkAndRecord(key, windowSeconds, maxLimit) => result
// result shape: { allowed, limit, remaining, resetInSeconds }
// Stores may also implement clear() for testing.

// ---------------------------------------------------------------------------
// In-Memory Sliding Window Store (development, testing, single-instance)
// ---------------------------------------------------------------------------
class InMemorySlidingWindowStore {
  constructor() {
    this.hits = new Map();
    this._gcCounter = 0;
  }

  checkAndRecord(key, windowSeconds, maxLimit) {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    let timestamps = this.hits.get(key) || [];
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= maxLimit) {
      const oldestInWindow = timestamps[0];
      const resetInSeconds = Math.ceil((oldestInWindow + windowMs - now) / 1000);
      this.hits.set(key, timestamps);
      this._maybeGarbageCollect();
      return {
        allowed: false,
        limit: maxLimit,
        remaining: 0,
        resetInSeconds: Math.max(1, resetInSeconds),
      };
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);
    this._maybeGarbageCollect();

    return {
      allowed: true,
      limit: maxLimit,
      remaining: maxLimit - timestamps.length,
      resetInSeconds: windowSeconds,
    };
  }

  _maybeGarbageCollect() {
    this._gcCounter += 1;
    if (this._gcCounter < 200) return;
    this._gcCounter = 0;
    const now = Date.now();
    for (const [key, timestamps] of this.hits) {
      const live = timestamps.filter((t) => t > now - 86_400_000);
      if (live.length === 0) this.hits.delete(key);
      else this.hits.set(key, live);
    }
  }

  clear() {
    this.hits.clear();
  }
}

// ---------------------------------------------------------------------------
// Upstash Redis Sliding Window Store (production, distributed)
// ---------------------------------------------------------------------------
class UpstashRedisStore {
  constructor({ url, token, prefix = 'rl:' } = {}) {
    this._url = url;
    this._token = token;
    this._prefix = prefix;
    this._available = Boolean(url && token);
  }

  get available() {
    return this._available;
  }

  async checkAndRecord(key, windowSeconds, maxLimit) {
    if (!this._available) return null;

    const redisKey = `${this._prefix}${key}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    try {
      // Upstash REST API pipeline: ZREMRANGEBYSCORE, ZADD, ZCARD, PEXPIRE
      const pipeline = [
        ['ZREMRANGEBYSCORE', redisKey, '0', String(windowStart)],
        ['ZADD', redisKey, String(now), `${now}:${Math.random().toString(36).slice(2, 8)}`],
        ['ZCARD', redisKey],
        ['PEXPIRE', redisKey, String(windowMs + 1000)],
      ];

      const response = await fetch(`${this._url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this._token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pipeline),
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        logger.warn('rate_limit_redis_error', { status: response.status });
        return null;
      }

      const results = await response.json();
      const count = results?.[2]?.result;
      if (typeof count !== 'number') return null;

      if (count > maxLimit) {
        return {
          allowed: false,
          limit: maxLimit,
          remaining: 0,
          resetInSeconds: windowSeconds,
        };
      }

      return {
        allowed: true,
        limit: maxLimit,
        remaining: Math.max(0, maxLimit - count),
        resetInSeconds: windowSeconds,
      };
    } catch (error) {
      logger.warn('rate_limit_redis_error', error);
      return null;
    }
  }

  clear() {
    // No-op for distributed store; keys expire naturally
  }
}

// ---------------------------------------------------------------------------
// Store Factory
// ---------------------------------------------------------------------------
const memoryStore = new InMemorySlidingWindowStore();

let _distributedStore = null;
function getDistributedStore() {
  if (_distributedStore) return _distributedStore;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    _distributedStore = new UpstashRedisStore({ url, token });
  }
  return _distributedStore;
}

function getActiveStore() {
  const provider = (process.env.RATE_LIMIT_PROVIDER || 'auto').toLowerCase();
  if (provider === 'memory') return { store: memoryStore, distributed: false };
  if (provider === 'upstash') {
    const redis = getDistributedStore();
    return redis?.available
      ? { store: redis, distributed: true }
      : { store: memoryStore, distributed: false };
  }
  // auto: prefer distributed when available
  const redis = getDistributedStore();
  return redis?.available
    ? { store: redis, distributed: true }
    : { store: memoryStore, distributed: false };
}

export function clearRateLimitStore() {
  memoryStore.clear();
}

// ---------------------------------------------------------------------------
// Policy Registry
// ---------------------------------------------------------------------------
export function getRateLimitConfig(policyName) {
  const configs = {
    auth_login: {
      windowSeconds: parseInt(process.env.RATE_LIMIT_AUTH_LOGIN_WINDOW || '900', 10),
      maxLimit: parseInt(process.env.RATE_LIMIT_AUTH_LOGIN_MAX || '10', 10),
    },
    auth_register: {
      windowSeconds: parseInt(process.env.RATE_LIMIT_AUTH_REGISTER_WINDOW || '3600', 10),
      maxLimit: parseInt(process.env.RATE_LIMIT_AUTH_REGISTER_MAX || '5', 10),
    },
    auth_password_reset: {
      windowSeconds: parseInt(process.env.RATE_LIMIT_AUTH_RESET_WINDOW || '3600', 10),
      maxLimit: parseInt(process.env.RATE_LIMIT_AUTH_RESET_MAX || '3', 10),
    },
    ai_generate: {
      windowSeconds: parseInt(process.env.RATE_LIMIT_AI_GENERATE_WINDOW || '3600', 10),
      maxLimit: parseInt(process.env.RATE_LIMIT_AI_GENERATE_MAX || '5', 10),
    },
    ai_regenerate: {
      windowSeconds: parseInt(process.env.RATE_LIMIT_AI_REGENERATE_WINDOW || '3600', 10),
      maxLimit: parseInt(process.env.RATE_LIMIT_AI_REGENERATE_MAX || '15', 10),
    },
    autocomplete: {
      windowSeconds: parseInt(process.env.RATE_LIMIT_AUTOCOMPLETE_WINDOW || '60', 10),
      maxLimit: parseInt(process.env.RATE_LIMIT_AUTOCOMPLETE_MAX || '60', 10),
    },
    public_share: {
      windowSeconds: parseInt(process.env.RATE_LIMIT_PUBLIC_SHARE_WINDOW || '60', 10),
      maxLimit: parseInt(process.env.RATE_LIMIT_PUBLIC_SHARE_MAX || '60', 10),
    },
    import_trip: {
      windowSeconds: parseInt(process.env.RATE_LIMIT_IMPORT_WINDOW || '3600', 10),
      maxLimit: parseInt(process.env.RATE_LIMIT_IMPORT_MAX || '10', 10),
    },
    newsletter: {
      windowSeconds: parseInt(process.env.RATE_LIMIT_NEWSLETTER_WINDOW || '86400', 10),
      maxLimit: parseInt(process.env.RATE_LIMIT_NEWSLETTER_MAX || '3', 10),
    },
    invitation: {
      windowSeconds: parseInt(process.env.RATE_LIMIT_INVITATION_WINDOW || '3600', 10),
      maxLimit: parseInt(process.env.RATE_LIMIT_INVITATION_MAX || '20', 10),
    },
    provider_request: {
      windowSeconds: parseInt(process.env.RATE_LIMIT_PROVIDER_WINDOW || '60', 10),
      maxLimit: parseInt(process.env.RATE_LIMIT_PROVIDER_MAX || '100', 10),
    },
  };

  return configs[policyName] || { windowSeconds: 60, maxLimit: 30 };
}

// ---------------------------------------------------------------------------
// Key Resolution
// ---------------------------------------------------------------------------
export function resolveRateLimitKey(policyName, identity, req) {
  if (identity?.authenticated && identity?.userId) {
    return `${policyName}:user:${identity.userId}`;
  }

  const forwardedFor = req?.headers?.get('x-forwarded-for');
  const realIp = req?.headers?.get('x-real-ip');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || '127.0.0.1');

  return `${policyName}:ip:${clientIp}`;
}

// ---------------------------------------------------------------------------
// Main API
// ---------------------------------------------------------------------------

/**
 * Evaluates rate limit for a request under a specific policy.
 * Uses distributed store when available, falls back to in-memory.
 */
export async function checkRateLimit(policyName, identity, req) {
  const config = getRateLimitConfig(policyName);
  const key = resolveRateLimitKey(policyName, identity, req);

  const { store, distributed } = getActiveStore();

  let result;
  if (distributed) {
    result = await store.checkAndRecord(key, config.windowSeconds, config.maxLimit);
    if (!result) {
      // Redis failed; fallback to memory (fail-open with local protection)
      result = memoryStore.checkAndRecord(key, config.windowSeconds, config.maxLimit);
    }
  } else {
    result = store.checkAndRecord(key, config.windowSeconds, config.maxLimit);
  }

  if (!result.allowed) {
    logger.warn('rate_limit_exceeded', {
      policy: policyName,
      key,
      limit: result.limit,
      resetInSeconds: result.resetInSeconds,
    });
  }

  return result;
}

/**
 * Returns HTTP rate limit headers.
 */
export function getRateLimitHeaders(result) {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetInSeconds),
    ...(result.allowed ? {} : { 'Retry-After': String(result.resetInSeconds) }),
  };
}

// Exported for testing
export { InMemorySlidingWindowStore, UpstashRedisStore };
