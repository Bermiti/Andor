import { describe, expect, it } from 'vitest';
import {
  calculateExpenseBalances,
  normalizeExpenseLedger,
  suggestSettlements,
} from '../app/lib/expense-ledger';

const participants = [
  { id: 'ana', name: 'Ana' },
  { id: 'bruno', name: 'Bruno' },
  { id: 'carla', name: 'Carla' },
];

describe('expense ledger', () => {
  it('keeps equal splits balanced to the cent', () => {
    const balances = calculateExpenseBalances({
      participants,
      expenses: [{
        id: 'dinner',
        description: 'Jantar',
        amountCents: 100,
        paidBy: 'ana',
        splitBetween: ['ana', 'bruno', 'carla'],
        category: 'food',
        date: '2026-07-12',
      }],
    });

    expect(balances.map((entry) => entry.owedCents)).toEqual([34, 33, 33]);
    expect(balances.reduce((sum, entry) => sum + entry.balanceCents, 0)).toBe(0);
  });

  it('suggests the minimum practical settlement transfers', () => {
    const ledger = {
      participants,
      expenses: [{
        id: 'hotel',
        description: 'Hotel',
        amountCents: 3000,
        paidBy: 'ana',
        splitBetween: ['ana', 'bruno', 'carla'],
        category: 'stay',
        date: '2026-07-12',
      }],
    };

    expect(suggestSettlements(ledger)).toEqual([
      { fromId: 'bruno', fromName: 'Bruno', toId: 'ana', toName: 'Ana', amountCents: 1000 },
      { fromId: 'carla', fromName: 'Carla', toId: 'ana', toName: 'Ana', amountCents: 1000 },
    ]);
  });

  it('drops malformed and unowned expense references', () => {
    const normalized = normalizeExpenseLedger({
      participants,
      expenses: [
        { id: 'valid', description: 'Taxi', amountCents: 1200, paidBy: 'ana', splitBetween: ['ana', 'bruno'] },
        { id: 'unknown-payer', description: 'Invalid', amountCents: 200, paidBy: 'nobody', splitBetween: ['ana'] },
        { id: 'empty-split', description: 'Invalid', amountCents: 200, paidBy: 'ana', splitBetween: ['nobody'] },
      ],
    });

    expect(normalized.expenses).toHaveLength(1);
    expect(normalized.expenses[0].splitBetween).toEqual(['ana', 'bruno']);
  });
});
