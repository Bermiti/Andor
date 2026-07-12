const SUPPORTED_CURRENCIES = new Set(['EUR', 'USD', 'GBP', 'JPY']);

function cleanText(value, fallback = '', maxLength = 120) {
  const text = typeof value === 'string' ? value.trim() : '';
  return (text || fallback).slice(0, maxLength);
}

function uniqueIds(values) {
  return [...new Set((Array.isArray(values) ? values : []).map(String).filter(Boolean))];
}

export function createEmptyLedger(participants = [], currency = 'EUR') {
  return normalizeExpenseLedger({ participants, expenses: [], currency });
}

export function normalizeExpenseLedger(input = {}) {
  const participantIds = new Set();
  const participants = (Array.isArray(input.participants) ? input.participants : [])
    .map((participant, index) => ({
      id: cleanText(participant?.id, `person-${index + 1}`, 80),
      name: cleanText(participant?.name, `Viajante ${index + 1}`, 80),
    }))
    .filter((participant) => {
      if (participantIds.has(participant.id)) return false;
      participantIds.add(participant.id);
      return true;
    })
    .slice(0, 40);

  const validIds = new Set(participants.map((participant) => participant.id));
  const expenseIds = new Set();
  const expenses = (Array.isArray(input.expenses) ? input.expenses : [])
    .map((expense, index) => {
      const id = cleanText(expense?.id, `expense-${index + 1}`, 80);
      const amountCents = Number.isInteger(expense?.amountCents)
        ? expense.amountCents
        : Math.round(Number(expense?.amount || 0) * 100);
      const splitBetween = uniqueIds(expense?.splitBetween).filter((participantId) => validIds.has(participantId));
      return {
        id,
        description: cleanText(expense?.description, 'Despesa', 120),
        amountCents: Math.min(100_000_000, Math.max(0, amountCents || 0)),
        paidBy: validIds.has(String(expense?.paidBy)) ? String(expense.paidBy) : '',
        splitBetween,
        category: cleanText(expense?.category, 'other', 40),
        date: cleanText(expense?.date, new Date().toISOString().slice(0, 10), 10),
        notes: cleanText(expense?.notes, '', 240),
      };
    })
    .filter((expense) => {
      if (expenseIds.has(expense.id) || !expense.paidBy || expense.amountCents <= 0 || expense.splitBetween.length === 0) {
        return false;
      }
      expenseIds.add(expense.id);
      return true;
    })
    .slice(0, 500);

  const currency = String(input.currency || 'EUR').toUpperCase();
  return {
    version: 1,
    currency: SUPPORTED_CURRENCIES.has(currency) ? currency : 'EUR',
    participants,
    expenses,
  };
}

export function calculateExpenseBalances(input = {}) {
  const ledger = normalizeExpenseLedger(input);
  const balances = new Map(ledger.participants.map((participant) => [participant.id, {
    participantId: participant.id,
    name: participant.name,
    paidCents: 0,
    owedCents: 0,
    balanceCents: 0,
  }]));

  ledger.expenses.forEach((expense) => {
    balances.get(expense.paidBy).paidCents += expense.amountCents;
    const baseShare = Math.floor(expense.amountCents / expense.splitBetween.length);
    let remainder = expense.amountCents % expense.splitBetween.length;
    expense.splitBetween.forEach((participantId) => {
      const share = baseShare + (remainder > 0 ? 1 : 0);
      remainder = Math.max(0, remainder - 1);
      balances.get(participantId).owedCents += share;
    });
  });

  return [...balances.values()].map((entry) => ({
    ...entry,
    balanceCents: entry.paidCents - entry.owedCents,
  }));
}

export function suggestSettlements(input = {}) {
  const balances = calculateExpenseBalances(input);
  const creditors = balances
    .filter((entry) => entry.balanceCents > 0)
    .map((entry) => ({ ...entry, remaining: entry.balanceCents }))
    .sort((a, b) => b.remaining - a.remaining);
  const debtors = balances
    .filter((entry) => entry.balanceCents < 0)
    .map((entry) => ({ ...entry, remaining: Math.abs(entry.balanceCents) }))
    .sort((a, b) => b.remaining - a.remaining);

  const settlements = [];
  let creditorIndex = 0;
  let debtorIndex = 0;
  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const amountCents = Math.min(creditor.remaining, debtor.remaining);
    if (amountCents > 0) {
      settlements.push({
        fromId: debtor.participantId,
        fromName: debtor.name,
        toId: creditor.participantId,
        toName: creditor.name,
        amountCents,
      });
    }
    creditor.remaining -= amountCents;
    debtor.remaining -= amountCents;
    if (creditor.remaining === 0) creditorIndex += 1;
    if (debtor.remaining === 0) debtorIndex += 1;
  }
  return settlements;
}

export function expenseTotalCents(input = {}) {
  return normalizeExpenseLedger(input).expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
}

export function formatLedgerMoney(cents, currency = 'EUR') {
  try {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(Number(cents || 0) / 100);
  } catch (error) {
    return `${(Number(cents || 0) / 100).toFixed(2)} ${currency}`;
  }
}
