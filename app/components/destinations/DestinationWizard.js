'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from '../../context/LanguageContext';
import styles from './DestinationWizard.module.css';

const DEPARTURE_CITIES = [
  'Lisboa', 'Porto', 'Faro', 'Madrid', 'Barcelona', 'Paris', 
  'Londres', 'Amesterdão', 'Berlim', 'Roma', 'Milão', 'Zurique', 'Bruxelas'
];

const MONTHS = [
  { id: 'january', key: 'monthJan', emoji: '❄️', defaultLabel: 'Janeiro' },
  { id: 'february', key: 'monthFeb', emoji: '🌨️', defaultLabel: 'Fevereiro' },
  { id: 'march', key: 'monthMar', emoji: '🌱', defaultLabel: 'Março' },
  { id: 'april', key: 'monthApr', emoji: '🌸', defaultLabel: 'Abril' },
  { id: 'may', key: 'monthMay', emoji: '☀️', defaultLabel: 'Maio' },
  { id: 'june', key: 'monthJun', emoji: '🏖️', defaultLabel: 'Junho' },
  { id: 'july', key: 'monthJul', emoji: '🌊', defaultLabel: 'Julho' },
  { id: 'august', key: 'monthAug', emoji: '☀️', defaultLabel: 'Agosto' },
  { id: 'september', key: 'monthSep', emoji: '🍂', defaultLabel: 'Setembro' },
  { id: 'october', key: 'monthOct', emoji: '🍁', defaultLabel: 'Outubro' },
  { id: 'november', key: 'monthNov', emoji: '💨', defaultLabel: 'Novembro' },
  { id: 'december', key: 'monthDec', emoji: '🎄', defaultLabel: 'Dezembro' }
];

const DURATIONS = [
  { id: '3-4', key: 'duration3to4', defaultLabel: '3–4 dias' },
  { id: '5-7', key: 'duration5to7', defaultLabel: '5–7 dias' },
  { id: '8-10', key: 'duration8to10', defaultLabel: '8–10 dias' },
  { id: '11-14', key: 'duration11to14', defaultLabel: '11–14 dias' },
  { id: '15+', key: 'duration15plus', defaultLabel: '15+ dias' }
];

const BUDGETS = [
  { id: 'economic', key: 'budgetEconomic', descKey: 'budgetEconomicDesc', emoji: '🪙', defaultLabel: 'Económico', defaultDesc: 'Até €500' },
  { id: 'moderate', key: 'budgetModerate', descKey: 'budgetModerateDesc', emoji: '💵', defaultLabel: 'Moderado', defaultDesc: '€500–€1500' },
  { id: 'comfortable', key: 'budgetComfortable', descKey: 'budgetComfortableDesc', emoji: '💳', defaultLabel: 'Confortável', defaultDesc: '€1500–€3000' },
  { id: 'premium', key: 'budgetPremium', descKey: 'budgetPremiumDesc', emoji: '💎', defaultLabel: 'Premium', defaultDesc: '€3000–€5000' },
  { id: 'luxury', key: 'budgetLuxury', descKey: 'budgetLuxuryDesc', emoji: '🏰', defaultLabel: 'Luxo', defaultDesc: '€5000+' }
];

const TRAVEL_STYLES = [
  { id: 'beach', key: 'styleBeach', emoji: '🏖️', defaultLabel: 'Praia' },
  { id: 'city', key: 'styleCity', emoji: '🏙️', defaultLabel: 'Cidade' },
  { id: 'nature', key: 'styleNature', emoji: '🌿', defaultLabel: 'Natureza' },
  { id: 'adventure', key: 'styleAdventure', emoji: '⛰️', defaultLabel: 'Aventura' },
  { id: 'culture', key: 'styleCulture', emoji: '🏛️', defaultLabel: 'Cultura' },
  { id: 'gastronomy', key: 'styleGastronomy', emoji: '🍽️', defaultLabel: 'Gastronomia' },
  { id: 'luxury', key: 'styleLuxury', emoji: '💎', defaultLabel: 'Luxo' },
  { id: 'relax', key: 'styleRelax', emoji: '🧘', defaultLabel: 'Descanso' },
  { id: 'romantic', key: 'styleRomantic', emoji: '❤️', defaultLabel: 'Romântica' },
  { id: 'family', key: 'styleFamily', emoji: '👨‍👩‍👧', defaultLabel: 'Família' },
  { id: 'friends', key: 'styleFriends', emoji: '🎉', defaultLabel: 'Amigos' },
  { id: 'nightlife', key: 'styleNightlife', emoji: '🌙', defaultLabel: 'Vida Noturna' }
];

