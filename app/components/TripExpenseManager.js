'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ClipboardCopy,
  Download,
  Plus,
  ReceiptText,
  Trash2,
  UsersRound,
} from 'lucide-react';
import {
  calculateExpenseBalances,
  createEmptyLedger,
  expenseTotalCents,
  formatLedgerMoney,
  normalizeExpenseLedger,
  suggestSettlements,
} from '../lib/expense-ledger';
import styles from './TripExpenseManager.module.css';

const categories = [
  ['food', 'Comida'],
  ['stay', 'Alojamento'],
  ['transport', 'Transportes'],
  ['activity', 'Atividades'],
  ['shopping', 'Compras'],
  ['other', 'Outros'],
];

function initialParticipants(trip) {
  const names = [
    trip?.clientName,
    trip?.exportMetadata?.clientName,
    ...(Array.isArray(trip?.travelers) ? trip.travelers.map((person) => person?.name || person) : []),
  ].map((name) => String(name || '').trim()).filter(Boolean);
  const unique = [...new Set(names)];
  if (unique.length === 0) unique.push('Eu', 'Acompanhante');
  if (unique.length === 1) unique.push('Acompanhante');
  return unique.slice(0, 12).map((name, index) => ({ id: `person-${index + 1}`, name }));
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export default function TripExpenseManager({ trip }) {
  const tripKey = String(trip?.id || trip?.destination || 'trip');
  const canEdit = !trip?.permission || ['owner', 'editor'].includes(trip.permission);
  const defaults = useMemo(() => initialParticipants(trip), [trip]);
  const [ledger, setLedger] = useState(() => createEmptyLedger(defaults));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [ledgerVersion, setLedgerVersion] = useState(0);
  const [activeTab, setActiveTab] = useState('expenses');
  const [participantName, setParticipantName] = useState('');
  const [form, setForm] = useState({
    description: '',
    amount: '',
    paidBy: defaults[0]?.id || '',
    splitBetween: defaults.map((participant) => participant.id),
    category: 'food',
    date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/itineraries/${encodeURIComponent(tripKey)}/ledger`, {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error?.message || 'Nao foi possivel carregar as despesas.');
        if (!active) return;
        const loaded = normalizeExpenseLedger(payload.ledger);
        const next = loaded.participants.length > 0 ? loaded : createEmptyLedger(defaults, loaded.currency);
        setLedger(next);
        setUpdatedAt(payload.updatedAt);
        setLedgerVersion(Number(payload.version) || 0);
        setForm((current) => ({
          ...current,
          paidBy: next.participants[0]?.id || '',
          splitBetween: next.participants.map((participant) => participant.id),
        }));
      } catch (loadError) {
        if (active) setError(loadError.message || 'Nao foi possivel carregar as despesas.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [defaults, tripKey]);

  const balances = useMemo(() => calculateExpenseBalances(ledger), [ledger]);
  const settlements = useMemo(() => suggestSettlements(ledger), [ledger]);
  const totalCents = useMemo(() => expenseTotalCents(ledger), [ledger]);

  const persist = async (input) => {
    if (!canEdit) {
      setError('Esta viagem esta em modo de leitura.');
      return;
    }
    const next = normalizeExpenseLedger(input);
    const previous = ledger;
    setLedger(next);
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/itineraries/${encodeURIComponent(tripKey)}/ledger`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'If-Match': `"${ledgerVersion}"`,
        },
        credentials: 'same-origin',
        body: JSON.stringify(next),
      });
      const payload = await response.json();
      if (!response.ok) {
        const conflict = response.status === 409;
        const failure = new Error(conflict
          ? 'As despesas mudaram noutro separador. Fecha e volta a abrir para recarregar.'
          : payload?.error?.message || 'Nao foi possivel guardar.');
        failure.conflict = conflict;
        throw failure;
      }
      setLedger(normalizeExpenseLedger(payload.ledger));
      setUpdatedAt(payload.updatedAt);
      setLedgerVersion(Number(payload.version));
    } catch (saveError) {
      setLedger(previous);
      setError(saveError.message || 'Nao foi possivel guardar.');
    } finally {
      setSaving(false);
    }
  };

  const addParticipant = async (event) => {
    event.preventDefault();
    if (!canEdit) return;
    const name = participantName.trim();
    if (!name) return;
    const participant = { id: crypto.randomUUID(), name };
    setParticipantName('');
    setForm((current) => ({
      ...current,
      paidBy: current.paidBy || participant.id,
      splitBetween: [...current.splitBetween, participant.id],
    }));
    await persist({ ...ledger, participants: [...ledger.participants, participant] });
  };

  const removeParticipant = async (participantId) => {
    if (!canEdit) return;
    const inUse = ledger.expenses.some((expense) => (
      expense.paidBy === participantId || expense.splitBetween.includes(participantId)
    ));
    if (inUse) {
      setError('Remove primeiro as despesas associadas a esta pessoa.');
      return;
    }
    const participants = ledger.participants.filter((participant) => participant.id !== participantId);
    setForm((current) => ({
      ...current,
      paidBy: current.paidBy === participantId ? participants[0]?.id || '' : current.paidBy,
      splitBetween: current.splitBetween.filter((id) => id !== participantId),
    }));
    await persist({ ...ledger, participants });
  };

  const toggleSplit = (participantId) => {
    setForm((current) => ({
      ...current,
      splitBetween: current.splitBetween.includes(participantId)
        ? current.splitBetween.filter((id) => id !== participantId)
        : [...current.splitBetween, participantId],
    }));
  };

  const addExpense = async (event) => {
    event.preventDefault();
    if (!canEdit) return;
    const amount = Number(String(form.amount).replace(',', '.'));
    if (!form.description.trim() || !Number.isFinite(amount) || amount <= 0 || !form.paidBy || form.splitBetween.length === 0) {
      setError('Preenche a descricao, o valor, quem pagou e pelo menos uma pessoa na divisao.');
      return;
    }
    const expense = {
      id: crypto.randomUUID(),
      description: form.description.trim(),
      amountCents: Math.round(amount * 100),
      paidBy: form.paidBy,
      splitBetween: form.splitBetween,
      category: form.category,
      date: form.date,
      notes: '',
    };
    await persist({ ...ledger, expenses: [expense, ...ledger.expenses] });
    setForm((current) => ({ ...current, description: '', amount: '' }));
  };

  const deleteExpense = async (expenseId) => {
    if (!canEdit) return;
    await persist({ ...ledger, expenses: ledger.expenses.filter((expense) => expense.id !== expenseId) });
  };

  const copySettlements = async () => {
    const lines = settlements.length > 0
      ? settlements.map((item) => `${item.fromName} paga ${formatLedgerMoney(item.amountCents, ledger.currency)} a ${item.toName}`)
      : ['Todas as contas estao acertadas.'];
    await navigator.clipboard.writeText(lines.join('\n'));
  };

  const exportCsv = () => {
    const participantNameById = Object.fromEntries(ledger.participants.map((participant) => [participant.id, participant.name]));
    const rows = [
      ['Data', 'Descricao', 'Categoria', 'Valor', 'Moeda', 'Pago por', 'Dividido entre'],
      ...ledger.expenses.map((expense) => [
        expense.date,
        expense.description,
        expense.category,
        (expense.amountCents / 100).toFixed(2),
        ledger.currency,
        participantNameById[expense.paidBy],
        expense.splitBetween.map((id) => participantNameById[id]).join(' | '),
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `andor-despesas-${tripKey}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className={styles.loading}>A carregar despesas...</div>;
  }

  return (
    <div className={styles.workspace} data-testid="trip-expense-manager">
      <div className={styles.summaryStrip}>
        <div><span>Total da viagem</span><strong>{formatLedgerMoney(totalCents, ledger.currency)}</strong></div>
        <div><span>Despesas</span><strong>{ledger.expenses.length}</strong></div>
        <div><span>Participantes</span><strong>{ledger.participants.length}</strong></div>
        <label>
          <span>Moeda</span>
          <select value={ledger.currency} onChange={(event) => persist({ ...ledger, currency: event.target.value })} disabled={saving || !canEdit}>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
          </select>
        </label>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist" aria-label="Vistas de despesas">
          <button type="button" role="tab" aria-selected={activeTab === 'expenses'} className={activeTab === 'expenses' ? styles.tabActive : ''} onClick={() => setActiveTab('expenses')}>
            <ReceiptText size={16} /> Despesas
          </button>
          <button type="button" role="tab" aria-selected={activeTab === 'settlements'} className={activeTab === 'settlements' ? styles.tabActive : ''} onClick={() => setActiveTab('settlements')}>
            <UsersRound size={16} /> Acertos
          </button>
        </div>
        <div className={styles.saveState}>
          {saving ? 'A guardar...' : updatedAt ? <><Check size={14} /> Guardado</> : 'Por guardar'}
        </div>
      </div>

      {error && <div className={styles.error} role="alert">{error}</div>}
      {!canEdit && <div className={styles.error}>Modo de leitura: apenas owner e editor podem alterar despesas.</div>}

      <section className={styles.peopleSection}>
        <div className={styles.sectionHeading}>
          <div><span>Grupo</span><h3>Quem participa</h3></div>
          <form className={styles.addPerson} onSubmit={addParticipant}>
            <input value={participantName} onChange={(event) => setParticipantName(event.target.value)} placeholder="Nome" maxLength={80} aria-label="Nome do participante" readOnly={!canEdit} />
            <button type="submit" title="Adicionar participante" aria-label="Adicionar participante" disabled={saving || !canEdit || !participantName.trim()}><Plus size={17} /></button>
          </form>
        </div>
        <div className={styles.peopleList}>
          {ledger.participants.map((participant) => (
            <span className={styles.personChip} key={participant.id}>
              {participant.name}
              <button type="button" onClick={() => removeParticipant(participant.id)} title={`Remover ${participant.name}`} aria-label={`Remover ${participant.name}`} disabled={saving || !canEdit}><Trash2 size={13} /></button>
            </span>
          ))}
        </div>
      </section>

      {activeTab === 'expenses' ? (
        <>
          <form className={styles.expenseForm} onSubmit={addExpense}>
            <div className={styles.sectionHeading}><div><span>Novo registo</span><h3>Adicionar despesa</h3></div></div>
            <div className={styles.formGrid}>
              <label className={styles.descriptionField}><span>Descricao</span><input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Jantar, hotel, comboio..." maxLength={120} readOnly={!canEdit} /></label>
              <label><span>Valor</span><input type="number" min="0.01" step="0.01" inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0,00" readOnly={!canEdit} /></label>
              <label><span>Pago por</span><select value={form.paidBy} onChange={(event) => setForm({ ...form, paidBy: event.target.value })} disabled={!canEdit}>{ledger.participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.name}</option>)}</select></label>
              <label><span>Categoria</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} disabled={!canEdit}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label><span>Data</span><input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} readOnly={!canEdit} /></label>
            </div>
            <fieldset className={styles.splitFieldset}>
              <legend>Dividir igualmente entre</legend>
              <div>{ledger.participants.map((participant) => (
                <label key={participant.id}><input type="checkbox" checked={form.splitBetween.includes(participant.id)} onChange={() => toggleSplit(participant.id)} disabled={!canEdit} /><span>{participant.name}</span></label>
              ))}</div>
            </fieldset>
            <button className={styles.primaryButton} type="submit" disabled={saving || !canEdit || ledger.participants.length === 0}><Plus size={17} /> Adicionar despesa</button>
          </form>

          <section className={styles.expensesSection}>
            <div className={styles.sectionHeading}>
              <div><span>Historico</span><h3>Despesas registadas</h3></div>
              <button className={styles.iconCommand} type="button" onClick={exportCsv} title="Exportar CSV" aria-label="Exportar despesas em CSV" disabled={ledger.expenses.length === 0}><Download size={17} /></button>
            </div>
            {ledger.expenses.length === 0 ? (
              <p className={styles.empty}>Ainda nao existem despesas nesta viagem.</p>
            ) : (
              <div className={styles.expenseList}>
                {ledger.expenses.map((expense) => {
                  const payer = ledger.participants.find((participant) => participant.id === expense.paidBy)?.name;
                  const category = categories.find(([value]) => value === expense.category)?.[1] || 'Outros';
                  return (
                    <div className={styles.expenseRow} key={expense.id}>
                      <div><strong>{expense.description}</strong><span>{expense.date} | {category} | pago por {payer}</span></div>
                      <strong>{formatLedgerMoney(expense.amountCents, ledger.currency)}</strong>
                      <button type="button" onClick={() => deleteExpense(expense.id)} title="Eliminar despesa" aria-label={`Eliminar ${expense.description}`} disabled={saving || !canEdit}><Trash2 size={16} /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : (
        <section className={styles.settlementSection}>
          <div className={styles.sectionHeading}>
            <div><span>Balanco</span><h3>Quem deve a quem</h3></div>
            <button className={styles.iconCommand} type="button" onClick={copySettlements} title="Copiar acertos" aria-label="Copiar acertos"><ClipboardCopy size={17} /></button>
          </div>
          <div className={styles.balanceList}>
            {balances.map((balance) => (
              <div key={balance.participantId}>
                <span>{balance.name}</span>
                <strong className={balance.balanceCents > 0 ? styles.positive : balance.balanceCents < 0 ? styles.negative : ''}>
                  {balance.balanceCents > 0 ? 'recebe ' : balance.balanceCents < 0 ? 'deve ' : ''}{formatLedgerMoney(Math.abs(balance.balanceCents), ledger.currency)}
                </strong>
              </div>
            ))}
          </div>
          <div className={styles.settlementList}>
            <h4>Transferencias sugeridas</h4>
            {settlements.length === 0 ? <p className={styles.empty}>Todas as contas estao acertadas.</p> : settlements.map((item) => (
              <div key={`${item.fromId}-${item.toId}`}><span><strong>{item.fromName}</strong> paga a <strong>{item.toName}</strong></span><strong>{formatLedgerMoney(item.amountCents, ledger.currency)}</strong></div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
