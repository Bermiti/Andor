import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { MemoryRateLimitStore } from '../app/lib/server/redis-rate-limit';
import {
  checkUserQuota,
  clearUsageQuotaStore,
  getQuotaLimits,
  recordAiUsage,
} from '../app/lib/server/usage-quota';

describe('Concurrency and Race Condition Quota Suite', () => {
  beforeEach(() => {
    clearUsageQuotaStore();
  });

  it('handles parallel concurrent requests without allowing over-consumption', async () => {
    const identity = { authenticated: true, userId: 'concurrent-user-1' };
    const limit = getQuotaLimits('generate_itinerary'); // 10

    // Fire 20 parallel requests simultaneously
    const requests = Array.from({ length: 20 }, (_, i) => i);
    const results = await Promise.all(
      requests.map(async () => {
        const check = checkUserQuota(identity, 'generate_itinerary');
        if (check.allowed) {
          recordAiUsage({ identity, action: 'generate_itinerary' });
          return 'allowed';
        }
        return 'blocked';
      })
    );

    const allowedCount = results.filter((r) => r === 'allowed').length;
    const blockedCount = results.filter((r) => r === 'blocked').length;

    expect(allowedCount).toBe(limit);
    expect(blockedCount).toBe(20 - limit);
  });

  it('verifies RateLimitStore memory driver atomic consumption', async () => {
    const store = new MemoryRateLimitStore();
    const key = 'test-concurrent-ip:127.0.0.1';

    const requests = Array.from({ length: 15 }, (_, i) => i);
    const results = await Promise.all(
      requests.map(() => store.consume(key, 60, 5))
    );

    const allowed = results.filter((r) => r.allowed);
    const blocked = results.filter((r) => !r.allowed);

    expect(allowed.length).toBe(5);
    expect(blocked.length).toBe(10);
  });
});
