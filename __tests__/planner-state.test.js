import { describe, expect, test } from 'vitest';
import {
  getPlannerDayCount,
  getPlannerStepError,
  normalizeFlexibleDays,
  normalizePlannerDraft,
  PLANNER_DRAFT_VERSION,
} from '../app/lib/planner-state';

describe('planner state and validation', () => {
  test('clamps flexible trips to the supported 1-14 day range', () => {
    expect(normalizeFlexibleDays(0)).toBe(1);
    expect(normalizeFlexibleDays(7)).toBe(7);
    expect(normalizeFlexibleDays(30)).toBe(14);
  });

  test('counts fixed dates inclusively and uses the flexible duration otherwise', () => {
    expect(getPlannerDayCount({
      datesUnknown: false,
      flexibleDays: 5,
      dates: { start: '2026-08-10', end: '2026-08-13' },
    })).toBe(4);
    expect(getPlannerDayCount({ datesUnknown: true, flexibleDays: 9, dates: {} })).toBe(9);
  });

  test('requires a client name when agency mode is enabled', () => {
    expect(getPlannerStepError(2, {
      datesUnknown: true,
      companyMode: true,
      clientName: '',
    })).toMatch(/cliente/i);
  });

  test('normalizes compatible drafts and rejects unknown versions', () => {
    expect(normalizePlannerDraft({ version: 999 })).toBeNull();
    expect(normalizePlannerDraft({
      version: PLANNER_DRAFT_VERSION,
      step: 12,
      destination: 'Tokyo, Japan',
      flexibleDays: 20,
      travelers: { adults: 0, children: 2 },
      stylesList: ['cultura', 'comida', 'arte', 'extra'],
    })).toMatchObject({
      step: 7,
      destination: 'Tokyo, Japan',
      flexibleDays: 14,
      travelers: { adults: 2, children: 2 },
      stylesList: ['cultura', 'comida', 'arte'],
    });
  });
});
