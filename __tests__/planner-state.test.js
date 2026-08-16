import { describe, expect, test } from 'vitest';
import {
  getPlannerDayCount,
  getPlannerNightCount,
  getPlannerStepError,
  getPlannerStageNightTotal,
  normalizeFlexibleDays,
  normalizePlannerDraft,
  normalizePlannerStages,
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
    expect(getPlannerNightCount({
      datesUnknown: false,
      flexibleDays: 5,
      dates: { start: '2026-08-10', end: '2026-08-13' },
    })).toBe(3);
  });

  test('normalizes stages and validates exact multi-destination night allocation', () => {
    const stages = normalizePlannerStages([
      { destination: 'Lisboa', nights: 2 },
      { destination: 'Porto', nights: 2, transportMode: 'train' },
    ]);
    expect(getPlannerStageNightTotal(stages)).toBe(4);
    expect(getPlannerStepError(2, {
      journeyStages: stages,
      datesUnknown: false,
      dates: { start: '2026-09-01', end: '2026-09-05' },
    })).toBe('');
    expect(getPlannerStepError(2, {
      journeyStages: [{ ...stages[0], nights: 1 }, stages[1]],
      datesUnknown: false,
      dates: { start: '2026-09-01', end: '2026-09-05' },
    })).toMatch(/exatamente 4 noites/i);
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

  test('migrates a v1 single-destination draft without losing its selection', () => {
    expect(normalizePlannerDraft({
      version: 1,
      destination: 'Coimbra, Portugal',
      destinationEntity: { entityId: 'geo-coimbra', displayName: 'Coimbra, Portugal' },
      flexibleDays: 4,
    })).toMatchObject({
      version: PLANNER_DRAFT_VERSION,
      journeyStages: [{
        destination: 'Coimbra, Portugal',
        destinationEntity: { entityId: 'geo-coimbra' },
        nights: 3,
      }],
    });
  });
});
