import 'server-only';

import { logger } from '../logger';

/**
 * Checks if the global AI generation kill switch or emergency budget ceiling is active.
 *
 * Environment variables:
 * - ANDOR_AI_KILL_SWITCH: '1' or 'true' to completely pause AI generation.
 * - ANDOR_DAILY_AI_BUDGET_CENTS: Maximum allowed estimated daily spend in cents (default: 5000 = €50.00).
 */

let dailyCostCentsInWindow = 0;
let lastResetTimestamp = Date.now();

export function isKillSwitchActive() {
  const envVal = String(process.env.ANDOR_AI_KILL_SWITCH || '').trim().toLowerCase();
  return envVal === '1' || envVal === 'true';
}

export function resetDailyCostTracker() {
  dailyCostCentsInWindow = 0;
  lastResetTimestamp = Date.now();
}

export function recordEstimatedCost(cents) {
  const now = Date.now();
  // Reset window every 24 hours
  if (now - lastResetTimestamp > 86400 * 1000) {
    resetDailyCostTracker();
  }

  dailyCostCentsInWindow += Math.max(0, Number(cents) || 0);
}

export function getDailyCostCents() {
  return dailyCostCentsInWindow;
}

export function isBudgetExceeded() {
  const maxBudgetCents = parseInt(process.env.ANDOR_DAILY_AI_BUDGET_CENTS || '5000', 10);
  return dailyCostCentsInWindow >= maxBudgetCents;
}

/**
 * Asserts that AI operations are allowed. Throws an error if kill switch or budget limit is hit.
 */
export function checkAiOperationalStatus() {
  if (isKillSwitchActive()) {
    logger.warn('ai_operational_status:kill_switch_active');
    const error = new Error('A geracao de IA esta temporariamente suspensa para manutencao.');
    error.code = 'AI_SERVICE_SUSPENDED';
    error.status = 503;
    throw error;
  }

  if (isBudgetExceeded()) {
    logger.warn('ai_operational_status:daily_budget_exceeded', { currentCents: dailyCostCentsInWindow });
    const error = new Error('O limite diario de geracao foi atingido. Tenta novamente amanha.');
    error.code = 'DAILY_BUDGET_EXCEEDED';
    error.status = 429;
    throw error;
  }

  return true;
}
