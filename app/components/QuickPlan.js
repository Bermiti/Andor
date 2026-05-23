'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveGeneratedItinerary } from '../lib/itinerary-store';
import styles from './QuickPlan.module.css';

const suggestions = [
  '2-day romantic trip in Lisbon under €200',
  'Best weekend with friends in Barcelona',
  '3 days in Paris, budget-friendly',
  'Adventure week in the Azores',
  'Cultural tour of Rome, 4 days',
];

export default function QuickPlan() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholderIndex((prev) => (prev + 1) % suggestions.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const parseQuery = (text) => {
    const lower = text.toLowerCase();
    // Extract destination — take the main city/country name
    const dest = text.replace(/\d+[\s-]?days?/gi, '').replace(/under\s*[€$£]?\d+/gi, '').replace(/budget[- ]?friendly/gi, '').replace(/romantic|adventure|cultural|best|weekend|with friends|in|trip|tour/gi, '').trim().replace(/,\s*$/, '').trim() || text;
    // Extract days
    const daysMatch = lower.match(/(\d+)\s*days?/);
    const days = daysMatch ? daysMatch[1] : '2';
    // Extract budget
    const budgetMatch = lower.match(/[€$£](\d+)/);
    const budget = budgetMatch ? budgetMatch[1] : '';
    return { destination: dest, days, budget };
  };

  const handlePlan = async (text) => {
    const q = text || query || suggestions[currentPlaceholderIndex];
    if (!q) return;
    setQuery(q);
    setLoading(true);

    try {
      const { destination, days, budget } = parseQuery(q);
      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, days, budget, travelers: '2', interests: [] }),
      });

      if (!response.ok) throw new Error('API error');
      const data = await response.json();

      // Save and navigate
      const id = saveGeneratedItinerary(data);
      router.push(`/itinerary/${id}`);
    } catch (error) {
      // error occurred, but app continues silently
      setLoading(false);
    }
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
            placeholder={suggestions[currentPlaceholderIndex]}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePlan()}
            disabled={loading}
          />
          <button className={styles.inputBtn} onClick={() => handlePlan()} disabled={loading}>
            {loading ? 'Planning...' : '✨ Plan Now'}
          </button>
        </div>

        <div className={styles.suggestions}>
          {suggestions.map((s, i) => (
            <button key={i} className={styles.suggestion} onClick={() => handlePlan(s)} disabled={loading}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
