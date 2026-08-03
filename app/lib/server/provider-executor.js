import 'server-only';

import { logger } from '../logger';
import { isAiKillSwitchActive } from './ai-kill-switch';
import { getCentralProviderRegistry } from './provider-registry';
import { checkRateLimit } from './rate-limit';

/**
 * Normalized Server Provider Executor.
 * Executes external requests with unified validation, rate limiting, kill switch, timeout, error normalization, and provenance tracking.
 */
export async function executeProviderRequest({
  providerId,
  capability,
  input,
  inputSchema,
  executorFn,
  timeoutMs = 10000,
}) {
  const correlationId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const registry = getCentralProviderRegistry();

  // 1. Check Kill Switch if AI provider
  if (providerId === 'provider-llm-engine' && isAiKillSwitchActive()) {
    return {
      success: false,
      error: {
        code: 'PROVIDER_KILL_SWITCH_ACTIVE',
        correlationId,
        provider: providerId,
        capability,
        retryable: false,
        message: 'AI Provider is temporarily disabled by emergency kill switch.',
      },
    };
  }

  // 2. Validate input schema if provided
  if (inputSchema) {
    const parseResult = inputSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: {
          code: 'PROVIDER_INVALID_INPUT',
          correlationId,
          provider: providerId,
          capability,
          retryable: false,
          details: parseResult.error.format(),
          message: 'Provider request input validation failed.',
        },
      };
    }
  }

  // 3. Rate limiting per provider policy
  const rateLimitResult = await checkRateLimit(`policy:provider:${providerId}`, `prov:${providerId}`, 100, 60);
  if (rateLimitResult.limited) {
    return {
      success: false,
      error: {
        code: 'PROVIDER_RATE_LIMITED',
        correlationId,
        provider: providerId,
        capability,
        retryable: true,
        retryAfter: rateLimitResult.resetInSeconds,
        message: 'Provider rate limit exceeded. Please retry later.',
      },
    };
  }

  // 4. Timeout-wrapped execution
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('PROVIDER_TIMEOUT')), timeoutMs)
    );

    const data = await Promise.race([executorFn(input), timeoutPromise]);

    return {
      success: true,
      correlationId,
      provider: providerId,
      capability,
      data,
    };
  } catch (err) {
    const isTimeout = err.message === 'PROVIDER_TIMEOUT';
    const code = isTimeout ? 'PROVIDER_TIMEOUT' : 'PROVIDER_UNAVAILABLE';

    logger.warn({
      context: 'provider_execution_failed',
      error: { code, message: err.message, providerId, capability },
      metadata: { correlationId },
    });

    return {
      success: false,
      error: {
        code,
        correlationId,
        provider: providerId,
        capability,
        retryable: isTimeout,
        message: isTimeout ? 'Provider request timed out.' : 'Provider execution encountered an error.',
      },
    };
  }
}
