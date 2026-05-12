'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './ExpenseSplitter.module.css';

export default function ExpenseSplitter() {
  const { user, updateUser } = useAuth();
  const [groups, setGroups] = useState([]);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState('');
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePaidBy, setExpensePaidBy] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('other');

  useEffect(() => {
    const stored = localStorage.getItem(`andor_expenses_${user?.id}`);
    if (stored) setGroups(JSON.parse(stored));
  }, [user?.id]);

  const saveGroups = (updated) => {
    setGroups(updated);
    localStorage.setItem(`andor_expenses_${user?.id}`, JSON.stringify(updated));
  };

  const createGroup = () => {
    if (!newGroupName.trim()) return;
    const members = newGroupMembers.split(',').map(m => m.trim()).filter(Boolean);
    if (members.length === 0) return;
    // Add current user to members if not already
    if (!members.find(m => m.toLowerCase() === user.name.toLowerCase())) {
      members.unshift(user.name);
    }
    const group = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      members,
      expenses: [],
      createdAt: new Date().toISOString(),
    };
    saveGroups([...groups, group]);
    setNewGroupName('');
    setNewGroupMembers('');
    setShowNewGroup(false);
    setActiveGroupId(group.id);
  };

  const addExpense = () => {
    if (!expenseDesc || !expenseAmount || !expensePaidBy) return;
    const group = groups.find(g => g.id === activeGroupId);
    if (!group) return;
    const expense = {
      id: Date.now().toString(),
      description: expenseDesc,
      amount: parseFloat(expenseAmount),
      paidBy: expensePaidBy,
      category: expenseCategory,
      date: new Date().toISOString(),
    };
    const updated = groups.map(g =>
      g.id === activeGroupId ? { ...g, expenses: [...g.expenses, expense] } : g
    );
    saveGroups(updated);
    setExpenseDesc('');
    setExpenseAmount('');
    setShowAddExpense(false);
  };

  const deleteExpense = (groupId, expenseId) => {
    const updated = groups.map(g =>
      g.id === groupId
        ? { ...g, expenses: g.expenses.filter(e => e.id !== expenseId) }
        : g
    );
    saveGroups(updated);
  };

  const deleteGroup = (groupId) => {
    if (!confirm('Apagar este grupo?')) return;
    saveGroups(groups.filter(g => g.id !== groupId));
    if (activeGroupId === groupId) setActiveGroupId(null);
  };

  const calculateBalances = (group) => {
    const totals = {};
    group.members.forEach(m => { totals[m] = 0; });
    const totalExpenses = group.expenses.reduce((sum, e) => sum + e.amount, 0);
    const perPerson = totalExpenses / group.members.length;

    group.expenses.forEach(e => {
      if (totals[e.paidBy] !== undefined) {
        totals[e.paidBy] += e.amount;
      }
    });

    const balances = {};
    group.members.forEach(m => {
      balances[m] = totals[m] - perPerson;
    });

    // Calculate settlements
    const settlements = [];
    const debtors = Object.entries(balances).filter(([, b]) => b < 0).sort((a, b) => a[1] - b[1]);
    const creditors = Object.entries(balances).filter(([, b]) => b > 0).sort((a, b) => b[1] - a[1]);

    let di = 0, ci = 0;
    while (di < debtors.length && ci < creditors.length) {
      const amount = Math.min(-debtors[di][1], creditors[ci][1]);
      if (amount > 0.01) {
        settlements.push({
          from: debtors[di][0],
          to: creditors[ci][0],
          amount: Math.round(amount * 100) / 100,
        });
      }
      debtors[di][1] += amount;
      creditors[ci][1] -= amount;
      if (Math.abs(debtors[di][1]) < 0.01) di++;
      if (Math.abs(creditors[ci][1]) < 0.01) ci++;
    }

    return { totals, perPerson, balances, settlements, totalExpenses };
  };

  const activeGroup = groups.find(g => g.id === activeGroupId);

  const categoryEmojis = {
    food: '🍽️',
    transport: '🚗',
    hotel: '🏨',
    activity: '🎯',
    shopping: '🛍️',
    flight: '✈️',
    other: '📦',
  };

  return (
    <div className={styles.container}>
      {/* Groups List */}
      <div className={styles.groupsPanel}>
        <div className={styles.groupsHeader}>
          <h3>Os teus grupos</h3>
          <button className={styles.newGroupBtn} onClick={() => setShowNewGroup(!showNewGroup)}>
            {showNewGroup ? '✕' : '+ Novo'}
          </button>
        </div>

        {showNewGroup && (
          <div className={styles.newGroupForm}>
            <input
              type="text"
              placeholder="Nome do grupo (ex: Viagem Lisboa)"
              className={styles.formInput}
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Membros (separados por vírgula)"
              className={styles.formInput}
              value={newGroupMembers}
              onChange={(e) => setNewGroupMembers(e.target.value)}
            />
            <button className={styles.createBtn} onClick={createGroup}>Criar Grupo</button>
          </div>
        )}

        <div className={styles.groupsList}>
          {groups.length === 0 && !showNewGroup && (
            <div className={styles.emptyGroups}>
              <span>💰</span>
              <p>Cria um grupo para começar a dividir despesas</p>
            </div>
          )}
          {groups.map(group => {
            const calc = calculateBalances(group);
            return (
              <button
                key={group.id}
                className={`${styles.groupCard} ${activeGroupId === group.id ? styles.groupCardActive : ''}`}
                onClick={() => setActiveGroupId(group.id)}
              >
                <div className={styles.groupCardInfo}>
                  <div className={styles.groupCardName}>{group.name}</div>
                  <div className={styles.groupCardMeta}>
                    {group.members.length} pessoas • €{calc.totalExpenses.toFixed(2)}
                  </div>
                </div>
                <button className={styles.groupDeleteBtn} onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }}>
                  🗑️
                </button>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Group Details */}
      <div className={styles.detailPanel}>
        {!activeGroup ? (
          <div className={styles.emptyDetail}>
            <div className={styles.emptyDetailIcon}>👈</div>
            <h3>Seleciona ou cria um grupo</h3>
            <p>Para veres as despesas e quem deve a quem.</p>
          </div>
        ) : (
          <>
            <div className={styles.detailHeader}>
              <div>
                <h3 className={styles.detailTitle}>{activeGroup.name}</h3>
                <div className={styles.detailMembers}>
                  {activeGroup.members.map((m, i) => (
                    <span key={i} className={styles.memberChip}>{m}</span>
                  ))}
                </div>
              </div>
              <button className={styles.addExpenseBtn} onClick={() => setShowAddExpense(!showAddExpense)}>
                {showAddExpense ? '✕ Cancelar' : '+ Despesa'}
              </button>
            </div>

            {showAddExpense && (
              <div className={styles.addExpenseForm}>
                <input
                  type="text"
                  placeholder="Descrição (ex: Jantar no restaurante)"
                  className={styles.formInput}
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                />
                <div className={styles.formRow}>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Valor (€)"
                    className={styles.formInput}
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                  />
                  <select
                    className={styles.formInput}
                    value={expensePaidBy}
                    onChange={(e) => setExpensePaidBy(e.target.value)}
                  >
                    <option value="">Quem pagou?</option>
                    {activeGroup.members.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formRow}>
                  <select
                    className={styles.formInput}
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                  >
                    <option value="food">🍽️ Alimentação</option>
                    <option value="transport">🚗 Transporte</option>
                    <option value="hotel">🏨 Alojamento</option>
                    <option value="flight">✈️ Voos</option>
                    <option value="activity">🎯 Atividades</option>
                    <option value="shopping">🛍️ Compras</option>
                    <option value="other">📦 Outro</option>
                  </select>
                  <button className={styles.createBtn} onClick={addExpense}>Adicionar</button>
                </div>
              </div>
            )}

            {/* Summary */}
            {activeGroup.expenses.length > 0 && (() => {
              const calc = calculateBalances(activeGroup);
              return (
                <>
                  <div className={styles.summaryCards}>
                    <div className={styles.summaryCard}>
                      <div className={styles.summaryLabel}>Total Gasto</div>
                      <div className={styles.summaryValue}>€{calc.totalExpenses.toFixed(2)}</div>
                    </div>
                    <div className={styles.summaryCard}>
                      <div className={styles.summaryLabel}>Por Pessoa</div>
                      <div className={styles.summaryValue}>€{calc.perPerson.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Settlements */}
                  {calc.settlements.length > 0 && (
                    <div className={styles.settlementsSection}>
                      <h4 className={styles.sectionSubtitle}>💸 Quem deve a quem</h4>
                      <div className={styles.settlements}>
                        {calc.settlements.map((s, i) => (
                          <div key={i} className={styles.settlement}>
                            <span className={styles.settlementFrom}>{s.from}</span>
                            <span className={styles.settlementArrow}>→</span>
                            <span className={styles.settlementTo}>{s.to}</span>
                            <span className={styles.settlementAmount}>€{s.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Expenses List */}
            <div className={styles.expensesList}>
              <h4 className={styles.sectionSubtitle}>📋 Despesas</h4>
              {activeGroup.expenses.length === 0 ? (
                <p className={styles.noExpenses}>Nenhuma despesa adicionada ainda.</p>
              ) : (
                activeGroup.expenses.map(expense => (
                  <div key={expense.id} className={styles.expenseRow}>
                    <div className={styles.expenseIcon}>
                      {categoryEmojis[expense.category] || '📦'}
                    </div>
                    <div className={styles.expenseInfo}>
                      <div className={styles.expenseDesc}>{expense.description}</div>
                      <div className={styles.expenseMeta}>
                        Pago por <strong>{expense.paidBy}</strong> • {new Date(expense.date).toLocaleDateString('pt-PT')}
                      </div>
                    </div>
                    <div className={styles.expenseAmount}>€{expense.amount.toFixed(2)}</div>
                    <button
                      className={styles.expenseDelete}
                      onClick={() => deleteExpense(activeGroup.id, expense.id)}
                    >✕</button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
