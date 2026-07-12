'use client';
import { useState, useEffect, useRef } from 'react';
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
  DollarSign,
  FileText,
  RotateCcw,
  Save,
  TriangleAlert,
} from 'lucide-react';
import styles from './CreationWizard.module.css';
import {
  getPlannerDayCount,
  getPlannerStepError,
  normalizeFlexibleDays,
  normalizePlannerDraft,
  PLANNER_DRAFT_KEY,
  PLANNER_DRAFT_VERSION,
} from '../lib/planner-state';

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

const TRAVELER_LABELS = {
  solo: 'Solo',
  couple: 'Casal',
  friends: 'Amigos',
  family: 'Família',
  honeymoon: 'Lua de mel',
  business: 'Negócios',
  'client-trip': 'Cliente',
  'company-trip': 'Empresa',
};

const TRANSPORT_LABELS = {
  public: 'Transportes públicos',
  car: 'Rent-a-car',
  walk: 'A pé',
  any: 'Mix inteligente',
};

const PACE_LABELS = { intense: 'Intenso', balanced: 'Equilibrado', relaxed: 'Relaxado' };
const WALKING_LABELS = { low: 'Pouco a pé', medium: 'Caminhadas normais', high: 'Muito a pé' };
const AUTHENTICITY_LABELS = { iconic: 'Ícones primeiro', balanced: 'Meio-termo', local: 'Mais local' };
const FOOD_LABELS = { safe: 'Sabores seguros', balanced: 'Equilibrado', adventurous: 'Aventura gastronómica' };

