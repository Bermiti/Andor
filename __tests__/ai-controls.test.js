import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  checkAiOperationalStatus,
  getDailyCostCents,
  isBudgetExceeded,
  isKillSwitchActive,
  recordEstimatedCost,
  resetDailyCostTracker,
} from '../app/lib/server/ai-kill-switch';
import {
  checkIdempotency,
  clearIdempotencyStore,
  recordIdempotency,
} from '../app/lib/server/idempotency';
import {
  checkUserQuota,
  clearUsageQuotaStore,
  getQuotaLimits,
  recordAiUsage,
} from '../app/lib/server/usage-quota';

describe('AI Cost and Operational Control Suite', () => {
  beforeEach(() => {
    resetDailyCostTracker();
    clearIdempotencyStore();
    clearUsageQuotaStore();
    delete process.env.ANDOR_AI_KILL_SWITCH;
    delete process.env.ANDOR_DAILY_AI_BUDGET_CENTS;
  });

  describe('Kill Switch & Budget Ceiling', () => {
    it('detects when kill switch is active', () => {
      expect(isKillSwitchActive()).toBe(false);
      process.env.ANDOR_AI_KILL_SWITCH = '1';
      expect(isKillSwitchActive()).toBe(true);

      expect(() => checkAiOperationalStatus()).toThrowError('A geracao de IA esta temporariamente suspensa');
    });

    it('tracks daily estimated spend and enforces budget ceiling', () => {
      process.env.ANDOR_DAILY_AI_BUDGET_CENTS = '100'; // €1.00
      expect(isBudgetExceeded()).toBe(false);

      recordEstimatedCost(60);
      expect(getDailyCostCents()).toBe(60);
      expect(isBudgetExceeded()).toBe(false);

      recordEstimatedCost(50);
      expect(getDailyCostCents()).toBe(110);
      expect(isBudgetExceeded()).toBe(true);

      expect(() => checkAiOperationalStatus()).toThrowError('O limite diario de geracao foi atingido');
    });
  });

  describe('User Quotas', () => {
    it('enforces daily quota limits per user', () => {
      const identity = { authenticated: true, userId: 'user-quota-1' };
      const limit = getQuotaLimits('generate_itinerary');

      for (let i = 0; i < limit; i++) {
        const status = checkUserQuota(identity, 'generate_itinerary');
        expect(status.allowed).toBe(true);
        recordAiUsage({ identity, action: 'generate_itinerary' });
      }

      const blockedStatus = checkUserQuota(identity, 'generate_itinerary');
      expect(blockedStatus.allowed).toBe(false);
      expect(blockedStatus.error?.code).toBe('QUOTA_EXCEEDED');
    });
  });

  describe('Idempotency', () => {
    it('returns cached response when identical request is repeated with same Idempotency-Key', () => {
      const payload = { destination: 'Tokyo', days: 5 };
      const response = { status: 'success', tripId: 'trip-123' };
      const req = new Request('http://localhost', {
        headers: { 'idempotency-key': 'idem-key-abc' },
      });

      const check1 = checkIdempotency(req, payload);
      expect(check1.isIdempotent).toBe(true);
      expect(check1.cachedResponse).toBeUndefined();

      recordIdempotency('idem-key-abc', payload, response);

      const check2 = checkIdempotency(req, payload);
      expect(check2.isIdempotent).toBe(true);
      expect(check2.cachedResponse).toEqual(response);
    });

    it('returns error if same Idempotency-Key is reused with a different payload', () => {
      const payload1 = { destination: 'Tokyo', days: 5 };
      const payload2 = { destination: 'Paris', days: 3 };
      const response = { status: 'success' };

      recordIdempotency('idem-key-diff', payload1, response);

      const req = new Request('http://localhost', {
        headers: { 'idempotency-key': 'idem-key-diff' },
      });
      const check = checkIdempotency(req, payload2);
      expect(check.isIdempotent).toBe(true);
      expect(check.error?.code).toBe('IDEMPOTENCY_MISMATCH');
    });
  });
});
