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
  MessageCircle,
  Package,
  Palette,
  RefreshCw,
  Route,
  Settings,
  Share2,
  Ticket,
  Unlink,
  Users,
  WalletCards,
} from 'lucide-react';
import { getItinerary, updateSavedTrip } from '../../lib/itinerary-store';
import { validateAndNormalize } from '../../lib/itinerary-validate';
import { ensureBookingReadyItinerary } from '../../lib/booking-ready';
import { getJson, setJson } from '../../lib/storage';
import { enrichItinerary } from '../../lib/itinerary-enricher';
import { validateAndFixCoordinates } from '../../lib/coordinate-validator';
import {
  buildClientShareSummary,
  buildInternalShareSummary,
} from '../../lib/share-utils';
import { getDestinationCover } from '../../lib/destination-media';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import BudgetCalculator from '../../components/BudgetCalculator';
import BudgetVisualization from '../../components/BudgetVisualization';
import BookingChecklist from '../../components/BookingChecklist';
import FlightSection from '../../components/FlightSection';
import HotelSection from '../../components/HotelSection';
import AirportTransferSection from '../../components/AirportTransferSection';
import AlertsSection from '../../components/AlertsSection';
import LocalTransportSection from '../../components/LocalTransportSection';
import RentalCarSection from '../../components/RentalCarSection';
import TravelDocumentsSection from '../../components/TravelDocumentsSection';
import BackupPlansSection from '../../components/BackupPlansSection';
import ReviewBeforeSending from '../../components/ReviewBeforeSending';
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
import WeatherSummary from '../../components/WeatherSummary';
import { calculateDayRoutes } from '../../lib/route-calculator';
import LiveMap from '../../components/LiveMap';
import styles from './itinerary.module.css';
import { trackEvent } from '../../lib/analytics';
import { buildDossierExportContext } from '../../lib/dossier-export';
import {
  backupTriggerLabel,
  bookingStatusLabel,
  documentImportanceLabel,
  documentStatusLabel,
  planningStatusLabel,
  priorityLabel,
} from '../../lib/planning-labels';

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
  if (value === undefined || value === null || value === '') return 'Por confirmar';
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
  const toFlag = (code) => {
    const normalized = String(code || '').trim().slice(0, 2).toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalized)) return '';
    return String.fromCodePoint(...normalized.split('').map((letter) => 127397 + letter.charCodeAt(0)));
  };
  if (typeof dest === 'string') return toFlag(dest.split(',')[1]?.trim()) || '•';
  if (dest.flag && !/^[A-Z]{2}$/.test(String(dest.flag))) return dest.flag;
  if (dest.countryCode) return toFlag(dest.countryCode);
  if (dest.flag) return toFlag(dest.flag);
  const country = String(dest.country || '').toLowerCase();
  return toFlag(COUNTRY_CODE_BY_NAME[country] || country.slice(0, 2)) || '•';
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

const getActivityImageUrl = (stop, destinationLabel = '') => {
  if (stop?.photo) return stop.photo;
  const query = [
    stop?.photoKeyword,
    stop?.name,
    destinationLabel,
    stop?.category || stop?.type,
  ].filter(Boolean).join(' ').trim() || 'specific travel place';
  return `https://source.unsplash.com/800x500/?${encodeURIComponent(query)}&sig=${encodeURIComponent(stop?.id || stop?.name || query)}`;
};

