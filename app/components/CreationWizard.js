'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './ToastProvider';
import { trackEvent } from '../lib/analytics';
import styles from './CreationWizard.module.css';

const AUTOCOMPLETE_DATA = [
  { name: 'Tokyo, Japan', flag: '🇯🇵', continent: 'Ásia' },
  { name: 'Paris, France', flag: '🇫🇷', continent: 'Europa' },
  { name: 'Bali, Indonesia', flag: '🇮🇩', continent: 'Ásia' },
  { name: 'New York, USA', flag: '🇺🇸', continent: 'América' },
  { name: 'Lisboa, Portugal', flag: '🇵🇹', continent: 'Europa' },
  { name: 'Barcelona, Spain', flag: '🇪🇸', continent: 'Europa' },
  { name: 'London, UK', flag: '🇬🇧', continent: 'Europa' },
  { name: 'Rome, Italy', flag: '🇮🇹', continent: 'Europa' },
  { name: 'Amsterdam, Netherlands', flag: '🇳🇱', continent: 'Europa' },
  { name: 'Bangkok, Thailand', flag: '🇹🇭', continent: 'Ásia' },
  { name: 'Dubai, UAE', flag: '🇦🇪', continent: 'Médio Oriente' },
  { name: 'Istanbul, Turkey', flag: '🇹🇷', continent: 'Europa/Ásia' },
  { name: 'Kyoto, Japan', flag: '🇯🇵', continent: 'Ásia' },
  { name: 'Sydney, Australia', flag: '🇦🇺', continent: 'Oceânia' },
  { name: 'Marrakech, Morocco', flag: '🇲🇦', continent: 'África' },
  { name: 'Prague, Czech Republic', flag: '🇨🇿', continent: 'Europa' },
  { name: 'Santorini, Greece', flag: '🇬🇷', continent: 'Europa' },
  { name: 'Seoul, South Korea', flag: '🇰🇷', continent: 'Ásia' },
  { name: 'Buenos Aires, Argentina', flag: '🇦🇷', continent: 'América' },
  { name: 'Cape Town, South Africa', flag: '🇿🇦', continent: 'África' },
];

const SEASONAL_SUGGESTIONS = {
  0: [{ name: 'Tokyo, Japan', flag: '🇯🇵', why: 'Inverno suave, sem multidões' }, { name: 'Bangkok, Thailand', flag: '🇹🇭', why: 'Época seca, perfeito' }, { name: 'Dubai, UAE', flag: '🇦🇪', why: 'Temperatura ideal' }],
  1: [{ name: 'Bali, Indonesia', flag: '🇮🇩', why: 'Preços baixos' }, { name: 'Marrakech, Morocco', flag: '🇲🇦', why: 'Clima perfeito' }, { name: 'Buenos Aires, Argentina', flag: '🇦🇷', why: 'Verão portenho' }],
  2: [{ name: 'Tokyo, Japan', flag: '🇯🇵', why: 'Cerejeiras em flor 🌸' }, { name: 'Lisbon, Portugal', flag: '🇵🇹', why: 'Primavera atlântica' }, { name: 'Rome, Italy', flag: '🇮🇹', why: 'Antes da alta temporada' }],
  3: [{ name: 'Amsterdam, Netherlands', flag: '🇳🇱', why: 'Tulipas em flor 🌷' }, { name: 'Barcelona, Spain', flag: '🇪🇸', why: 'Clima perfeito' }, { name: 'Kyoto, Japan', flag: '🇯🇵', why: 'Últimas cerejeiras' }],
  4: [{ name: 'Santorini, Greece', flag: '🇬🇷', why: 'Antes das multidões de verão' }, { name: 'Prague, Czech Republic', flag: '🇨🇿', why: 'Primavera mágica' }, { name: 'Seoul, South Korea', flag: '🇰🇷', why: 'Clima ideal' }],
  5: [{ name: 'Barcelona, Spain', flag: '🇪🇸', why: 'Festival de San Juan' }, { name: 'London, UK', flag: '🇬🇧', why: 'Verão londrino' }, { name: 'Bali, Indonesia', flag: '🇮🇩', why: 'Época seca' }],
  6: [{ name: 'Santorini, Greece', flag: '🇬🇷', why: 'Pico do verão grego' }, { name: 'Cape Town, South Africa', flag: '🇿🇦', why: 'Inverno com baleias' }, { name: 'Istanbul, Turkey', flag: '🇹🇷', why: 'Noites quentes' }],
  7: [{ name: 'Sydney, Australia', flag: '🇦🇺', why: 'Inverno suave, preços baixos' }, { name: 'Santorini, Greece', flag: '🇬🇷', why: 'Verão perfeito' }, { name: 'Tokyo, Japan', flag: '🇯🇵', why: 'Festivais de verão' }],
  8: [{ name: 'Paris, France', flag: '🇫🇷', why: 'Rentrée, cidade calma' }, { name: 'Marrakech, Morocco', flag: '🇲🇦', why: 'Calor moderado' }, { name: 'New York, USA', flag: '🇺🇸', why: 'Outono dourado' }],
  9: [{ name: 'Tokyo, Japan', flag: '🇯🇵', why: 'Folhas de outono 🍁' }, { name: 'Rome, Italy', flag: '🇮🇹', why: 'Outono romano' }, { name: 'Seoul, South Korea', flag: '🇰🇷', why: 'Cores de outono' }],
  10: [{ name: 'Bangkok, Thailand', flag: '🇹🇭', why: 'Início da época seca' }, { name: 'Dubai, UAE', flag: '🇦🇪', why: 'Tempo perfeito' }, { name: 'Kyoto, Japan', flag: '🇯🇵', why: 'Folhagem vermelha' }],
  11: [{ name: 'New York, USA', flag: '🇺🇸', why: 'Natal mágico 🎄' }, { name: 'Prague, Czech Republic', flag: '🇨🇿', why: 'Mercados de Natal' }, { name: 'Bali, Indonesia', flag: '🇮🇩', why: 'Escapar ao inverno' }],
};

