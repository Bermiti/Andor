'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './BudgetVisualization.module.css';

/**
 * PHASE 11.3: BudgetVisualization Component
 * Displays budget breakdown with 3 scenarios (economical/balanced/premium)
 */

export default function BudgetVisualization({ budget }) {
  const [activeScenario, setActiveScenario] = useState(0);
  const [barsVisible, setBarsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        window.setTimeout(() => setBarsVisible(true), 100);
        observer.disconnect();
      },
      { threshold: 0.35 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!budget || !budget.scenarios) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>💰</div>
        <p>Informações de orçamento a carregar...</p>
      </div>
    );
  }

  const scenarios = budget.scenarios;
  const active = scenarios[activeScenario];

  if (!active) {
    return null;
  }

  const breakdown = active.breakdown;
  const total = active.total;

  // Calculate percentages
  const getPercentage = (value) => ((value / total) * 100).toFixed(0);

  return (
    <div className={styles.section} ref={sectionRef}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.icon}>💰</span>
          Orçamento
        </h2>
        <p className={styles.subtitle}>Detalhamento de custos para sua viagem</p>
      </div>

      {/* Scenario Selector */}
      {scenarios.length > 1 && (
        <div className={styles.scenarioSelector}>
          {scenarios.map((scenario, idx) => (
            <button
              key={idx}
              className={`${styles.scenarioBtn} ${activeScenario === idx ? styles.active : ''}`}
              onClick={() => setActiveScenario(idx)}
            >
              <span className={styles.scenarioLabel}>
                {scenario.tier === 'economical' && '💰'}
                {scenario.tier === 'balanced' && '⚖️'}
                {scenario.tier === 'premium' && '✨'}
              </span>
              <span className={styles.scenarioName}>
                {scenario.tier === 'economical' && 'Económico'}
                {scenario.tier === 'balanced' && 'Equilibrado'}
                {scenario.tier === 'premium' && 'Premium'}
              </span>
              <span className={styles.scenarioPrice}>€{scenario.total}</span>
            </button>
          ))}
        </div>
      )}

      {/* Total Overview */}
      <div className={styles.totalOverview}>
        <div className={styles.totalValue}>€{total.toLocaleString()}</div>
        <div className={styles.totalLabel}>Orçamento Total</div>
        {active.perDay && (
          <div className={styles.perDay}>
            ~€{Math.round(active.perDay)}/dia
          </div>
        )}
      </div>

      {/* Breakdown Bars */}
      <div className={styles.breakdown}>
        {breakdown && Object.entries(breakdown).map(([key, value]) => {
          if (!value || value === 0) return null;

          const labels = {
            flights: '✈️ Voos',
            accommodation: '🏨 Alojamento',
            food: '🍽️ Alimentação',
            activities: '🎭 Atividades',
            transport: '🚗 Transportes',
            airportTransfer: '🚕 Transfer Aeroporto',
            contingency: '⚠️ Contingência'
          };

          const percentage = getPercentage(value);

          return (
            <div key={key} className={styles.breakdownItem}>
              <div className={styles.breakdownHeader}>
                <span className={styles.breakdownLabel}>{labels[key]}</span>
                <span className={styles.breakdownValue}>€{value} ({percentage}%)</span>
              </div>
              <div className={styles.breakdownBar}>
                <div
                  className={`${styles.breakdownFill} ${styles[`fill_${key}`]}`}
                  style={{ width: barsVisible ? `${percentage}%` : '0%' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Description */}
      {active.notes && (
        <div className={styles.notes}>
          <strong>Notas:</strong>
          <p>{active.notes}</p>
        </div>
      )}

      {/* Comparison Table (if multiple scenarios) */}
      {scenarios.length > 1 && (
        <div className={styles.comparisonSection}>
          <h3 className={styles.comparisonTitle}>Comparação de Cenários</h3>
          <div className={styles.comparisonTable}>
            <div className={styles.comparisonRow}>
              <div className={styles.comparisonCell}>Cenário</div>
              {scenarios.map((s, idx) => (
                <div key={idx} className={styles.comparisonCell}>
                  {s.tier === 'economical' && 'Económico'}
                  {s.tier === 'balanced' && 'Equilibrado'}
                  {s.tier === 'premium' && 'Premium'}
                </div>
              ))}
            </div>
            <div className={styles.comparisonRow}>
              <div className={styles.comparisonCell}>Total</div>
              {scenarios.map((s, idx) => (
                <div key={idx} className={`${styles.comparisonCell} ${styles.total}`}>
                  €{s.total}
                </div>
              ))}
            </div>
            <div className={styles.comparisonRow}>
              <div className={styles.comparisonCell}>/dia</div>
              {scenarios.map((s, idx) => (
                <div key={idx} className={styles.comparisonCell}>
                  €{s.perDay || Math.round(s.total / 3)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
