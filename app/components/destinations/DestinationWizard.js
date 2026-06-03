'use client';

import { useState, useEffect } from 'react';
import styles from './DestinationWizard.module.css';

const MONTHS = [
  { name: 'Janeiro', emoji: '❄️' },
  { name: 'Fevereiro', emoji: '❄️' },
  { name: 'Março', emoji: '🌸' },
  { name: 'Abril', emoji: '🌸' },
  { name: 'Maio', emoji: '🌸' },
  { name: 'Junho', emoji: '☀️' },
  { name: 'Julho', emoji: '☀️' },
  { name: 'Agosto', emoji: '☀️' },
  { name: 'Setembro', emoji: '🍁' },
  { name: 'Outubro', emoji: '🍁' },
  { name: 'Novembro', emoji: '🍁' },
  { name: 'Dezembro', emoji: '❄️' }
];

const DURATIONS = [
  { label: 'Fim de semana (2-3 dias)', value: '3' },
  { label: 'Uma semana (5-8 dias)', value: '7' },
  { label: 'Duas semanas (10-15 dias)', value: '14' },
  { label: 'Longo prazo (15+ dias)', value: '21' }
];

const POPULAR_DEPARTURES = [
  'Lisboa, Portugal',
  'Porto, Portugal',
  'Faro, Portugal',
  'Funchal, Portugal',
  'Ponta Delgada, Portugal',
  'Madrid, Espanha',
  'Paris, França',
  'Londres, Reino Unido'
];

const BUDGET_TIERS = [
  { name: 'Económico', emoji: '💰', desc: 'Alojamentos modestos, transportes públicos, refeições baratas.', rangeDaily: '< €50/dia', rangeTotal: '< €500' },
  { name: 'Moderado', emoji: '⚖️', desc: 'Hotéis de 3 estrelas, jantares em restaurantes locais, alguns tours.', rangeDaily: '€50–€150/dia', rangeTotal: '€500–€1500' },
  { name: 'Confortável', emoji: '✨', desc: 'Hotéis boutique, jantares de qualidade, flexibilidade de transporte.', rangeDaily: '€150–€300/dia', rangeTotal: '€1500–€3000' },
  { name: 'Premium', emoji: '💎', desc: 'Hotéis de 4/5 estrelas, experiências gastronómicas, transfers privados.', rangeDaily: '€300–€500/dia', rangeTotal: '€3000–€5000' },
  { name: 'Luxo', emoji: '👑', desc: 'Resorts de classe mundial, restaurantes com estrelas Michelin, guias privados.', rangeDaily: '€500+/dia', rangeTotal: '€5000+' }
];

const STYLES = [
  { id: 'praia', label: 'Praia e Sol', emoji: '🏖️', desc: 'Relaxar à beira-mar' },
  { id: 'cidade', label: 'Cultura Urbana', emoji: '🏙️', desc: 'Museus e avenidas dinâmicas' },
  { id: 'natureza', label: 'Natureza pura', emoji: '🌲', desc: 'Florestas, montanhas, paisagens' },
  { id: 'aventura', label: 'Aventura / Desporto', emoji: '🧗', desc: 'Atividades e adrenalina' },
  { id: 'romantico', label: 'Romance / Relax', emoji: '💖', desc: 'Jantares a dois e bem-estar' },
  { id: 'gastronomia', label: 'Gastronomia', emoji: '🍷', desc: 'Provar o mundo' },
  { id: 'vida-noturna', label: 'Vida Noturna', emoji: '🕺', desc: 'Bares, festas e discotecas' },
  { id: 'compras', label: 'Compras', emoji: '🛍️', desc: 'Lojas e feiras locais' },
  { id: 'familia', label: 'Familiar', emoji: '👪', desc: 'Ritmo suave para miúdos e graúdos' }
];

const CLIMATES = ['Quente', 'Temperado', 'Frio'];
const FLIGHT_HOURS = ['Sem voo', 'Curto (< 3h)', 'Médio (3-7h)', 'Longo (> 7h)'];
const POPULARITY_TIERS = ['Super Popular', 'Equilibrado', 'Longe das Multidões'];

const AVOID_ITEMS = [
  { id: 'overtourism', label: 'Excesso de Turismo', emoji: '🚫' },
  { id: 'destinos caros', label: 'Custo de vida Elevado', emoji: '💸' },
  { id: 'climas frios', label: 'Frio extremo', emoji: '🥶' },
  { id: 'barreiras linguisticas', label: 'Dificuldade de Comunicação', emoji: '🗣️' },
  { id: 'zonas com voos longos', label: 'Longas horas de viagem', emoji: '✈️' }
];

