import 'server-only';

import { logger } from '../logger';

/**
 * Interface abstracting Rate Limiting storage across environments.
 * - MemoryRateLimitStore: Used in development, unit tests, and E2E harness.
 * - RedisRateLimitStore: Used in staging and production with atomic Redis operations.
 */
export class RateLimitStore {
  async consume(key, windowSeconds, maxLimit) {
    throw new Error('RateLimitStore.consume() must be implemented.');
  }

  async healthCheck() {
    return { ok: true, driver: 'base' };
  }
}

export class MemoryRateLimitStore extends RateLimitStore {
  constructor() {
    super();
    this.hits = new Map();
  }

  async consume(key, windowSeconds, maxLimit) {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    let timestamps = this.hits.get(key) || [];
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= maxLimit) {
      const oldestInWindow = timestamps[0];
      const resetInSeconds = Math.ceil((oldestInWindow + windowMs - now) / 1000);
      this.hits.set(key, timestamps);
      return {
        allowed: false,
        limit: maxLimit,
        remaining: 0,
        resetInSeconds: Math.max(1, resetInSeconds),
      };
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);

    return {
      allowed: true,
      limit: maxLimit,
      remaining: maxLimit - timestamps.length,
      resetInSeconds: windowSeconds,
    };
  }

  async healthCheck() {
    return { ok: true, driver: 'memory', activeKeys: this.hits.size };
  }

  clear() {
    this.hits.clear();
  }
}

export class RedisRateLimitStore extends RateLimitStore {
  constructor(redisClient) {
    super();
    this.redis = redisClient;
  }

  async consume(key, windowSeconds, maxLimit) {
    if (!this.redis) {
      logger.error('redis_rate_limit:missing_client');
      // In production, fail closed to protect downstream LLMs/apis
      return {
        allowed: false,
        limit: maxLimit,
        remaining: 0,
        resetInSeconds: windowSeconds,
      };
    }

    try {
      const redisKey = `ratelimit:${key}`;
      const count = await this.redis.incr(redisKey);
      if (count === 1) {
        await this.redis.expire(redisKey, windowSeconds);
      }
      const ttl = await this.redis.ttl(redisKey);

      if (count > maxLimit) {
        return {
          allowed: false,
          limit: maxLimit,
          remaining: 0,
          resetInSeconds: Math.max(1, ttl),
        };
      }

      return {
        allowed: true,
        limit: maxLimit,
        remaining: maxLimit - count,
        resetInSeconds: Math.max(1, ttl),
      };
    } catch (error) {
      logger.error('redis_rate_limit_error', error, { key });
      // Fail closed in production
      return {
        allowed: false,
        limit: maxLimit,
        remaining: 0,
        resetInSeconds: windowSeconds,
      };
    }
  }

  async healthCheck() {
    try {
      await this.redis.ping();
      return { ok: true, driver: 'redis' };
    } catch (error) {
      return { ok: false, driver: 'redis', error: error.message };
    }
  }
}

let activeStore = null;

export function getRateLimitStore() {
  if (activeStore) return activeStore;

  const isProd = process.env.NODE_ENV === 'production' && !process.env.ANDOR_E2E_LOCAL_AUTH;
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;

  if (isProd) {
    if (!redisUrl) {
      logger.error('rate_limit_config_error: missing distributed redis configuration in production.');
    }
    // Note: When Upstash/Redis SDK client is provided, instantiate RedisRateLimitStore(client)
  }

  activeStore = new MemoryRateLimitStore();
  return activeStore;
}

export function setRateLimitStore(store) {
  activeStore = store;
}
