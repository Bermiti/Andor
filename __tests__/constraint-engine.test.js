// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { validateItineraryConstraints } from '../app/lib/server/constraint-engine';

describe('Itinerary Constraint Engine Test Suite (Sprint 6)', () => {
  it('detects budget overruns and high-intensity days with warnings', () => {
    const dayData = {
      dailyBudgetLimit: 100,
      stops: [
        { name: 'Stop 1', cost: 50 },
        { name: 'Stop 2', cost: 70 },
      ],
    };

    const res = validateItineraryConstraints(dayData);
    expect(res.valid).toBe(true); // No hard physical transfer conflict
    expect(res.warnings.length).toBe(1);
    expect(res.warnings[0].type).toBe('budget_exceeded');
  });

  it('detects impossible transfer conflicts when consecutive stops have extreme distance gaps', () => {
    const dayData = {
      stops: [
        { name: 'Lisboa', coordinates: [38.7223, -9.1393] },
        { name: 'Tóquio', coordinates: [35.6762, 139.6503] },
      ],
    };

    const res = validateItineraryConstraints(dayData);
    expect(res.valid).toBe(false);
    expect(res.conflicts.length).toBe(1);
    expect(res.conflicts[0].type).toBe('impossible_transfer');
  });
});
