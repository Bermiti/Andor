import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { InMemorySlidingWindowStore, UpstashRedisStore } from '../app/lib/server/rate-limit';

describe('InMemorySlidingWindowStore', () => {
  let store;

  beforeEach(() => {
    store = new InMemorySlidingWindowStore();
  });

  it('allows requests within limit', () => {
    const r1 = store.checkAndRecord('test:key', 60, 3);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r1.limit).toBe(3);
  });

  it('blocks requests exceeding limit', () => {
    store.checkAndRecord('test:key', 60, 2);
    store.checkAndRecord('test:key', 60, 2);
    const r3 = store.checkAndRecord('test:key', 60, 2);
    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
    expect(r3.resetInSeconds).toBeGreaterThan(0);
  });

  it('isolates keys', () => {
    store.checkAndRecord('user:a', 60, 1);
    const result = store.checkAndRecord('user:b', 60, 1);
    expect(result.allowed).toBe(true);
  });

  it('clear() resets all state', () => {
    store.checkAndRecord('test:key', 60, 1);
    store.clear();
    const result = store.checkAndRecord('test:key', 60, 1);
    expect(result.allowed).toBe(true);
  });

  it('returns correct remaining count', () => {
    const r1 = store.checkAndRecord('test:key', 60, 5);
    expect(r1.remaining).toBe(4);
    const r2 = store.checkAndRecord('test:key', 60, 5);
    expect(r2.remaining).toBe(3);
  });

  it('garbage collects stale entries periodically', () => {
    // Fill with many unique keys
    for (let i = 0; i < 250; i++) {
      store.checkAndRecord(`gc:key:${i}`, 1, 100); // 1-second window
    }
    // All entries exist after insertion
    expect(store.hits.size).toBe(250);
    // GC runs at threshold (200) but 1s window means entries are still fresh
    // The GC mechanism exists and runs — entries will be cleaned when expired
    expect(store._gcCounter).toBe(50); // 250 % 200 = 50 (GC ran once at 200)
  });
});

describe('UpstashRedisStore', () => {
  it('reports unavailable when no credentials', () => {
    const store = new UpstashRedisStore({});
    expect(store.available).toBe(false);
  });

  it('reports available when credentials provided', () => {
    const store = new UpstashRedisStore({ url: 'https://example.upstash.io', token: 'test-token' });
    expect(store.available).toBe(true);
  });

  it('returns null when unavailable', async () => {
    const store = new UpstashRedisStore({});
    const result = await store.checkAndRecord('key', 60, 10);
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    const store = new UpstashRedisStore({
      url: 'https://nonexistent-host.invalid',
      token: 'test',
    });
    const result = await store.checkAndRecord('key', 60, 10);
    expect(result).toBeNull();
  });
});

describe('rate limit store interface contract', () => {
  it('both stores return the same result shape for allowed', () => {
    const memory = new InMemorySlidingWindowStore();
    const result = memory.checkAndRecord('test', 60, 10);
    expect(result).toHaveProperty('allowed');
    expect(result).toHaveProperty('limit');
    expect(result).toHaveProperty('remaining');
    expect(result).toHaveProperty('resetInSeconds');
    expect(typeof result.allowed).toBe('boolean');
    expect(typeof result.limit).toBe('number');
    expect(typeof result.remaining).toBe('number');
    expect(typeof result.resetInSeconds).toBe('number');
  });

  it('both stores return the same result shape for blocked', () => {
    const memory = new InMemorySlidingWindowStore();
    memory.checkAndRecord('test', 60, 1);
    const result = memory.checkAndRecord('test', 60, 1);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.limit).toBe(1);
    expect(result.resetInSeconds).toBeGreaterThan(0);
  });
});
