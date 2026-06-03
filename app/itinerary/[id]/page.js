'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CalendarDays,
  Copy,
  Edit3,
  FileText,
  History,
  Loader2,
  Map,
  MapPin,
  MessageCircle,
  Package,
  Palette,
  RefreshCw,
  Route,
  Settings,
  Share2,
  Ticket,
  Users,
  WalletCards,
} from 'lucide-react';
import { getItinerary, saveGeneratedItinerary } from '../../lib/itinerary-store';
import { validateAndNormalize } from '../../lib/itinerary-validate';
import { getJson, setJson } from '../../lib/storage';
import { enrichItinerary } from '../../lib/itinerary-enricher';
import { validateAndFixCoordinates } from '../../lib/coordinate-validator';
import { safeParse } from '../../lib/safe-json';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import LiveMap from '../../components/LiveMap';
import BudgetCalculator from '../../components/BudgetCalculator';
import DailyPlanTimeline from '../../components/DailyPlanTimeline';
import BudgetVisualization from '../../components/BudgetVisualization';
import BookingChecklist from '../../components/BookingChecklist';
import FlightSection from '../../components/FlightSection';
import HotelSection from '../../components/HotelSection';
import AirportTransferSection from '../../components/AirportTransferSection';
import AlertsSection from '../../components/AlertsSection';
import LocalTransportSection from '../../components/LocalTransportSection';
import SkeletonLoader from '../../components/SkeletonLoader';
import FavoriteButton from '../../components/FavoriteButton';
import { useToast } from '../../components/ToastProvider';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { Modal, Drawer } from '../../components/ui/Modal';
import EnhancedActivityCard from '../../components/EnhancedActivityCard';
import RestaurantCard from '../../components/RestaurantCard';
import AccommodationCard from '../../components/AccommodationCard';
import TransportCard from '../../components/TransportCard';
import EnrichmentProgress from '../../components/EnrichmentProgress';
import styles from './itinerary.module.css';
import { trackEvent } from '../../lib/analytics';

const getStopIcon = (stop) => {
  const type = (stop.type || '').toLowerCase();
  
  if (type.includes('restaurant') || type.includes('food') || type.includes('dining')) return 'FOOD';
  if (type.includes('museum') || type.includes('culture') || type.includes('history')) return 'ART';
  if (type.includes('nature') || type.includes('park')) return 'NAT';
  if (type.includes('shopping') || type.includes('market')) return 'SHOP';
  if (type.includes('cafe') || type.includes('coffee')) return 'CAFE';
  if (type.includes('entertainment') || type.includes('bar') || type.includes('night')) return 'EVE';
  if (type.includes('transport') || type.includes('flight')) return 'MOVE';
  if (type.includes('hotel') || type.includes('stay')) return 'STAY';
  return 'PIN';
};

const getDayEmoji = (day) => {
  const theme = (day.theme || '').toLowerCase();
  if (theme.includes('arrival')) return 'ARR';
  if (theme.includes('culture')) return 'CUL';
  if (theme.includes('food')) return 'FOOD';
  if (theme.includes('nature')) return 'NAT';
  if (theme.includes('shopping')) return 'SHOP';
  if (theme.includes('night')) return 'EVE';
  return 'DAY';
};

const CURRENCY_SYMBOLS = {
  EUR: '€',
  JPY: '¥',
  USD: '$',
  GBP: '£',
  IDR: 'Rp',
  MAD: 'MAD',
};

const COUNTRY_CODE_BY_NAME = {
  japan: 'JP',
  france: 'FR',
  indonesia: 'ID',
  portugal: 'PT',
  'united kingdom': 'GB',
  spain: 'ES',
  italy: 'IT',
  netherlands: 'NL',
  morocco: 'MA',
  'united states': 'US',
};

const normalizeCurrencyCode = (currency) => {
  if (!currency) return 'EUR';
  if (typeof currency === 'object') return normalizeCurrencyCode(currency.code || currency.symbol);
  const value = String(currency).trim().toUpperCase();
  if (value === '€') return 'EUR';
  if (value === '¥' || value === 'JPY') return 'JPY';
  if (value === '$' || value === 'USD') return 'USD';
  if (value === '£' || value === 'GBP') return 'GBP';
  if (value === 'RP' || value === 'IDR') return 'IDR';
  if (value === 'MAD') return 'MAD';
  return /^[A-Z]{3}$/.test(value) ? value : 'EUR';
};

const getCurrencyContext = (itinerary) => {
  const dest = typeof itinerary?.destination === 'string'
    ? {}
    : (itinerary?.destination || {});
  const trip = itinerary?.trip || {};
  const code = normalizeCurrencyCode(dest.currency?.code || trip.budgetBreakdown?.currency || dest.currency);
  return {
    code,
    symbol: CURRENCY_SYMBOLS[code] || code,
  };
};