const bgMap = {
  'Tokyo, Japan': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600',
  'Paris, France': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600',
  'Bali, Indonesia': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600',
  'New York, USA': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600',
  'Lisboa, Portugal': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1600',
  'Rome, Italy': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600',
};

/* Custom Calendar component to handle 1 month at a time and touch targets >= 40px */
function CustomCalendar({ value, onChange }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const totalDays = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (dayNum) => {
    const clickedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

    if (!value.start || (value.start && value.end)) {
      onChange({ start: clickedDateStr, end: '', flexible: value.flexible });
    } else {
      const start = new Date(value.start);
      const clicked = new Date(clickedDateStr);
      if (clicked < start) {
        onChange({ start: clickedDateStr, end: '', flexible: value.flexible });
      } else {
        onChange({ start: value.start, end: clickedDateStr, flexible: value.flexible });
      }
    }
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className={styles.calendarDayEmpty}></div>);
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isStart = value.start === dateStr;
    const isEnd = value.end === dateStr;
    const isBetween = value.start && value.end && new Date(dateStr) > new Date(value.start) && new Date(dateStr) < new Date(value.end);

    let dayClass = styles.calendarDay;
    if (isStart) dayClass += ` ${styles.calendarDayStart}`;
    if (isEnd) dayClass += ` ${styles.calendarDayEnd}`;
    if (isBetween) dayClass += ` ${styles.calendarDayBetween}`;

    days.push(
      <button
        key={d}
        type="button"
        className={dayClass}
        onClick={() => handleDayClick(d)}
      >
        {d}
      </button>
    );
  }

  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarHeader}>
        <button type="button" className={styles.calendarNavBtn} onClick={handlePrevMonth}>&larr;</button>
        <span className={styles.calendarMonthName}>{monthNames[month]} {year}</span>
        <button type="button" className={styles.calendarNavBtn} onClick={handleNextMonth}>&rarr;</button>
      </div>
      <div className={styles.calendarWeekdays}>
        {weekdays.map(w => <div key={w} className={styles.calendarWeekday}>{w}</div>)}
      </div>
      <div className={styles.calendarDaysGrid}>
        {days}
      </div>
    </div>
  );
}