export default function ItineraryPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  
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
  const [shareExpiresInDays, setShareExpiresInDays] = useState(7);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');
  const [activeShare, setActiveShare] = useState(null);
  const [shareLinks, setShareLinks] = useState([]);
  const [tripVersion, setTripVersion] = useState(null);
  const [tripPermission, setTripPermission] = useState(null);
  const [persistenceState, setPersistenceState] = useState('loading');
  const [saveStatus, setSaveStatus] = useState('idle');
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
  const [exportMode, setExportMode] = useState('client');
  const [weatherData, setWeatherData] = useState(null);
  const [dayRoutes, setDayRoutes] = useState({});
  const [exchangeRateData, setExchangeRateData] = useState(null);

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
  const versionRef = useRef(null);
  const saveQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    let cancelled = false;

    const applyData = (data, record = null) => {
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
          const bookingReadyData = ensureBookingReadyItinerary(validatedData, {
            profile: validatedData.trip?.travelerProfile,
          });
          const enriched = enrichItinerary(bookingReadyData);
          setItinerary(enriched);
          setExpandedStops({ 0: true });
        }
      } catch (e) {
        const bookingReadyData = ensureBookingReadyItinerary(data, {
          profile: data?.trip?.travelerProfile,
        });
        const enriched = enrichItinerary(bookingReadyData);
        setItinerary(enriched);
      }
      if (record) {
        const version = Number(record.version) || 1;
        versionRef.current = version;
        setTripVersion(version);
        setTripPermission(record.permission || null);
        setPersistenceState('durable');
        setSaveStatus('saved');
      }
      return true;
    };

    const loadItinerary = async () => {
      let data = null;
      let applied = false;
      if (params.id === 'share') {
        setValidationError('A partilha antiga por dados no URL foi desativada. Importa o roteiro local e cria um novo link seguro.');
        setPersistenceState('legacy-share-blocked');
      } else {
        const isDurableId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(params.id));
        if (isDurableId) {
          try {
            const response = await fetch(`/api/itineraries/${encodeURIComponent(params.id)}`, {
              cache: 'no-store',
              credentials: 'same-origin',
            });
            if (response.ok) {
              const payload = await response.json();
              data = payload.trip?.itinerary || payload.itinerary;
              applied = applyData(data, payload.trip);
            } else if (response.status === 401) {
              setValidationError('Inicia sessao para abrir esta viagem guardada.');
            }
          } catch (error) {}
        }
        if (!data) {
          data = getItinerary(params.id) || getJson(`andor_itinerary_${params.id}`, null, 'local');
          if (data) {
            setPersistenceState('legacy');
            setTripPermission('legacy');
            setSaveStatus('local');
          }
        }
      }

      if (data && !applied) applyData(data);
      if (!cancelled) setLoading(false);
    };

    loadItinerary();
    return () => {
      cancelled = true;
    };
  }, [params.id, user?.id]);

  // Fetch verified weather, OSRM routes, and live exchange rates from server APIs
  useEffect(() => {
    if (!itinerary) return;
    let active = true;

    const fetchWeather = async () => {
      const destCoords = itinerary.destination?.coordinates;
      let lat = null;
      let lng = null;

      if (Array.isArray(destCoords)) {
        [lat, lng] = destCoords;
      } else if (typeof destCoords === 'object' && destCoords) {
        lat = destCoords.lat;
        lng = destCoords.lng;
      }

      if (lat == null || lng == null) {
        const firstStop = itinerary.days?.[0]?.stops?.[0];
        if (firstStop?.coordinates) {
          const coords = firstStop.coordinates;
          lat = Array.isArray(coords) ? coords[0] : coords.lat;
          lng = Array.isArray(coords) ? coords[1] : coords.lng;
        }
      }

      if (lat != null && lng != null) {
        try {
          const daysCount = itinerary.days?.length || 7;
          const res = await fetch(`/api/weather?lat=${lat}&lng=${lng}&days=${daysCount}`);
          if (res.ok && active) {
            const data = await res.json();
            setWeatherData(data);
          }
        } catch (e) {
          console.warn('Weather fetch error:', e);
        }
      }
    };

    const fetchExchangeRate = async () => {
      const destCurrency = itinerary.destination?.currency?.code || itinerary.currency || 'EUR';
      if (destCurrency && destCurrency.toUpperCase() !== 'EUR') {
        try {
          const res = await fetch(`/api/exchange-rates?base=EUR&quote=${encodeURIComponent(destCurrency)}`);
          if (res.ok && active) {
            const data = await res.json();
            setExchangeRateData(data);
          }
        } catch (e) {
          console.warn('Exchange rate fetch error:', e);
        }
      }
    };

    fetchWeather();
    fetchExchangeRate();

    return () => {
      active = false;
    };
  }, [itinerary]);

  useEffect(() => {
    if (!itinerary?.days?.[activeDay]) return;
    let active = true;

    const runRouteCalc = async () => {
      const stops = itinerary.days[activeDay].stops || [];
      if (stops.length < 2) return;

      try {
        const routes = await calculateDayRoutes(stops);
        if (active && routes && routes.length > 0) {
          setDayRoutes((prev) => ({ ...prev, [activeDay]: routes }));
        }
      } catch (e) {
        console.warn('Route calculation error:', e);
      }
    };

    runRouteCalc();
    return () => {
      active = false;
    };
  }, [itinerary, activeDay]);

  useEffect(() => {
    if (!itinerary || !id || enrichmentStatus !== 'idle') return;
    if (persistenceState === 'durable') {
      // Durable records render exactly what the authorized repository returned.
      // Background enrichment must not create an unversioned browser-only fork.
      setEnrichmentStatus('complete');
      return;
    }
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
              departureCity: itinerary.trip?.departureCity || itinerary.preferences?.departureCity || ''
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
  }, [itinerary, id, enrichmentStatus, persistenceState]);

  useEffect(() => {
    if (itinerary) {
      const destObj = itinerary.destination || {};
      const tripObj = itinerary.trip || {};
      const city = typeof destObj === 'string' ? destObj : (destObj.city || destObj.name || (typeof itinerary.destination === 'string' ? itinerary.destination : 'Viagem'));
      const daysCount = tripObj.totalDays || itinerary.days?.length || 0;
      const title = `${city} ${daysCount} dias · Andor`;
      const applyTitle = () => {
        if (document.title !== title) document.title = title;
      };
      const observer = new MutationObserver(applyTitle);
      observer.observe(document.head, { childList: true, subtree: true, characterData: true });
      applyTitle();
      return () => observer.disconnect();
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

  useEffect(() => {
    if (!id) return undefined;
    const syncSectionState = (sectionName, expectedStorageKey, event) => {
      if (event.detail?.storageKey !== expectedStorageKey) return;
      const itemState = event.detail?.itemState || {};
      setItinerary((current) => {
        if (!current) return current;
        const source = current[sectionName];
        const items = Array.isArray(source?.items) ? source.items : Array.isArray(source) ? source : [];
        const nextItems = items.map((item) => ({ ...item, ...(itemState[item.id] || {}) }));
        return {
          ...current,
          [sectionName]: Array.isArray(source) ? nextItems : { ...(source || {}), items: nextItems },
        };
      });
    };
    const bookingKey = `andor_booking_checklist_${id}`;
    const documentKey = `andor_documents_checklist_${id}`;
    const handleBookings = (event) => syncSectionState('bookingChecklist', bookingKey, event);
    const handleDocuments = (event) => syncSectionState('documentsChecklist', documentKey, event);
    window.addEventListener('andor-bookings-updated', handleBookings);
    window.addEventListener('andor-documents-updated', handleDocuments);
    return () => {
      window.removeEventListener('andor-bookings-updated', handleBookings);
      window.removeEventListener('andor-documents-updated', handleDocuments);
    };
  }, [id]);

  const saveItinerarySnapshot = (nextItinerary) => {
    if (!id) return Promise.resolve({ ok: false, status: 'missing_id' });
    if (persistenceState !== 'durable') {
      const persisted = updateSavedTrip(id, () => nextItinerary);
      if (!persisted) {
        setJson(`andor_itinerary_${id}`, nextItinerary, 'session');
        setJson(`andor_itinerary_${id}`, nextItinerary, 'local');
      }
      setSaveStatus('local');
      return Promise.resolve({ ok: true, status: 'local' });
    }
    if (!['owner', 'editor'].includes(tripPermission)) {
      setSaveStatus('forbidden');
      showToast('Esta viagem esta em modo de leitura.', 'info');
      return Promise.resolve({ ok: false, status: 'forbidden' });
    }

    const persist = async () => {
      const expectedVersion = versionRef.current;
      if (!Number.isInteger(expectedVersion)) return { ok: false, status: 'missing_version' };
      setSaveStatus('saving');
      try {
        const response = await fetch(`/api/itineraries/${encodeURIComponent(String(id))}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'If-Match': `"${expectedVersion}"`,
          },
          credentials: 'same-origin',
          body: JSON.stringify({ itinerary: nextItinerary }),
        });
        const payload = await response.json().catch(() => null);
        if (response.status === 409) {
          setSaveStatus('conflict');
          return { ok: false, status: 'conflict', currentVersion: payload?.error?.currentVersion };
        }
        if (!response.ok || !payload?.trip) {
          setSaveStatus('error');
          return { ok: false, status: 'error' };
        }
        const nextVersion = Number(payload.trip.version);
        versionRef.current = nextVersion;
        setTripVersion(nextVersion);
        setSaveStatus('saved');
        return { ok: true, status: 'saved', version: nextVersion };
      } catch (error) {
        setSaveStatus('error');
        return { ok: false, status: 'network_error' };
      }
    };

    saveQueueRef.current = saveQueueRef.current.catch(() => null).then(persist);
    return saveQueueRef.current;
  };

  const saveVersion = (label, nextItinerary) => {
    if (!id || (persistenceState === 'durable' && !['owner', 'editor'].includes(tripPermission))) return;
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
    if (persistenceState === 'durable' && !['owner', 'editor'].includes(tripPermission)) return;
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
        'Notas offline com moradas e reservas importantes',
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

  const loadShareLinks = async () => {
    if (!id || persistenceState !== 'durable' || tripPermission !== 'owner') return [];
    try {
      const response = await fetch(`/api/itineraries/${encodeURIComponent(String(id))}/shares`, {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(payload?.shares)) {
        throw new Error(payload?.error?.message || 'Nao foi possivel carregar os links.');
      }
      setShareLinks(payload.shares);
      return payload.shares;
    } catch (error) {
      setShareError(error?.message || 'Nao foi possivel carregar os links.');
      return [];
    }
  };

  const createShareUrl = async (expiresInDays = shareExpiresInDays) => {
    if (!itinerary || !id || persistenceState !== 'durable' || tripPermission !== 'owner') return null;
    setShareLoading(true);
    setShareError('');
    try {
      const response = await fetch(`/api/itineraries/${encodeURIComponent(String(id))}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ expiresInDays }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error?.message || 'Não foi possível criar o link seguro.');
      }
      setShareUrl(payload.url);
      setActiveShare(payload.share);
      setShareLinks((current) => [payload.share, ...current.filter((share) => share.id !== payload.share.id)]);
      return payload.url;
    } catch (error) {
      setShareUrl('');
      setActiveShare(null);
      setShareError(error.message || 'Não foi possível criar o link seguro.');
      return null;
    } finally {
      setShareLoading(false);
    }
  };

  const handleShare = async () => {
    if (typeof window === 'undefined' || !itinerary) return;
    if (persistenceState !== 'durable') {
      showToast('Importa e guarda esta viagem antes de criares um link.', 'info');
      return;
    }
    if (tripPermission !== 'owner') {
      showToast('So o proprietario pode gerir links publicos.', 'info');
      return;
    }
    setShareUrl('');
    setActiveShare(null);
    setShareError('');
    setShowShareModal(true);
    await loadShareLinks();
  };

  const handleShareExpiryChange = (value) => {
    const expiresInDays = Number(value);
    setShareExpiresInDays(expiresInDays);
  };

  const copyShareUrl = async () => {
    try {
      if (!shareUrl) throw new Error('missing_share_url');
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copiado para a área de transferência.', 'success');
    } catch (err) {
      showToast('Cria primeiro um novo link para o poderes copiar.', 'info');
    }
  };

  const revokeShare = async (shareId) => {
    if (!shareId) return;
    try {
      const response = await fetch(`/api/itineraries/${encodeURIComponent(String(id))}/shares/${encodeURIComponent(shareId)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error('share_revoke_failed');
      setShareLinks((current) => current.map((share) => (
        share.id === shareId ? { ...share, revokedAt: new Date().toISOString() } : share
      )));
      if (activeShare?.id === shareId) {
        setShareUrl('');
        setActiveShare(null);
      }
      showToast('Link revogado.', 'success');
    } catch (error) {
      showToast('Não foi possível revogar o link.', 'error');
    }
  };

  const copyTextSummary = async (audience = 'client') => {
    try {
      const summary = audience === 'internal'
        ? buildInternalShareSummary(itinerary)
        : buildClientShareSummary(itinerary);
      await navigator.clipboard.writeText(summary);
      showToast('Resumo de texto copiado.', 'success');
    } catch (err) {
      showToast('Erro ao copiar resumo.', 'error');
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
        ...(day.stops || []).map((stop, index) => `${index + 1}. ${stop.name}${stop.duration ? ` · ${stop.duration}` : ''} · ${formatCurrencyAmount(stop.cost ?? stop.estimatedCost, currencyContext)}`),
        day.localSecret ? `Segredo do Andor: ${day.localSecret}` : null,
      ].filter(Boolean);
      await navigator.clipboard.writeText(lines.join('\n'));
      showToast('Plano do dia copiado.', 'success');
    } catch (err) {
      showToast('Não foi possível copiar o dia.', 'error');
    }
  };

  const handleExportPDF = async (modeOverride) => {
    if (typeof window === 'undefined' || !itinerary) return;
    const requestedMode = modeOverride === 'internal' || modeOverride === 'client' ? modeOverride : exportMode;
    showToast(`A gerar PDF ${requestedMode === 'internal' ? 'interno' : 'cliente'}...`, 'info');
    
    let html2pdf = null;
    try {
      html2pdf = (await import('html2pdf.js')).default;
    } catch (e) {
      showToast('A usar exportacao PDF simples.', 'info');
    }

    const currencyContext = getCurrencyContext(itinerary);
    const pdfMoney = (value) => formatCurrencyAmount(value, currencyContext);
    const pdfDestination = typeof itinerary.destination === 'string'
      ? { name: itinerary.destination }
      : (itinerary.destination || {});
    const pdfDestinationName = pdfDestination.city || pdfDestination.name || itinerary.destination || 'O teu destino';
    const pdfCoverImage = getDestinationCover(pdfDestination);
    const preparedAt = new Date();
    const preparedAtLabel = preparedAt.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
    const documentReference = `AND-${String(id || preparedAt.getTime()).replace(/[^a-z0-9]/gi, '').slice(-8).toUpperCase()}`;
    const safeText = (value) => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    const dossierExport = buildDossierExportContext(itinerary, requestedMode);
    const pdfExport = dossierExport.exportMetadata || {};
    const includeInternal = dossierExport.includeInternal;
    const pdfFlights = Array.isArray(itinerary.flightOptions) ? itinerary.flightOptions : [];
    const pdfHotels = Array.isArray(itinerary.accommodation?.hotels)
      ? itinerary.accommodation.hotels
      : [itinerary.accommodation?.recommended, itinerary.accommodation?.budget, itinerary.accommodation?.luxury].filter(Boolean);
    const pdfChecklist = dossierExport.bookingChecklist || [];
    const pdfDocs = dossierExport.documents || [];
    const pdfBackupPlans = dossierExport.backupPlans || [];
    const pdfFinalChecklist = dossierExport.finalChecklist || [];
    const pdfTransferOptions = itinerary.airportTransfer?.options || [];
    const pdfBudget = itinerary.trip?.budgetBreakdown || {};
    const pdfBudgetRows = [
      ['Voos', pdfBudget.flights?.min, pdfBudget.flights?.max],
      ['Alojamento', pdfBudget.accommodation?.total],
      ['Refeições', pdfBudget.food?.total],
      ['Atividades', pdfBudget.activities?.total],
      ['Transportes', pdfBudget.transport?.total],
    ].filter(([, min, max]) => Number(min) > 0 || Number(max) > 0);
    const pdfBudgetHtml = pdfBudgetRows.length
      ? `<div style="margin:40px 0; padding:24px; background:#f8f8f8; border-radius:8px; page-break-inside:avoid;">
          <h2 style="font-size:20px; color:#1A2235; margin:0 0 16px;">Estimativa de orçamento</h2>
          <table style="width:100%; border-collapse:collapse; font-size:14px;">
            ${pdfBudgetRows.map(([label, min, max]) => `<tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;">${label}</td><td style="text-align:right; padding:8px 0;">~${max ? formatCurrencyRange(min, max, currencyContext) : pdfMoney(min)}</td></tr>`).join('')}
          </table>
          <p style="font-size:11px; color:#777;">Valores de planeamento, não tarifas ou disponibilidade de fornecedor.</p>
        </div>`
      : '';
    const renderPdfList = (items, renderItem) => (
      items && items.length
        ? `<ul style="margin:8px 0 0; padding-left:18px;">${items.map(renderItem).join('')}</ul>`
        : '<p style="font-size:13px; color:#777; margin:8px 0 0;">Sem dados suficientes. Confirmar antes de reservar.</p>'
    );
    const renderPdfLink = (url, label) => (
      /^https?:\/\//i.test(String(url || ''))
        ? `<a href="${safeText(url)}" style="color:#1A2235; text-decoration:underline;">${safeText(label)}</a>`
        : ''
    );
    const brandLogo = `
      <svg viewBox="0 0 40 40" width="50" height="50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Andor Travels">
        <path d="M20 3L7 33H13L20 17L27 33H33L20 3Z" fill="#1E6FD9"/>
        <path d="M12 27H28" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
        <path d="M20 3V17" stroke="#D4A853" stroke-width="2" stroke-linecap="round"/>
        <path d="M20 5L28 16L20 14Z" fill="#D4A853" opacity="0.35"/>
        <path d="M9 35C9 35 14 32 20 32C26 32 31 35 31 35" stroke="#1E6FD9" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
      </svg>`;
    
    const content = document.createElement('div');
    content.innerHTML = `
      <div style="font-family:'Georgia',serif; padding:40px; max-width:800px; color:#1A2235; background-color:#ffffff;">
        
        <!-- CAPA INSTITUCIONAL -->
        <div style="position:relative; min-height:1260px; margin:-40px -40px 42px; overflow:hidden; background:#20242A; color:#fff; page-break-after:always;">
          <img data-andor-cover="true" crossorigin="anonymous" src="${safeText(pdfCoverImage)}" alt="${safeText(pdfDestinationName)}" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" />
          <div style="position:absolute; inset:0; background:linear-gradient(180deg,rgba(22,26,31,.48) 0%,rgba(22,26,31,.22) 38%,rgba(22,26,31,.92) 100%);"></div>
          <div style="position:relative; z-index:1; min-height:1260px; padding:54px; display:flex; flex-direction:column; box-sizing:border-box;">
            <div style="display:flex; align-items:center; justify-content:space-between; padding-bottom:24px; border-bottom:1px solid rgba(255,255,255,.42);">
              <div style="display:flex; align-items:center; gap:14px;">
                <div style="width:62px; height:62px; display:flex; align-items:center; justify-content:center; background:#fff; border-radius:6px;">${brandLogo}</div>
                <div>
                  <div style="font:700 20px Arial,sans-serif; letter-spacing:.08em;">ANDOR</div>
                  <div style="font:600 10px Arial,sans-serif; letter-spacing:.22em; margin-top:3px;">TRAVELS</div>
                </div>
              </div>
              <div style="padding:9px 12px; border:1px solid ${includeInternal ? '#E77762' : 'rgba(255,255,255,.55)'}; border-radius:5px; background:rgba(20,24,29,.4); font:700 10px Arial,sans-serif; text-transform:uppercase; letter-spacing:.08em;">
                ${includeInternal ? 'Uso interno' : 'Versao cliente'}
              </div>
            </div>
            <div style="margin-top:auto;">
              <div style="font:700 12px Arial,sans-serif; color:#E3BD68; text-transform:uppercase; letter-spacing:.16em;">Itinerario personalizado</div>
              <h1 style="max-width:680px; margin:14px 0 18px; color:#fff; font:700 54px/1.05 Georgia,serif; letter-spacing:0;">${safeText(pdfDestinationName)}</h1>
               <p style="max-width:620px; margin:0 0 32px; color:rgba(255,255,255,.9); font:400 16px/1.55 Arial,sans-serif;">${safeText(itinerary.destination?.andorVerdict || itinerary.tripOverview || 'Uma proposta de planeamento criada no Andor e sujeita a confirmação.')}</p>
              <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:18px; padding:22px 0; border-top:1px solid rgba(255,255,255,.35); border-bottom:1px solid rgba(255,255,255,.35); font-family:Arial,sans-serif;">
                <div><span style="display:block; color:rgba(255,255,255,.65); font-size:9px; text-transform:uppercase;">Duracao</span><strong style="display:block; margin-top:6px; font-size:14px;">${safeText(itinerary.trip?.totalDays || itinerary.days?.length || '-')} dias</strong></div>
                <div><span style="display:block; color:rgba(255,255,255,.65); font-size:9px; text-transform:uppercase;">Perfil</span><strong style="display:block; margin-top:6px; font-size:14px;">${safeText(itinerary.trip?.groupType || itinerary.trip?.travelStyle || 'Viagem')}</strong></div>
                <div><span style="display:block; color:rgba(255,255,255,.65); font-size:9px; text-transform:uppercase;">Preparado para</span><strong style="display:block; margin-top:6px; font-size:14px;">${safeText(pdfExport.companyName || pdfExport.clientName || 'Viajante Andor')}</strong></div>
              </div>
              <div style="display:flex; justify-content:space-between; margin-top:22px; color:rgba(255,255,255,.72); font:600 10px Arial,sans-serif;">
                <span>${safeText(documentReference)} | ${safeText(preparedAtLabel)}</span>
                <span>andortravels.com</span>
              </div>
            </div>
          </div>
        </div>

        <div style="margin:0 0 30px; padding:0 0 22px; border-bottom:2px solid #D4A853; page-break-inside:avoid;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:24px;">
            <div style="display:flex; align-items:center; gap:12px;">${brandLogo}<div><strong style="display:block; font:700 14px Arial,sans-serif;">ANDOR TRAVELS</strong><span style="display:block; color:#666; font:400 10px Arial,sans-serif; margin-top:3px;">Planeamento e curadoria digital de viagens</span></div></div>
            <div style="text-align:right; color:#666; font:400 10px/1.5 Arial,sans-serif;">Documento preparado digitalmente<br/>${safeText(documentReference)} | ${safeText(preparedAtLabel)}</div>
          </div>
        </div>
        
        <!-- FICHA DO DOCUMENTO -->
        <div style="margin:28px 0; padding:20px; background:#F7F3E9; border:1px solid #E7D9B5; border-radius:7px; page-break-inside:avoid; font-family:Arial,sans-serif;">
          <div style="display:flex; justify-content:space-between; gap:24px; align-items:flex-start;">
            <div>
              <p style="font-size:10px; margin:0 0 6px; color:#8A6A25; text-transform:uppercase; letter-spacing:.1em;">Ficha do documento</p>
              <h2 style="font:700 19px Georgia,serif; margin:0;">${includeInternal ? 'Dossier operacional interno' : 'Dossier de viagem'}</h2>
            </div>
            <strong style="font-size:11px; color:${includeInternal ? '#B84F3D' : '#1E6FD9'};">${safeText(documentReference)}</strong>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px 28px; margin-top:18px; font-size:12px; line-height:1.5;">
            <p style="margin:0;"><strong>Aplicação:</strong> Andor</p>
            <p style="margin:0;"><strong>Natureza:</strong> Proposta informativa de planeamento</p>
            <p style="margin:0;"><strong>Servico:</strong> Organização digital de informação de viagem</p>
            <p style="margin:0;"><strong>Estado:</strong> Pré-lançamento</p>
            <p style="margin:0;"><strong>Destinatario:</strong> ${safeText(pdfExport.clientName || 'Viajante Andor')}</p>
            <p style="margin:0;"><strong>Empresa:</strong> ${safeText(pdfExport.companyName || 'Nao aplicavel')}</p>
            <p style="margin:0;"><strong>Preparado por:</strong> ${safeText(pdfExport.preparedBy || 'Utilizador Andor')}</p>
            <p style="margin:0;"><strong>Reservas:</strong> Não processadas pelo Andor</p>
          </div>
          ${pdfExport.clientFacingNotes ? `<p style="font-size:12px; line-height:1.55; margin:16px 0 0; padding-top:14px; border-top:1px solid #E7D9B5;">${safeText(pdfExport.clientFacingNotes)}</p>` : ''}
          ${includeInternal && pdfExport.internalNotes ? `<p style="font-size:12px; line-height:1.55; margin:14px 0 0; padding:12px; background:#fff; border-left:3px solid #E77762;"><strong>Nota interna:</strong> ${safeText(pdfExport.internalNotes)}</p>` : ''}
        </div>

        <div style="margin:28px 0; padding:20px; background:#f4f7fb; border:1px solid #dde6f2; border-radius:8px; page-break-inside:avoid;">
          <h2 style="font-size:20px; color:#1A2235; margin:0 0 12px;">Resumo executivo</h2>
          <p style="font-size:13px; line-height:1.55; color:#444; margin:0;">${safeText(dest.andorVerdict || itinerary.tripOverview || currentDay.moodDescription || `Plano pratico para ${pdfDestination.city || pdfDestination.name || 'esta viagem'}, com logistica, custos e reservas separadas.`)}</p>
          ${itinerary.metadata?.assumptions?.length ? `<p style="font-size:12px; color:#666; margin:10px 0 0;"><strong>Assunções:</strong> ${safeText(itinerary.metadata.assumptions.slice(0, 2).join(' '))}</p>` : ''}
        </div>

        ${pdfBudgetHtml}
        
        <div style="margin:40px 0; padding:24px; background:#fffdf6; border:1px solid #efe3bd; border-radius:8px; page-break-inside:avoid;">
          <h2 style="font-size:20px; color:#1A2235; margin:0 0 16px;">Plano Booking-Ready</h2>
          <p style="font-size:13px; color:#555; margin:0 0 14px;">Nada esta reservado automaticamente. Usa estes links e campos para confirmar manualmente.</p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div>
              <h3 style="font-size:14px; margin:0 0 6px;">Voos</h3>
              ${renderPdfList(pdfFlights.slice(0, 3), (flight) => `
                <li style="font-size:12px; margin-bottom:6px;">
                  <strong>${safeText(flight.operator || flight.airline || 'Pesquisa de voos')}</strong> - ${safeText(flight.timing || flight.route || '')} ${safeText(flight.estimatedPrice || '')}
                  ${renderPdfLink(flight.bookingUrl || flight.skyscannerUrl, 'abrir')}
                </li>
              `)}
            </div>
            <div>
              <h3 style="font-size:14px; margin:0 0 6px;">Alojamento</h3>
              ${renderPdfList(pdfHotels.slice(0, 3), (hotel) => `
                <li style="font-size:12px; margin-bottom:6px;">
                  <strong>${safeText(hotel.name || hotel.hotelName || 'Hotel')}</strong> - ${safeText(hotel.area || hotel.type || '')} ${hotel.pricePerNight ? `~${safeText(hotel.currency || '')} ${safeText(hotel.pricePerNight)}/noite` : ''}
                  ${renderPdfLink(hotel.bookingUrl, 'abrir')}
                </li>
              `)}
            </div>
          </div>
          <div style="margin-top:18px;">
            <h3 style="font-size:14px; margin:0 0 6px;">Transfer e transportes</h3>
            ${renderPdfList(pdfTransferOptions.slice(0, 3), (option) => `
              <li style="font-size:12px; margin-bottom:6px;">
                <strong>${safeText(option.name || option.tier || 'Transfer')}</strong> - ${safeText(option.estimatedDuration || option.duration || '')} ${option.estimatedCost ? `~${pdfMoney(option.estimatedCost)}` : ''}
              </li>
            `)}
            ${itinerary.rentalCar?.strategy ? `<p style="font-size:12px; color:#555; margin:8px 0 0;"><strong>Rent-a-car:</strong> ${safeText(itinerary.rentalCar.strategy)}</p>` : ''}
          </div>
        </div>

        <div style="margin:40px 0; padding:24px; background:#f8f8f8; border-radius:8px; page-break-inside:avoid;">
          <h2 style="font-size:20px; color:#1A2235; margin:0 0 16px;">Checklist de Reserva</h2>
          <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <thead>
              <tr style="text-align:left; color:#777; border-bottom:1px solid #ddd;">
                <th style="padding:7px 4px;">Tarefa</th>
                <th style="padding:7px 4px;">Prioridade</th>
                <th style="padding:7px 4px;">Estado</th>
                <th style="padding:7px 4px;">Referencia</th>
              </tr>
            </thead>
            <tbody>
              ${pdfChecklist.slice(0, 10).map((item) => `
                <tr style="border-bottom:1px solid #eee;">
                  <td style="padding:8px 4px;">${safeText(item.task)}</td>
                  <td style="padding:8px 4px;">${safeText(priorityLabel(item.priority))}</td>
                  <td style="padding:8px 4px;">${safeText(bookingStatusLabel(item.status))}</td>
                  <td style="padding:8px 4px;">${safeText(item.reference || '')}</td>
                </tr>
              `).join('')}
            </tbody>
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
                    <strong>${safeText(getStopIcon(a))} ${safeText(a.name)}</strong>
                    <br/><span style="font-size:12px; color:#888;">${[a.address, a.duration, a.cost === 0 ? 'Grátis' : a.cost > 0 ? pdfMoney(a.cost) : 'Custo por confirmar'].filter(Boolean).join(' · ')}</span>
                    ${a.transportFromPrevious?.duration ? `<br/><span style="font-size:11px; color:#555;"><strong>Transporte:</strong> ${safeText(a.transportFromPrevious.mode || '')} ${safeText(a.transportFromPrevious.duration || '')} ${safeText(a.transportFromPrevious.directions || '')}</span>` : ''}
                    ${a.bookingRequired ? `<br/><span style="font-size:11px; color:#8a5d00;"><strong>Reserva:</strong> confirmar disponibilidade antes de enviar.</span>` : ''}
                    ${a.backupOption ? `<br/><span style="font-size:11px; color:#555;"><strong>Backup:</strong> ${safeText(a.backupOption)}</span>` : ''}
                    ${a.practicalNote ? `<br/><span style="font-size:11px; color:#555;"><strong>Nota pratica:</strong> ${safeText(a.practicalNote)}</span>` : ''}
                    ${a.insiderTip ? `<br/><span style="font-size:11px; color:#D4A843; font-style:italic;">Nota local: ${safeText(a.insiderTip)}</span>` : ''}
                  </div>
                `).join('')}
              ` : ''}

              ${afternoonActivities.length ? `
                <h3 style="font-size:16px; color:#666; margin:16px 0 8px;">Tarde</h3>
                ${afternoonActivities.map(a => `
                  <div style="padding:12px; margin:8px 0; background:#fafafa; border-radius:6px; border-left:3px solid #D4A843;">
                    <strong>${safeText(getStopIcon(a))} ${safeText(a.name)}</strong>
                    <br/><span style="font-size:12px; color:#888;">${[a.address, a.duration, a.cost === 0 ? 'Grátis' : a.cost > 0 ? pdfMoney(a.cost) : 'Custo por confirmar'].filter(Boolean).join(' · ')}</span>
                    ${a.transportFromPrevious?.duration ? `<br/><span style="font-size:11px; color:#555;"><strong>Transporte:</strong> ${safeText(a.transportFromPrevious.mode || '')} ${safeText(a.transportFromPrevious.duration || '')} ${safeText(a.transportFromPrevious.directions || '')}</span>` : ''}
                    ${a.bookingRequired ? `<br/><span style="font-size:11px; color:#8a5d00;"><strong>Reserva:</strong> confirmar disponibilidade antes de enviar.</span>` : ''}
                    ${a.backupOption ? `<br/><span style="font-size:11px; color:#555;"><strong>Backup:</strong> ${safeText(a.backupOption)}</span>` : ''}
                    ${a.practicalNote ? `<br/><span style="font-size:11px; color:#555;"><strong>Nota pratica:</strong> ${safeText(a.practicalNote)}</span>` : ''}
                    ${a.insiderTip ? `<br/><span style="font-size:11px; color:#D4A843; font-style:italic;">Nota local: ${safeText(a.insiderTip)}</span>` : ''}
                  </div>
                `).join('')}
              ` : ''}

              ${eveningActivities.length ? `
                <h3 style="font-size:16px; color:#666; margin:16px 0 8px;">Noite</h3>
                ${eveningActivities.map(a => `
                  <div style="padding:12px; margin:8px 0; background:#fafafa; border-radius:6px; border-left:3px solid #D4A843;">
                    <strong>${safeText(getStopIcon(a))} ${safeText(a.name)}</strong>
                    <br/><span style="font-size:12px; color:#888;">${[a.address, a.duration, a.cost === 0 ? 'Grátis' : a.cost > 0 ? pdfMoney(a.cost) : 'Custo por confirmar'].filter(Boolean).join(' · ')}</span>
                    ${a.transportFromPrevious?.duration ? `<br/><span style="font-size:11px; color:#555;"><strong>Transporte:</strong> ${safeText(a.transportFromPrevious.mode || '')} ${safeText(a.transportFromPrevious.duration || '')} ${safeText(a.transportFromPrevious.directions || '')}</span>` : ''}
                    ${a.bookingRequired ? `<br/><span style="font-size:11px; color:#8a5d00;"><strong>Reserva:</strong> confirmar disponibilidade antes de enviar.</span>` : ''}
                    ${a.backupOption ? `<br/><span style="font-size:11px; color:#555;"><strong>Backup:</strong> ${safeText(a.backupOption)}</span>` : ''}
                    ${a.practicalNote ? `<br/><span style="font-size:11px; color:#555;"><strong>Nota pratica:</strong> ${safeText(a.practicalNote)}</span>` : ''}
                    ${a.insiderTip ? `<br/><span style="font-size:11px; color:#D4A843; font-style:italic;">Nota local: ${safeText(a.insiderTip)}</span>` : ''}
                  </div>
                `).join('')}
              ` : ''}
              
              ${day.localSecret ? `
                <div style="background:#fffbf0; padding:12px; border-radius:6px; margin-top:12px; border-left:3px solid #D4A843;">
                  <strong style="font-size:12px; color:#8A6A25;">Nota local Andor</strong>
                  <p style="font-size:12px; color:#555; margin:4px 0;">${safeText(day.localSecret)}</p>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
        
        <!-- INFO PRÁTICA -->
        <div style="margin:40px 0; padding:24px; background:#f6fbff; border-radius:8px; page-break-inside:avoid;">
          <h2 style="font-size:20px; color:#1A2235; margin:0 0 16px;">Documentos e Planos Alternativos</h2>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div>
              <h3 style="font-size:14px; margin:0 0 6px;">Documentos</h3>
              ${renderPdfList(pdfDocs.slice(0, 12), (item) => `
                <li style="font-size:12px; margin-bottom:6px;">
                  <strong>${safeText(item.title || item.label || item.task)}</strong> (${safeText(documentImportanceLabel(item.importance || (item.required ? 'required' : 'recommended')))}; ${safeText(documentStatusLabel(item.status))})
                  <br/><span style="color:#666;">${safeText(item.description || item.notes || '')}</span>
                  <br/><span style="color:#777;">Quem: ${safeText(item.whoNeedsIt || 'Travelers')} - Timing: ${safeText(item.timing || 'Before departure')}</span>
                </li>
              `)}
            </div>
            <div>
              <h3 style="font-size:14px; margin:0 0 6px;">Alternativas</h3>
              ${renderPdfList(pdfBackupPlans.slice(0, 12), (item) => `
                <li style="font-size:12px; margin-bottom:6px;">
                  <strong>${safeText(backupTriggerLabel(item))}</strong> - ${safeText(item.replacementPlan || item.notes)}
                  <br/><span style="color:#777;">Custo: ${safeText(item.costImpact || 'Confirmar')} - Tempo: ${safeText(item.timeImpact || 'Confirmar')}</span>
                  ${item.moveOrCancel ? `<br/><span style="color:#777;">Mover/cancelar: ${safeText(item.moveOrCancel)}</span>` : ''}
                  ${item.clientFacing ? `<br/><span style="color:#555;">Cliente: ${safeText(item.clientFacing)}</span>` : ''}
                </li>
              `)}
            </div>
          </div>
        </div>

        <div style="margin:40px 0; padding:24px; background:#fffdf6; border:1px solid #efe3bd; border-radius:8px; page-break-inside:avoid;">
          <h2 style="font-size:20px; color:#1A2235; margin:0 0 16px;">Checklist final antes de enviar</h2>
          ${renderPdfList(pdfFinalChecklist.slice(0, 14), (item) => `
            <li style="font-size:12px; margin-bottom:6px;">
              <strong>${safeText(item.label)}</strong> - ${safeText(planningStatusLabel(item.status))} ${item.reason ? `(${safeText(priorityLabel(item.reason))})` : ''}
            </li>
          `)}
        </div>

        <div style="margin:40px 0; padding:24px; background:#f0f8ff; border-radius:8px; page-break-before:always;">
          <h2 style="font-size:20px; color:#1A2235; margin:0 0 16px;">Informacao pratica</h2>
          <p style="font-size:14px; margin:8px 0;"><strong>Visto:</strong> ${safeText(itinerary.destination?.visaInfo || 'Confirmar os requisitos oficiais antes da partida')}</p>
          <p style="font-size:14px; margin:8px 0;"><strong>Saude:</strong> ${safeText(itinerary.destination?.healthInfo || 'Confirmar recomendacoes oficiais antes da partida')}</p>
          <p style="font-size:14px; margin:8px 0;"><strong>Seguranca:</strong> ${safeText(itinerary.destination?.safetyLevel || 'Consultar os avisos de viagem em vigor')}</p>
          <p style="font-size:14px; margin:8px 0;"><strong>Gorjetas:</strong> ${safeText(itinerary.destination?.tippingCulture || 'Confirmar a pratica local')}</p>
          <p style="font-size:14px; margin:8px 0;"><strong>Tomadas:</strong> ${safeText(itinerary.destination?.electricityPlug || 'Confirmar o adaptador necessario')}</p>
          ${itinerary.destination?.simCard ? `<p style="font-size:14px; margin:8px 0;"><strong>Cartao SIM:</strong> ${safeText(itinerary.destination.simCard)}</p>` : ''}
        </div>
        
        <div style="margin-top:40px; padding:20px 0; color:#666; font:400 10px/1.55 Arial,sans-serif; border-top:2px solid #D4A853; page-break-inside:avoid;">
          <strong style="display:block; color:#20242A; margin-bottom:6px;">Nota de responsabilidade</strong>
          Este documento foi preparado na aplicação Andor e tem natureza exclusivamente informativa. Não constitui uma reserva, venda, aconselhamento legal, médico ou de segurança. Horários, preços, disponibilidade e requisitos oficiais devem ser confirmados diretamente nos fornecedores e autoridades competentes antes de qualquer pagamento ou partida. A versão cliente exclui notas operacionais de uso interno.
        </div>
      </div>
    `;

    content.querySelectorAll('script, style, iframe, object, embed').forEach((node) => node.remove());
    content.querySelectorAll('img:not([data-andor-cover])').forEach((node) => node.remove());
    content.querySelectorAll('*').forEach((node) => {
      Array.from(node.attributes).forEach((attribute) => {
        if (/^on/i.test(attribute.name) || attribute.name === 'srcdoc') {
          node.removeAttribute(attribute.name);
        }
      });
    });
    content.style.width = '880px';
    const imageReady = Promise.allSettled(Array.from(content.querySelectorAll('img')).map((image) => {
      if (image.complete) return image.decode?.().catch(() => {}) || Promise.resolve();
      return new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      });
    }));
    await Promise.race([
      imageReady,
      new Promise((resolve) => window.setTimeout(resolve, 5000)),
    ]);
    
    const pdfDate = new Date(trip.startDate || Date.now());
    const pdfMonthYear = pdfDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).replace(/\s/g, '');
    const pdfCity = (itinerary.destination?.city || itinerary.destination?.name || 'Itinerario').replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '');
    const options = {
      margin: [10, 10, 18, 10],
      filename: `Andor_${pdfCity}_${itinerary.trip?.totalDays || itinerary.days?.length}dias_${pdfMonthYear}_${requestedMode}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: false, backgroundColor: '#ffffff', logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const applyPdfBranding = (pdf) => {
      pdf.setProperties({
        title: options.filename,
        subject: `${includeInternal ? 'Dossier operacional interno' : 'Dossier de viagem'} - ${pdfDestinationName}`,
        author: 'Andor Travels',
        creator: 'Andor Travels',
        keywords: 'Andor Travels, itinerario, viagem',
      });
      const pages = pdf.internal.getNumberOfPages();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      for (let pageNumber = 2; pageNumber <= pages; pageNumber += 1) {
        pdf.setPage(pageNumber);
        pdf.setDrawColor(212, 168, 83);
        pdf.setLineWidth(0.35);
        pdf.line(10, pageHeight - 11, pageWidth - 10, pageHeight - 11);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(54, 59, 65);
        pdf.text('ANDOR TRAVELS | andortravels.com', 10, pageHeight - 6);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(105, 109, 114);
        pdf.text(`${documentReference} | ${pageNumber}/${pages}`, pageWidth - 10, pageHeight - 6, { align: 'right' });
      }
    };

    const exportPlainPdf = async () => {
      const jsPdfModule = await import('jspdf');
      const JsPDF = jsPdfModule.jsPDF || jsPdfModule.default?.jsPDF || jsPdfModule.default;
      if (!JsPDF) throw new Error('jspdf_unavailable');

      const doc = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const margin = 14;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const maxWidth = pageWidth - margin * 2;
      let y = 18;
      const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
      const ensureSpace = (height = 8) => {
        if (y + height <= pageHeight - 16) return;
        doc.addPage();
        y = 18;
      };
      const addText = (value, size = 10, style = 'normal', gap = 2) => {
        const text = clean(value);
        if (!text) return;
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line) => {
          ensureSpace(size * 0.45 + 3);
          doc.text(line, margin, y);
          y += size * 0.45 + 3;
        });
        y += gap;
      };
      const addSection = (title) => {
        ensureSpace(12);
        y += 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(clean(title), margin, y);
        y += 8;
      };
      const addBullets = (items, renderItem, limit = 8) => {
        items.slice(0, limit).forEach((item) => addText(`- ${renderItem(item)}`, 9, 'normal', 0.5));
      };

      doc.setFillColor(32, 36, 42);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      try {
        const response = await fetch(pdfCoverImage, { referrerPolicy: 'no-referrer' });
        if (response.ok) {
          const blob = await response.blob();
          const imageData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          doc.addImage(imageData, 'JPEG', 0, 0, pageWidth, 162);
        }
      } catch (imageError) {}
      doc.setFillColor(32, 36, 42);
      doc.rect(0, 136, pageWidth, pageHeight - 136, 'F');
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(14, 14, 25, 25, 2, 2, 'F');
      doc.setFont('times', 'bold');
      doc.setFontSize(23);
      doc.setTextColor(30, 111, 217);
      doc.text('A', 26.5, 32, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text('ANDOR', 45, 24);
      doc.setFontSize(7);
      doc.setTextColor(227, 189, 104);
      doc.text('TRAVELS', 45, 30);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.25);
      doc.line(14, 47, pageWidth - 14, 47);
      doc.setFontSize(8);
      doc.setTextColor(227, 189, 104);
      doc.text('ITINERARIO PERSONALIZADO', 14, 158);
      doc.setFont('times', 'bold');
      doc.setFontSize(27);
      doc.setTextColor(255, 255, 255);
      const coverTitleLines = doc.splitTextToSize(clean(pdfDestinationName), pageWidth - 28);
      doc.text(coverTitleLines, 14, 174);
      const coverTitleBottom = 174 + coverTitleLines.length * 11;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(215, 218, 221);
      doc.text(`${itinerary.trip?.totalDays || itinerary.days?.length || '-'} dias | ${itinerary.trip?.groupType || itinerary.trip?.travelStyle || 'Viagem'}`, 14, coverTitleBottom + 8);
      doc.setDrawColor(212, 168, 83);
      doc.line(14, pageHeight - 38, pageWidth - 14, pageHeight - 38);
      doc.setFontSize(8);
      doc.setTextColor(215, 218, 221);
      doc.text(`Preparado para: ${pdfExport.companyName || pdfExport.clientName || 'Viajante Andor'}`, 14, pageHeight - 28);
      doc.text(`${documentReference} | ${preparedAtLabel}`, 14, pageHeight - 21);
      doc.text(includeInternal ? 'USO INTERNO' : 'VERSAO CLIENTE', pageWidth - 14, pageHeight - 21, { align: 'right' });

      doc.addPage();
      y = 18;

      addText(`${pdfDestination.city || pdfDestination.name || itinerary.destination || 'Itinerario'} - ${dossierExport.label}`, 17, 'bold', 4);
      addText(`${itinerary.trip?.totalDays || itinerary.days?.length || '-'} dias | ${itinerary.trip?.groupType || 'Viagem'} | ${itinerary.trip?.travelStyle || 'Exploracao'}`, 10);
      if (pdfExport.clientName || pdfExport.companyName || pdfExport.preparedBy) {
        addSection('Cliente');
        addText([pdfExport.clientName, pdfExport.companyName, pdfExport.preparedBy && `Preparado por ${pdfExport.preparedBy}`].filter(Boolean).join(' | '), 10);
      }
      if (pdfExport.clientFacingNotes) addText(`Notas cliente: ${pdfExport.clientFacingNotes}`, 9);
      if (includeInternal && pdfExport.internalNotes) addText(`Notas internas: ${pdfExport.internalNotes}`, 9);
      if (itinerary.destination?.andorVerdict || itinerary.tripOverview) {
        addSection('Resumo');
        addText(itinerary.destination?.andorVerdict || itinerary.tripOverview, 10);
      }

      addSection('Checklist de Reserva');
      addBullets(pdfChecklist, (item) => `${item.task || item.title || 'Tarefa'} | ${priorityLabel(item.priority)} | ${bookingStatusLabel(item.status)}${item.reference ? ` | Ref: ${item.reference}` : ''}`, 12);

      addSection('Documentos');
      addBullets(pdfDocs, (item) => `${item.title || item.label || item.task || 'Documento'} | ${documentImportanceLabel(item.importance || (item.required ? 'required' : 'recommended'))} | ${documentStatusLabel(item.status)} | ${item.whoNeedsIt || 'Viajantes'} | ${item.timing || 'Antes da partida'}`, 12);

      addSection('Voos');
      addBullets(pdfFlights, (flight) => `${flight.operator || flight.airline || 'Pesquisa de voos'} | ${flight.timing || flight.route || ''} | ${flight.estimatedPrice || flight.estimatedCost || 'Confirmar preco'}`, 4);

      addSection('Alojamento');
      addBullets(pdfHotels, (hotel) => `${hotel.name || hotel.hotelName || 'Hotel'} | ${hotel.area || hotel.type || ''} | ${hotel.pricePerNight ? `${hotel.currency || ''} ${hotel.pricePerNight}/noite` : 'Confirmar preco'}`, 4);

      addSection('Transfer e Transportes');
      addBullets(pdfTransferOptions, (option) => `${option.name || option.tier || 'Transfer'} | ${option.estimatedDuration || option.duration || ''} | ${option.estimatedCost ? pdfMoney(option.estimatedCost) : option.cost || 'Confirmar preco'}`, 4);
      if (itinerary.rentalCar?.strategy) addText(`Rent-a-car: ${itinerary.rentalCar.strategy}`, 9);

      addSection('Plano Diario');
      (itinerary.days || []).forEach((day) => {
        addText(`Dia ${day.dayNumber}: ${day.title}`, 11, 'bold', 1);
        addBullets(day.stops || [], (stop) => `${stop.time || ''} ${stop.name || 'Paragem'} | ${stop.duration || ''} | ${stop.cost > 0 ? pdfMoney(stop.cost) : 'Gratis'}${stop.transportFromPrevious?.duration ? ` | Transporte: ${stop.transportFromPrevious.duration}` : ''}${stop.backupOption ? ` | Backup: ${stop.backupOption}` : ''}${stop.practicalNote ? ` | Nota: ${stop.practicalNote}` : ''}`, 6);
      });

      addSection('Planos Alternativos');
      addBullets(pdfBackupPlans, (item) => `${backupTriggerLabel(item)}: ${item.replacementPlan || item.notes || ''} | Custo: ${item.costImpact || 'Confirmar'} | Tempo: ${item.timeImpact || 'Confirmar'}`, 12);

      addSection('Checklist final');
      addBullets(pdfFinalChecklist, (item) => `${item.label || 'Pendente'} | ${planningStatusLabel(item.status)} | ${priorityLabel(item.reason)}`, 14);

      applyPdfBranding(doc);
      doc.save(options.filename);
    };
    
    const cleanupPdfArtifacts = () => {
      if (content.parentNode) content.parentNode.removeChild(content);
      document.querySelectorAll('.html2pdf__container').forEach((node) => node.remove());
    };

    try {
      if (!html2pdf) {
        await exportPlainPdf();
        showToast('PDF exportado com sucesso.', 'success');
        return;
      }

      // Attach to the DOM tree so html2canvas can measure size, compute styles, and load fonts
      content.style.position = 'absolute';
      content.style.left = '0';
      content.style.top = '0';
      content.style.zIndex = '-9999';
      content.style.background = '#ffffff';
      document.body.appendChild(content);

      const pdfJob = html2pdf()
        .set(options)
        .from(content)
        .toPdf()
        .get('pdf')
        .then((pdf) => {
          if (pdf.internal.getNumberOfPages() < 2) throw new Error('pdf_render_empty');
          applyPdfBranding(pdf);
        })
        .save();
      await Promise.race([
        pdfJob,
        new Promise((_, reject) => {
          window.setTimeout(() => reject(new Error('pdf_export_timeout')), 25000);
        }),
      ]);
      showToast('PDF exportado com sucesso.', 'success');
    } catch (err) {
      try {
        await exportPlainPdf();
        showToast('PDF simples exportado com sucesso.', 'success');
      } catch (fallbackErr) {
        showToast(
          err?.message === 'pdf_export_timeout'
            ? 'Tempo esgotado ao gerar PDF. Tenta novamente com menos conteudo aberto.'
            : 'Erro ao exportar PDF.',
          'error'
        );
      }
    } finally {
      cleanupPdfArtifacts();
    }
  };

  const handleRegenerateDay = async () => {
    if (persistenceState === 'durable' && !['owner', 'editor'].includes(tripPermission)) {
      showToast('Esta viagem esta em modo de leitura.', 'info');
      return;
    }
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

  const updateActivity = (stop, patch) => {
    if (persistenceState === 'durable' && !['owner', 'editor'].includes(tripPermission)) return;
    const matches = (item) => (
      (stop.id && item?.id === stop.id) || (!stop.id && item?.name === stop.name)
    );
    const updateList = (items) => (
      Array.isArray(items) ? items.map((item) => matches(item) ? { ...item, ...patch } : item) : items
    );
    const nextDays = (itinerary.days || []).map((day, dayIndex) => {
      if (dayIndex !== activeDay) return day;
      const periods = day.periods && typeof day.periods === 'object'
        ? Object.fromEntries(Object.entries(day.periods).map(([periodKey, period]) => [
            periodKey,
            { ...period, activities: updateList(period?.activities) || [] },
          ]))
        : day.periods;
      return {
        ...day,
        stops: updateList(day.stops),
        activities: updateList(day.activities),
        periods,
      };
    });
    const nextItinerary = { ...itinerary, days: nextDays, updatedAt: new Date().toISOString() };
    setItinerary(nextItinerary);
    saveItinerarySnapshot(nextItinerary);
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
        cost: stop.cost !== undefined
          ? formatCurrencyAmount(stop.cost, getCurrencyContext(itinerary))
          : stop.estimatedCost !== undefined
            ? formatCurrencyAmount(stop.estimatedCost, getCurrencyContext(itinerary))
            : null,
        duration: stop.duration || null,
        city: dest.city || dest.name || (typeof itinerary?.destination === 'string' ? itinerary.destination : ''),
        itineraryId: id,
        destinationSlug: dest.slug || null,
        image: getActivityImageUrl(stop, dest.city || dest.name || ''),
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
          {validationError && <p>{validationError}</p>}
          <button className="btn btn-primary" onClick={() => router.push('/')}>Criar o meu próprio</button>
        </div>
      </>
    );
  }

  const dest = typeof itinerary.destination === 'string' 
    ? { name: itinerary.destination } 
    : (itinerary.destination || {});
  const trip = itinerary.trip || {};
  const canEditTrip = persistenceState === 'legacy' || ['owner', 'editor'].includes(tripPermission);
  const canManageShares = persistenceState === 'durable' && tripPermission === 'owner';
  const currencyContext = getCurrencyContext(itinerary);
  const formatMoney = (value) => formatCurrencyAmount(value, currencyContext);
  const destinationBadge = getDestinationBadge(dest);
  const currentDay = itinerary.days?.[activeDay] || {};
  
  // Budget estimate
  const budgetMin = trip.budgetBreakdown?.grandTotal?.min;
  const budgetMax = trip.budgetBreakdown?.grandTotal?.max;
  const budgetDisplay = budgetMin
    ? formatCurrencyRange(budgetMin, budgetMax, currencyContext)
    : itinerary.totalCost || null;
  const coverImage = getDestinationCover(dest);
  const exportMetadata = itinerary.exportMetadata || {};
  const bookingReady = itinerary.bookingReady || {};
  const bookingLinks = bookingReady.providerLinks || {};
  const documentsChecklistItems = Array.isArray(itinerary.documentsChecklist?.items)
    ? itinerary.documentsChecklist.items
    : Array.isArray(itinerary.documentsChecklist)
      ? itinerary.documentsChecklist
      : [];
  const bookingItems = Array.isArray(itinerary.bookingChecklist?.items)
    ? itinerary.bookingChecklist.items
    : Array.isArray(itinerary.bookingChecklist)
      ? itinerary.bookingChecklist
      : Array.isArray(trip.bookingChecklist?.items)
        ? trip.bookingChecklist.items
        : Array.isArray(trip.bookingChecklist)
          ? trip.bookingChecklist
          : [];
  const readyBookingItems = bookingItems.filter((item) => ['booked', 'confirmed'].includes(item.status)).length;
  const companyModeActive = Boolean(exportMetadata.whiteLabelReady || trip.travelerProfile?.companyMode);
  const backupPlanItems = Array.isArray(itinerary.backupPlans?.items)
    ? itinerary.backupPlans.items
    : Array.isArray(itinerary.backupPlans)
      ? itinerary.backupPlans
      : [];
  const bookingStorageKey = `andor_booking_checklist_${id}`;
  const documentsStorageKey = `andor_documents_checklist_${id}`;

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
        <header className={styles.premiumHeader} style={{ backgroundImage: `url(${coverImage})` }}>
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
                {trip.groupType && (
                  <span className={styles.headerMetaChip}>
                    <Users size={16} aria-hidden="true" /> {trip.groupType}
                  </span>
                )}
                {trip.travelStyle && (
                  <span className={styles.headerMetaChip}>
                    <Palette size={16} aria-hidden="true" /> {trip.travelStyle}
                  </span>
                )}
                {budgetDisplay && (
                  <span className={styles.headerMetaChipGold}>
                    <WalletCards size={16} aria-hidden="true" /> {budgetDisplay}
                  </span>
                )}
              </div>
            </div>
            <div className={styles.headerActionsDesktop}>
              <button className={styles.btnSecondary} disabled={!canEditTrip} onClick={() => setShowAdaptModal(true)} aria-label="Editar este dia" title={canEditTrip ? 'Editar este dia' : 'Modo de leitura'}><Edit3 size={16} aria-hidden="true" /> <span>Editar</span></button>
              <button className={styles.btnSecondary} disabled={!canManageShares} onClick={handleShare} aria-label="Partilhar itinerário" title={canManageShares ? 'Partilhar itinerário' : 'Apenas o proprietario pode partilhar'}><Share2 size={16} aria-hidden="true" /> <span>Partilhar</span></button>
              <button className={styles.btnSecondary} onClick={() => handleExportPDF(exportMode)} aria-label="Exportar PDF" title="Exportar PDF"><FileText size={16} aria-hidden="true" /> <span>PDF</span></button>
              <button className={styles.btnSecondary} onClick={() => setShowVersionsModal(true)} aria-label="Ver versões" title="Ver versões"><History size={16} aria-hidden="true" /> <span>Versões</span></button>
              <button className={styles.btnSecondary} onClick={handleGeneratePackingList} aria-label="Gerar lista de bagagem" title="Gerar lista de bagagem"><Package size={16} aria-hidden="true" /> <span>Bagagem</span></button>
              <button className={styles.btnSecondary} onClick={copyCurrentDayPlan} aria-label="Copiar plano do dia" title="Copiar plano do dia"><Copy size={16} aria-hidden="true" /> <span>Copiar</span></button>
              <button className={styles.btnPrimary} onClick={openAIChat} aria-label="Pedir ajuda ao Andor" title="Pedir ajuda ao Andor"><MessageCircle size={16} aria-hidden="true" /> <span>Andor</span></button>
            </div>
          </div>
        </header>

        <section className={`${styles.persistenceBanner} ${saveStatus === 'conflict' || saveStatus === 'error' ? styles.persistenceBannerError : ''}`} aria-live="polite">
          <strong>
            {persistenceState === 'durable'
              ? `Guardado no servidor · ${tripPermission || 'sem papel'} · v${tripVersion || '–'}`
              : 'Rascunho local · ainda nao importado'}
          </strong>
          <span>
            {saveStatus === 'saving' && 'A guardar alteracoes...'}
            {saveStatus === 'saved' && 'Alteracoes sincronizadas.'}
            {saveStatus === 'local' && 'As alteracoes existem apenas neste dispositivo.'}
            {saveStatus === 'forbidden' && 'Esta viagem esta em modo de leitura.'}
            {saveStatus === 'error' && 'Falha ao guardar. Os dados do servidor nao foram confirmados.'}
            {saveStatus === 'conflict' && 'Conflito: existe uma versao mais recente no servidor.'}
          </span>
          {saveStatus === 'conflict' && (
            <button type="button" onClick={() => window.location.reload()}>Recarregar versao atual</button>
          )}
        </section>

        <section className={styles.agencyBrief} aria-label="Resumo profissional do itinerario">
          <div className={styles.agencyBriefHeader}>
            <div>
              <span className={styles.agencyEyebrow}>{companyModeActive ? 'Dossier profissional' : 'Viagem pronta para organizar'}</span>
              <h2>{companyModeActive ? 'Rever, reservar e entregar ao cliente' : 'Do roteiro às reservas, sem perder o fio'}</h2>
            </div>
            <div className={styles.agencyHeaderControls}>
              <div className={styles.exportModeSwitch} role="group" aria-label="Modo de exportacao">
                <button
                  type="button"
                  className={exportMode === 'client' ? styles.exportModeButtonActive : styles.exportModeButton}
                  onClick={() => setExportMode('client')}
                >
                  Cliente
                </button>
                {companyModeActive && (
                  <button
                    type="button"
                    className={exportMode === 'internal' ? styles.exportModeButtonActive : styles.exportModeButton}
                    onClick={() => setExportMode('internal')}
                  >
                    Interno
                  </button>
                )}
              </div>
              <div className={styles.agencyStatus}>
                {readyBookingItems}/{bookingItems.length || 0} confirmados
              </div>
            </div>
          </div>
          <div className={styles.agencyBriefGrid}>
            <div className={styles.agencyBriefPanel}>
              <h3>Resumo inteligente</h3>
              <p>{dest.andorVerdict || itinerary.tripOverview || currentDay.moodDescription || `Proposta de organização para ${dest.city || dest.name || 'esta viagem'}, sujeita a confirmação.`}</p>
              {itinerary.metadata?.generationSource === 'fallback' && <span className={styles.sourceBadge}>Versão de demonstração — confirmar todos os detalhes</span>}
              {itinerary.metadata?.generationSource && itinerary.metadata.generationSource !== 'fallback' && (
                <span className={styles.sourceBadge}>Proposta gerada por IA — preços, horários e disponibilidade por confirmar</span>
              )}
              {bookingReady.disclaimer && <p className={styles.agencyFinePrint}>O Andor prepara decisões e links, mas não compra nem confirma reservas automaticamente.</p>}
            </div>
            <div className={styles.agencyBriefPanel}>
              <h3>Pesquisa rápida</h3>
              <div className={styles.agencyLinkGrid}>
                {bookingLinks.flights?.google && <a href={bookingLinks.flights.google} target="_blank" rel="noopener noreferrer">Voos</a>}
                {bookingLinks.hotels?.booking && <a href={bookingLinks.hotels.booking} target="_blank" rel="noopener noreferrer">Hoteis</a>}
                {bookingLinks.rentalCars?.search && <a href={bookingLinks.rentalCars.search} target="_blank" rel="noopener noreferrer">Rent-a-car</a>}
                {bookingLinks.places?.search && <a href={bookingLinks.places.search} target="_blank" rel="noopener noreferrer">Reservas</a>}
              </div>
              <div className={styles.providerLine}>
                Links prontos · preços e disponibilidade por confirmar
              </div>
            </div>
            <div className={styles.agencyBriefPanel}>
              <h3>Documentos</h3>
              <ul className={styles.agencyMiniList}>
                {documentsChecklistItems.slice(0, 4).map((item, index) => (
                  <li key={item.id || index}>{item.title || item.label || item.task}</li>
                ))}
              </ul>
            </div>
            <div className={styles.agencyBriefPanel}>
              <h3>Exportação</h3>
              <p>{exportMode === 'internal' ? 'Inclui notas internas e revisão operacional.' : 'Oculta notas internas e mostra apenas conteúdo de cliente.'}</p>
              <div className={styles.exportActionRow}>
                <button type="button" onClick={() => handleExportPDF('client')}>PDF cliente</button>
                {companyModeActive && <button type="button" onClick={() => handleExportPDF('internal')}>PDF interno</button>}
              </div>
              <p className={styles.agencyFinePrint}>{documentsChecklistItems.length} documentos - {backupPlanItems.length} backups</p>
            </div>
            {companyModeActive && (
              <div className={styles.agencyBriefPanel}>
                <h3>Cliente</h3>
                <p>{exportMetadata.clientName || trip.travelerProfile?.clientName || 'Cliente por definir'}</p>
                {exportMetadata.companyName && <p className={styles.agencyFinePrint}>{exportMetadata.companyName}</p>}
                {exportMetadata.preparedBy && <p className={styles.agencyFinePrint}>Preparado por {exportMetadata.preparedBy}</p>}
              </div>
            )}
          </div>
        </section>

        <nav className={styles.itineraryNav} aria-label="Secções do itinerário">
          <a href="#day-plan">Dias</a>
          <a href="#booking-ready">Reservas</a>
          <a href="#documents">Documentos</a>
          <a href="#backup-plans">Planos B</a>
          <a href="#budget-summary">Orçamento</a>
          <a href="#review-before-sending">Revisão</a>
          <a href="#export-share">Exportar</a>
        </nav>

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
        <div className={styles.twoPanelLayout} id="day-plan">
          
          {/* PAINEL ESQUERDO */}
          <div className={styles.leftPanel}>

            <div className={styles.mapContainer} data-testid="itinerary-map-container">
              <LiveMap
                stops={currentDay.stops || []}
                destination={dest}
                currency={currencyContext.symbol}
              />
            </div>
            
            {/* CLIMA E TRANSPORTE */}
            <div className={styles.dayMetaCards}>
              {weatherData ? (
                <WeatherSummary weatherData={weatherData} activeDayIndex={activeDay} />
              ) : currentDay.weather ? (
                <div className={styles.metaCard}>
                  <span className={styles.metaIcon}>⛅</span>
                  <div>
                    <div className={styles.metaLabel}>Clima estimado · estimativa sazonal</div>
                    <div className={styles.metaValue}>{currentDay.weather.avgTemp} · {currentDay.weather.condition}</div>
                    {currentDay.weather.tip && (
                      <div className={styles.metaValueSub}>{currentDay.weather.tip}</div>
                    )}
                  </div>
                </div>
              ) : null}
              {currentDay.transport && (
                <div className={styles.metaCard}>
                  <span className={styles.metaIcon}><Route size={18} aria-hidden="true" /></span>
                  <div>
                    <div className={styles.metaLabel}>Plano de transporte · confirmar rota</div>
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
                  <button className={styles.btnRegenerate} onClick={() => setShowAdaptModal(true)} disabled={isAdapting || !canEditTrip}>
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
                    {currentDay.energyLevel && (
                      <div className={`${styles.synopsisStatBadge} ${
                        String(currentDay.energyLevel).toLowerCase().includes('relax') ? styles.energyRelaxed :
                        String(currentDay.energyLevel).toLowerCase().includes('intense') ? styles.energyIntense :
                        styles.energyModerate
                      }`}>
                        {String(currentDay.energyLevel).toLowerCase().includes('relax') ? 'Ritmo leve' :
                         String(currentDay.energyLevel).toLowerCase().includes('intense') ? 'Ritmo intenso' :
                         'Ritmo moderado'}
                      </div>
                    )}
                    {currentDay.estimatedDistance && (
                      <div className={styles.synopsisStatBadge}>{currentDay.estimatedDistance} a pé</div>
                    )}
                    {getDayBudget(currentDay) > 0 && (
                      <div className={styles.synopsisStatBadge}>
                        ~{formatMoney(getDayBudget(currentDay))} est.
                      </div>
                    )}
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
                                onUpdate={canEditTrip ? (patch) => updateActivity(stop, patch) : undefined}
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
                <h3 className={styles.sectionTitle}>Sugestões de refeições · confirmar local e disponibilidade</h3>
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
                    const mealSource = String(meal.source || meal.providerSource || '').toLowerCase();
                    const providerBackedMeal = ['foursquare', 'provider', 'provider-api', 'user-confirmed'].includes(mealSource);
                    return (
                      <div key={mealType} className={`${styles.mealCard} ${borderClass[mealType]}`}>
                        <div className={styles.mealHeader}>{icons[mealType]}</div>
                        <div className={styles.mealName}>{meal.name}</div>
                        <div className={styles.mealMeta}>
                          {meal.cuisine || meal.type}
                          <span className={styles.mealCost}> · {mealCostDisplay}{mealCostDisplay !== 'Por confirmar' && !providerBackedMeal ? ' (estimativa)' : ''}</span>
                        </div>
                        {(meal.mustOrder || meal.note) && (
                          <div className={styles.mealTip}>
                            <span className={styles.mealTipLabel}>Deve pedir:</span> &ldquo;{meal.mustOrder || meal.note}&rdquo;
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RESTAURANTES ENRIQUECIDOS NAS PROXIMIDADES */}
            {currentDay.enrichedRestaurants && currentDay.enrichedRestaurants.length > 0 && (
              <div className={styles.mealsSection}>
                <h3 className={styles.sectionTitle}>Sugestões de restaurantes próximos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {currentDay.enrichedRestaurants.map((restaurant, rIdx) => (
                    <RestaurantCard
                      key={rIdx}
                      restaurant={restaurant}
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
                  <h4 className={styles.localSecretTitle}>Sugestão local por confirmar</h4>
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

          <div className={styles.rightPanel}>
            <section className={styles.operationalSection} id="booking-ready">
              <div className={styles.operationalHeading}>
                <span>Reservas</span>
                <h2>Preparar a viagem</h2>
                <p>Pesquisa e decisões por categoria. Nada fica confirmado até marcares o respetivo estado.</p>
              </div>
              <div className={styles.bookingServicesGrid}>
                <FlightSection
                  flights={{
                    options: itinerary.flightOptions || [],
                    overview: trip.flightOverview || '',
                    externalLinks: {
                      googleFlights: bookingLinks.flights?.google,
                      skyscanner: bookingLinks.flights?.skyscanner,
                    }
                  }}
                  destination={dest.city || dest.name}
                />
                <HotelSection
                  accommodation={{
                    ...itinerary.accommodation,
                    externalLinks: {
                      booking: bookingLinks.hotels?.booking,
                      googleHotels: bookingLinks.hotels?.googleHotels,
                      airbnb: bookingLinks.hotels?.airbnb,
                    }
                  }}
                  destination={dest.city || dest.name}
                />
              </div>
              <div className={styles.logisticsGrid}>
                <AirportTransferSection airportTransfer={itinerary.airportTransfer || trip.airportTransfer} />
                <LocalTransportSection localTransport={itinerary.localTransport || trip.localTransport} />
                <RentalCarSection
                  rentalCar={itinerary.rentalCar || trip.rentalCar}
                  destination={dest.city || dest.name}
                  storageKey={`andor_rental_car_${id}`}
                  tripId={id}
                />
              </div>

              <BookingChecklist
                bookingChecklist={itinerary.bookingChecklist || trip.bookingChecklist || itinerary.trip?.bookingChecklist}
                storageKey={bookingStorageKey}
                tripId={id}
              />
            </section>

            <div id="documents">
              <TravelDocumentsSection
                documentsChecklist={itinerary.documentsChecklist || trip.documentsChecklist}
                storageKey={documentsStorageKey}
                mode={exportMode}
                tripId={id}
              />
            </div>

            <div id="backup-plans">
              <BackupPlansSection
                backupPlans={itinerary.backupPlans || trip.backupPlans}
                contingencyPlans={itinerary.contingencyPlans || trip.contingencyPlans}
              />
            </div>

            <section className={styles.operationalSection} id="budget-summary">
              <div className={styles.operationalHeading}>
                <span>Orçamento</span>
                <h2>Custos e preparação</h2>
                <p>Estimativas para orientar decisões; confirma sempre o preço final no fornecedor.</p>
              </div>
              <div className={`${styles.budgetWorkspace} ${showMobileBudget ? styles.budgetWorkspaceOpen : styles.budgetWorkspaceCollapsed}`}>
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
                <button className={styles.btnOutlineFull} onClick={() => setShowBudgetDrawer(true)}>
                  <Settings size={16} aria-hidden="true" /> Ajustar orçamento
                </button>
              </div>
              <div className={styles.tripToolsGrid}>
                {trip.topTips && (
                  <div className={styles.sidebarCard}>
                    <h3 className={styles.tipsHeading}>Dicas práticas</h3>
                    <ul className={styles.tipsList}>
                      {trip.topTips.map((tip, index) => (
                        <li key={`${tip}-${index}`} className={styles.tipsItem}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className={styles.sidebarCard}>
                  <div className={styles.packingHeader}>
                    <h3 className={styles.tipsHeading}>Lista de bagagem</h3>
                    <button className={styles.btnSecondary} onClick={handleGeneratePackingList} disabled={isPackingGenerating}>
                      {isPackingGenerating ? 'A gerar...' : packingList ? 'Atualizar' : 'Gerar'}
                    </button>
                  </div>
                  {packingList ? (
                    <div className={styles.packingList}>
                      {Object.entries({ essential: 'Essencial', clothes: 'Roupa', apps: 'Apps', avoid: 'Não levar' }).map(([category, label]) => (
                        <div key={category} className={styles.packingGroup}>
                          <h4>{label}</h4>
                          {(packingList[category] || []).map((item) => {
                            const checkedKey = `${category}:${item}`;
                            return (
                              <label key={item} className={styles.packingItem}>
                                <input type="checkbox" checked={!!checkedPacking[checkedKey]} onChange={() => togglePackingItem(category, item)} />
                                <span>{item}</span>
                              </label>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.sidebarHint}>Gera uma checklist adaptada ao destino, estação e ritmo do roteiro.</p>
                  )}
                </div>
              </div>
            </section>

            <div id="review-before-sending">
              <ReviewBeforeSending
                itinerary={itinerary}
                exportMode={exportMode}
                bookingStorageKey={bookingStorageKey}
                documentsStorageKey={documentsStorageKey}
                companyMode={companyModeActive}
              />
            </div>

            <AlertsSection warnings={itinerary.warnings || trip.warnings || []} destination={dest.city || dest.name} />

            <section className={styles.exportWorkspace} id="export-share" aria-label="Exportar e partilhar">
              <div>
                <span>Entregar</span>
                <h2>Exportar e partilhar</h2>
                <p>{exportMode === 'internal' ? 'A versão interna inclui notas operacionais.' : 'A versão cliente oculta notas internas.'}</p>
              </div>
              <div className={styles.sidebarActionsCol}>
                <button className={styles.btnSecondaryFull} onClick={() => handleExportPDF(exportMode)}><FileText size={16} aria-hidden="true" /> Exportar PDF</button>
                <button className={styles.btnSecondaryFull} disabled={!canManageShares} onClick={handleShare}><Share2 size={16} aria-hidden="true" /> Partilhar</button>
                <button className={styles.btnSecondaryFull} onClick={() => copyTextSummary('client')}><Copy size={16} aria-hidden="true" /> Resumo cliente</button>
                <button className={styles.btnSecondaryFull} onClick={() => copyTextSummary('internal')}><Copy size={16} aria-hidden="true" /> Resumo interno</button>
                <button className={styles.btnPrimaryFull} onClick={openAIChat}><MessageCircle size={16} aria-hidden="true" /> Pedir ao Andor</button>
              </div>
            </section>
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
              exchangeRate={exchangeRateData}
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
        <p className={styles.shareDisclosure}>
          O link publico e sempre de leitura e inclui apenas o roteiro permitido para cliente.
          Nomes de cliente, notas internas, referencias de reserva e campos desconhecidos ficam excluidos.
        </p>
        <label className={styles.shareExpiry}>
          <span>Validade do link</span>
          <select value={shareExpiresInDays} onChange={(event) => handleShareExpiryChange(event.target.value)} disabled={shareLoading}>
            <option value={1}>1 dia</option>
            <option value={7}>7 dias</option>
            <option value={30}>30 dias</option>
            <option value={90}>90 dias</option>
          </select>
        </label>
        <div className={styles.shareActions}>
          <button
            className={styles.btnPrimary}
            onClick={() => createShareUrl(shareExpiresInDays)}
            disabled={shareLoading}
            type="button"
          >
            {shareLoading ? 'A criar...' : 'Criar novo link'}
          </button>
        </div>
        <div className={styles.sharePreview}>
          <span>URL do link acabado de criar</span>
          <div className={styles.shareUrlField}>
            {shareLoading && <Loader2 size={18} className={styles.shareSpinner} aria-hidden="true" />}
            <input
              value={shareLoading ? 'A criar link seguro...' : shareUrl}
              placeholder="Cria um link para veres o URL uma unica vez"
              readOnly
              aria-label="URL de partilha"
            />
          </div>
          {shareError && <span className={styles.shareError} role="alert">{shareError}</span>}
          {!shareError && activeShare && (
            <span>Qualquer pessoa com este link pode abrir a versao cliente ate ao fim da validade.</span>
          )}
          {activeShare?.expiresAt && (
            <span>Expira em {new Date(activeShare.expiresAt).toLocaleString('pt-PT')}</span>
          )}
        </div>
        <div className={styles.shareActions}>
          <button className={styles.btnPrimary} onClick={copyShareUrl} disabled={shareLoading || !shareUrl}>Copiar link</button>
          <button className={styles.btnOutline} onClick={() => copyTextSummary('client')}>Copiar resumo</button>
          <button className={styles.btnOutline} onClick={() => handleExportPDF('client')}>PDF cliente</button>
          {shareUrl && <a className={styles.btnOutline} href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
          {shareUrl && <a className={styles.btnOutline} href={`mailto:?subject=${encodeURIComponent('O meu roteiro Andor')}&body=${encodeURIComponent(shareUrl)}`}>Email</a>}
          {activeShare && (
            <button className={styles.btnDanger} onClick={() => revokeShare(activeShare.id)} type="button">
              <Unlink size={16} aria-hidden="true" /> Revogar link
            </button>
          )}
        </div>
        <div className={styles.shareLinkList}>
          <strong>Links criados</strong>
          {shareLinks.length === 0 ? (
            <span>Ainda nao existem links para esta viagem.</span>
          ) : shareLinks.map((share) => {
            const expired = new Date(share.expiresAt).getTime() <= Date.now();
            const inactive = Boolean(share.revokedAt || expired);
            return (
              <div key={share.id} className={styles.shareLinkItem}>
                <span>
                  <strong>{inactive ? 'Inativo' : 'Ativo'}</strong>
                  <small>Criado em {new Date(share.createdAt).toLocaleString('pt-PT')} · expira em {new Date(share.expiresAt).toLocaleString('pt-PT')}</small>
                </span>
                {!inactive && (
                  <button type="button" className={styles.btnDanger} onClick={() => revokeShare(share.id)}>
                    Revogar
                  </button>
                )}
              </div>
            );
          })}
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
