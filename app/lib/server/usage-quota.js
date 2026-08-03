import 'server-only';

import { logger } from '../logger';
import { recordEstimatedCost } from './ai-kill-switch';

// In-memory usage quota tracker for local dev/testing fallback.
// In production, syncs with Supabase `usage_events` / `usage_quotas` tables or Redis.
class UsageQuotaStore {
  constructor() {
    this.usage = new Map();
  }

  getUserUsageKey(userId, action) {
    const today = new Date().toISOString().slice(0, 10);
    return `${userId}:${action}:${today}`;
  }

  getUsage(userId, action) {
    const key = this.getUserUsageKey(userId, action);
    return this.usage.get(key) || 0;
  }

  increment(userId, action, count = 1) {
    const key = this.getUserUsageKey(userId, action);
    const current = this.usage.get(key) || 0;
    this.usage.set(key, current + count);
    return current + count;
  }

  clear() {
    this.usage.clear();
  }
}

const quotaStore = new UsageQuotaStore();

export function clearUsageQuotaStore() {
  quotaStore.clear();
}

/**
 * Default daily quota limits per action.
 * Overridable via environment variables.
 */
export function getQuotaLimits(action) {
  const limits = {
    generate_itinerary: parseInt(process.env.QUOTA_DAILY_GENERATE || '10', 10),
    regenerate_day: parseInt(process.env.QUOTA_DAILY_REGENERATE || '30', 10),
    chat: parseInt(process.env.QUOTA_DAILY_CHAT || '50', 10),
  };
  return limits[action] || 20;
}

/**
 * Checks if a user has sufficient quota for an action.
 */
export function checkUserQuota(identity, action) {
  if (!identity?.authenticated || !identity?.userId) {
    // Unauthenticated requests use IP-based rate limiting
    return { allowed: true, limit: 0, used: 0, remaining: 0 };
  }

  const limit = getQuotaLimits(action);
  const used = quotaStore.getUsage(identity.userId, action);

  if (used >= limit) {
    logger.warn('user_quota_exceeded', { userId: identity.userId, action, used, limit });
    const error = new Error(`Atingiste o limite diario de ${limit} utilizacoes para esta funcionalidade.`);
    error.code = 'QUOTA_EXCEEDED';
    error.status = 429;
    return { allowed: false, limit, used, remaining: 0, error };
  }

  return { allowed: true, limit, used, remaining: limit - used };
}

/**
 * Records AI consumption after successful generation.
 */
export function recordAiUsage({ identity, action, provider = 'google', model = 'gemini-3.6-flash', estimatedCostCents = 2 }) {
  if (identity?.userId) {
    quotaStore.increment(identity.userId, action, 1);
  }

  recordEstimatedCost(estimatedCostCents);

  logger.info('ai_usage_recorded', {
    userId: identity?.userId || 'guest',
    action,
    provider,
    model,
    estimatedCostCents,
  });
}