export default function CreationWizard({ isOpen, onClose, initialDestination = '', initialStep = 1 }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [step, setStep] = useState(initialStep);
  const [destination, setDestination] = useState(initialDestination);
  const [isSurprise, setIsSurprise] = useState(false);
  const [dates, setDates] = useState({ start: '', end: '', flexible: false });
  const [travelers, setTravelers] = useState({ adults: 2, children: 0 });
  const [stylesList, setStylesList] = useState([]);
  const [budgetTier, setBudgetTier] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [bgImage, setBgImage] = useState('');

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (isOpen && !isHydrated) {
      const saved = sessionStorage.getItem('andor_wizard_state');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.step) setStep(parsed.step);
          if (parsed.destination !== undefined) setDestination(parsed.destination);
          if (parsed.isSurprise !== undefined) setIsSurprise(parsed.isSurprise);
          if (parsed.dates) setDates(parsed.dates);
          if (parsed.travelers) setTravelers(parsed.travelers);
          if (parsed.stylesList) setStylesList(parsed.stylesList);
          if (parsed.budgetTier) setBudgetTier(parsed.budgetTier);
        } catch(e){}
      } else {
        setStep(initialStep);
        setDestination(initialDestination);
        setIsSurprise(false);
      }
      setIsHydrated(true);
    } else if (!isOpen) {
      setIsHydrated(false);
    }
  }, [isOpen, initialDestination, initialStep, isHydrated]);

  useEffect(() => {
    if (isHydrated && isOpen) {
      sessionStorage.setItem('andor_wizard_state', JSON.stringify({
        step, destination, isSurprise, dates, travelers, stylesList, budgetTier
      }));
    }
  }, [isHydrated, isOpen, step, destination, isSurprise, dates, travelers, stylesList, budgetTier]);

  useEffect(() => {
    if (bgMap[destination]) {
      setBgImage(bgMap[destination]);
    } else {
      setBgImage('');
    }
  }, [destination]);

  const getDaysCount = () => {
    if (!dates.start || !dates.end) return 5;
    const start = new Date(dates.start);
    const end = new Date(dates.end);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays + 1);
  };

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleStyleToggle = (styleId) => {
    if (stylesList.includes(styleId)) {
      setStylesList(stylesList.filter(s => s !== styleId));
    } else {
      if (stylesList.length < 2) {
        setStylesList([...stylesList, styleId]);
      } else {
        // Replace first
        setStylesList([stylesList[1], styleId]);
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const payload = {
        destination: isSurprise ? 'Destino Surpresa' : destination,
        days: getDaysCount(),
        budget: budgetTier,
        travelers: travelers.adults + travelers.children,
        style: stylesList.join(', ')
      };

      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('API failed');
      const data = await response.json();

      trackEvent('itinerary_generated', {
        destination: payload.destination,
        days: payload.days,
        budget: payload.budget,
        travelers: payload.travelers,
        style: payload.style
      });

      const { saveGeneratedItinerary } = await import('../lib/itinerary-store');
      const newId = saveGeneratedItinerary(data);

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
        router.push(`/itinerary/${newId}`);
      }, 1500);

    } catch (error) {
      setIsSubmitting(false);
      showToast('❌ Erro ao gerar itinerário. Tenta novamente.', 'error');
    }
  };

  const filteredDestinations = AUTOCOMPLETE_DATA.filter(d =>
    d.name.toLowerCase().includes(destination.toLowerCase())
  );

  return (
    <div className={styles.wizardOverlay} data-testid="creation-wizard">
      {bgImage && <div className={styles.wizardBg} style={{ backgroundImage: `url(${bgImage})` }}></div>}
      <div className={styles.wizardBgMask}></div>

      <div className={styles.wizardContainer}>
        {/* Fixed top progress bar */}
        <div className={styles.progressBarWrapper}>
          <div className={styles.progressBar} style={{ width: `${(step / 4) * 100}%` }}></div>
        </div>

        <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar Modal">✕</button>

        {!isSubmitting ? (
          <div className={styles.wizardContent}>

            {/* STEP 1: DESTINATION */}
            {step === 1 && (
              <div className={styles.stepFadeIn}>
                <h2 className={styles.stepTitle}>Para onde vais?</h2>
                <div className={styles.destToggleRow}>
                  <button
                    type="button"
                    className={`${styles.destToggle} ${!isSurprise ? styles.active : ''}`}
                    onClick={() => setIsSurprise(false)}
                  >
                    Tenho destino
                  </button>
                  <button
                    type="button"
                    className={`${styles.destToggle} ${isSurprise ? styles.active : ''}`}
                    onClick={() => setIsSurprise(true)}
                  >
                    Surpreende-me 🎲
                  </button>
                </div>

                {!isSurprise ? (
                  <div className={styles.inputGroup} style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className={styles.hugeInput}
                      placeholder="Ex: Tóquio, Paris..."
                      value={destination}
                      onChange={(e) => { setDestination(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      aria-label="Destino da viagem"
                      data-testid="wizard-destination-input"
                    />
                    {showDropdown && destination && filteredDestinations.length > 0 && (
                      <div className={styles.autocomplete}>
                        {filteredDestinations.map(d => (
                          <div
                            key={d.name}
                            className={styles.autoItem}
                            onClick={() => { setDestination(d.name); setShowDropdown(false); }}
                          >
                            <span className={styles.autoFlag}>{d.flag}</span>
                            <div className={styles.autoText}>
                              <span className={styles.autoCity}>{d.name.split(',')[0]}</span>
                              <span className={styles.autoCountry}>{d.name.split(',')[1] || d.continent}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.surpriseBox}>
                    <h3>🎲 Destinos recomendados para esta época</h3>
                    <p className={styles.surpriseSubtext}>Baseado no clima, festivais e preços actuais.</p>
                    <div className={styles.seasonalGrid}>
                      {(SEASONAL_SUGGESTIONS[new Date().getMonth()] || SEASONAL_SUGGESTIONS[0]).map((s, i) => (
                        <div key={i} className={styles.seasonalCard} onClick={() => { setDestination(s.name); setIsSurprise(false); }}>
                          <span className={styles.seasonalFlag}>{s.flag}</span>
                          <div className={styles.seasonalInfo}>
                            <strong>{s.name}</strong>
                            <span>{s.why}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: WHEN & WHO */}
            {step === 2 && (
              <div className={styles.stepFadeIn}>
                <h2 className={styles.stepTitle}>Quando e com quem?</h2>

                <div className={styles.calendarSection}>
                  <CustomCalendar value={dates} onChange={setDates} />
                  <div className={styles.selectedDatesSummary}>
                    <span>📅 Partida: <strong>{dates.start || 'Seleciona no mapa'}</strong></span>
                    <span> &nbsp;&middot;&nbsp; Regresso: <strong>{dates.end || 'Seleciona no mapa'}</strong></span>
                  </div>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" checked={dates.flexible} onChange={e => setDates({...dates, flexible: e.target.checked})} />
                    Datas Flexíveis (±3 dias)
                  </label>
                </div>

                <div className={styles.travelersBox}>
                  <div className={styles.travelerRow}>
                    <span>Adultos</span>
                    <div className={styles.stepper}>
                      <button type="button" className={styles.stepBtn} onClick={() => setTravelers({...travelers, adults: Math.max(1, travelers.adults - 1)})}>-</button>
                      <span className={styles.stepperValue}>{travelers.adults}</span>
                      <button type="button" className={styles.stepBtn} onClick={() => setTravelers({...travelers, adults: travelers.adults + 1})}>+</button>
                    </div>
                  </div>
                  <div className={styles.travelerRow}>
                    <span>Crianças</span>
                    <div className={styles.stepper}>
                      <button type="button" className={styles.stepBtn} onClick={() => setTravelers({...travelers, children: Math.max(0, travelers.children - 1)})}>-</button>
                      <span className={styles.stepperValue}>{travelers.children}</span>
                      <button type="button" className={styles.stepBtn} onClick={() => setTravelers({...travelers, children: travelers.children + 1})}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: STYLE */}
            {step === 3 && (
              <div className={styles.stepFadeIn}>
                <h2 className={styles.stepTitle}>Que tipo de viagem é esta?</h2>
                <p className={styles.stepSubtitle}>Escolhe até 2 estilos.</p>
                <div className={styles.styleGrid}>
                  {[
                    { id: 'aventura', icon: '🏔️', label: 'Aventura', desc: 'Trilhos e desportos extremos', bg: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=70' },
                    { id: 'gastronomia', icon: '🍽️', label: 'Gastronomia', desc: 'Mercados locais e degustações', bg: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=70' },
                    { id: 'cultura', icon: '🏛️', label: 'Cultura', desc: 'Museus, história e monumentos', bg: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=70' },
                    { id: 'romance', icon: '💑', label: 'Romance', desc: 'Sunsets e jantares românticos', bg: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&q=70' },
                    { id: 'familia', icon: '👨‍👩‍👧', label: 'Família', desc: 'Ritmo calmo, todas as idades', bg: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400&q=70' },
                    { id: 'bem-estar', icon: '🧘', label: 'Bem-estar', desc: 'Spas, yoga e relaxamento', bg: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=70' }
                  ].map(s => {
                    const isSelected = stylesList.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        className={`${styles.styleCard} ${isSelected ? styles.selected : ''}`}
                        onClick={() => handleStyleToggle(s.id)}
                        aria-pressed={isSelected}
                        data-testid={`wizard-style-${s.id}`}
                      >
                        <div className={styles.styleCardBg} style={{ backgroundImage: `url(${s.bg})` }}></div>
                        <div className={`${styles.styleCardMask} ${isSelected ? styles.selectedMask : ''}`}></div>
                        {isSelected && <div className={styles.checkmark}>✓</div>}
                        <div className={styles.styleCardContent}>
                          <span className={styles.styleIcon}>{s.icon}</span>
                          <span className={styles.styleLabel}>{s.label}</span>
                          <span className={styles.styleDesc}>{s.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: BUDGET */}
            {step === 4 && (
              <div className={styles.stepFadeIn}>
                <h2 className={styles.stepTitle}>Qual é o teu orçamento total?</h2>
                <div className={styles.budgetTiers}>
                  {[
                    { id: 'budget', name: 'Económico', range: '€0-800/pessoa', desc: 'Hostels, transportes públicos, street food' },
                    { id: 'comfort', name: 'Confortável', range: '€800-2000/pessoa', desc: 'Hotéis 3-4★, mix de restaurantes, actividades principais' },
                    { id: 'premium', name: 'Premium', range: '€2000-5000/pessoa', desc: 'Hotéis 4-5★, restaurantes especiais, experiências exclusivas' },
                    { id: 'luxury', name: 'Luxo', range: '€5000+/pessoa', desc: '5★ only, transfers privados, experiências únicas' }
                  ].map(t => {
                    const isSelected = budgetTier === t.id;
                    return (
                      <button
                        type="button"
                        key={t.id}
                        className={`${styles.budgetCard} ${isSelected ? styles.selected : ''}`}
                        onClick={() => setBudgetTier(t.id)}
                        aria-pressed={isSelected}
                        data-testid={`wizard-budget-${t.id}`}
                      >
                        {isSelected && <div className={styles.checkmark}>✓</div>}
                        <div className={styles.budgetTop}>
                          <strong className={styles.budgetName}>{t.name}</strong>
                          <span className={styles.budgetRange}>{t.range}</span>
                        </div>
                        <div className={styles.budgetDesc}>{t.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions Footer - Stacked on mobile */}
            <div className={styles.wizardFooter}>
              {step < 4 ? (
                <button
                  type="button"
                  className={styles.nextBtn}
                  onClick={handleNext}
                  disabled={step === 1 && !isSurprise && !destination}
                  data-testid="wizard-next"
                >
                  Próximo &rarr;
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={handleSubmit}
                  disabled={!budgetTier}
                  data-testid="wizard-submit"
                >
                  ✨ Criar o Meu Itinerário
                </button>
              )}

              {step > 1 && (
                <button type="button" className={styles.backBtn} onClick={handleBack} data-testid="wizard-back">
                  &larr; Anterior
                </button>
              )}
            </div>

          </div>
        ) : (
          /* LOADING SCREEN (Aurora + Takeoff) */
          <div className={styles.loadingScreen}>
            <div className={styles.auroraBg}></div>
            <div className={styles.takeoffAnim}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="var(--gold)" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z" />
              </svg>
            </div>
            <div className={styles.logoAndor}>✦ ANDOR</div>
            <h2 className={styles.loadingDestination}>
              A criar o teu itinerário para {destination.split(',')[0] || 'o teu destino'}...
            </h2>
            <div className={styles.rotatingTipsContainer}>
              <LoadingTextRotator />
            </div>
            <div className={styles.fakeProgress}>
              <div className={styles.fakeProgressBar}></div>
            </div>
            <div className={styles.percentageText}>88%</div>
            <button type="button" className={styles.cancelBtn} onClick={() => setIsSubmitting(false)}>
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingTextRotator() {
  const texts = [
    "A calcular a rota perfeita...",
    "A descobrir onde os locais comem...",
    "A verificar o que evitar...",
    "A encontrar os segredos escondidos...",
    "A optimizar cada euro do orçamento...",
    "A escolher os hotéis com mais carácter...",
    "Quase pronto para a aventura..."
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % texts.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [texts.length]);

  return <span className={styles.rotatingText}>{texts[index]}</span>;
}
