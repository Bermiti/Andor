'use client';
import { useState } from 'react';
import styles from './QuickPlan.module.css';

const suggestions = [
  '2-day romantic trip in Lisbon under €200',
  'Best weekend with friends in Barcelona',
  '3 days in Paris, budget-friendly',
  'Adventure week in the Azores',
  'Cultural tour of Rome, 4 days',
];

const quickResult = {
  title: '🇵🇹 2 Days in Lisbon — Romantic',
  items: [
    { emoji: '🌅', title: 'Sunset at Miradouro', sub: 'Day 1 — Evening' },
    { emoji: '🍷', title: 'Wine Tasting in Alfama', sub: 'Day 1 — Night' },
    { emoji: '⛵', title: 'Tagus River Cruise', sub: 'Day 2 — Morning' },
    { emoji: '🍽️', title: 'Lunch at Belcanto', sub: 'Day 2 — Afternoon' },
    { emoji: '🏛️', title: 'Belém Tower Walk', sub: 'Day 2 — Afternoon' },
    { emoji: '🎵', title: 'Fado Night in Bairro Alto', sub: 'Day 2 — Evening' },
  ],
};

export default function QuickPlan() {
  const [query, setQuery] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePlan = (text) => {
    const q = text || query;
    if (!q) return;
    setQuery(q);
    setLoading(true);
    setShowResult(false);
    setTimeout(() => {
      setLoading(false);
      setShowResult(true);
    }, 1800);
  };

  return (
    <section className={styles.quickPlan}>
      <div className={styles.content}>
        <span className={styles.label}>⚡ 1-Click Planning</span>
        <h2 className={styles.title}>Just tell us what you want</h2>
        <p className={styles.subtitle}>
          Type a natural language request and get an instant itinerary. No forms, no friction.
        </p>

        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={styles.input}
            placeholder="Plan a 2-day romantic trip in Lisbon under €200..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePlan()}
          />
          <button className={styles.inputBtn} onClick={() => handlePlan()}>
            {loading ? 'Planning...' : '✨ Plan Now'}
          </button>
        </div>

        <div className={styles.suggestions}>
          {suggestions.map((s, i) => (
            <button key={i} className={styles.suggestion} onClick={() => handlePlan(s)}>
              {s}
            </button>
          ))}
        </div>

        {showResult && (
          <div className={styles.quickResult}>
            <div className={styles.quickResultHeader}>
              <span className={styles.quickResultTitle}>{quickResult.title}</span>
              <span className={styles.quickResultBadge}>Est. €178</span>
            </div>
            <div className={styles.quickResultGrid}>
              {quickResult.items.map((item, i) => (
                <div key={i} className={styles.quickResultItem}>
                  <div className={styles.quickResultItemEmoji}>{item.emoji}</div>
                  <div className={styles.quickResultItemTitle}>{item.title}</div>
                  <div className={styles.quickResultItemSub}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