function CustomCalendar({ value, onChange }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

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
    if (clickedDateStr < todayStr) return;

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
    const isPast = dateStr < todayStr;

    let dayClass = styles.calendarDay;
    if (isStart) dayClass += ` ${styles.calendarDayStart}`;
    if (isEnd) dayClass += ` ${styles.calendarDayEnd}`;
    if (isBetween) dayClass += ` ${styles.calendarDayBetween}`;
    if (isPast) dayClass += ` ${styles.calendarDayDisabled}`;

    days.push(
      <button
        key={d}
        type="button"
        className={dayClass}
        onClick={() => handleDayClick(d)}
        disabled={isPast}
        aria-label={`${d} de ${monthNames[month]} de ${year}${isPast ? ', indisponível' : ''}`}
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
  const [flexibleDays, setFlexibleDays] = useState(5);
  const [travelers, setTravelers] = useState({ adults: 2, children: 0 });
  const [stylesList, setStylesList] = useState([]);
  
  // New personalization fields
  const [travelerType, setTravelerType] = useState('couple');
  const [companyMode, setCompanyMode] = useState(false);
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [preparedBy, setPreparedBy] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [clientFacingNotes, setClientFacingNotes] = useState('');
  const [exportPreference, setExportPreference] = useState('client_pdf');
  const [budgetPerDay, setBudgetPerDay] = useState(100); // defaults to €100/day
  const [dietary, setDietary] = useState([]);
  const [mobilityReduced, setMobilityReduced] = useState(false);
  const [transportPreference, setTransportPreference] = useState('any');
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [budgetIncludesFlights, setBudgetIncludesFlights] = useState('unknown');
  const [pace, setPace] = useState('balanced');
  const [childrenAges, setChildrenAges] = useState('');
  const [kidsWalking, setKidsWalking] = useState('medium');
  const [arrivalInstinct, setArrivalInstinct] = useState('market');
  const [memoryPreference, setMemoryPreference] = useState('meal');
  const [hotelPreference, setHotelPreference] = useState('balanced');
  const [originCity, setOriginCity] = useState('');
  const [arrivalTime, setArrivalTime] = useState('afternoon');
  const [departureTime, setDepartureTime] = useState('afternoon');
  const [mustSee, setMustSee] = useState('');
  const [avoid, setAvoid] = useState('');
  const [authenticityLevel, setAuthenticityLevel] = useState('balanced');
  const [walkingLevel, setWalkingLevel] = useState('medium');
  const [foodAdventure, setFoodAdventure] = useState('balanced');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [liveSuggestions, setLiveSuggestions] = useState([]);
  const [bgImage, setBgImage] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const generationAbortRef = useRef(null);

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
      let draft = null;
      try {
        draft = normalizePlannerDraft(JSON.parse(sessionStorage.getItem(PLANNER_DRAFT_KEY) || 'null'));
      } catch (error) {
        draft = null;
      }

      setStep(initialStep > 1 ? initialStep : draft?.step || initialStep);
      setDestination(initialDestination || draft?.destination || '');
      setDates(initialDates
        ? { start: initialDates.start || '', end: initialDates.end || '', flexible: Boolean(initialDates.flexible) }
        : draft?.dates || { start: '', end: '', flexible: false });
      setDatesUnknown(Boolean(draft?.datesUnknown));
      setFlexibleDays(normalizeFlexibleDays(draft?.flexibleDays));
      setTravelers(initialTravelers ? {
        adults: Math.max(1, Number(initialTravelers.adults) || 2),
        children: Math.max(0, Number(initialTravelers.children) || 0),
      } : draft?.travelers || { adults: 2, children: 0 });
      setStylesList(draft?.stylesList || []);
      setTravelerType(draft?.travelerType || 'couple');
      setCompanyMode(Boolean(draft?.companyMode));
      setClientName(draft?.clientName || '');
      setCompanyName(draft?.companyName || '');
      setPreparedBy(draft?.preparedBy || '');
      setInternalNotes(draft?.internalNotes || '');
      setClientFacingNotes(draft?.clientFacingNotes || '');
      setExportPreference(draft?.exportPreference || 'client_pdf');
      setBudgetPerDay(Number(draft?.budgetPerDay) || 100);
      setDietary(draft?.dietary || []);
      setMobilityReduced(Boolean(draft?.mobilityReduced));
      setTransportPreference(draft?.transportPreference || 'any');
      setBudgetIncludesFlights(draft?.budgetIncludesFlights || 'unknown');
      setPace(draft?.pace || 'balanced');
      setChildrenAges(draft?.childrenAges || '');
      setKidsWalking(draft?.kidsWalking || 'medium');
      setArrivalInstinct(draft?.arrivalInstinct || 'market');
      setMemoryPreference(draft?.memoryPreference || 'meal');
      setHotelPreference(draft?.hotelPreference || 'balanced');
      setIsSurprise(Boolean(draft?.isSurprise));
      setOriginCity(draft?.originCity || '');
      setArrivalTime(draft?.arrivalTime || 'afternoon');
      setDepartureTime(draft?.departureTime || 'afternoon');
      setMustSee(draft?.mustSee || '');
      setAvoid(draft?.avoid || '');
      setAuthenticityLevel(draft?.authenticityLevel || 'balanced');
      setWalkingLevel(draft?.walkingLevel || 'medium');
      setFoodAdventure(draft?.foodAdventure || 'balanced');
      setDraftRestored(Boolean(draft));
      setIsHydrated(true);
    } else if (!isOpen) {
      setIsHydrated(false);
    }
  }, [isOpen, initialDestination, initialStep, initialDates, initialTravelers, isHydrated]);

  useEffect(() => {
    if (!isOpen || !initialDestination.trim()) return;
    setDestination(initialDestination);
  }, [initialDestination, isOpen]);

  useEffect(() => {
    if (!isHydrated || !isOpen || isSubmitting) return undefined;
    const timer = window.setTimeout(() => {
      const draft = {
        version: PLANNER_DRAFT_VERSION,
        updatedAt: new Date().toISOString(),
        step,
        destination,
        isSurprise,
        dates,
        datesUnknown,
        flexibleDays,
        travelers,
        stylesList,
        travelerType,
        companyMode,
        clientName,
        companyName,
        preparedBy,
        internalNotes,
        clientFacingNotes,
        exportPreference,
        budgetPerDay,
        dietary,
        mobilityReduced,
        transportPreference,
        budgetIncludesFlights,
        pace,
        childrenAges,
        kidsWalking,
        arrivalInstinct,
        memoryPreference,
        hotelPreference,
        originCity,
        arrivalTime,
        departureTime,
        mustSee,
        avoid,
        authenticityLevel,
        walkingLevel,
        foodAdventure,
      };
      try {
        sessionStorage.setItem(PLANNER_DRAFT_KEY, JSON.stringify(draft));
      } catch (error) {}
    }, 250);
    return () => window.clearTimeout(timer);
  }, [
    isHydrated, isOpen, isSubmitting, step, destination, isSurprise, dates, datesUnknown,
    flexibleDays, travelers, stylesList, travelerType, companyMode, clientName, companyName,
    preparedBy, internalNotes, clientFacingNotes, exportPreference, budgetPerDay, dietary,
    mobilityReduced, transportPreference, budgetIncludesFlights, pace, childrenAges,
    kidsWalking, arrivalInstinct, memoryPreference, hotelPreference, originCity, arrivalTime,
    departureTime, mustSee, avoid, authenticityLevel, walkingLevel, foodAdventure,
  ]);

  useEffect(() => {
    if (bgMap[destination]) {
      setBgImage(bgMap[destination]);
    } else {
      setBgImage('');
    }
  }, [destination]);

  const getDaysCount = () => {
    return getPlannerDayCount({ datesUnknown, flexibleDays, dates });
  };

  const getBudgetTierLabel = (val) => {
    if (val <= 80) return 'Económico';
    if (val <= 150) return 'Confortável';
    if (val <= 300) return 'Premium';
    return 'Luxo';
  };

  if (!isOpen) return null;

  const handleNext = () => {
    const error = getPlannerStepError(step, {
      destination,
      isSurprise,
      dates,
      datesUnknown,
      companyMode,
      clientName,
      stylesList,
    });
    if (error) {
      showToast(error, 'warning');
      return;
    }
    if (step < 7) setStep(step + 1);
  };

  const handleResetDraft = () => {
    try {
      sessionStorage.removeItem(PLANNER_DRAFT_KEY);
    } catch (error) {}
    setGenerationError('');
    setDraftRestored(false);
    setIsHydrated(false);
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

  const handleSubmit = async (forceFallback = false) => {
    const controller = new AbortController();
    generationAbortRef.current = controller;
    setGenerationError('');
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
        companyMode,
        clientName,
        companyName,
        preparedBy,
        internalNotes,
        clientFacingNotes,
        exportPreference,
        budgetApprovalStatus: companyMode ? 'pending' : 'not_requested',
        bookingStatus: 'not_started',
        dietaryRestrictions: dietary,
        mobilityReduced,
        transportPreference,
        budgetPerDay,
        budgetIncludesFlights,
        pace,
        childrenAges,
        kidsWalking,
        originCity,
        arrivalTime,
        departureTime,
        mustSee: mustSee.split(/[,\n]/).map((item) => item.trim()).filter(Boolean),
        avoid: avoid.split(/[,\n]/).map((item) => item.trim()).filter(Boolean),
        authenticityLevel,
        walkingLevel,
        foodAdventure,
        memoryMode: 'none',
        doNotUseStoredMemory: true,
        forceFallback,
        personalityContext: {
          arrivalInstinct,
          memoryPreference,
          hotelPreference,
        }
      };

      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const failure = await response.json().catch(() => null);
        throw new Error(failure?.error?.message || failure?.message || 'Não foi possível gerar o roteiro.');
      }
      const data = await response.json();
      const itinerary = data.itinerary || data;

      trackEvent('itinerary_generated', {
        destination: payload.destination,
        days: payload.days,
        budget: payload.budget,
        travelers: payload.travelers,
        style: payload.style,
        source: itinerary.metadata?.generationSource || (forceFallback ? 'fallback' : 'generated'),
      });

      const { saveGeneratedItinerary } = await import('../lib/itinerary-store');
      const newId = saveGeneratedItinerary(itinerary);

      try {
        sessionStorage.removeItem(PLANNER_DRAFT_KEY);
      } catch (error) {}
      setIsSubmitting(false);
      router.push(`/itinerary/${newId}`);
    } catch (error) {
      if (error?.name === 'AbortError') return;
      setIsSubmitting(false);
      const message = error?.message || 'Não foi possível gerar o roteiro.';
      setGenerationError(message);
      showToast(message, 'error');
    } finally {
      if (generationAbortRef.current === controller) generationAbortRef.current = null;
    }
  };

  const handleCancelGeneration = () => {
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
    setIsSubmitting(false);
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
          <div className={styles.progressBar} style={{ width: `${(step / 7) * 100}%` }}></div>
        </div>

        <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar Modal">✕</button>

        {!isSubmitting ? (
          <div className={styles.wizardContent}>
            <div className={styles.progressPills} aria-label="Progresso do wizard">
              {['Destino', 'Datas', 'Estilo', 'Orcamento', 'Ritmo', 'Perfil', 'Resumo'].map((label, index) => (
                <span
                  key={label}
                  className={`${styles.progressPill} ${step === index + 1 ? styles.progressPillActive : ''} ${step > index + 1 ? styles.progressPillDone : ''}`}
                >
                  {label}
                </span>
              ))}
            </div>
            {(draftRestored || step > 1 || destination.trim()) && (
              <div className={styles.draftStatus} role="status">
                <span><Save size={14} aria-hidden="true" /> {draftRestored ? 'Rascunho retomado' : 'Rascunho guardado neste dispositivo'}</span>
                <button type="button" onClick={handleResetDraft} title="Recomeçar o planeamento">
                  <RotateCcw size={14} aria-hidden="true" />
                  Recomeçar
                </button>
              </div>
            )}

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
                <div className={styles.followUpBox}>
                  <label>
                    <span>De onde partes?</span>
                    <input
                      className={styles.textInput}
                      value={originCity}
                      onChange={(event) => setOriginCity(event.target.value)}
                      placeholder="Ex: Lisboa, Porto, Madrid"
                    />
                  </label>
                </div>
                <div className={styles.contextCard}>
                  <strong>Porque pergunto?</strong>
                  <span>O destino muda moeda, fuso horario, vistos, clima e bairros ideais para ficar.</span>
                </div>
              </div>
            )}

            {/* STEP 2: WHEN & WHO */}
            {step === 2 && (
              <div className={styles.stepFadeIn}>
                <h2 className={styles.stepTitle}>Quando e com quem?</h2>

                <div className={styles.calendarSection}>
                  {!datesUnknown && (
                    <>
                      <CustomCalendar value={dates} onChange={setDates} />
                      <div className={styles.selectedDatesSummary}>
                        <span>Partida: <strong>{dates.start || 'Seleciona no calendário'}</strong></span>
                        <span> &nbsp;&middot;&nbsp; Regresso: <strong>{dates.end || 'Seleciona no calendário'}</strong></span>
                      </div>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" checked={dates.flexible} onChange={e => setDates({...dates, flexible: e.target.checked})} />
                        Datas flexíveis (±3 dias)
                      </label>
                    </>
                  )}
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={datesUnknown}
                      onChange={e => setDatesUnknown(e.target.checked)}
                      data-testid="wizard-dates-unknown"
                    />
                    Ainda não sei as datas
                  </label>
                  {datesUnknown && (
                    <div className={styles.flexibleDuration}>
                      <div>
                        <strong>Quantos dias estás a imaginar?</strong>
                        <span>Podes ajustar as datas depois sem perder o roteiro.</span>
                      </div>
                      <div className={styles.stepper} aria-label="Duração flexível da viagem">
                        <button
                          type="button"
                          className={styles.stepBtn}
                          onClick={() => setFlexibleDays((value) => normalizeFlexibleDays(value - 1))}
                          disabled={flexibleDays <= 1}
                          aria-label="Retirar um dia"
                        >-</button>
                        <span className={styles.stepperValue}>{flexibleDays} dias</span>
                        <button
                          type="button"
                          className={styles.stepBtn}
                          onClick={() => setFlexibleDays((value) => normalizeFlexibleDays(value + 1))}
                          disabled={flexibleDays >= 14}
                          aria-label="Adicionar um dia"
                        >+</button>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.followUpBox}>
                  <h3 className={styles.followUpTitle}>Como chegam e saem os dias?</h3>
                  <div className={styles.optionGrid}>
                    {[
                      { id: 'morning', label: 'Chego de manha', text: 'Da para orientar e fazer um bairro leve' },
                      { id: 'afternoon', label: 'Chego a tarde', text: 'Primeiro dia suave e jantar certo' },
                      { id: 'night', label: 'Chego a noite', text: 'Sem planos ambiciosos no dia 1' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={`${styles.choiceCard} ${arrivalTime === item.id ? styles.choiceCardActive : ''}`}
                        onClick={() => setArrivalTime(item.id)}
                      >
                        <strong>{item.label}</strong>
                        <span>{item.text}</span>
                      </button>
                    ))}
                  </div>
                  <div className={styles.optionGrid}>
                    {[
                      { id: 'morning', label: 'Saio de manha', text: 'Ultimo dia so checkout e aeroporto' },
                      { id: 'afternoon', label: 'Saio a tarde', text: 'Cabe uma ultima manha perto da base' },
                      { id: 'night', label: 'Saio a noite', text: 'Ultimo dia ainda pode render' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={`${styles.choiceCard} ${departureTime === item.id ? styles.choiceCardActive : ''}`}
                        onClick={() => setDepartureTime(item.id)}
                      >
                        <strong>{item.label}</strong>
                        <span>{item.text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.travelersBox}>
                  <div className={styles.travelerRow}>
                    <span>Tipo de Viajante</span>
                    <select
                      className={styles.selectInput}
                      value={travelerType}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        setTravelerType(nextType);
                        if (['business', 'client-trip', 'company-trip'].includes(nextType)) {
                          setCompanyMode(true);
                        }
                      }}
                    >
                      <option value="solo">Solo</option>
                      <option value="couple">Casal</option>
                      <option value="friends">Grupo de Amigos</option>
                      <option value="family">Família</option>
                      <option value="honeymoon">Lua de Mel</option>
                      <option value="business">Business</option>
                      <option value="client-trip">Cliente</option>
                      <option value="company-trip">Empresa</option>
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
                <div className={styles.followUpBox}>
                  <label className={styles.toggleRow}>
                    <span>Modo empresa/agencia para documento de cliente</span>
                    <input
                      type="checkbox"
                      checked={companyMode}
                      onChange={(event) => setCompanyMode(event.target.checked)}
                      className={styles.toggleSwitch}
                    />
                  </label>
                  {companyMode && (
                    <div className={styles.twoColumnFields}>
                      <label>
                        <span>Cliente/viajante</span>
                        <input
                          className={styles.textInput}
                          value={clientName}
                          onChange={(event) => setClientName(event.target.value)}
                          placeholder="Ex: Maria Silva"
                        />
                      </label>
                      <label>
                        <span>Empresa</span>
                        <input
                          className={styles.textInput}
                          value={companyName}
                          onChange={(event) => setCompanyName(event.target.value)}
                          placeholder="Ex: Acme Travel"
                        />
                      </label>
                      <label>
                        <span>Preparado por</span>
                        <input
                          className={styles.textInput}
                          value={preparedBy}
                          onChange={(event) => setPreparedBy(event.target.value)}
                          placeholder="Ex: Andor Concierge"
                        />
                      </label>
                      <label>
                        <span>Preferencia de export</span>
                        <select
                          className={styles.selectInput}
                          value={exportPreference}
                          onChange={(event) => setExportPreference(event.target.value)}
                        >
                          <option value="client_pdf">PDF para cliente</option>
                          <option value="internal_review">Revisao interna</option>
                          <option value="traveler_copy">Copia para viajante</option>
                        </select>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

                {step === 2 && travelerType === 'family' && (
                  <div className={styles.followUpBox}>
                    <label>
                      <span>Idades aproximadas das criancas</span>
                      <input
                        className={styles.textInput}
                        value={childrenAges}
                        onChange={(event) => setChildrenAges(event.target.value)}
                        placeholder="Ex: 6 e 10"
                      />
                    </label>
                    <div className={styles.optionGrid}>
                      {[
                        { id: 'low', label: 'Pouco andar', text: 'Rotas curtas e pausas frequentes' },
                        { id: 'medium', label: 'Normal', text: 'Meio-termo confortavel' },
                        { id: 'high', label: 'Aguentam bem', text: 'Dias mais completos' }
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          className={`${styles.choiceCard} ${kidsWalking === item.id ? styles.choiceCardActive : ''}`}
                          onClick={() => setKidsWalking(item.id)}
                        >
                          <strong>{item.label}</strong>
                          <span>{item.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {step === 2 && travelerType === 'honeymoon' && (
                  <div className={styles.contextCard}>
                    <strong>Boa pista.</strong>
                    <span>Vou puxar alojamentos romanticos, jantares especiais e momentos com menos pressa.</span>
                  </div>
                )}
                {step === 2 && travelerType === 'solo' && (
                  <div className={styles.contextCard}>
                    <strong>Boa pista.</strong>
                    <span>Vou equilibrar seguranca, zonas faceis de navegar e experiencias onde e natural conhecer pessoas.</span>
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
                {stylesList.includes('gastronomia') && (
                  <div className={styles.followUpBox}>
                    <h3 className={styles.followUpTitle}>Tens restricoes alimentares?</h3>
                    <div className={styles.checkboxGrid}>
                      {['Sem restricoes', 'Vegetariano', 'Vegan', 'Halal', 'Sem Gluten', 'Sem marisco'].map((opt) => {
                        const isNone = opt === 'Sem restricoes';
                        const isChecked = isNone ? dietary.length === 0 : dietary.includes(opt);
                        return (
                          <button
                            type="button"
                            key={opt}
                            className={`${styles.badgeSelector} ${isChecked ? styles.badgeActive : ''}`}
                            onClick={() => {
                              if (isNone) setDietary([]);
                              else handleDietaryToggle(opt);
                            }}
                          >
                            {opt}{isChecked && !isNone ? ' ✓' : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className={styles.followUpBox}>
                  <h3 className={styles.followUpTitle}>O que tem de entrar, e o que nao queres?</h3>
                  <div className={styles.twoColumnFields}>
                    <label>
                      <span>Obrigatorios</span>
                      <textarea
                        className={styles.textArea}
                        value={mustSee}
                        onChange={(event) => setMustSee(event.target.value)}
                        placeholder="Ex: Sagrada Familia, ramen bom, um rooftop"
                      />
                    </label>
                    <label>
                      <span>Evitar</span>
                      <textarea
                        className={styles.textArea}
                        value={avoid}
                        onChange={(event) => setAvoid(event.target.value)}
                        placeholder="Ex: museus longos, sitios com filas, zonas demasiado turisticas"
                      />
                    </label>
                  </div>
                  <div className={styles.optionGrid}>
                    {[
                      { id: 'icons', label: 'Icones primeiro', text: 'Quero os classicos, mas bem roteados' },
                      { id: 'balanced', label: 'Meio-termo', text: 'Icones bons + bairros com vida local' },
                      { id: 'local', label: 'Mais local', text: 'Menos postal, mais lugares com caracter' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={`${styles.choiceCard} ${authenticityLevel === item.id ? styles.choiceCardActive : ''}`}
                        onClick={() => setAuthenticityLevel(item.id)}
                      >
                        <strong>{item.label}</strong>
                        <span>{item.text}</span>
                      </button>
                    ))}
                  </div>
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
                <div className={styles.contextCard}>
                  <strong>Exemplo realista</strong>
                  <span>Com €{budgetPerDay}/dia, o Andor ajusta alojamento, refeicoes e actividades ao custo local de {destination.split(',')[0] || 'destino'}.</span>
                </div>
                <div className={styles.optionGrid}>
                  {[
                    { id: 'no', label: 'Sem voos', text: 'O orcamento e so para o destino' },
                    { id: 'yes', label: 'Inclui voos', text: 'Vou contar tudo no total' },
                    { id: 'unknown', label: 'Ainda nao sei', text: 'Mostra estimativas separadas' }
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={`${styles.choiceCard} ${budgetIncludesFlights === item.id ? styles.choiceCardActive : ''}`}
                      onClick={() => setBudgetIncludesFlights(item.id)}
                    >
                      <strong>{item.label}</strong>
                      <span>{item.text}</span>
                    </button>
                  ))}
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

              </div>
            )}

            {/* STEP 5: TRANSPORT & PACE */}
            {step === 5 && (
              <div className={styles.stepFadeIn}>
                <h2 className={styles.stepTitle}>Como queres viver os dias?</h2>
                <p className={styles.stepSubtitle}>Pergunto porque o mesmo destino pode ser uma corrida por icones ou uma viagem lenta por bairros.</p>
                <div className={styles.optionGrid}>
                  {[
                    { id: 'public', label: 'Transportes publicos', text: 'Metro, comboio e autocarro sempre que fizer sentido' },
                    { id: 'car', label: 'Rent-a-car', text: 'Ideal para regioes e natureza fora do centro' },
                    { id: 'walk', label: 'A pe', text: 'Bairros compactos, rotas caminhaveis e menos transfers' },
                    { id: 'any', label: 'Mix inteligente', text: 'O Andor escolhe o melhor modo por dia' }
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={`${styles.choiceCard} ${transportPreference === item.id ? styles.choiceCardActive : ''}`}
                      onClick={() => setTransportPreference(item.id)}
                    >
                      <strong>{item.label}</strong>
                      <span>{item.text}</span>
                    </button>
                  ))}
                </div>
                <div className={styles.optionGrid}>
                  {[
                    { id: 'intense', label: 'Intenso', text: 'Aproveito cada hora, quero ver muito' },
                    { id: 'balanced', label: 'Equilibrado', text: 'Manhas activas, tardes mais calmas' },
                    { id: 'relaxed', label: 'Relaxado', text: 'Menos pontos, mais tempo em cada sitio' }
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={`${styles.choiceCard} ${pace === item.id ? styles.choiceCardActive : ''}`}
                      onClick={() => setPace(item.id)}
                    >
                      <strong>{item.label}</strong>
                      <span>{item.text}</span>
                    </button>
                  ))}
                </div>
                <div className={styles.questionBlock}>
                  <h3>Quanto queres andar?</h3>
                  <div className={styles.optionGrid}>
                    {[
                      { id: 'low', label: 'Pouco', text: 'Saltos curtos, menos escadas e taxis quando compensar' },
                      { id: 'medium', label: 'Normal', text: 'Caminhar por bairros, sem maratonas' },
                      { id: 'high', label: 'Muito', text: 'A pe sempre que a cidade fizer sentido assim' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={`${styles.choiceCard} ${walkingLevel === item.id ? styles.choiceCardActive : ''}`}
                        onClick={() => setWalkingLevel(item.id)}
                      >
                        <strong>{item.label}</strong>
                        <span>{item.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.questionBlock}>
                  <h3>Comida: conforto ou descoberta?</h3>
                  <div className={styles.optionGrid}>
                    {[
                      { id: 'safe', label: 'Seguro', text: 'Bons sitios, sabores familiares e reservas faceis' },
                      { id: 'balanced', label: 'Equilibrado', text: 'Classicos locais e uma ou duas apostas' },
                      { id: 'adventurous', label: 'Aventura', text: 'Mercados, balcões, especialidades e lugares pequenos' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={`${styles.choiceCard} ${foodAdventure === item.id ? styles.choiceCardActive : ''}`}
                        onClick={() => setFoodAdventure(item.id)}
                      >
                        <strong>{item.label}</strong>
                        <span>{item.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <label className={styles.toggleRow}>
                  <span>Preciso de rotas adaptadas a mobilidade reduzida</span>
                  <input
                    type="checkbox"
                    checked={mobilityReduced}
                    onChange={(e) => setMobilityReduced(e.target.checked)}
                    className={styles.toggleSwitch}
                  />
                </label>
              </div>
            )}

            {/* STEP 6: PERSONALITY */}
            {step === 6 && (
              <div className={styles.stepFadeIn}>
                <h2 className={styles.stepTitle}>O que faz uma viagem tua?</h2>
                <p className={styles.stepSubtitle}>Estas respostas dao tom ao roteiro. Nao sao filtros rigidos; sao pistas de personalidade.</p>
                <div className={styles.questionBlock}>
                  <h3>Quando chegas a uma cidade nova, o que fazes primeiro?</h3>
                  <div className={styles.optionGrid}>
                    {[
                      { id: 'old-cafe', label: 'Cafe antigo', text: 'Procuro o cafe local mais velho' },
                      { id: 'viewpoint', label: 'Ponto alto', text: 'Quero ver a cidade de cima' },
                      { id: 'market', label: 'Mercado', text: 'Comeco pela comida e pelas pessoas' },
                      { id: 'rest', label: 'Recuperar', text: 'Durmo e entro devagar no destino' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={`${styles.choiceCard} ${arrivalInstinct === item.id ? styles.choiceCardActive : ''}`}
                        onClick={() => setArrivalInstinct(item.id)}
                      >
                        <strong>{item.label}</strong>
                        <span>{item.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.questionBlock}>
                  <h3>Qual e a memoria que mais te fica?</h3>
                  <div className={styles.optionGrid}>
                    {[
                      { id: 'meal', label: 'Refeicao', text: 'Uma mesa que conto depois' },
                      { id: 'sunset', label: 'Luz perfeita', text: 'Um por-do-sol ou uma vista' },
                      { id: 'lost', label: 'Perder-me', text: 'Ruelas, acaso e pequenas descobertas' },
                      { id: 'locals', label: 'Locals', text: 'Conversas e lugares de quem vive la' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={`${styles.choiceCard} ${memoryPreference === item.id ? styles.choiceCardActive : ''}`}
                        onClick={() => setMemoryPreference(item.id)}
                      >
                        <strong>{item.label}</strong>
                        <span>{item.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.questionBlock}>
                  <h3>Hotel ou experiencias?</h3>
                  <div className={styles.optionGrid}>
                    {[
                      { id: 'experiences', label: 'Experiencias', text: 'Poupar no quarto, gastar no destino' },
                      { id: 'balanced', label: 'Equilibrio', text: 'Conforto sem roubar o orcamento' },
                      { id: 'hotel', label: 'Hotel importa', text: 'O alojamento tambem e parte da viagem' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={`${styles.choiceCard} ${hotelPreference === item.id ? styles.choiceCardActive : ''}`}
                        onClick={() => setHotelPreference(item.id)}
                      >
                        <strong>{item.label}</strong>
                        <span>{item.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: SUMMARY */}
            {step === 7 && (
              <div className={styles.stepFadeIn}>
                <h2 className={styles.stepTitle}>Resumo antes de gerar</h2>
                <p className={styles.stepSubtitle}>Confirma os sinais principais. A seguir recebes dias detalhados, logística, custos estimados, reservas e planos alternativos.</p>
                <div className={styles.summaryCard}>
                  <h3 className={styles.summaryTitle}>Confirmar viagem Andor</h3>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryItemLabel}><MapPin size={14} /> Destino</span>
                    <strong>{isSurprise ? 'Destino surpresa' : destination || 'Destino por definir'}</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryItemLabel}><Calendar size={14} /> Datas</span>
                    <strong>{datesUnknown ? `${getDaysCount()} dias flexiveis` : `${dates.start || '?'} a ${dates.end || '?'}`}</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryItemLabel}><UsersIcon size={14} /> Viajantes</span>
                    <strong>{travelers.adults + travelers.children} · {TRAVELER_LABELS[travelerType] || travelerType}</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryItemLabel}><Briefcase size={14} /> Interesses</span>
                    <strong>{stylesList.join(' · ') || 'A definir'}</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryItemLabel}><DollarSign size={14} /> Diário</span>
                    <strong>~€{budgetPerDay}/pessoa · {budgetIncludesFlights === 'yes' ? 'inclui voos' : budgetIncludesFlights === 'no' ? 'sem voos' : 'voos estimados à parte'}</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryItemLabel}><Sliders size={14} /> Ritmo</span>
                    <strong>{TRANSPORT_LABELS[transportPreference] || transportPreference} · {PACE_LABELS[pace] || pace} · {WALKING_LABELS[walkingLevel] || walkingLevel}</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryItemLabel}><Sparkles size={14} /> Afinação</span>
                    <strong>{AUTHENTICITY_LABELS[authenticityLevel] || authenticityLevel} · {FOOD_LABELS[foodAdventure] || foodAdventure}</strong>
                  </div>
                  {companyMode && (
                    <>
                      <div className={styles.summaryRow}>
                        <span className={styles.summaryItemLabel}><Briefcase size={14} /> Cliente</span>
                        <strong>{clientName || 'Cliente por definir'} {companyName ? `· ${companyName}` : ''}</strong>
                      </div>
                      <div className={styles.summaryRow}>
                        <span className={styles.summaryItemLabel}><FileText size={14} /> Export</span>
                        <strong>{exportPreference === 'internal_review' ? 'Revisão interna' : exportPreference === 'traveler_copy' ? 'Cópia do viajante' : 'PDF para cliente'} {preparedBy ? `· por ${preparedBy}` : ''}</strong>
                      </div>
                    </>
                  )}
                </div>
                {companyMode && (
                  <div className={styles.followUpBox}>
                    <h3 className={styles.followUpTitle}>Notas para entrega profissional</h3>
                    <div className={styles.twoColumnFields}>
                      <label>
                        <span>Notas visiveis ao cliente</span>
                        <textarea
                          className={styles.textArea}
                          value={clientFacingNotes}
                          onChange={(event) => setClientFacingNotes(event.target.value)}
                          placeholder="Ex: viagem preparada para aprovacao, precos sujeitos a disponibilidade"
                        />
                      </label>
                      <label>
                        <span>Notas internas</span>
                        <textarea
                          className={styles.textArea}
                          value={internalNotes}
                          onChange={(event) => setInternalNotes(event.target.value)}
                          placeholder="Ex: confirmar budget antes de reservar hotel premium"
                        />
                      </label>
                    </div>
                  </div>
                )}
                <div className={styles.estimateGrid}>
                  <div>
                    <span>Voos</span>
                    <strong>{originCity ? `pesquisa desde ${originCity}` : 'origem por indicar'}</strong>
                  </div>
                  <div>
                    <span>Alojamento</span>
                    <strong>incluído no orçamento diário</strong>
                  </div>
                  <div>
                    <span>Total no destino</span>
                    <strong>~€{estimatedTotal}</strong>
                  </div>
                </div>
                <div className={styles.assumptionsBox}>
                  <strong>Assunções que o Andor vai usar</strong>
                  <ul>
                    <li>Preços e disponibilidade são estimativas até confirmação no fornecedor.</li>
                    <li>O primeiro e último dia respeitam os horários de chegada e saída escolhidos.</li>
                    <li>Nenhuma reserva será marcada como confirmada automaticamente.</li>
                  </ul>
                </div>
                {generationError && (
                  <div className={styles.generationError} role="alert">
                    <TriangleAlert size={20} aria-hidden="true" />
                    <div>
                      <strong>Não foi possível concluir a geração</strong>
                      <p>{generationError}</p>
                      <button type="button" onClick={() => handleSubmit(true)}>Criar versão de demonstração</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions Footer - Stacked on mobile */}
            <div className={styles.wizardFooter}>
              {step < 7 ? (
                <button
                  type="button"
                  className={styles.nextBtn}
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !isSurprise && !destination.trim()) ||
                    (step === 2 && !datesUnknown && (!dates.start || !dates.end)) ||
                    (step === 2 && companyMode && !clientName.trim()) ||
                    (step === 3 && stylesList.length === 0)
                  }
                  data-testid={step === 4 ? 'wizard-submit' : 'wizard-next'}
                >
                  Continuar &rarr;
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={() => handleSubmit(false)}
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
          <div className={styles.loadingScreen} role="status" aria-live="polite">
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
            <div className={styles.percentageText}>A validar tempos, deslocações e reservas</div>
            <button type="button" className={styles.cancelBtn} onClick={handleCancelGeneration}>
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
