'use client';
import { useState } from 'react';
import styles from './ExpenseSplitter.module.css';

export default function ExpenseSplitter() {
  const [expenses, setExpenses] = useState([
    { id: 1, item: 'Group Dinner', amount: 120, paidBy: 'You', split: '3 people' },
    { id: 2, item: 'Car Rental', amount: 450, paidBy: 'Marco', split: '3 people' },
    { id: 3, item: 'Airbnb', amount: 900, paidBy: 'You', split: '3 people' },
  ]);

  const [newItem, setNewItem] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const addExpense = (e) => {
    e.preventDefault();
    if (!newItem || !newAmount) return;
    setExpenses([...expenses, { 
      id: Date.now(), 
      item: newItem, 
      amount: parseFloat(newAmount), 
      paidBy: 'You', 
      split: '3 people' 
    }]);
    setNewItem('');
    setNewAmount('');
  };

  const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const perPerson = Math.round(total / 3);

  return (
    <div className={styles.container} id="expenses">
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <span className="section-label">💰 Splitwise Core</span>
          <h2 className={styles.title}>Group <span className="gradient-text">Expenses</span></h2>
        </div>
        <div className={styles.totalBadge}>
          <span className={styles.totalLabel}>Total Trip Cost</span>
          <span className={styles.totalValue}>€{total}</span>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.formSide}>
          <div className={styles.card}>
            <h3>Add New Expense</h3>
            <form onSubmit={addExpense}>
              <div className={styles.inputGroup}>
                <label>Expense Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Boat Tour" 
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Amount (€)</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{width: '100%'}}>
                Log Expense
              </button>
            </form>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryLine}>
              <span>Per Person (3)</span>
              <strong>€{perPerson}</strong>
            </div>
            <div className={styles.summaryLine}>
              <span>You Owe</span>
              <span className={styles.negative}>€140</span>
            </div>
            <div className={styles.summaryLine}>
              <span>You are Owed</span>
              <span className={styles.positive}>€320</span>
            </div>
          </div>
        </div>

        <div className={styles.listSide}>
          <div className={styles.expenseList}>
            {expenses.map(exp => (
              <div key={exp.id} className={styles.expenseItem}>
                <div className={styles.expIcon}>💸</div>
                <div className={styles.expInfo}>
                  <span className={styles.expName}>{exp.item}</span>
                  <span className={styles.expMeta}>Paid by {exp.paidBy} • Split among {exp.split}</span>
                </div>
                <div className={styles.expAmount}>€{exp.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