const formatCurrencyAmount = (value, context = { code: 'EUR', symbol: '€' }) => {
  if (value === undefined || value === null || value === '') return 'Grátis';
  const currency = typeof context === 'string'
    ? { code: normalizeCurrencyCode(context), symbol: CURRENCY_SYMBOLS[normalizeCurrencyCode(context)] || context }
    : context;

  if (typeof value === 'string') {
    if (/free|gr[aá]tis/i.test(value)) return 'Grátis';
    if (/[€$£¥]|JPY|USD|GBP|EUR|IDR|MAD/i.test(value)) return value;
    const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
    if (!Number.isFinite(parsed)) return value;
    value = parsed;
  }

  try {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: currency.code,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency.symbol}${value}`;
  }
};

const formatCurrencyRange = (min, max, context) => {
  const left = formatCurrencyAmount(min, context);
  const right = formatCurrencyAmount(max, context);
  return `${left} – ${right}`;
};

const getDestinationBadge = (dest = {}) => {
  if (typeof dest === 'string') return dest.split(',')[1]?.trim().slice(0, 2).toUpperCase() || 'TR';
  if (dest.countryCode) return String(dest.countryCode).toUpperCase();
  if (dest.flag && /^[A-Z]{2}$/.test(String(dest.flag))) return dest.flag;
  const country = String(dest.country || '').toLowerCase();
  return COUNTRY_CODE_BY_NAME[country] || country.slice(0, 2).toUpperCase() || 'TR';
};

const getDayBudget = (day) => {
  let total = 0;
  if (day.stops && Array.isArray(day.stops)) {
    day.stops.forEach(s => {
      const cost = s.cost ?? s.estimatedCost ?? 0;
      total += typeof cost === 'number' ? cost : parseFloat(cost) || 0;
    });
  }
  if (day.meals) {
    ['breakfast', 'lunch', 'dinner'].forEach(m => {
      if (day.meals[m]) {
        const c = day.meals[m].cost ?? 0;
        total += typeof c === 'number' ? c : parseFloat(c) || 0;
      }
    });
  }
  if (day.transport?.cost) {
    const tc = day.transport.cost;
    total += typeof tc === 'number' ? tc : parseFloat(tc) || 0;
  }
  return Math.round(total);
};

const getCrowdLabel = (level) => {
  if (!level) return null;
  const l = (typeof level === 'string' ? level : '').toLowerCase();
  if (l.includes('low') || l.includes('baix')) return { label: 'Tranquilo', cls: 'crowdLow' };
  if (l.includes('high') || l.includes('alt') || l.includes('muito')) return { label: 'Muito movimentado', cls: 'crowdHigh' };
  return { label: 'Moderado', cls: 'crowdMedium' };
};

const ADAPT_OPTIONS = [
  { id: 'intense', label: 'Muito intenso' },
  { id: 'relaxed', label: 'Muito relaxado' },
  { id: 'expensive', label: 'Muito caro' },
  { id: 'touristy', label: 'Muito turístico' },
  { id: 'activities', label: 'Tipo de actividades não é o meu' },
];

export default function ItineraryPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const { showToast } = useToast();
  const { user, saveTrip } = useAuth();
  
  const [itinerary, setItinerary] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedStops, setExpandedStops] = useState({});
  const [isAdapting, setIsAdapting] = useState(false);
  const [dayTransitioning, setDayTransitioning] = useState(false);
  const [showAdaptModal, setShowAdaptModal] = useState(false);
  const [showBudgetDrawer, setShowBudgetDrawer] = useState(false);
  const [showMobileBudget, setShowMobileBudget] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [bookingStop, setBookingStop] = useState(null);
  const [adaptFeedback, setAdaptFeedback] = useState('');
  const [adaptChecks, setAdaptChecks] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [versions, setVersions] = useState([]);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [packingList, setPackingList] = useState(null);
  const [checkedPacking, setCheckedPacking] = useState({});
  const [isPackingGenerating, setIsPackingGenerating] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [enrichmentStatus, setEnrichmentStatus] = useState('idle');

  useEffect(() => {
    setFavorites(getJson('andor_favorites', [], 'local') || []);
  }, []);

  const isStopSaved = (stopName) => {
    return favorites.some(fav => {
      if (typeof fav === 'object' && fav !== null) {
        return fav.name === stopName;
      }
      return fav === stopName;
    });
  };
  
  const printRef = useRef();
  const timelineRef = useRef();
  const dayTabRefs = useRef([]);
  const versionsLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const applyData = (data) => {
      if (!data || cancelled) return false;
      try {
        const val = validateAndNormalize(data);
        if (val.fatal) {
          setValidationError(val.errors.join('; '));
        } else {
          const normalized = val.normalized || data;
          const validatedData = validateAndFixCoordinates(
            normalized,
            normalized.destination?.city || normalized.destination?.name || ''
          );
          const enriched = enrichItinerary(validatedData);
          setItinerary(enriched);
          setExpandedStops({ 0: true });
        }
      } catch (e) {
        const enriched = enrichItinerary(data);
        setItinerary(enriched);
      }
      return true;
    };

    const loadItinerary = async () => {
      let data = null;
      if (params.id === 'share') {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedData = urlParams.get('data');
        if (sharedData) {
          try {
            const decoder = new TextDecoder();
            const binaryString = atob(sharedData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const jsonStr = decoder.decode(bytes);
            data = safeParse(jsonStr, null);
          } catch (e) {}
        } else {
          const urlId = urlParams.get('id');
          if (urlId) {
            data = getJson(`andor_shared_${urlId}`, null, 'local');
          }
        }
      } else {
        data = getItinerary(params.id);
        if (!data && typeof window !== 'undefined') {
          data = getJson(`andor_shared_${params.id}`, null, 'local');
        }
        if (!data) {
          try {
            const response = await fetch(`/api/itineraries/${encodeURIComponent(params.id)}`, { cache: 'no-store' });
            if (response.ok) {
              const payload = await response.json();
              data = payload.itinerary;
              if (data) {
                setJson(`andor_itinerary_${params.id}`, data, 'local');
                setJson(`andor_shared_${params.id}`, data, 'local');
              }
            }
          } catch (error) {}
        }
      }

      applyData(data);
      if (!cancelled) setLoading(false);
    };

    loadItinerary();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    if (!itinerary || !id || enrichmentStatus !== 'idle') return;
    if (itinerary.metadata?.enrichmentStatus === 'complete') {
      setEnrichmentStatus('complete');
      return;
    }

    let active = true;
    const runEnrichment = async () => {
      setEnrichmentStatus('geocoding');
      setTimeout(() => { if (active) setEnrichmentStatus('activities'); }, 1500);
      setTimeout(() => { if (active) setEnrichmentStatus('restaurants'); }, 3000);

      try {
        const response = await fetch('/api/enrich-itinerary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itinerary,
            preferences: {
              departureCity: 'Lisboa'
            }
          })
        });

        if (!active) return;

        if (response.ok) {
          const data = await response.json();
          if (data.enriched) {
            setItinerary(prev => {
              const updated = {
                ...prev,
                days: prev.days.map((day, dIdx) => {
                  const enrichedDay = data.days?.[dIdx] || {};
                  return {
                    ...day,
                    stops: day.stops.map((stop, sIdx) => {
                      const enrichedStop = enrichedDay.stops?.[sIdx] || {};
                      return {
                        ...stop,
                        ...enrichedStop,
                        description: enrichedStop.description || stop.description,
                        hours: enrichedStop.hours || stop.hours,
                        cost: enrichedStop.cost ?? stop.cost,
                        photo: enrichedStop.photo || stop.photo,
                        wikipediaUrl: enrichedStop.wikipediaUrl || stop.wikipediaUrl,
                        enrichmentSource: enrichedStop.enrichmentSource || stop.enrichmentSource,
                        enriched: true
                      };
                    }),
                    enrichedRestaurants: enrichedDay.enrichedRestaurants || []
                  };
                }),
                flightOptions: data.transport?.options || prev.flightOptions,
                accommodation: data.accommodation || prev.accommodation,
                metadata: {
                  ...prev.metadata,
                  enrichmentStatus: 'complete'
                }
              };
              setJson(`andor_itinerary_${id}`, updated, 'local');
              setJson(`andor_shared_${id}`, updated, 'local');
              return updated;
            });
            setEnrichmentStatus('complete');
          } else {
            setEnrichmentStatus('error');
          }
        } else {
          setEnrichmentStatus('error');
        }
      } catch (err) {
        console.error('Failed to enrich itinerary:', err);
        if (active) setEnrichmentStatus('error');
      }
    };

    runEnrichment();
    return () => { active = false; };
  }, [itinerary, id, enrichmentStatus]);

  useEffect(() => {
    if (itinerary) {
      const destObj = itinerary.destination || {};
      const tripObj = itinerary.trip || {};
      const city = typeof destObj === 'string' ? destObj : (destObj.city || destObj.name || (typeof itinerary.destination === 'string' ? itinerary.destination : 'Viagem'));
      const daysCount = tripObj.totalDays || itinerary.days?.length || 0;
      document.title = `${city} ${daysCount} dias · Andor`;
    }
  }, [itinerary]);

  useEffect(() => {
    dayTabRefs.current[activeDay]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest'
    });
  }, [activeDay]);

  useEffect(() => {
    if (!itinerary || !id || versionsLoadedRef.current) return;
    versionsLoadedRef.current = true;
    const versionKey = `andor_itinerary_versions_${id}`;
    const storedVersions = getJson(versionKey, [], 'local') || [];
    if (storedVersions.length > 0) {
      setVersions(storedVersions);
    } else {
      const original = {
        id: `v-${Date.now()}`,
        label: 'Versão 1 — Original',
        createdAt: new Date().toISOString(),
        itinerary,
      };
      setVersions([original]);
      setJson(versionKey, [original], 'local');
    }

    const storedPacking = getJson(`andor_packing_${id}`, null, 'local');
    if (storedPacking) setPackingList(storedPacking);
    setCheckedPacking(getJson(`andor_packing_checked_${id}`, {}, 'local') || {});
  }, [id, itinerary]);

  const saveItinerarySnapshot = (nextItinerary) => {
    if (!id) return;
    setJson(`andor_itinerary_${id}`, nextItinerary, 'session');
    setJson(`andor_shared_${id}`, nextItinerary, 'local');
  };

  const saveVersion = (label, nextItinerary) => {
    if (!id) return;
    const versionKey = `andor_itinerary_versions_${id}`;
    const currentVersions = getJson(versionKey, [], 'local') || versions;
    const nextVersion = {
      id: `v-${Date.now()}`,
      label: `Versão ${currentVersions.length + 1} — ${label}`,
      createdAt: new Date().toISOString(),
      itinerary: nextItinerary,
    };
    const updated = [...currentVersions, nextVersion].slice(-10);
    setVersions(updated);
    setJson(versionKey, updated, 'local');
  };

  const restoreVersion = (version) => {
    setItinerary(version.itinerary);
    saveItinerarySnapshot(version.itinerary);
    setShowVersionsModal(false);
    showToast(`${version.label} restaurada.`, 'success');
  };

  const buildPackingList = () => {
    const city = (dest.city || dest.name || '').toLowerCase();
    const isJapan = city.includes('tokyo') || city.includes('tóquio') || city.includes('kyoto');
    const isWarm = ['bali', 'marrakech'].some((place) => city.includes(place));
    const hasTemples = (itinerary.days || []).some((day) =>
      JSON.stringify(day).toLowerCase().includes('temple') ||
      JSON.stringify(day).toLowerCase().includes('shrine') ||
      JSON.stringify(day).toLowerCase().includes('templo')
    );

    return {
      essential: [
        isJapan ? 'Adaptador tipo A/B (100V)' : 'Adaptador universal compacto',
        isJapan ? 'Cartão Suica/PASMO no telemóvel' : 'Cartão bancário sem taxas internacionais',
        'Cópia offline do passaporte e seguro',
        'Carteira pequena para dinheiro local',
      ],
      clothes: [
        isWarm ? 'Roupa leve e respirável' : 'Camada leve para noites frescas',
        'Calçado confortável para 10.000+ passos/dia',
        hasTemples ? 'Roupa modesta para templos e santuários' : 'Uma peça mais arranjada para jantar',
        'Capa fina para chuva imprevisível',
      ],
      apps: [
        'Google Maps com áreas offline',
        'Google Translate em modo câmara',
        isJapan ? 'Tabelog para restaurantes locais' : 'TheFork ou app local de reservas',
        'Wallet com cartões e bilhetes guardados',
      ],
      avoid: [
        'Mala de cabine demasiado rígida para transportes cheios',
        'Sapatos novos por estrear',
        'Dinheiro em excesso no mesmo bolso',
      ],
    };
  };

  const handleGeneratePackingList = async () => {
    setIsPackingGenerating(true);
    window.setTimeout(() => {
      const nextList = buildPackingList();
      setPackingList(nextList);
      setJson(`andor_packing_${id}`, nextList, 'local');
      setIsPackingGenerating(false);
      showToast('Lista de bagagem criada.', 'success');
    }, 650);
  };

  const togglePackingItem = (category, item) => {
    const key = `${category}:${item}`;
    const next = { ...checkedPacking, [key]: !checkedPacking[key] };
    setCheckedPacking(next);
    setJson(`andor_packing_checked_${id}`, next, 'local');
  };

  const createShareUrl = () => {
    const uuid = crypto.randomUUID();
    const stored = setJson(`andor_shared_${uuid}`, itinerary, 'local');
    if (!stored) {
      showToast('Não foi possível guardar o link neste navegador.', 'warning');
    }
    return `${window.location.origin}/itinerary/share/${uuid}`;
  };

  const handleShare = () => {
    if (typeof window === 'undefined' || !itinerary) return;
    const nextUrl = shareUrl || createShareUrl();
    setShareUrl(nextUrl);
    setShowShareModal(true);
  };

  const copyShareUrl = async () => {
    try {
      const nextUrl = shareUrl || createShareUrl();
      setShareUrl(nextUrl);
      await navigator.clipboard.writeText(nextUrl);
      showToast('Link copiado para a área de transferência.', 'success');
    } catch (err) {
      showToast('Erro ao partilhar.', 'error');
    }
  };

  const copyActivityDetails = async (stop) => {
    try {
      const currencyContext = getCurrencyContext(itinerary);
      const text = [
        stop.name,
        stop.address ? `Endereço: ${stop.address}` : null,
        stop.duration ? `Duração: ${stop.duration}` : null,
        stop.cost !== undefined ? `Custo: ${formatCurrencyAmount(stop.cost, currencyContext)}` : stop.estimatedCost ? `Custo: ${formatCurrencyAmount(stop.estimatedCost, currencyContext)}` : null,
        stop.insiderTip ? `Segredo do Andor: ${stop.insiderTip}` : null,
      ].filter(Boolean).join('\n');
      await navigator.clipboard.writeText(text);
      showToast('Actividade copiada.', 'success');
    } catch (err) {
      showToast('Não foi possível copiar a actividade.', 'error');
    }
  };

  const copyCurrentDayPlan = async () => {
    try {
      const day = currentDay;
      const currencyContext = getCurrencyContext(itinerary);
      const lines = [
        `${getDayEmoji(day)} Dia ${activeDay + 1}: ${day.title}`,
        day.moodDescription || null,
        ...(day.stops || []).map((stop, index) => `${index + 1}. ${stop.name} · ${stop.duration || '2h'} · ${stop.cost !== undefined ? formatCurrencyAmount(stop.cost, currencyContext) : formatCurrencyAmount(stop.estimatedCost || 'Grátis', currencyContext)}`),
        day.localSecret ? `Segredo do Andor: ${day.localSecret}` : null,
      ].filter(Boolean);
      await navigator.clipboard.writeText(lines.join('\n'));
      showToast('Plano do dia copiado.', 'success');
    } catch (err) {
      showToast('Não foi possível copiar o dia.', 'error');
    }
  };

  const handleExportPDF = async () => {
    if (typeof window === 'undefined' || !itinerary) return;
    showToast('A gerar PDF...', 'info');
    
    let html2pdf;
    try {
      html2pdf = (await import('html2pdf.js')).default;
    } catch (e) {
      showToast('Erro ao inicializar gerador de PDF.', 'error');
      return;
    }

    const currencyContext = getCurrencyContext(itinerary);
    const pdfMoney = (value) => formatCurrencyAmount(value, currencyContext);
    const pdfDestination = typeof itinerary.destination === 'string'
      ? { name: itinerary.destination }
      : (itinerary.destination || {});
    const safeText = (value) => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    const content = document.createElement('div');
    content.innerHTML = `
      <div style="font-family:'Georgia',serif; padding:40px; max-width:800px; color:#1A2235; background-color:#ffffff;">
        
        <!-- CAPA -->
        <div style="text-align:center; padding:60px 0; border-bottom:2px solid #D4A843; margin-bottom: 40px;">
          <div style="font-size:22px; margin-bottom:16px; letter-spacing:0.08em; font-weight:700;">${safeText(getDestinationBadge(pdfDestination))}</div>
          <h1 style="font-size:36px; color:#1A2235; margin:0;">${itinerary.destination?.city || itinerary.destination?.name || 'O teu Destino'}</h1>
          <p style="font-size:18px; color:#666; margin:8px 0;">${itinerary.trip?.totalDays || itinerary.days?.length || '–'} dias · ${itinerary.trip?.groupType || 'Viagem'} · ${itinerary.trip?.travelStyle || 'Exploração'}</p>
          <p style="font-size:14px; color:#D4A843; margin:16px 0; font-style:italic;">"${itinerary.destination?.andorVerdict || ''}"</p>
          <p style="font-size:12px; color:#999;">Gerado por Andor Travels · andortravels.com</p>
        </div>
        
        <!-- RESUMO DE ORÇAMENTO -->
        <div style="margin:40px 0; padding:24px; background:#f8f8f8; border-radius:8px; page-break-inside:avoid;">
          <h2 style="font-size:20px; color:#1A2235; margin:0 0 16px;">Estimativa de Orçamento</h2>
          <table style="width:100%; border-collapse:collapse; font-size:14px;">
            <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;">Voos</td><td style="text-align:right; padding:8px 0;">~${formatCurrencyRange(itinerary.trip?.budgetBreakdown?.flights?.min || 0, itinerary.trip?.budgetBreakdown?.flights?.max || 0, currencyContext)}</td></tr>
            <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;">Alojamento</td><td style="text-align:right; padding:8px 0;">~${pdfMoney(itinerary.trip?.budgetBreakdown?.accommodation?.total || 0)}</td></tr>
            <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;">Refeições</td><td style="text-align:right; padding:8px 0;">~${pdfMoney(itinerary.trip?.budgetBreakdown?.food?.total || 0)}</td></tr>
            <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;">Actividades</td><td style="text-align:right; padding:8px 0;">~${pdfMoney(itinerary.trip?.budgetBreakdown?.activities?.total || 0)}</td></tr>
            <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;">Transportes</td><td style="text-align:right; padding:8px 0;">~${pdfMoney(itinerary.trip?.budgetBreakdown?.transport?.total || 0)}</td></tr>
            <tr style="border-top:2px solid #D4A843; font-weight:bold;">
              <td style="padding:12px 0;">TOTAL ESTIMADO</td>
              <td style="text-align:right; padding:12px 0; color:#D4A843;">~${formatCurrencyRange(itinerary.trip?.budgetBreakdown?.grandTotal?.min || 0, itinerary.trip?.budgetBreakdown?.grandTotal?.max || 0, currencyContext)}</td>
            </tr>
          </table>
        </div>
        
        <!-- DIAS -->
        ${(itinerary.days || []).map(day => {
          const dayBudget = getDayBudget(day);
          const morningActivities = (day.stops || []).filter(s => (s.period || 'afternoon') === 'morning');
          const afternoonActivities = (day.stops || []).filter(s => (s.period || 'afternoon') === 'afternoon');
          const eveningActivities = (day.stops || []).filter(s => (s.period || 'afternoon') === 'evening');
          
          return `
            <div style="margin:40px 0; page-break-inside:avoid; border-bottom:1px solid #eee; padding-bottom:30px;">
              <h2 style="font-size:22px; color:#1A2235; border-bottom:1px solid #eee; padding-bottom:8px; margin-bottom:12px;">
                ${getDayEmoji(day)} Dia ${day.dayNumber} — ${day.title}
              </h2>
              <p style="color:#666; font-style:italic; font-size:14px; margin-bottom:10px;">${day.moodDescription || ''}</p>
              <p style="font-size:13px; color:#555; margin-bottom:15px;">Orçamento do dia: ~${pdfMoney(dayBudget)} · ${day.weather?.avgTemp || ''} ${day.weather?.condition || ''}</p>
              
              ${morningActivities.length ? `
                <h3 style="font-size:16px; color:#666; margin:16px 0 8px;">Manhã</h3>
                ${morningActivities.map(a => `
                  <div style="padding:12px; margin:8px 0; background:#fafafa; border-radius:6px; border-left:3px solid #D4A843;">
                    <strong>${getStopIcon(a)} ${a.name}</strong>
                    <br/><span style="font-size:12px; color:#888;">${a.address || ''} · ${a.duration || '2h'} · ${a.cost > 0 ? pdfMoney(a.cost) : 'Grátis'}</span>
                    ${a.insiderTip ? `<br/><span style="font-size:11px; color:#D4A843; font-style:italic;">Nota local: ${a.insiderTip}</span>` : ''}
                  </div>
                `).join('')}
              ` : ''}

              ${afternoonActivities.length ? `
                <h3 style="font-size:16px; color:#666; margin:16px 0 8px;">Tarde</h3>
                ${afternoonActivities.map(a => `
                  <div style="padding:12px; margin:8px 0; background:#fafafa; border-radius:6px; border-left:3px solid #D4A843;">
                    <strong>${getStopIcon(a)} ${a.name}</strong>
                    <br/><span style="font-size:12px; color:#888;">${a.address || ''} · ${a.duration || '2h'} · ${a.cost > 0 ? pdfMoney(a.cost) : 'Grátis'}</span>
                    ${a.insiderTip ? `<br/><span style="font-size:11px; color:#D4A843; font-style:italic;">Nota local: ${a.insiderTip}</span>` : ''}
                  </div>
                `).join('')}
              ` : ''}

              ${eveningActivities.length ? `
                <h3 style="font-size:16px; color:#666; margin:16px 0 8px;">Noite</h3>
                ${eveningActivities.map(a => `
                  <div style="padding:12px; margin:8px 0; background:#fafafa; border-radius:6px; border-left:3px solid #D4A843;">
                    <strong>${getStopIcon(a)} ${a.name}</strong>
                    <br/><span style="font-size:12px; color:#888;">${a.address || ''} · ${a.duration || '2h'} · ${a.cost > 0 ? pdfMoney(a.cost) : 'Grátis'}</span>
                    ${a.insiderTip ? `<br/><span style="font-size:11px; color:#D4A843; font-style:italic;">Nota local: ${a.insiderTip}</span>` : ''}
                  </div>
                `).join('')}
              ` : ''}
              
              ${day.localSecret ? `
                <div style="background:#fffbf0; padding:12px; border-radius:6px; margin-top:12px; border-left:3px solid #D4A843;">
                  <strong style="font-size:12px; color:#D4A843;">🗝️ Segredo do Andor:</strong>
                  <p style="font-size:12px; color:#555; margin:4px 0;">${day.localSecret}</p>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
        
        <!-- INFO PRÁTICA -->
        <div style="margin:40px 0; padding:24px; background:#f0f8ff; border-radius:8px; page-break-before:always;">
          <h2 style="font-size:20px; color:#1A2235; margin:0 0 16px;">ℹ️ Informação Prática</h2>
          <p style="font-size:14px; margin:8px 0;">🛂 <strong>Visto:</strong> ${itinerary.destination?.visaInfo || 'Não necessita de visto para estadias curtas'}</p>
          <p style="font-size:14px; margin:8px 0;">🏥 <strong>Saúde:</strong> ${itinerary.destination?.healthInfo || 'Sem requisitos especiais'}</p>
          <p style="font-size:14px; margin:8px 0;"><strong>Segurança:</strong> ${itinerary.destination?.safetyLevel || 'Normal'}</p>
          <p style="font-size:14px; margin:8px 0;">💵 <strong>Gorjetas:</strong> ${itinerary.destination?.tippingCulture || 'Opcional'}</p>
          <p style="font-size:14px; margin:8px 0;">🔌 <strong>Tomadas:</strong> ${itinerary.destination?.electricityPlug || 'Tipos padrão'}</p>
          ${itinerary.destination?.simCard ? `<p style="font-size:14px; margin:8px 0;">📱 <strong>Cartão SIM:</strong> ${itinerary.destination.simCard}</p>` : ''}
        </div>
        
        <div style="text-align:center; padding:20px; color:#999; font-size:11px; border-top:1px solid #eee;">
          Gerado por Andor AI · andortravels.com · Preços são estimativas, verifica antes de reservar
        </div>
      </div>
    `;

    content.querySelectorAll('script, style, iframe, object, embed').forEach((node) => node.remove());
    content.querySelectorAll('*').forEach((node) => {
      Array.from(node.attributes).forEach((attribute) => {
        if (/^on/i.test(attribute.name) || attribute.name === 'srcdoc') {
          node.removeAttribute(attribute.name);
        }
      });
    });
    
    const pdfDate = new Date(trip.startDate || Date.now());
    const pdfMonthYear = pdfDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).replace(/\s/g, '');
    const pdfCity = (itinerary.destination?.city || itinerary.destination?.name || 'Itinerario').replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '');
    const options = {
      margin: [10, 10, 10, 10],
      filename: `Andor_${pdfCity}_${itinerary.trip?.totalDays || itinerary.days?.length}dias_${pdfMonthYear}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(options).from(content).save().then(() => {
      showToast('PDF exportado com sucesso.', 'success');
    }).catch(err => {
      showToast('Erro ao exportar PDF.', 'error');
    });
  };

  const handleRegenerateDay = async () => {
    const checkedLabels = ADAPT_OPTIONS
      .filter(o => adaptChecks[o.id])
      .map(o => o.label);
    const combined = [...checkedLabels, adaptFeedback].filter(Boolean).join('. ');
    if (!combined) return;
    setIsAdapting(true);
    setShowAdaptModal(false);
    try {
      const response = await fetch('/api/regenerate-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: dest.city || dest.name || itinerary.destination,
          dayNumber: activeDay + 1,
          currentDay: currentDay,
          feedback: combined,
          tripContext: {
            totalDays: itinerary.days?.length || trip.totalDays || activeDay + 1,
            travelStyle: trip.travelStyle,
            groupType: trip.groupType,
            budget: budgetDisplay,
            existingDayTitles: (itinerary.days || []).map((day) => day.title),
          }
        })
      });

      if (!response.ok) {
        showToast('Erro ao regenerar o dia.', 'error');
        return;
      }
      
      const data = await response.json();
      const newDay = data.day;
      if (!newDay) {
        showToast('Erro ao processar a resposta do dia.', 'error');
        return;
      }

      // Validate & normalize the new day
      const mockItinerary = { ...itinerary, days: itinerary.days.map((d, i) => i === activeDay ? newDay : d) };
      const val = validateAndNormalize(mockItinerary);
      const normalizedDay = val.normalized?.days?.[activeDay] || newDay;

      const newDays = [...(itinerary.days || [])];
      newDays[activeDay] = normalizedDay;
      const newItinerary = { ...itinerary, days: newDays, updatedAt: new Date().toISOString() };
      setItinerary(newItinerary);
      saveItinerarySnapshot(newItinerary);
      saveVersion(`Dia ${activeDay + 1} regenerado`, newItinerary);
      showToast(`Dia ${activeDay + 1} regenerado com sucesso.`, 'success');
    } catch (error) {
      showToast('Ocorreu um erro inesperado.', 'error');
    } finally {
      setIsAdapting(false);
      setAdaptFeedback('');
      setAdaptChecks({});
    }
  };

  const toggleStop = (idx) => {
    setExpandedStops(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleSaved = (stop) => {
    const stopName = stop.name;
    const destName = itinerary?.destination || (dest.city || dest.name) || '';
    
    let nextFavorites;
    const exists = favorites.some(fav => {
      if (typeof fav === 'object' && fav !== null) {
        return fav.name === stopName;
      }
      return fav === stopName;
    });

    if (exists) {
      nextFavorites = favorites.filter(fav => {
        if (typeof fav === 'object' && fav !== null) {
          return fav.name !== stopName;
        }
        return fav !== stopName;
      });
      showToast('Removido dos favoritos.', 'info');
    } else {
      nextFavorites = [...favorites, { name: stopName, destination: destName }];
      showToast('Guardado nos favoritos.', 'success');
    }
    
    setFavorites(nextFavorites);
    if (!setJson('andor_favorites', nextFavorites, 'local')) {
      showToast('Não foi possível guardar favoritos neste navegador.', 'warning');
    }

    let favActivities = getJson('andor_favorite_activities', [], 'local') || [];
    if (exists) {
      favActivities = favActivities.filter(a => a.name !== stopName);
    } else {
      favActivities.push({
        id: stopName.toLowerCase().replace(/\s+/g, '-'),
        name: stopName,
        type: stop.type || 'Actividade',
        cost: stop.cost !== undefined ? formatCurrencyAmount(stop.cost, getCurrencyContext(itinerary)) : formatCurrencyAmount(stop.estimatedCost || 'Grátis', getCurrencyContext(itinerary)),
        duration: stop.duration || '2h',
        city: dest.city || dest.name || (typeof itinerary?.destination === 'string' ? itinerary.destination : ''),
        destinationSlug: dest.slug || 'tokyo',
        image: stop.photoKeyword ? `https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=75&auto=format&fit=crop` : '',
        dateSaved: new Date().toLocaleDateString('pt-PT')
      });
    }
    setJson('andor_favorite_activities', favActivities, 'local');
    
    trackEvent(exists ? 'favorite_removed' : 'favorite_added', {
      type: 'activity',
      name: stopName,
      destination: destName
    });
  };

  const handleDayChange = (i) => {
    if (i === activeDay || dayTransitioning) return;
    setDayTransitioning(true);
    setTimeout(() => {
      setActiveDay(i);
      setDayTransitioning(false);
      if (timelineRef.current) {
        timelineRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  const openAIChat = () => {
    window.dispatchEvent(new Event('open-ai-chat'));
  };

  const handleActivityKeyDown = (event, idx) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      document.querySelector(`[data-activity-index="${idx + 1}"]`)?.focus();
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      document.querySelector(`[data-activity-index="${idx - 1}"]`)?.focus();
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.content}>
          <SkeletonLoader variant="itinerary" />
        </div>
      </>
    );
  }

  if (!itinerary) {
    return (
      <>
        <Navbar />
        <div className={styles.notFound}>
          <h2>{validationError ? 'Itinerário inválido' : 'Itinerário não encontrado'}</h2>
          <button className="btn btn-primary" onClick={() => router.push('/')}>Criar o meu próprio</button>
        </div>
      </>
    );
  }

  const dest = typeof itinerary.destination === 'string' 
    ? { name: itinerary.destination } 
    : (itinerary.destination || {});
  const trip = itinerary.trip || {};
  const currencyContext = getCurrencyContext(itinerary);
  const formatMoney = (value) => formatCurrencyAmount(value, currencyContext);
  const destinationBadge = getDestinationBadge(dest);
  const currentDay = itinerary.days?.[activeDay] || {};
  const dayCoordinates = (currentDay.stops || [])
    .map(stop => Array.isArray(stop.coordinates)
      ? stop.coordinates
      : stop.coordinates?.lat && stop.coordinates?.lng
        ? [stop.coordinates.lat, stop.coordinates.lng]
        : null)
    .filter(Boolean);
  const dayDirectionsUrl = dayCoordinates.length > 1
    ? `https://www.google.com/maps/dir/?api=1&origin=${dayCoordinates[0].join(',')}&destination=${dayCoordinates[dayCoordinates.length - 1].join(',')}&waypoints=${dayCoordinates.slice(1, -1).map(coord => coord.join(',')).join('|')}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest.city || dest.name || '')}`;
  
  // Budget estimate
  const budgetMin = trip.budgetBreakdown?.grandTotal?.min;
  const budgetMax = trip.budgetBreakdown?.grandTotal?.max;
  const budgetDisplay = budgetMin
    ? formatCurrencyRange(budgetMin, budgetMax, currencyContext)
    : itinerary.totalCost || null;

  // Group stops for the current day
  const groupedStops = { morning: [], afternoon: [], evening: [] };
  
  if (currentDay.stops && Array.isArray(currentDay.stops)) {
     currentDay.stops.forEach(stop => {
       const period = stop.period || 'afternoon';
       if (groupedStops[period]) groupedStops[period].push(stop);
       else groupedStops.afternoon.push(stop);
     });
  }

  let globalStopCounter = 0;

  return (
    <>
      <Navbar />
      <ErrorBoundary>
        <div className={styles.page} ref={printRef}>
        
        {/* HEADER DO DESTINO */}
        <header className={styles.premiumHeader}>
          <div className={styles.headerTitleRow}>
            <div className={styles.headerTitleGroup}>
              <h1 className={styles.headerCity}>
                <span className={styles.headerFlag}>{destinationBadge}</span>
                {dest.city || dest.name || itinerary.destination}
              </h1>
              <div className={styles.headerMeta}>
                <span className={styles.headerMetaChip}>
                  <CalendarDays size={16} aria-hidden="true" /> {trip.totalDays || itinerary.days?.length || '–'} dias
                </span>
                <span className={styles.headerMetaChip}>
                  <Users size={16} aria-hidden="true" /> {trip.groupType || 'Casal'}
                </span>
                <span className={styles.headerMetaChip}>
                  <Palette size={16} aria-hidden="true" /> {trip.travelStyle || 'Cultural'}
                </span>
                {budgetDisplay && (
                  <span className={styles.headerMetaChipGold}>
                    <WalletCards size={16} aria-hidden="true" /> {budgetDisplay}
                  </span>
                )}
              </div>
            </div>
            <div className={styles.headerActionsDesktop}>
              <button className={styles.btnSecondary} onClick={() => setShowAdaptModal(true)} aria-label="Editar este dia" title="Editar este dia"><Edit3 size={16} aria-hidden="true" /> <span>Editar</span></button>
              <button className={styles.btnSecondary} onClick={handleShare} aria-label="Partilhar itinerário" title="Partilhar itinerário"><Share2 size={16} aria-hidden="true" /> <span>Partilhar</span></button>
              <button className={styles.btnSecondary} onClick={handleExportPDF} aria-label="Exportar PDF" title="Exportar PDF"><FileText size={16} aria-hidden="true" /> <span>PDF</span></button>
              <button className={styles.btnSecondary} onClick={() => setShowVersionsModal(true)} aria-label="Ver versões" title="Ver versões"><History size={16} aria-hidden="true" /> <span>Versões</span></button>
              <button className={styles.btnSecondary} onClick={handleGeneratePackingList} aria-label="Gerar lista de bagagem" title="Gerar lista de bagagem"><Package size={16} aria-hidden="true" /> <span>Bagagem</span></button>
              <button className={styles.btnSecondary} onClick={copyCurrentDayPlan} aria-label="Copiar plano do dia" title="Copiar plano do dia"><Copy size={16} aria-hidden="true" /> <span>Copiar</span></button>
              <button className={styles.btnPrimary} onClick={openAIChat} aria-label="Pedir ajuda ao Andor" title="Pedir ajuda ao Andor"><MessageCircle size={16} aria-hidden="true" /> <span>Andor</span></button>
            </div>
          </div>
        </header>

        {/* TABS DOS DIAS */}
        <div className={styles.dayTabsWrapper}>
          <div className={styles.dayTabs} data-testid="day-tabs">
            {itinerary.days?.map((day, i) => {
              const dayBudget = getDayBudget(day);
              return (
                <button
                  key={i}
                  ref={(node) => { dayTabRefs.current[i] = node; }}
                  className={`${styles.dayTab} ${activeDay === i ? styles.dayTabActive : ''}`}
                  onClick={() => handleDayChange(i)}
                  data-testid={`day-tab-${i + 1}`}
                >
                  <div className={styles.dayTabEmoji}>
                    {isAdapting && activeDay === i ? <Loader2 size={16} aria-hidden="true" /> : getDayEmoji(day)}
                  </div>
                  <div className={styles.dayTabContent}>
                    <div className={styles.dayTabNumber}>DIA {i + 1}</div>
                    <div className={styles.dayTabTitle} title={day.title || `Dia ${i + 1}`}>
                      {(day.title?.length > 16 ? day.title.substring(0, 16) + '…' : day.title) || `Dia ${i + 1}`}
                    </div>
                    {dayBudget > 0 && (
                      <div className={styles.dayTabBudget}>~{formatMoney(dayBudget)}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className={styles.dayProgress}>
            <span>Dia {activeDay + 1} de {itinerary.days?.length || 1}</span>
            <div className={styles.dayProgressTrack} aria-hidden="true">
              <div
                className={styles.dayProgressFill}
                style={{ width: `${(((activeDay + 1) / (itinerary.days?.length || 1)) * 100).toFixed(2)}%` }}
              />
            </div>
          </div>
        </div>

        {/* MAIN LAYOUT (DOIS PAINÉIS) */}
        <div className={styles.twoPanelLayout}>
          
          {/* PAINEL ESQUERDO */}
          <div className={styles.leftPanel}>
            
            {/* MAPA INTERACTIVO */}
            <div className={styles.mapContainer} data-testid="itinerary-map-container">
              <ErrorBoundary>
                <LiveMap stops={currentDay.stops || []} destination={dest} currency={currencyContext.symbol} />
              </ErrorBoundary>
            </div>
            <a
              className={styles.googleMapsDayButton}
              href={dayDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Map size={16} aria-hidden="true" /> Abrir este dia no Google Maps
            </a>

            <DailyPlanTimeline dailyPlans={itinerary.days} destination={dest.city || dest.name} />

            {/* CLIMA E TRANSPORTE */}
            <div className={styles.dayMetaCards}>
              {currentDay.weather && (
                <div className={styles.metaCard}>
                  <span className={styles.metaIcon}>WX</span>
                  <div>
                    <div className={styles.metaLabel}>Clima</div>
                    <div className={styles.metaValue}>{currentDay.weather.avgTemp} · {currentDay.weather.condition}</div>
                    {currentDay.weather.tip && (
                      <div className={styles.metaValueSub}>{currentDay.weather.tip}</div>
                    )}
                  </div>
                </div>
              )}
              {currentDay.transport && (
                <div className={styles.metaCard}>
                  <span className={styles.metaIcon}><Route size={18} aria-hidden="true" /></span>
                  <div>
                    <div className={styles.metaLabel}>Transporte do Dia</div>
                    <div className={styles.metaValue}>
                      {currentDay.transport.mainMode || currentDay.transport.mainRecommendation}
                    </div>
                    <div className={styles.metaValueSub}>
                      Est. {formatMoney(currentDay.transport.cost)}
                      {currentDay.transport.dayPass && (
                        <span> · Passe diário: {formatMoney(currentDay.transport.dayPass.price || currentDay.transport.dayPass)}</span>
                      )}
                    </div>
                    {currentDay.transport.apps && currentDay.transport.apps.length > 0 && (
                      <div className={styles.transportApps}>
                        {currentDay.transport.apps.map((app, ai) => (
                          <span key={ai} className={styles.transportAppChip}>{app}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* TIMELINE (MANHÃ, TARDE, NOITE) */}
            <div className={`${styles.timeline} ${isAdapting ? styles.loading : ''} ${dayTransitioning ? styles.transitioning : ''}`} ref={timelineRef}>
              <div className={styles.timelineHeader}>
                <h2 className={styles.dayHeading}>{currentDay.title}</h2>
                <div className={styles.timelineHeaderActions}>
                  <button 
                    type="button"
                    className={`${styles.viewToggleBtn} ${compactMode ? styles.viewToggleBtnActive : ''}`} 
                    onClick={() => setCompactMode(!compactMode)}
                    aria-label={compactMode ? "Mudar para vista detalhada" : "Mudar para vista compacta"}
                  >
                    {compactMode ? 'Vista compacta' : 'Vista detalhada'}
                  </button>
                  <button className={styles.btnRegenerate} onClick={() => setShowAdaptModal(true)} disabled={isAdapting}>
                    {isAdapting ? <><Loader2 size={16} aria-hidden="true" /> A processar...</> : <><RefreshCw size={16} aria-hidden="true" /> Regenerar este dia</>}
                  </button>
                </div>
              </div>

              {/* Daily Synopsis / Day Overview */}
              {!isAdapting && (
                <div className={styles.daySynopsisCard}>
                  {currentDay.moodDescription && (
                    <div className={styles.synopsisMood}>
                      <span className={styles.quoteIcon}>“</span>
                      <p className={styles.moodText}>{currentDay.moodDescription}</p>
                    </div>
                  )}
                  <div className={styles.synopsisStats}>
                    <div className={`${styles.synopsisStatBadge} ${
                      String(currentDay.energyLevel || '').toLowerCase().includes('relax') ? styles.energyRelaxed :
                      String(currentDay.energyLevel || '').toLowerCase().includes('intense') ? styles.energyIntense :
                      styles.energyModerate
                    }`}>
                      {String(currentDay.energyLevel || '').toLowerCase().includes('relax') ? 'Ritmo leve' :
                       String(currentDay.energyLevel || '').toLowerCase().includes('intense') ? 'Ritmo intenso' :
                       'Ritmo moderado'}
                    </div>
                    <div className={styles.synopsisStatBadge}>
                      {currentDay.estimatedDistance || (activeDay === 0 ? '4 km' : activeDay % 2 === 0 ? '8 km' : '6 km')} a pé
                    </div>
                    <div className={styles.synopsisStatBadge}>
                      ~{formatMoney(getDayBudget(currentDay))} est.
                    </div>
                    {enrichmentStatus !== 'complete' && enrichmentStatus !== 'idle' && (
                      <EnrichmentProgress status={enrichmentStatus} />
                    )}
                  </div>
                </div>
              )}

              {isAdapting ? (
                <div style={{ padding: '20px 0' }}>
                  <SkeletonLoader variant="text" />
                  <div style={{ height: '20px' }}></div>
                  <SkeletonLoader variant="card" count={2} />
                </div>
              ) : ['morning', 'afternoon', 'evening'].map(periodKey => {
                  const stops = groupedStops[periodKey];
                  if (!stops || stops.length === 0) return null;
                  
                  const periodNames = { morning: 'MANHÃ', afternoon: 'TARDE', evening: 'NOITE' };

                  return (
                    <div key={periodKey} className={styles.periodSection}>
                      <h3 className={styles.periodHeading}>{periodNames[periodKey]}</h3>
                      <div className={styles.periodStops}>
                        {stops.map((stop, stopIdx) => {
                          const idx = globalStopCounter++;
                          const isSaved = isStopSaved(stop.name);
                          
                          return (
                            <div key={idx}>
                              {/* Transport bridge from previous activity */}
                              {stopIdx > 0 && stop.transportFromPrevious && (
                                <div className={styles.transportBridge}>
                                  <span className={styles.transportBridgeIcon}>
                                    <Route size={16} aria-hidden="true" />
                                  </span>
                                  <span className={styles.transportBridgeText}>
                                    {stop.transportFromPrevious.mode} · {stop.transportFromPrevious.duration}
                                    {stop.transportFromPrevious.cost && ` · ${formatMoney(stop.transportFromPrevious.cost)}`}
                                  </span>
                                </div>
                              )}
                              
                              <EnhancedActivityCard
                                activity={stop}
                                index={idx}
                                period={periodKey}
                                isSaved={isSaved}
                                isExpanded={compactMode ? false : !!expandedStops[idx]}
                                onToggle={() => toggleStop(idx)}
                                onSave={() => toggleSaved(stop)}
                                onBook={() => setBookingStop(stop)}
                                onCopy={() => copyActivityDetails(stop)}
                                onMapFocus={(coords) => {
                                  // focus on map
                                }}
                                isDayHighlight={stopIdx === 0}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* REFEIÇÕES DO DIA */}
            {currentDay.meals && (
              <div className={styles.mealsSection}>
                <h3 className={styles.sectionTitle}>Refeições do Dia</h3>
                <div className={styles.mealsGrid}>
                  {['breakfast', 'lunch', 'dinner'].map(mealType => {
                    const meal = currentDay.meals[mealType];
                    if (!meal) return null;
                    const icons = { breakfast: 'Pequeno-almoço', lunch: 'Almoço', dinner: 'Jantar' };
                    const borderClass = {
                      breakfast: styles.mealBorderGold,
                      lunch: styles.mealBorderBlue,
                      dinner: styles.mealBorderPurple,
                    };
                    const mealPriceRange = String(meal.priceRange || '').trim();
                    const mealCostDisplay = mealPriceRange && !/^[A-Z]{3}$|^[€$£¥]+$/.test(mealPriceRange)
                      ? mealPriceRange
                      : formatMoney(meal.cost);
                    return (
                      <div key={mealType} className={`${styles.mealCard} ${borderClass[mealType]}`}>
                        <div className={styles.mealHeader}>{icons[mealType]}</div>
                        <div className={styles.mealName}>{meal.name}</div>
                        <div className={styles.mealMeta}>
                          {meal.cuisine || meal.type}
                          <span className={styles.mealCost}> · {mealCostDisplay}</span>
                        </div>
                        {(meal.mustOrder || meal.note) && (
                          <div className={styles.mealTip}>
                            <span className={styles.mealTipLabel}>Deve pedir:</span> &ldquo;{meal.mustOrder || meal.note}&rdquo;
                          </div>
                        )}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meal.name + ' ' + (dest.city || ''))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.mealMapLink}
                        >
                          <MapPin size={16} aria-hidden="true" /> Ver no Google Maps
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RESTAURANTES ENRIQUECIDOS NAS PROXIMIDADES */}
            {currentDay.enrichedRestaurants && currentDay.enrichedRestaurants.length > 0 && (
              <div className={styles.mealsSection}>
                <h3 className={styles.sectionTitle}>Restaurantes Recomendados (Dados Reais)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {currentDay.enrichedRestaurants.map((restaurant, rIdx) => (
                    <RestaurantCard
                      key={rIdx}
                      restaurant={restaurant}
                      onMapFocus={(coords) => {
                        const event = new CustomEvent('andor-open-map', {
                          detail: { coordinates: coords, name: restaurant.name }
                        });
                        window.dispatchEvent(event);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* SEGREDO LOCAL */}
            {(currentDay.localSecret || currentDay.culturalNote) && (
              <div className={styles.localSecretCard}>
                <div className={styles.localSecretIcon}>Nota</div>
                <div className={styles.localSecretContent}>
                  <h4 className={styles.localSecretTitle}>Segredo Local do Andor</h4>
                  <p>{currentDay.localSecret}</p>
                  {currentDay.culturalNote && <p className={styles.culturalNote}><em>Nota Cultural:</em> {currentDay.culturalNote}</p>}
                </div>
              </div>
            )}

            <button
              type="button"
              className={styles.mobileBudgetToggle}
              onClick={() => setShowMobileBudget((value) => !value)}
              aria-expanded={showMobileBudget}
              data-testid="mobile-budget-toggle"
            >
              Ver orçamento completo {showMobileBudget ? '▲' : '▼'}
            </button>
          </div>

          {/* PAINEL LATERAL (DIREITO) */}
          <div className={`${styles.rightPanel} ${showMobileBudget ? styles.mobileBudgetOpen : styles.mobileBudgetCollapsed}`}>
            
            <BudgetVisualization currency={currencyContext.symbol} budget={trip.budget || trip.budgetScenarios || (trip.budgetBreakdown ? { 
              scenarios: [{ 
                tier: 'balanced', 
                total: trip.budgetBreakdown.grandTotal?.min || 0, 
                breakdown: {
                  flights: trip.budgetBreakdown.flights?.min || 0,
                  accommodation: trip.budgetBreakdown.accommodation?.total || 0,
                  food: trip.budgetBreakdown.food?.total || 0,
                  activities: trip.budgetBreakdown.activities?.total || 0,
                  transport: trip.budgetBreakdown.transport?.total || 0
                }
              }] 
            } : { scenarios: [] })} />
            
            <button className={styles.btnOutlineFull} onClick={() => setShowBudgetDrawer(true)} style={{ marginBottom: '16px' }}>
              <Settings size={16} aria-hidden="true" /> Ajustar orçamento
            </button>

            <BookingChecklist bookingChecklist={itinerary.bookingChecklist || trip.bookingChecklist || itinerary.trip?.bookingChecklist} />

            {/* VOOS */}
            <FlightSection 
              flights={{ 
                options: itinerary.flightOptions || [], 
                overview: trip.flightOverview || '',
                externalLinks: {
                  skyscanner: `https://www.skyscanner.net/transport/flights-from/pt/${encodeURIComponent((dest.city || dest.name || '').toLowerCase())}`
                }
              }} 
              destination={dest.city || dest.name} 
            />

            {/* HOTEL */}
            <HotelSection 
              accommodation={{
                ...itinerary.accommodation,
                externalLinks: {
                  booking: `https://www.booking.com/searchresults.pt-pt.html?ss=${encodeURIComponent(dest.city || dest.name || '')}`
                }
              }} 
              destination={dest.city || dest.name} 
            />

            {/* AIRPORT TRANSFER */}
            <AirportTransferSection airportTransfer={itinerary.airportTransfer || trip.airportTransfer} />

            {/* LOCAL TRANSPORT */}
            <LocalTransportSection localTransport={itinerary.localTransport || trip.localTransport} />

            {/* ALERTS & WARNINGS */}
            <AlertsSection warnings={itinerary.warnings || trip.warnings || []} destination={dest.city || dest.name} />

            {/* TOP TIPS */}
            {trip.topTips && (
              <div className={styles.sidebarCard}>
                <h3 className={styles.tipsHeading}>Dicas Top do Andor</h3>
                <ul className={styles.tipsList}>
                  {trip.topTips.map((tip, i) => (
                    <li key={i} className={styles.tipsItem}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.sidebarCard}>
              <div className={styles.packingHeader}>
                <h3 className={styles.tipsHeading}>Lista de Bagagem</h3>
                <button className={styles.btnSecondary} onClick={handleGeneratePackingList} disabled={isPackingGenerating}>
                  {isPackingGenerating ? 'A gerar...' : packingList ? 'Atualizar' : 'Gerar'}
                </button>
              </div>
              {packingList ? (
                <div className={styles.packingList}>
                  {Object.entries({
                    essential: 'Essencial',
                    clothes: 'Roupa',
                    apps: 'Apps',
                    avoid: 'Não levar',
                  }).map(([category, label]) => (
                    <div key={category} className={styles.packingGroup}>
                      <h4>{label}</h4>
                      {(packingList[category] || []).map((item) => {
                        const checkedKey = `${category}:${item}`;
                        return (
                          <label key={item} className={styles.packingItem}>
                            <input
                              type="checkbox"
                              checked={!!checkedPacking[checkedKey]}
                              onChange={() => togglePackingItem(category, item)}
                            />
                            <span>{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.sidebarHint}>Gera uma checklist adaptada ao destino, estação e ritmo do teu roteiro.</p>
              )}
            </div>

            {/* ACTIONS */}
            <div className={styles.sidebarActionsCol}>
              <button className={styles.btnSecondaryFull} onClick={handleExportPDF}><FileText size={16} aria-hidden="true" /> Exportar PDF</button>
              <button className={styles.btnSecondaryFull} onClick={handleShare}><Share2 size={16} aria-hidden="true" /> Partilhar link</button>
              <button className={styles.btnPrimaryFull} onClick={openAIChat}><MessageCircle size={16} aria-hidden="true" /> Pedir ao Andor</button>
            </div>

          </div>
        </div>
      </div>
      </ErrorBoundary>

      <Modal
        isOpen={showAdaptModal}
        onClose={() => setShowAdaptModal(false)}
        title={`Regenerar Dia ${activeDay + 1}`}
      >
        <p className={styles.modalSubtitle}>O que não gostaste neste dia?</p>
            
        <div className={styles.adaptOptions}>
          {ADAPT_OPTIONS.map(opt => (
            <label key={opt.id} className={`${styles.adaptCheckbox} ${adaptChecks[opt.id] ? styles.adaptCheckboxActive : ''}`}>
              <input
                type="checkbox"
                checked={!!adaptChecks[opt.id]}
                onChange={() => setAdaptChecks(prev => ({ ...prev, [opt.id]: !prev[opt.id] }))}
                className={styles.adaptCheckboxInput}
              />
              <span className={styles.adaptCheckboxLabel}>{opt.label}</span>
            </label>
          ))}
        </div>

        <textarea 
          className={styles.adaptTextarea} 
          placeholder="Descreve o que preferias, em detalhe..."
          value={adaptFeedback}
          onChange={e => setAdaptFeedback(e.target.value)}
        />
        <div className={styles.modalActions}>
          <button className={styles.btnSecondary} onClick={() => setShowAdaptModal(false)}>Cancelar</button>
          <button className={styles.btnPrimary} onClick={handleRegenerateDay} disabled={isAdapting || (!adaptFeedback.trim() && !Object.values(adaptChecks).some(Boolean))}>
            {isAdapting ? 'A regenerar...' : 'Regenerar'}
          </button>
        </div>
      </Modal>

      <Drawer
        isOpen={showBudgetDrawer}
        onClose={() => setShowBudgetDrawer(false)}
        title="Ajustar Orçamento"
      >
        <div className={styles.modalBody}>
          <ErrorBoundary>
            <BudgetCalculator 
              baseCost={trip.budgetBreakdown?.grandTotal?.min || 500} 
              daysCount={trip.totalDays || itinerary.days?.length || 3} 
              currency={currencyContext.symbol} 
            />
          </ErrorBoundary>
        </div>
        <div className={styles.modalActions}>
          <button className={styles.btnPrimary} onClick={() => setShowBudgetDrawer(false)}>Aplicar e fechar</button>
        </div>
      </Drawer>

      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Partilhar Itinerário"
      >
        <div className={styles.sharePreview}>
          <span>URL privada deste roteiro</span>
          <input value={shareUrl} readOnly aria-label="URL de partilha" />
          <span>Este link usa armazenamento local deste navegador. Para partilha garantida, exporta também o PDF.</span>
        </div>
        <div className={styles.shareActions}>
          <button className={styles.btnPrimary} onClick={copyShareUrl}>Copiar link</button>
          <a className={styles.btnOutline} href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <a className={styles.btnOutline} href={`mailto:?subject=${encodeURIComponent('O meu roteiro Andor')}&body=${encodeURIComponent(shareUrl)}`}>Email</a>
        </div>
      </Modal>

      <Modal
        isOpen={showVersionsModal}
        onClose={() => setShowVersionsModal(false)}
        title="Versões do Itinerário"
      >
        <div className={styles.versionList}>
          {versions.map((version) => (
            <button
              key={version.id}
              type="button"
              className={styles.versionItem}
              onClick={() => restoreVersion(version)}
            >
              <strong>{version.label}</strong>
              <span>{new Date(version.createdAt).toLocaleString('pt-PT')}</span>
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={!!bookingStop}
        onClose={() => setBookingStop(null)}
        title={`Reservar ${bookingStop?.name || ''}`}
      >
        {bookingStop && (
          <div className={styles.bookingModal}>
            <p>
              {bookingStop.bookingRequired
                ? 'Reserva recomendada. Garante lugar antes de ajustares o resto do dia.'
                : 'Normalmente não exige reserva, mas vale confirmar horários e lotação antes de saíres.'}
            </p>
            <div className={styles.bookingTip}>
              <strong>Dica Andor:</strong> {bookingStop.bookingTip || bookingStop.crowdTip || 'Procura o primeiro horário disponível ou o final da tarde para evitar grupos grandes.'}
            </div>
            <div className={styles.shareActions}>
              {bookingStop.bookingUrl && (
                <a className={styles.btnPrimary} href={bookingStop.bookingUrl} target="_blank" rel="noopener noreferrer">Site oficial</a>
              )}
              <a className={styles.btnOutline} href={`https://www.getyourguide.com/s/?q=${encodeURIComponent(bookingStop.name)}`} target="_blank" rel="noopener noreferrer">GetYourGuide</a>
              <a className={styles.btnOutline} href={`https://www.viator.com/searchResults/all?text=${encodeURIComponent(bookingStop.name)}`} target="_blank" rel="noopener noreferrer">Viator</a>
              <a className={styles.btnOutline} href={`https://www.google.com/search?q=${encodeURIComponent(`${bookingStop.name} tickets reservation ${dest.city || dest.name || ''}`)}`} target="_blank" rel="noopener noreferrer">Google</a>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