const CLIMATES = [
  { id: 'hot', key: 'climateHot', emoji: '☀️', defaultLabel: 'Calor' },
  { id: 'warm', key: 'climateWarm', emoji: '🌤️', defaultLabel: 'Ameno' },
  { id: 'cold', key: 'climateCold', emoji: '❄️', defaultLabel: 'Frio / Neve' },
  { id: 'any', key: 'climateAny', emoji: '🤷', defaultLabel: 'Indiferente' }
];

const FLIGHTS = [
  { id: '2', key: 'flightUpTo2', defaultLabel: 'Até 2h' },
  { id: '5', key: 'flightUpTo5', defaultLabel: 'Até 5h' },
  { id: '8', key: 'flightUpTo8', defaultLabel: 'Até 8h' },
  { id: 'any', key: 'flightAny', defaultLabel: 'Qualquer distância' }
];

const POPULARITIES = [
  { id: 'popular', key: 'popularityPopular', emoji: '🌟', defaultLabel: 'Populares' },
  { id: 'balanced', key: 'popularityBalanced', emoji: '⚖️', defaultLabel: 'Equilibrados' },
  { id: 'original', key: 'popularityOriginal', emoji: '💎', defaultLabel: 'Originais / Menos óbvios' }
];

const AVOIDS = [
  { id: 'expensive', key: 'avoidExpensive', emoji: '💸', defaultLabel: 'Destinos caros' },
  { id: 'crowded', key: 'avoidCrowded', emoji: '👥', defaultLabel: 'Turistas demais' },
  { id: 'longFlights', key: 'avoidLongFlights', emoji: '✈️', defaultLabel: 'Voos longos' },
  { id: 'layovers', key: 'avoidLayovers', emoji: '🔄', defaultLabel: 'Escalas' },
  { id: 'cold', key: 'avoidCold', emoji: '❄️', defaultLabel: 'Frio' },
  { id: 'extremeHeat', key: 'avoidExtremeHeat', emoji: '🌡️', defaultLabel: 'Calor extremo' },
  { id: 'unsafe', key: 'avoidUnsafe', emoji: '⚠️', defaultLabel: 'Pouca segurança' },
  { id: 'chaos', key: 'avoidChaos', emoji: '😵', defaultLabel: 'Muita confusão' },
  { id: 'boring', key: 'avoidBoring', emoji: '😴', defaultLabel: 'Destinos parados' }
];