const EXAMPLES = [
  'Viagem com crianças pequenas',
  'Quero locais bons para surf',
  'Prefiro gastronomia local barata',
  'Gosto de trilhos na montanha'
];

export default function DestinationWizard({ onComplete, onBack, initialData }) {
  const [step, setStep] = useState(1);
  
  // State variables for questionnaire
  const [travelMonth, setTravelMonth] = useState('');
  const [duration, setDuration] = useState('');
  const [departureCity, setDepartureCity] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [budgetType, setBudgetType] = useState('total');
  const [budget, setBudget] = useState('moderate');
  const [travelStyles, setTravelStyles] = useState([]);
  const [climate, setClimate] = useState('Temperado');
  const [maxFlightHours, setMaxFlightHours] = useState('Médio (3-7h)');
  const [destinationPopularity, setDestinationPopularity] = useState('Balanced');
  const [avoid, setAvoid] = useState([]);
  const [additionalInfo, setAdditionalInfo] = useState('');

  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [filteredCities, setFilteredCities] = useState([]);

  // Populate initial data if present (e.g. when editing preferences)
  useEffect(() => {
    if (initialData) {
      if (initialData.travelMonth) setTravelMonth(initialData.travelMonth);
      if (initialData.duration) setDuration(initialData.duration);
      if (initialData.departureCity) setDepartureCity(initialData.departureCity);
      if (initialData.travelers) setTravelers(initialData.travelers);
      if (initialData.budgetType) setBudgetType(initialData.budgetType);
      if (initialData.budget) setBudget(initialData.budget);
      if (initialData.travelStyles) setTravelStyles(initialData.travelStyles);
      if (initialData.climate) setClimate(initialData.climate);
      if (initialData.maxFlightHours) setMaxFlightHours(initialData.maxFlightHours);
      if (initialData.destinationPopularity) setDestinationPopularity(initialData.destinationPopularity);
      if (initialData.avoid) setAvoid(initialData.avoid);
      if (initialData.additionalInfo) setAdditionalInfo(initialData.additionalInfo);
    }
  }, [initialData]);

  // Handle departure autocomplete filtering
  useEffect(() => {
    if (!departureCity) {
      setFilteredCities([]);
      return;
    }
    const filtered = POPULAR_DEPARTURES.filter(city => 
      city.toLowerCase().includes(departureCity.toLowerCase())
    );
    setFilteredCities(filtered);
  }, [departureCity]);

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
    } else {
      onComplete({
        travelMonth,
        duration,
        departureCity,
        travelers,
        budgetType,
        budget,
        travelStyles,
        climate,
        maxFlightHours,
        destinationPopularity,
        avoid,
        additionalInfo
      });
    }
  };

  const handleBackStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const toggleStyle = (styleId) => {
    if (travelStyles.includes(styleId)) {
      setTravelStyles(travelStyles.filter(s => s !== styleId));
    } else {
      setTravelStyles([...travelStyles, styleId]);
    }
  };

  const toggleAvoid = (avoidId) => {
    if (avoid.includes(avoidId)) {
      setAvoid(avoid.filter(a => a !== avoidId));
    } else {
      setAvoid([...avoid, avoidId]);
    }
  };

  // Get total progress percentage (out of 6 steps)
  const progressPercent = ((step - 1) / 6) * 100 + 5;

  return (
    <div className={styles.wizardWrapper} data-testid="destination-wizard-wrapper">
      <div className={styles.wizardContainer}>
        {/* Progress Bar */}
        <div className={styles.progressBarWrapper}>
          <div className={styles.progressBar} style={{ width: `${progressPercent}%` }}></div>
        </div>

        {/* Back navigation button */}
        <button className={styles.backToHero} onClick={handleBackStep}>
          &larr; Voltar
        </button>

        {/* STEP 1: MONTH & DURATION */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <div className={styles.stepIndicator}>Passo 1 de 6</div>
            <h2 className={styles.stepTitle}>Quando queres viajar e por quanto tempo?</h2>
            <p className={styles.stepSubtitle}>A época do ano influencia o clima e o preço em cada destino do mundo.</p>

            <span className={styles.sectionLabel}>Mês da Viagem</span>
            <div className={styles.monthGrid}>
              {MONTHS.map(m => {
                const isSelected = travelMonth === m.name;
                return (
                  <button
                    key={m.name}
                    type="button"
                    className={`${styles.monthCard} ${isSelected ? styles.selected : ''}`}
                    onClick={() => setTravelMonth(m.name)}
                  >
                    {isSelected && <span className={styles.checkmark}>✓</span>}
                    <span className={styles.selectCardEmoji}>{m.emoji}</span>
                    <span className={styles.selectCardLabel}>{m.name}</span>
                  </button>
                );
              })}
            </div>

            <span className={styles.sectionLabel}>Duração Estimada</span>
            <div className={styles.durationGrid}>
              {DURATIONS.map(d => {
                const isSelected = duration === d.value;
                return (
                  <button
                    key={d.value}
                    type="button"
                    className={`${styles.durationCard} ${isSelected ? styles.selected : ''}`}
                    onClick={() => setDuration(d.value)}
                  >
                    {isSelected && <span className={styles.checkmark}>✓</span>}
                    <span className={styles.selectCardLabel}>{d.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: DEPARTURE & TRAVELERS */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <div className={styles.stepIndicator}>Passo 2 de 6</div>
            <h2 className={styles.stepTitle}>De onde vais partir e com quem?</h2>
            <p className={styles.stepSubtitle}>Usamos isto para estimar custos de viagem e duração máxima de voos.</p>

            <span className={styles.sectionLabel}>Cidade de Partida</span>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                className={styles.textInput}
                placeholder="Ex: Lisboa, Porto, Madrid..."
                value={departureCity}
                onChange={(e) => {
                  setDepartureCity(e.target.value);
                  setAutocompleteOpen(true);
                }}
                onFocus={() => setAutocompleteOpen(true)}
              />
              {autocompleteOpen && filteredCities.length > 0 && (
                <div className={styles.autocompleteDropdown}>
                  {filteredCities.map(city => (
                    <div
                      key={city}
                      className={styles.autocompleteItem}
                      onClick={() => {
                        setDepartureCity(city);
                        setAutocompleteOpen(false);
                      }}
                    >
                      {city}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <span className={styles.sectionLabel}>Número de Viajantes</span>
            <div className={styles.travelersRow}>
              <span className={styles.travelersLabel}>Pessoas a viajar</span>
              <div className={styles.stepper}>
                <button
                  type="button"
                  className={styles.stepperBtn}
                  onClick={() => setTravelers(Math.max(1, travelers - 1))}
                  disabled={travelers <= 1}
                >
                  -
                </button>
                <span className={styles.stepperValue}>{travelers}</span>
                <button
                  type="button"
                  className={styles.stepperBtn}
                  onClick={() => setTravelers(travelers + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: BUDGET */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <div className={styles.stepIndicator}>Passo 3 de 6</div>
            <h2 className={styles.stepTitle}>Qual é a tua tolerância de orçamento?</h2>
            <p className={styles.stepSubtitle}>As nossas sugestões adaptam-se aos teus limites financeiros reais.</p>

            <div className={styles.budgetToggle}>
              <button
                type="button"
                className={`${styles.budgetPill} ${budgetType === 'total' ? styles.active : ''}`}
                onClick={() => setBudgetType('total')}
              >
                Orçamento Total
              </button>
              <button
                type="button"
                className={`${styles.budgetPill} ${budgetType === 'daily' ? styles.active : ''}`}
                onClick={() => setBudgetType('daily')}
              >
                Custo por Dia
              </button>
            </div>

            <div className={styles.budgetGrid}>
              {BUDGET_TIERS.map(b => {
                const isSelected = budget === b.name.toLowerCase();
                return (
                  <button
                    key={b.name}
                    type="button"
                    className={`${styles.budgetCard} ${isSelected ? styles.selected : ''}`}
                    onClick={() => setBudget(b.name.toLowerCase())}
                  >
                    {isSelected && <span className={styles.checkmark}>✓</span>}
                    <span className={styles.budgetCardIcon}>{b.emoji}</span>
                    <div className={styles.budgetCardContent}>
                      <span className={styles.budgetCardName}>{b.name}</span>
                      <span className={styles.budgetCardRange}>
                        {budgetType === 'total' ? b.rangeTotal : b.rangeDaily}
                      </span>
                      <span className={styles.budgetCardDesc}>{b.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: STYLE */}
        {step === 4 && (
          <div className={styles.stepContent}>
            <div className={styles.stepIndicator}>Passo 4 de 6</div>
            <h2 className={styles.stepTitle}>Que estilos de viagem preferes?</h2>
            <p className={styles.stepSubtitle}>Podes selecionar múltiplos estilos para encontrarmos o destino ideal.</p>

            <div className={styles.styleGrid}>
              {STYLES.map(s => {
                const isSelected = travelStyles.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`${styles.styleCard} ${isSelected ? styles.selected : ''}`}
                    onClick={() => toggleStyle(s.id)}
                  >
                    {isSelected && <span className={styles.checkmark}>✓</span>}
                    <span className={styles.selectCardEmoji}>{s.emoji}</span>
                    <span className={styles.selectCardLabel}>{s.label}</span>
                    <span className={styles.selectCardDesc}>{s.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: PREFERENCES */}
        {step === 5 && (
          <div className={styles.stepContent}>
            <div className={styles.stepIndicator}>Passo 5 de 6</div>
            <h2 className={styles.stepTitle}>Quais são as tuas preferências de viagem?</h2>
            <p className={styles.stepSubtitle}>Ajusta o clima, transportes e o tipo de destinos que pretendes.</p>

            <div className={styles.preferencesSection}>
              <span className={styles.sectionLabel}>Clima Desejado</span>
              <div className={styles.preferencesGrid}>
                {CLIMATES.map(c => {
                  const isSelected = climate === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      className={`${styles.preferenceCard} ${isSelected ? styles.selected : ''}`}
                      onClick={() => setClimate(c)}
                    >
                      {isSelected && <span className={styles.checkmark}>✓</span>}
                      <span className={styles.selectCardLabel}>{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.preferencesSection}>
              <span className={styles.sectionLabel}>Duração Máxima de Voo</span>
              <div className={styles.preferencesGrid}>
                {FLIGHT_HOURS.map(f => {
                  const isSelected = maxFlightHours === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      className={`${styles.preferenceCard} ${isSelected ? styles.selected : ''}`}
                      onClick={() => setMaxFlightHours(f)}
                    >
                      {isSelected && <span className={styles.checkmark}>✓</span>}
                      <span className={styles.selectCardLabel}>{f}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.preferencesSection}>
              <span className={styles.sectionLabel}>Tipo de Destinos</span>
              <div className={styles.preferencesGrid}>
                {POPULARITY_TIERS.map(p => {
                  const isSelected = destinationPopularity === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      className={`${styles.preferenceCard} ${isSelected ? styles.selected : ''}`}
                      onClick={() => setDestinationPopularity(p)}
                    >
                      {isSelected && <span className={styles.checkmark}>✓</span>}
                      <span className={styles.selectCardLabel}>{p}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.preferencesSection}>
              <span className={styles.sectionLabel}>Fatores a Evitar</span>
              <div className={styles.chipsGrid}>
                {AVOID_ITEMS.map(a => {
                  const isSelected = avoid.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      className={`${styles.chip} ${isSelected ? styles.selected : ''}`}
                      onClick={() => toggleAvoid(a.id)}
                    >
                      <span className={styles.chipEmoji}>{a.emoji}</span>
                      <span>{a.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: ADDITIONAL INFO */}
        {step === 6 && (
          <div className={styles.stepContent}>
            <div className={styles.stepIndicator}>Passo 6 de 6</div>
            <h2 className={styles.stepTitle}>Mais alguma coisa que devamos saber?</h2>
            <p className={styles.stepSubtitle}>Indica restrições, sonhos especiais ou preferências muito específicas.</p>

            <div className={styles.exampleChips}>
              {EXAMPLES.map(ex => (
                <button
                  key={ex}
                  type="button"
                  className={styles.exampleChip}
                  onClick={() => setAdditionalInfo(prev => prev ? `${prev}, ${ex}` : ex)}
                >
                  + {ex}
                </button>
              ))}
            </div>

            <textarea
              className={styles.textarea}
              placeholder="Ex: Viajo grávida e preciso de locais de fácil acesso, ou quero fazer uma surpresa romântica de aniversário..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
            />
          </div>
        )}

        {/* Navigation Footer */}
        <div className={styles.wizardFooter}>
          <button
            type="button"
            className={styles.nextBtn}
            onClick={handleNext}
            disabled={
              (step === 1 && (!travelMonth || !duration)) ||
              (step === 2 && !departureCity) ||
              (step === 3 && !budget) ||
              (step === 4 && travelStyles.length === 0)
            }
          >
            {step === 6 ? 'Gerar Recomendações' : 'Seguinte →'}
          </button>
          <button
            type="button"
            className={styles.backBtn}
            onClick={handleBackStep}
          >
            Anterior
          </button>
        </div>
      </div>
    </div>
  );
}
