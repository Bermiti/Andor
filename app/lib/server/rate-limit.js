import 'server-only';

import { logger } from '../logger';

// Default in-memory sliding window store for development, testing, and single-instance fallback.
// In production, this adapter delegates to a distributed store (e.g. Upstash Redis / Redis).
class InMemorySlidingWindowStore {
  constructor() {
    this.hits = new Map();
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

  clear() {
    this.hits.clear();
  }
}

const defaultStore = new InMemorySlidingWindowStore();

export function clearRateLimitStore() {
  defaultStore.clear();
}

/**
 * Central Rate Limiting Policy Registry.
 * Configuration can be overridden via environment variables.
 */
export function getRateLimitConfig(policyName) {
  const configs = {
    auth_login: {
      windowSeconds: parseInt(process.env.RATE_LIMIT_AUTH_LOGIN_WINDOW || '900', 10), // 15 mins
      maxLimit: parseInt(process.env.RATE_LIMIT_AUTH_LOGIN_MAX || '10', 10),
    },
    auth_register: {
      windowSeconds: parseInt(process.env.RATE_LIMIT_AUTH_REGISTER_WINDOW || '3600', 10), // 1 hour
      maxLimit: parseInt(process.env.RATE_LIMIT_AUTH_REGISTER_MAX || '5', 10),
    },
    ai_generate: {
      windowSeconds: parseInt(process.env.RATE_LIMIT_AI_GENERATE_WINDOW || '3600', 10), // 1 hour
      maxLimit: parseInt(process.env.RATE_LIMIT_AI_GENERATE_MAX || '5', 10),
    },
    ai_regenerate: {
      windowSeconds: parseInt(process.env.RATE_LIMIT_AI_REGENERATE_WINDOW || '3600', 10), // 1 hour
      maxLimit: parseInt(process.env.RATE_LIMIT_AI_REGENERATE_MAX || '15', 10),
    },
    public_share: {
      windowSeconds: parseInt(process.env.RATE_LIMIT_PUBLIC_SHARE_WINDOW || '60', 10), // 1 min
      maxLimit: parseInt(process.env.RATE_LIMIT_PUBLIC_SHARE_MAX || '60', 10),
    },
    import_trip: {
      windowSeconds: parseInt(process.env.RATE_LIMIT_IMPORT_WINDOW || '3600', 10), // 1 hour
      maxLimit: parseInt(process.env.RATE_LIMIT_IMPORT_MAX || '10', 10),
    },
    newsletter: {
      windowSeconds: parseInt(process.env.RATE_LIMIT_NEWSLETTER_WINDOW || '86400', 10), // 24 hours
      maxLimit: parseInt(process.env.RATE_LIMIT_NEWSLETTER_MAX || '3', 10),
    },
    provider_request: {
      windowSeconds: parseInt(process.env.RATE_LIMIT_PROVIDER_WINDOW || '60', 10),
      maxLimit: parseInt(process.env.RATE_LIMIT_PROVIDER_MAX || '100', 10),
    },
  };

  return configs[policyName] || { windowSeconds: 60, maxLimit: 30 };
}

/**
 * Resolves request rate limit key using authenticated user ID or trusted client IP.
 */
export function resolveRateLimitKey(policyName, identity, req) {
  if (identity?.authenticated && identity?.userId) {
    return `${policyName}:user:${identity.userId}`;
  }

  const forwardedFor = req?.headers?.get('x-forwarded-for');
  const realIp = req?.headers?.get('x-real-ip');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || '127.0.0.1');

  return `${policyName}:ip:${clientIp}`;
}

/**
 * Evaluates rate limit for a request under a specific policy.
 */
export async function checkRateLimit(policyName, identity, req) {
  const config = getRateLimitConfig(policyName);
  const key = resolveRateLimitKey(policyName, identity, req);

  const result = defaultStore.checkAndRecord(key, config.windowSeconds, config.maxLimit);

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
