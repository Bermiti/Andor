'use client';
import { useState, useEffect } from 'react';
import styles from './BudgetCalculator.module.css';

export default function BudgetCalculator({ baseCost = 250, daysCount = 3, currency = '€', exchangeRate = null }) {
  const [travelers, setTravelers] = useState(2);
  const [days, setDays] = useState(daysCount);
  const [flightClass, setFlightClass] = useState('economy'); // economy, business, first
  const [hotelTier, setHotelTier] = useState('boutique'); // budget, boutique, luxury
  const [diningTier, setDiningTier] = useState('mid'); // budget, mid, fine

  const [breakdown, setBreakdown] = useState({
    flights: 0,
    accommodation: 0,
    dining: 0,
    activities: 0,
    total: 0
  });

  const rate = exchangeRate?.data?.rate || exchangeRate?.rate;
  const quote = exchangeRate?.data?.quoteCurrency || exchangeRate?.quoteCurrency;
  const rateAvailable = typeof rate === 'number' && rate > 0 && quote && quote !== 'EUR';

  useEffect(() => {
    // Standard cost formulas (realistic estimates)
    const flightPrices = { economy: 150, business: 650, first: 1800 };
    const hotelPrices = { budget: 45, boutique: 130, luxury: 420 };
    const diningPrices = { budget: 20, mid: 55, fine: 160 };

    const flightsCost = flightPrices[flightClass] * travelers;
    const lodgingCost = hotelTier === 'none' ? 0 : hotelPrices[hotelTier] * days * Math.ceil(travelers / 2);
    const diningCost = diningPrices[diningTier] * days * travelers;
    const activitiesCost = 35 * days * travelers; // average ticket/activity cost per day per person

    const total = flightsCost + lodgingCost + diningCost + activitiesCost;

    setBreakdown({
      flights: flightsCost,
      accommodation: lodgingCost,
      dining: diningCost,
      activities: activitiesCost,
      total
    });
  }, [travelers, days, flightClass, hotelTier, diningTier]);

  return (
    <div className={styles.calculator}>
      <h3 className={styles.title}>Planeador de Orçamento Interativo</h3>
      <p className={styles.subtitle}>Personaliza os teus níveis de viagem para calcular a estimativa de custos instantaneamente.</p>

      {/* Sliders */}
      <div className={styles.sliderGroup}>
        <div className={styles.sliderLabelRow}>
          <span>Viajantes</span>
          <span className={styles.sliderVal}>{travelers} {travelers === 1 ? 'pessoa' : 'pessoas'}</span>
        </div>
        <input
          type="range"
          min="1"
          max="8"
          value={travelers}
          onChange={(e) => setTravelers(parseInt(e.target.value))}
          className={styles.rangeInput}
        />
      </div>

      <div className={styles.sliderGroup}>
        <div className={styles.sliderLabelRow}>
          <span>Duração</span>
          <span className={styles.sliderVal}>{days} {days === 1 ? 'dia' : 'dias'}</span>
        </div>
        <input
          type="range"
          min="1"
          max="14"
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className={styles.rangeInput}
        />
      </div>

      {/* Tiers Selectors */}
      <div className={styles.tierSelector}>
        <label className={styles.selectorLabel}>Classe do Voo</label>
        <div className={styles.tabsGrid}>
          {[
            { id: 'economy', label: 'Económica' },
            { id: 'business', label: 'Executiva' },
            { id: 'first', label: 'Primeira' }
          ].map((tier) => (
            <button
              key={tier.id}
              className={`${styles.tabBtn} ${flightClass === tier.id ? styles.tabBtnActive : ''}`}
              onClick={() => setFlightClass(tier.id)}
            >
              {tier.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tierSelector}>
        <label className={styles.selectorLabel}>Alojamento</label>
        <div className={styles.tabsGrid}>
          {[
            { id: 'budget', label: 'Económico' },
            { id: 'boutique', label: 'Boutique' },
            { id: 'luxury', label: 'Luxo' }
          ].map((tier) => (
            <button
              key={tier.id}
              className={`${styles.tabBtn} ${hotelTier === tier.id ? styles.tabBtnActive : ''}`}
              onClick={() => setHotelTier(tier.id)}
            >
              {tier.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tierSelector}>
        <label className={styles.selectorLabel}>Refeições & Gastronomia</label>
        <div className={styles.tabsGrid}>
          {[
            { id: 'budget', label: 'Local' },
            { id: 'mid', label: 'Misto' },
            { id: 'fine', label: 'Premium' }
          ].map((tier) => (
            <button
              key={tier.id}
              className={`${styles.tabBtn} ${diningTier === tier.id ? styles.tabBtnActive : ''}`}
              onClick={() => setDiningTier(tier.id)}
            >
              {tier.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Breakdown */}
      <div className={styles.resultsArea}>
        <div className={styles.totalDisplay}>
          <span className={styles.totalLabel}>Total Estimado</span>
          <h2 className={styles.totalAmount}>
            {currency}{breakdown.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </h2>
          <span className={styles.perPerson}>
            ~{currency}{Math.round(breakdown.total / travelers)} / pessoa
          </span>
        </div>

        <div className={styles.breakdownList}>
          <div className={styles.breakdownItem}>
            <span className={styles.breakdownDot} style={{ background: 'var(--ocean)' }}></span>
            <span className={styles.breakdownName}>Voos</span>
            <span className={styles.breakdownVal}>{currency}{breakdown.flights}</span>
          </div>
          <div className={styles.breakdownItem}>
            <span className={styles.breakdownDot} style={{ background: 'var(--gold)' }}></span>
            <span className={styles.breakdownName}>Alojamento</span>
            <span className={styles.breakdownVal}>{currency}{breakdown.accommodation}</span>
          </div>
          <div className={styles.breakdownItem}>
            <span className={styles.breakdownDot} style={{ background: 'var(--coral)' }}></span>
            <span className={styles.breakdownName}>Refeições</span>
            <span className={styles.breakdownVal}>{currency}{breakdown.dining}</span>
          </div>
          <div className={styles.breakdownItem}>
            <span className={styles.breakdownDot} style={{ background: '#A3A3A3' }}></span>
            <span className={styles.breakdownName}>Atividades</span>
            <span className={styles.breakdownVal}>{currency}{breakdown.activities}</span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className={styles.progressBar}>
          <div
            className={styles.progressSeg}
            style={{ width: `${(breakdown.flights / breakdown.total) * 100}%`, background: 'var(--ocean)' }}
            title="Voos"
          />
          <div
            className={styles.progressSeg}
            style={{ width: `${(breakdown.accommodation / breakdown.total) * 100}%`, background: 'var(--gold)' }}
            title="Alojamento"
          />
          <div
            className={styles.progressSeg}
            style={{ width: `${(breakdown.dining / breakdown.total) * 100}%`, background: 'var(--coral)' }}
            title="Refeições"
          />
          <div
            className={styles.progressSeg}
            style={{ width: `${(breakdown.activities / breakdown.total) * 100}%`, background: '#A3A3A3' }}
            title="Atividades"
          />
        </div>
      </div>
    </div>
  );
}
