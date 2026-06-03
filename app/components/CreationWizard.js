'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './ToastProvider';
import { trackEvent } from '../lib/analytics';
import {
  Compass,
  Utensils,
  BookOpen,
  Heart,
  Users as UsersIcon,
  Sparkles,
  Beer,
  ShoppingBag,
  Sliders,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  CheckCircle,
  HelpCircle,
  Briefcase,
  DollarSign
} from 'lucide-react';
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

const COUNTRY_CODES = {
  japan: 'JP',
  france: 'FR',
  indonesia: 'ID',
  usa: 'US',
  portugal: 'PT',
  spain: 'ES',
  uk: 'GB',
  italy: 'IT',
  netherlands: 'NL',
  thailand: 'TH',
  uae: 'AE',
  turkey: 'TR',
  australia: 'AU',
  morocco: 'MA',
  'czech republic': 'CZ',
  greece: 'GR',
  'south korea': 'KR',
  argentina: 'AR',
  'south africa': 'ZA',
};

const getDestinationCode = (name = '') => {
  const country = String(name).split(',').pop()?.trim().toLowerCase();
  return COUNTRY_CODES[country] || country?.slice(0, 2).toUpperCase() || 'TR';
};

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

export default function CreationWizard({
  isOpen,
  onClose,
  initialDestination = '',
  initialStep = 1,
  initialDates = null,
  initialTravelers = null,
}) {
  const router = useRouter();
  const { showToast } = useToast();

  const [step, setStep] = useState(initialStep);
  const [destination, setDestination] = useState(initialDestination);
  const [isSurprise, setIsSurprise] = useState(false);
  const [dates, setDates] = useState({ start: '', end: '', flexible: false });
  const [datesUnknown, setDatesUnknown] = useState(false);
  const [travelers, setTravelers] = useState({ adults: 2, children: 0 });
  const [stylesList, setStylesList] = useState([]);
  
  // New personalization fields
  const [travelerType, setTravelerType] = useState('couple');
  const [budgetPerDay, setBudgetPerDay] = useState(100); // defaults to €100/day
  const [dietary, setDietary] = useState([]);
  const [mobilityReduced, setMobilityReduced] = useState(false);
  const [transportPreference, setTransportPreference] = useState('any');
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [liveSuggestions, setLiveSuggestions] = useState([]);
  const [bgImage, setBgImage] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  // Debounce city autocomplete
  useEffect(() => {
    if (!destination || destination.trim().length < 2) {
      setLiveSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const response = await fetch(`/api/autocomplete?q=${encodeURIComponent(destination)}`);
        if (response.ok) {
          const data = await response.json();
          setLiveSuggestions(data);
        }
      } catch (err) {
        console.error('Failed to fetch autocomplete suggestions:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [destination]);

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
          if (parsed.datesUnknown !== undefined) setDatesUnknown(parsed.datesUnknown);
          if (parsed.travelers) setTravelers(parsed.travelers);
          if (parsed.stylesList) setStylesList(parsed.stylesList);
          if (parsed.travelerType) setTravelerType(parsed.travelerType);
          if (parsed.budgetPerDay) setBudgetPerDay(parsed.budgetPerDay);
          if (parsed.dietary) setDietary(parsed.dietary);
          if (parsed.mobilityReduced !== undefined) setMobilityReduced(parsed.mobilityReduced);
          if (parsed.transportPreference) setTransportPreference(parsed.transportPreference);
        } catch (e) {}
      } else {
        setStep(initialStep);
        setDestination(initialDestination);
        if (initialDates) setDates({ start: initialDates.start || '', end: initialDates.end || '', flexible: Boolean(initialDates.flexible) });
        if (initialTravelers) setTravelers({
          adults: Math.max(1, Number(initialTravelers.adults) || 2),
          children: Math.max(0, Number(initialTravelers.children) || 0),
        });
        setIsSurprise(false);
      }
      setIsHydrated(true);
    } else if (!isOpen) {
      setIsHydrated(false);
    }
  }, [isOpen, initialDestination, initialStep, initialDates, initialTravelers, isHydrated]);

  useEffect(() => {
    if (isHydrated && isOpen) {
      sessionStorage.setItem('andor_wizard_state', JSON.stringify({
        step, destination, isSurprise, dates, datesUnknown, travelers, stylesList,
        travelerType, budgetPerDay, dietary, mobilityReduced, transportPreference
      }));
    }
  }, [isHydrated, isOpen, step, destination, isSurprise, dates, datesUnknown, travelers, stylesList, travelerType, budgetPerDay, dietary, mobilityReduced, transportPreference]);

  useEffect(() => {
    if (bgMap[destination]) {
      setBgImage(bgMap[destination]);
    } else {
      setBgImage('');
    }
  }, [destination]);

  const getDaysCount = () => {
    if (datesUnknown || !dates.start || !dates.end) return 5;
    const start = new Date(dates.start);
    const end = new Date(dates.end);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays + 1);
  };

  const getBudgetTierLabel = (val) => {
    if (val <= 80) return 'Económico';
    if (val <= 150) return 'Confortável';
    if (val <= 300) return 'Premium';
    return 'Luxo';
  };

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1 && !isSurprise && !destination.trim()) {
      showToast('Indica o destino da viagem.', 'warning');
      return;
    }
    if (step === 2 && !datesUnknown && (!dates.start || !dates.end)) {
      showToast('Seleciona as datas ou marca que ainda não sabes.', 'warning');
      return;
    }
    if (step === 3 && stylesList.length === 0) {
      showToast('Escolhe pelo menos um estilo de viagem.', 'warning');
      return;
    }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleStyleToggle = (styleId) => {
    if (stylesList.includes(styleId)) {
      setStylesList(stylesList.filter(s => s !== styleId));
    } else {
      if (stylesList.length < 3) {
        setStylesList([...stylesList, styleId]);
      } else {
        setStylesList([...stylesList.slice(1), styleId]);
      }
    }
  };

  const handleDietaryToggle = (item) => {
    if (dietary.includes(item)) {
      setDietary(dietary.filter(d => d !== item));
    } else {
      setDietary([...dietary, item]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const payload = {
        destination: isSurprise ? 'Destino Surpresa' : destination,
        days: getDaysCount(),
        budget: getBudgetTierLabel(budgetPerDay).toLowerCase(),
        travelers: travelers.adults + travelers.children,
        style: stylesList.join(', '),
        startDate: datesUnknown ? null : dates.start,
        endDate: datesUnknown ? null : dates.end,
        datesFlexible: dates.flexible,
        // Advanced personalization preferences
        travelerType,
        dietaryRestrictions: dietary,
        mobilityReduced,
        transportPreference,
        budgetPerDay
      };

      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('API failed');
      const data = await response.json();
      const itinerary = data.itinerary || data;

      trackEvent('itinerary_generated', {
        destination: payload.destination,
        days: payload.days,
        budget: payload.budget,
        travelers: payload.travelers,
        style: payload.style
      });

      const { saveGeneratedItinerary } = await import('../lib/itinerary-store');
      const newId = saveGeneratedItinerary(itinerary);

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
        router.push(`/itinerary/${newId}`);
      }, 1500);

    } catch (error) {
      setIsSubmitting(false);
      showToast('Erro ao gerar itinerário. Tenta novamente.', 'error');
    }
  };

  const filteredDestinations = liveSuggestions.length > 0
    ? liveSuggestions
    : AUTOCOMPLETE_DATA.filter(d =>
        d.name.toLowerCase().includes(destination.toLowerCase())
      );

  const estimatedTotal = budgetPerDay * getDaysCount() * (travelers.adults + travelers.children);

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
                    Surpreende-me
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
                    <h3>Destinos recomendados para esta época</h3>
                    <p className={styles.surpriseSubtext}>Baseado no clima, festivais e preços actuais.</p>
                    <div className={styles.seasonalGrid}>
                      {(SEASONAL_SUGGESTIONS[new Date().getMonth()] || SEASONAL_SUGGESTIONS[0]).map((s, i) => (
                        <div key={i} className={styles.seasonalCard} onClick={() => { setDestination(s.name); setIsSurprise(false); }}>
                          <span className={styles.seasonalFlag}>{getDestinationCode(s.name)}</span>
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
                    <span>Partida: <strong>{dates.start || 'Seleciona no mapa'}</strong></span>
                    <span> &nbsp;&middot;&nbsp; Regresso: <strong>{dates.end || 'Seleciona no mapa'}</strong></span>
                  </div>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" checked={dates.flexible} onChange={e => setDates({...dates, flexible: e.target.checked})} />
                    Datas Flexíveis (±3 dias)
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={datesUnknown}
                      onChange={e => setDatesUnknown(e.target.checked)}
                      data-testid="wizard-dates-unknown"
                    />
                    Ainda não sei as datas
                  </label>
                </div>

                <div className={styles.travelersBox}>
                  <div className={styles.travelerRow}>
                    <span>Tipo de Viajante</span>
                    <select
                      className={styles.selectInput}
                      value={travelerType}
                      onChange={(e) => setTravelerType(e.target.value)}
                    >
                      <option value="solo">Solo</option>
                      <option value="couple">Casal</option>
                      <option value="friends">Grupo de Amigos</option>
                      <option value="family">Família</option>
                      <option value="honeymoon">Lua de Mel</option>
                    </select>
                  </div>
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
                <p className={styles.stepSubtitle}>Escolhe até 3 estilos.</p>
                <div className={styles.styleGrid}>
                  {[
                    { id: 'aventura', icon: <Compass size={24} />, label: 'Aventura', desc: 'Trilhos e desportos extremos', bg: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=70' },
                    { id: 'gastronomia', icon: <Utensils size={24} />, label: 'Gastronomia', desc: 'Mercados locais e degustações', bg: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=70' },
                    { id: 'cultura', icon: <BookOpen size={24} />, label: 'Cultura', desc: 'Museus, história e monumentos', bg: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=70' },
                    { id: 'romance', icon: <Heart size={24} />, label: 'Romance', desc: 'Sunsets e jantares românticos', bg: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&q=70' },
                    { id: 'familia', icon: <UsersIcon size={24} />, label: 'Família', desc: 'Ritmo calmo, todas as idades', bg: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400&q=70' },
                    { id: 'bem-estar', icon: <Sparkles size={24} />, label: 'Bem-estar', desc: 'Spas, yoga e relaxamento', bg: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=70' },
                    { id: 'vida-noturna', icon: <Beer size={24} />, label: 'Vida Noturna', desc: 'Bares, clubes e vida noturna', bg: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=70' },
                    { id: 'compras', icon: <ShoppingBag size={24} />, label: 'Compras', desc: 'Lojas locais, mercados e boutiques', bg: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=70' }
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

            {/* STEP 4: BUDGET SLIDER */}
            {step === 4 && (
              <div className={styles.stepFadeIn}>
                <h2 className={styles.stepTitle}>Qual é o teu orçamento diário?</h2>
                <p className={styles.stepSubtitle}>Orçamento diário estimado por pessoa (alojamento + refeições + atividades)</p>

                {/* Presets for E2E and quick selection */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setBudgetPerDay(50)}
                    data-testid="wizard-budget-economy"
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--b-1)',
                      background: budgetPerDay <= 80 ? 'var(--gold)' : 'var(--bg-elevated)',
                      color: budgetPerDay <= 80 ? 'var(--bg-primary)' : 'var(--t-1)',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      transition: 'all 200ms'
                    }}
                  >
                    💰 Económico
                  </button>
                  <button
                    type="button"
                    onClick={() => setBudgetPerDay(120)}
                    data-testid="wizard-budget-comfort"
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--b-1)',
                      background: budgetPerDay > 80 && budgetPerDay <= 150 ? 'var(--gold)' : 'var(--bg-elevated)',
                      color: budgetPerDay > 80 && budgetPerDay <= 150 ? 'var(--bg-primary)' : 'var(--t-1)',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      transition: 'all 200ms'
                    }}
                  >
                    ✨ Confortável
                  </button>
                  <button
                    type="button"
                    onClick={() => setBudgetPerDay(250)}
                    data-testid="wizard-budget-premium"
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--b-1)',
                      background: budgetPerDay > 150 && budgetPerDay <= 300 ? 'var(--gold)' : 'var(--bg-elevated)',
                      color: budgetPerDay > 150 && budgetPerDay <= 300 ? 'var(--bg-primary)' : 'var(--t-1)',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      transition: 'all 200ms'
                    }}
                  >
                    💎 Premium
                  </button>
                </div>

                <div className={styles.sliderSection}>
                  <div className={styles.sliderValueRow}>
                    <span className={styles.sliderLabel}>Orçamento Diário:</span>
                    <strong className={styles.sliderValue}>€{budgetPerDay} <span className={styles.sliderPerDay}>/ dia por pessoa</span></strong>
                  </div>
                  
                  <input
                    type="range"
                    min="30"
                    max="500"
                    step="5"
                    value={budgetPerDay}
                    onChange={(e) => setBudgetPerDay(Number(e.target.value))}
                    className={styles.rangeSlider}
                  />

                  <div className={styles.sliderLabelRow}>
                    <span>€30</span>
                    <span>€150</span>
                    <span>€300</span>
                    <span>€500+</span>
                  </div>

                  <div className={styles.sliderTierStatus}>
                    Classe de Serviço: <strong className={styles.tierNameStatus}>{getBudgetTierLabel(budgetPerDay)}</strong>
                  </div>
                </div>

                <div className={styles.budgetStatsBox}>
                  <h3 className={styles.statsBoxTitle}>Estimativa de Custo Total da Viagem:</h3>
                  <div className={styles.statsBoxGrid}>
                    <div className={styles.statsItem}>
                      <span className={styles.statsLabel}>Duração</span>
                      <strong className={styles.statsVal}>{getDaysCount()} dias</strong>
                    </div>
                    <div className={styles.statsItem}>
                      <span className={styles.statsLabel}>Viajantes</span>
                      <strong className={styles.statsVal}>{travelers.adults + travelers.children}</strong>
                    </div>
                    <div className={styles.statsItem}>
                      <span className={styles.statsLabel}>Custo Total Est.</span>
                      <strong className={styles.statsVal} style={{ color: 'var(--gold-light)' }}>€{estimatedTotal}</strong>
                    </div>
                  </div>
                </div>

                {/* Collapsible Advanced Preferences panel */}
                <div className={styles.collapsibleSection} style={{ marginTop: '24px' }}>
                  <button
                    type="button"
                    className={styles.collapseHeader}
                    onClick={() => setAdvancedExpanded(!advancedExpanded)}
                  >
                    <span>Preferências de Viagem Avançadas (Opcional)</span>
                    {advancedExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {advancedExpanded && (
                    <div className={styles.collapseContent}>
                      {/* Dietary Restrictions */}
                      <div className={styles.prefGroup}>
                        <h4 className={styles.prefGroupTitle}>Restrições Alimentares</h4>
                        <div className={styles.checkboxGrid}>
                          {['Vegetariano', 'Vegan', 'Halal', 'Sem Glúten'].map(opt => {
                            const isChecked = dietary.includes(opt);
                            return (
                              <button
                                type="button"
                                key={opt}
                                className={`${styles.badgeSelector} ${isChecked ? styles.badgeActive : ''}`}
                                onClick={() => handleDietaryToggle(opt)}
                              >
                                {opt} {isChecked && '✓'}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Mobility */}
                      <div className={styles.prefGroup}>
                        <h4 className={styles.prefGroupTitle}>Acessibilidade / Mobilidade Reduzida</h4>
                        <label className={styles.toggleRow}>
                          <span>Necessito de rotas adaptadas para mobilidade reduzida</span>
                          <input
                            type="checkbox"
                            checked={mobilityReduced}
                            onChange={(e) => setMobilityReduced(e.target.checked)}
                            className={styles.toggleSwitch}
                          />
                        </label>
                      </div>

                      {/* Transport */}
                      <div className={styles.prefGroup}>
                        <h4 className={styles.prefGroupTitle}>Preferência de Transportes</h4>
                        <div className={styles.radioGroup}>
                          {[
                            { id: 'any', label: 'Qualquer transporte' },
                            { id: 'avoid flights', label: 'Evitar voos internos' },
                            { id: 'ground only', label: 'Apenas transporte terrestre' }
                          ].map(t => (
                            <label key={t.id} className={styles.radioLabel}>
                              <input
                                type="radio"
                                name="transportPref"
                                value={t.id}
                                checked={transportPreference === t.id}
                                onChange={() => setTransportPreference(t.id)}
                              />
                              <span>{t.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Final Summary Card */}
                <div className={styles.summaryCard} style={{ marginTop: '24px' }}>
                  <h3 className={styles.summaryTitle}>✦ Confirmar Viagem Andor</h3>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryItemLabel}><MapPin size={14} /> Destino:</span>
                    <strong>{isSurprise ? 'Destino Surpresa' : destination || 'Destino por definir'}</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryItemLabel}><Calendar size={14} /> Duração & Datas:</span>
                    <strong>{getDaysCount()} dias {datesUnknown ? '(Datas Flexíveis)' : `(${dates.start} a ${dates.end})`}</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryItemLabel}><UsersIcon size={14} /> Viajantes:</span>
                    <strong>{travelers.adults + travelers.children} ({travelerType === 'couple' ? 'Casal' : travelerType})</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryItemLabel}><Briefcase size={14} /> Estilos:</span>
                    <strong style={{ textTransform: 'capitalize' }}>{stylesList.join(', ') || 'Nenhum'}</strong>
                  </div>
                  <div className={styles.summaryRow} style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '10px', marginTop: '10px' }}>
                    <span className={styles.summaryItemLabel}><DollarSign size={14} /> Custo Estimado:</span>
                    <strong style={{ color: 'var(--gold-light)', fontSize: '1.2rem' }}>€{estimatedTotal} <span style={{ fontSize: '0.8rem', color: '#aaa', fontWeight: 'normal' }}>(€{budgetPerDay}/dia)</span></strong>
                  </div>
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
                  disabled={
                    (step === 1 && !isSurprise && !destination.trim()) ||
                    (step === 2 && !datesUnknown && (!dates.start || !dates.end)) ||
                    (step === 3 && stylesList.length === 0)
                  }
                  data-testid="wizard-next"
                >
                  Próximo &rarr;
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={handleSubmit}
                  data-testid="wizard-submit"
                >
                  Criar o meu itinerário
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