export default function DestinationWizard({ onComplete, onBack, initialData }) {
  const t = useTranslations('destinations');

  const [step, setStep] = useState(1);
  const [travelMonth, setTravelMonth] = useState('flexible');
  const [duration, setDuration] = useState('5-7');
  const [departureCity, setDepartureCity] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [budgetType, setBudgetType] = useState('total');
  const [budget, setBudget] = useState('moderate');
  const [travelStyles, setTravelStyles] = useState([]);
  const [climate, setClimate] = useState('any');
  const [maxFlightHours, setMaxFlightHours] = useState('any');
  const [destinationPopularity, setDestinationPopularity] = useState('balanced');
  const [avoid, setAvoid] = useState([]);
  const [additionalInfo, setAdditionalInfo] = useState('');

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Initialize from initialData if present
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

  // Click outside listener for dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onBack();
    }
  };

  const toggleTravelStyle = (styleId) => {
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

  const handleAutocompleteSelect = (city) => {
    setDepartureCity(city);
    setShowDropdown(false);
  };

  const filteredCities = DEPARTURE_CITIES.filter(city =>
    city.toLowerCase().includes(departureCity.toLowerCase())
  );

  const getStepProgress = () => {
    return (step / 6) * 100;
  };

  const stepTitle = () => {
    switch (step) {
      case 1: return t('step1Title') || 'Quando queres viajar?';
      case 2: return t('step2Title') || 'De onde partes e com quem vais?';
      case 3: return t('step3Title') || 'Qual é o teu orçamento?';
      case 4: return t('step4Title') || 'Que tipo de viagem procuras?';
      case 5: return t('step5Title') || 'Mais algumas preferências';
      case 6: return t('step6Title') || 'Mais alguma coisa que devamos saber?';
      default: return '';
    }
  };

  const stepSubtitle = () => {
    switch (step) {
      case 1: return t('step1Subtitle') || 'Escolhe o mês e a duração ideal.';
      case 2: return t('step2Subtitle') || 'Indica a tua cidade de partida e número de viajantes.';
      case 3: return t('step3Subtitle') || 'Seleciona a faixa de orçamento que melhor se adequa.';
      case 4: return t('step4Subtitle') || 'Seleciona todos os estilos que te interessam.';
      case 5: return t('step5Subtitle') || 'Ajuda-nos a afinar as recomendações.';
      case 6: return t('step6Subtitle') || 'Acrescenta detalhes que tornem as recomendações ainda mais personalizadas.';
      default: return '';
    }
  };

  const getStepOfText = () => {
    const raw = t('wizardStepOf') || 'Passo {step} de 6';
    return raw.replace('{step}', step.toString());
  };

  const isNextDisabled = () => {
    if (step === 2 && !departureCity.trim()) return true;
    return false;
  };

  return (
    <div className={styles.wizardWrapper}>
      <div className={styles.wizardContainer}>
        {/* Progress Bar */}
        <div className={styles.progressBarWrapper}>
          <div className={styles.progressBar} style={{ width: `${getStepProgress()}%` }} />
        </div>

        {/* Back Link */}
        <button className={styles.backToHero} onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {t('common.back') || 'Voltar'}
        </button>

        {/* Step Indicator */}
        <div className={styles.stepIndicator}>
          <span>{getStepOfText()}</span>
        </div>

        {/* Headings */}
        <h2 className={styles.stepTitle}>{stepTitle()}</h2>
        <p className={styles.stepSubtitle}>{stepSubtitle()}</p>

        {/* Step Content */}
        <div className={styles.stepContent}>
          {/* STEP 1: When & Duration */}
          {step === 1 && (
            <div>
              <span className={styles.sectionLabel}>{t('monthLabel') || 'Mês de viagem'}</span>
              <div className={styles.monthGrid}>
                {MONTHS.map(m => {
                  const isSelected = travelMonth === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={`${styles.monthCard} ${isSelected ? styles.selected : ''}`}
                      onClick={() => setTravelMonth(m.id)}
                    >
                      {isSelected && <span className={styles.checkmark}>✓</span>}
                      <span className={styles.selectCardEmoji}>{m.emoji}</span>
                      <span className={styles.selectCardLabel}>{t(m.key) || m.defaultLabel}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  className={`${styles.monthCard} ${travelMonth === 'flexible' ? styles.selected : ''}`}
                  onClick={() => setTravelMonth('flexible')}
                >
                  {travelMonth === 'flexible' && <span className={styles.checkmark}>✓</span>}
                  <span className={styles.selectCardEmoji}>📅</span>
                  <span className={styles.selectCardLabel}>{t('monthFlexible') || 'Flexível'}</span>
                </button>
              </div>

              <span className={styles.sectionLabel}>{t('durationLabel') || 'Duração da viagem'}</span>
              <div className={styles.durationGrid}>
                {DURATIONS.map(d => {
                  const isSelected = duration === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      className={`${styles.durationCard} ${isSelected ? styles.selected : ''}`}
                      onClick={() => setDuration(d.id)}
                    >
                      {isSelected && <span className={styles.checkmark}>✓</span>}
                      <span className={styles.selectCardLabel}>{t(d.key) || d.defaultLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Departure & Travelers */}
          {step === 2 && (
            <div>
              <div className={styles.inputWrapper} ref={dropdownRef}>
                <label className={styles.sectionLabel} htmlFor="departureCityInput">
                  {t('departureLabel') || 'Cidade de partida'}
                </label>
                <input
                  id="departureCityInput"
                  type="text"
                  className={styles.textInput}
                  placeholder={t('departurePlaceholder') || 'Ex: Lisboa, Porto, Madrid...'}
                  value={departureCity}
                  onChange={(e) => {
                    setDepartureCity(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  autoComplete="off"
                />
                {showDropdown && departureCity.trim() !== '' && filteredCities.length > 0 && (
                  <div className={styles.autocompleteDropdown}>
                    {filteredCities.map(city => (
                      <div
                        key={city}
                        className={styles.autocompleteItem}
                        onClick={() => handleAutocompleteSelect(city)}
                      >
                        {city}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.travelersRow}>
                <span className={styles.travelersLabel}>
                  {t('travelersLabel') || 'Número de viajantes'}
                </span>
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
                    onClick={() => setTravelers(Math.min(10, travelers + 1))}
                    disabled={travelers >= 10}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Budget */}
          {step === 3 && (
            <div>
              <div className={styles.budgetToggle}>
                <button
                  type="button"
                  className={`${styles.budgetPill} ${budgetType === 'total' ? styles.active : ''}`}
                  onClick={() => setBudgetType('total')}
                >
                  {t('budgetTotal') || 'Total'}
                </button>
                <button
                  type="button"
                  className={`${styles.budgetPill} ${budgetType === 'person' ? styles.active : ''}`}
                  onClick={() => setBudgetType('person')}
                >
                  {t('budgetPerPerson') || 'Por pessoa'}
                </button>
              </div>

              <div className={styles.budgetGrid}>
                {BUDGETS.map(b => {
                  const isSelected = budget === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      className={`${styles.budgetCard} ${isSelected ? styles.selected : ''}`}
                      onClick={() => setBudget(b.id)}
                    >
                      {isSelected && <span className={styles.checkmark}>✓</span>}
                      <span className={styles.budgetCardIcon}>{b.emoji}</span>
                      <div className={styles.budgetCardContent}>
                        <span className={styles.budgetCardName}>{t(b.key) || b.defaultLabel}</span>
                        <span className={styles.budgetCardRange}>{t(b.descKey) || b.defaultDesc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Travel Styles */}
          {step === 4 && (
            <div className={styles.styleGrid}>
              {TRAVEL_STYLES.map(s => {
                const isSelected = travelStyles.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`${styles.styleCard} ${isSelected ? styles.selected : ''}`}
                    onClick={() => toggleTravelStyle(s.id)}
                  >
                    {isSelected && <span className={styles.checkmark}>✓</span>}
                    <span className={styles.selectCardEmoji}>{s.emoji}</span>
                    <span className={styles.selectCardLabel}>{t(s.key) || s.defaultLabel}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* STEP 5: Preferences */}
          {step === 5 && (
            <div>
              <div className={styles.preferencesSection}>
                <span className={styles.sectionLabel}>{t('climateLabel') || 'Clima preferido'}</span>
                <div className={styles.preferencesGrid}>
                  {CLIMATES.map(c => {
                    const isSelected = climate === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`${styles.preferenceCard} ${isSelected ? styles.selected : ''}`}
                        onClick={() => setClimate(c.id)}
                      >
                        {isSelected && <span className={styles.checkmark}>✓</span>}
                        <span className={styles.selectCardEmoji}>{c.emoji}</span>
                        <span className={styles.selectCardLabel}>{t(c.key) || c.defaultLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.preferencesSection}>
                <span className={styles.sectionLabel}>{t('flightLabel') || 'Duração máxima de voo'}</span>
                <div className={styles.preferencesGrid}>
                  {FLIGHTS.map(f => {
                    const isSelected = maxFlightHours === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        className={`${styles.preferenceCard} ${isSelected ? styles.selected : ''}`}
                        onClick={() => setMaxFlightHours(f.id)}
                      >
                        {isSelected && <span className={styles.checkmark}>✓</span>}
                        <span className={styles.selectCardLabel}>{t(f.key) || f.defaultLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.preferencesSection}>
                <span className={styles.sectionLabel}>{t('popularityLabel') || 'Tipo de destino'}</span>
                <div className={styles.preferencesGrid}>
                  {POPULARITIES.map(p => {
                    const isSelected = destinationPopularity === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`${styles.preferenceCard} ${isSelected ? styles.selected : ''}`}
                        onClick={() => setDestinationPopularity(p.id)}
                      >
                        {isSelected && <span className={styles.checkmark}>✓</span>}
                        <span className={styles.selectCardEmoji}>{p.emoji}</span>
                        <span className={styles.selectCardLabel}>{t(p.key) || p.defaultLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.preferencesSection}>
                <span className={styles.sectionLabel}>{t('avoidLabel') || 'O que preferias evitar?'}</span>
                <div className={styles.chipsGrid}>
                  {AVOIDS.map(a => {
                    const isSelected = avoid.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        className={`${styles.chip} ${isSelected ? styles.selected : ''}`}
                        onClick={() => toggleAvoid(a.id)}
                      >
                        <span className={styles.chipEmoji}>{a.emoji}</span>
                        <span>{t(a.key) || a.defaultLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Additional Info */}
          {step === 6 && (
            <div>
              <div className={styles.exampleChips}>
                {[
                  { key: 'additionalChip1', defaultVal: 'Quero um destino romântico' },
                  { key: 'additionalChip2', defaultVal: 'Boa comida é essencial' },
                  { key: 'additionalChip3', defaultVal: 'Praia e vida noturna' },
                  { key: 'additionalChip4', defaultVal: 'Seguro para viajar sozinha' },
                  { key: 'additionalChip5', defaultVal: 'Bonito mas económico' }
                ].map((chip, idx) => {
                  const text = t(chip.key) || chip.defaultVal;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={styles.exampleChip}
                      onClick={() => setAdditionalInfo(prev => prev ? `${prev}, ${text}`.trim() : text)}
                    >
                      {text}
                    </button>
                  );
                })}
              </div>

              <textarea
                className={styles.textarea}
                placeholder={t('additionalInfoPlaceholder') || 'Ex: Quero um destino romântico com boa comida, praia e sem demasiados turistas...'}
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={5}
              />
            </div>
          )}
        </div>

        {/* Wizard Footer */}
        <div className={styles.wizardFooter}>
          <button
            type="button"
            className={styles.nextBtn}
            onClick={handleNext}
            disabled={isNextDisabled()}
          >
            {step === 6 ? (t('btnDiscover') || 'Descobrir Destinos') : (t('btnNext') || 'Seguinte →')}
          </button>
          <button
            type="button"
            className={styles.backBtn}
            onClick={handleBackStep}
          >
            ← {t('btnPrevious') || 'Anterior'}
          </button>
        </div>
      </div>
    </div>
  );
}
