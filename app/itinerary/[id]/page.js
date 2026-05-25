'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getItinerary, saveGeneratedItinerary } from '../../lib/itinerary-store';
import { validateAndNormalize } from '../../lib/itinerary-validate';
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
import { useToast } from '../../components/ToastProvider';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import styles from './itinerary.module.css';
import { trackEvent } from '../../lib/analytics';

const getStopIcon = (stop) => {
  const type = (stop.type || '').toLowerCase();
  const name = (stop.name || '').toLowerCase();
  
  if (type.includes('restaurant') || type.includes('food') || type.includes('dining')) return '🍽️';
  if (type.includes('museum') || type.includes('culture') || type.includes('history')) return '🏛️';
  if (type.includes('nature') || type.includes('park')) return '🌿';
  if (type.includes('shopping') || type.includes('market')) return '🛍️';
  if (type.includes('cafe') || type.includes('coffee')) return '☕';
  if (type.includes('entertainment') || type.includes('bar') || type.includes('night')) return '🎭';
  if (type.includes('transport') || type.includes('flight')) return '✈️';
  if (type.includes('hotel') || type.includes('stay')) return '🏨';
  return stop.emoji || '📍';
};

const getDayEmoji = (day) => {
  if (day.emoji) return day.emoji;
  const theme = (day.theme || '').toLowerCase();
  if (theme.includes('arrival')) return '🛬';
  if (theme.includes('culture')) return '🏛️';
  if (theme.includes('food')) return '🍜';
  if (theme.includes('nature')) return '🗻';
  if (theme.includes('shopping')) return '🛍️';
  if (theme.includes('night')) return '🎭';
  return '📍';
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
  const [adaptFeedback, setAdaptFeedback] = useState('');
  const [adaptChecks, setAdaptChecks] = useState({});
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('andor_favorites');
      if (stored) {
        try {
          setFavorites(JSON.parse(stored) || []);
        } catch (e) {
          setFavorites([]);
        }
      }
    }
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

  useEffect(() => {
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
          const stored = localStorage.getItem(`andor_shared_${urlId}`);
          if (stored) data = safeParse(stored, null);
        }
      }
    } else {
      data = getItinerary(params.id);
      if (!data && typeof window !== 'undefined') {
        const stored = localStorage.getItem(`andor_shared_${params.id}`);
        if (stored) data = safeParse(stored, null);
      }
    }

    if (data) {
      try {
        const val = validateAndNormalize(data);
        if (val.fatal) {
          setValidationError(val.errors.join('; '));
        } else {
          const normalized = val.normalized || data;
          const validatedData = validateAndFixCoordinates(
            normalized, 
            normalized.destination?.city || ''
          );
          const enriched = enrichItinerary(validatedData);
          setItinerary(enriched);
          setExpandedStops({ 0: true });
        }
      } catch (e) {
        const enriched = enrichItinerary(data);
        setItinerary(enriched);
      }
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    if (itinerary) {
      const destObj = itinerary.destination || {};
      const tripObj = itinerary.trip || {};
      const city = typeof destObj === 'string' ? destObj : (destObj.city || destObj.name || (typeof itinerary.destination === 'string' ? itinerary.destination : 'Viagem'));
      const daysCount = tripObj.totalDays || itinerary.days?.length || 0;
      document.title = `${city} ${daysCount} dias · Andor`;
    }
  }, [itinerary]);

  const handleShare = async () => {
    try {
      const uuid = crypto.randomUUID();
      // Safely write to localStorage with fallback
      try {
        localStorage.setItem(`andor_shared_${uuid}`, JSON.stringify(itinerary));
      } catch (storageErr) {
        // silent: localStorage not available
      }
      const shareUrl = `${window.location.origin}/itinerary/share/${uuid}`;
      await navigator.clipboard.writeText(shareUrl);
      showToast('✅ Link copiado para a área de transferência!', 'success');
    } catch (err) {
      showToast('❌ Erro ao partilhar.', 'error');
    }
  };

  const handleExportPDF = async () => {
    if (typeof window === 'undefined' || !itinerary) return;
    showToast('📄 A gerar PDF...', 'info');
    
    let html2pdf;
    try {
      html2pdf = (await import('html2pdf.js')).default;
    } catch (e) {
      showToast('❌ Erro ao inicializar gerador de PDF.', 'error');
      return;
    }
    
    const content = document.createElement('div');
    content.innerHTML = `
      <div style="font-family:'Georgia',serif; padding:40px; max-width:800px; color:#1A2235; background-color:#ffffff;">
        
        <!-- CAPA -->
        <div style="text-align:center; padding:60px 0; border-bottom:2px solid #D4A843; margin-bottom: 40px;">
          <div style="font-size:48px; margin-bottom:16px;">${itinerary.destination?.flag || '✈️'}</div>
          <h1 style="font-size:36px; color:#1A2235; margin:0;">${itinerary.destination?.city || itinerary.destination?.name || 'O teu Destino'}</h1>
          <p style="font-size:18px; color:#666; margin:8px 0;">${itinerary.trip?.totalDays || itinerary.days?.length || '–'} dias · ${itinerary.trip?.groupType || 'Viagem'} · ${itinerary.trip?.travelStyle || 'Exploração'}</p>
          <p style="font-size:14px; color:#D4A843; margin:16px 0; font-style:italic;">"${itinerary.destination?.andorVerdict || ''}"</p>
          <p style="font-size:12px; color:#999;">Gerado por Andor Travels · andortravels.com</p>
        </div>
        
        <!-- RESUMO DE ORÇAMENTO -->
        <div style="margin:40px 0; padding:24px; background:#f8f8f8; border-radius:8px; page-break-inside:avoid;">
          <h2 style="font-size:20px; color:#1A2235; margin:0 0 16px;">💰 Estimativa de Orçamento</h2>
          <table style="width:100%; border-collapse:collapse; font-size:14px;">
            <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;">✈️ Voos</td><td style="text-align:right; padding:8px 0;">~€${itinerary.trip?.budgetBreakdown?.flights?.min || 0}-${itinerary.trip?.budgetBreakdown?.flights?.max || 0}</td></tr>
            <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;">🏨 Alojamento</td><td style="text-align:right; padding:8px 0;">~€${itinerary.trip?.budgetBreakdown?.accommodation?.total || 0}</td></tr>
            <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;">🍽️ Refeições</td><td style="text-align:right; padding:8px 0;">~€${itinerary.trip?.budgetBreakdown?.food?.total || 0}</td></tr>
            <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;">🎭 Actividades</td><td style="text-align:right; padding:8px 0;">~€${itinerary.trip?.budgetBreakdown?.activities?.total || 0}</td></tr>
            <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;">🚇 Transportes</td><td style="text-align:right; padding:8px 0;">~€${itinerary.trip?.budgetBreakdown?.transport?.total || 0}</td></tr>
            <tr style="border-top:2px solid #D4A843; font-weight:bold;">
              <td style="padding:12px 0;">TOTAL ESTIMADO</td>
              <td style="text-align:right; padding:12px 0; color:#D4A843;">~€${itinerary.trip?.budgetBreakdown?.grandTotal?.min || 0}-${itinerary.trip?.budgetBreakdown?.grandTotal?.max || 0}</td>
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
              <p style="font-size:13px; color:#555; margin-bottom:15px;">💰 Orçamento do dia: ~€${dayBudget} · ⛅ ${day.weather?.avgTemp || ''} ${day.weather?.condition || ''}</p>
              
              ${morningActivities.length ? `
                <h3 style="font-size:16px; color:#666; margin:16px 0 8px;">🌅 Manhã</h3>
                ${morningActivities.map(a => `
                  <div style="padding:12px; margin:8px 0; background:#fafafa; border-radius:6px; border-left:3px solid #D4A843;">
                    <strong>${a.emoji || '📍'} ${a.name}</strong>
                    <br/><span style="font-size:12px; color:#888;">📍 ${a.address || ''} · ⏱ ${a.duration || '2h'} · 💰 ${a.cost > 0 ? '€'+a.cost : 'Grátis'}</span>
                    ${a.insiderTip ? `<br/><span style="font-size:11px; color:#D4A843; font-style:italic;">💡 ${a.insiderTip}</span>` : ''}
                  </div>
                `).join('')}
              ` : ''}

              ${afternoonActivities.length ? `
                <h3 style="font-size:16px; color:#666; margin:16px 0 8px;">☀️ Tarde</h3>
                ${afternoonActivities.map(a => `
                  <div style="padding:12px; margin:8px 0; background:#fafafa; border-radius:6px; border-left:3px solid #D4A843;">
                    <strong>${a.emoji || '📍'} ${a.name}</strong>
                    <br/><span style="font-size:12px; color:#888;">📍 ${a.address || ''} · ⏱ ${a.duration || '2h'} · 💰 ${a.cost > 0 ? '€'+a.cost : 'Grátis'}</span>
                    ${a.insiderTip ? `<br/><span style="font-size:11px; color:#D4A843; font-style:italic;">💡 ${a.insiderTip}</span>` : ''}
                  </div>
                `).join('')}
              ` : ''}

              ${eveningActivities.length ? `
                <h3 style="font-size:16px; color:#666; margin:16px 0 8px;">🌙 Noite</h3>
                ${eveningActivities.map(a => `
                  <div style="padding:12px; margin:8px 0; background:#fafafa; border-radius:6px; border-left:3px solid #D4A843;">
                    <strong>${a.emoji || '📍'} ${a.name}</strong>
                    <br/><span style="font-size:12px; color:#888;">📍 ${a.address || ''} · ⏱ ${a.duration || '2h'} · 💰 ${a.cost > 0 ? '€'+a.cost : 'Grátis'}</span>
                    ${a.insiderTip ? `<br/><span style="font-size:11px; color:#D4A843; font-style:italic;">💡 ${a.insiderTip}</span>` : ''}
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
          <p style="font-size:14px; margin:8px 0;">🔒 <strong>Segurança:</strong> ${itinerary.destination?.safetyLevel || 'Normal'}</p>
          <p style="font-size:14px; margin:8px 0;">💵 <strong>Gorjetas:</strong> ${itinerary.destination?.tippingCulture || 'Opcional'}</p>
          <p style="font-size:14px; margin:8px 0;">🔌 <strong>Tomadas:</strong> ${itinerary.destination?.electricityPlug || 'Tipos padrão'}</p>
          ${itinerary.destination?.simCard ? `<p style="font-size:14px; margin:8px 0;">📱 <strong>Cartão SIM:</strong> ${itinerary.destination.simCard}</p>` : ''}
        </div>
        
        <div style="text-align:center; padding:20px; color:#999; font-size:11px; border-top:1px solid #eee;">
          Gerado por Andor AI · andortravels.com · Preços são estimativas, verifica antes de reservar
        </div>
      </div>
    `;
    
    const options = {
      margin: [10, 10, 10, 10],
      filename: `Andor_${itinerary.destination?.city || 'Itinerario'}_${itinerary.trip?.totalDays || itinerary.days?.length}dias.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(options).from(content).save().then(() => {
      showToast('✅ PDF exportado com sucesso!', 'success');
    }).catch(err => {
      showToast('❌ Erro ao exportar PDF.', 'error');
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
          allDays: itinerary.days
        })
      });

      if (!response.ok) {
        showToast('❌ Erro ao regenerar o dia.', 'error');
        return;
      }
      
      const data = await response.json();
      const newDay = data.day;
      if (!newDay) {
        showToast('❌ Erro ao processar a resposta do dia.', 'error');
        return;
      }

      // Validate & normalize the new day
      const mockItinerary = { ...itinerary, days: itinerary.days.map((d, i) => i === activeDay ? newDay : d) };
      const val = validateAndNormalize(mockItinerary);
      const normalizedDay = val.normalized?.days?.[activeDay] || newDay;

      const newItinerary = { ...itinerary };
      newItinerary.days[activeDay] = normalizedDay;
      setItinerary(newItinerary);
      showToast(`✅ Dia ${activeDay + 1} regenerado com sucesso!`, 'success');
    } catch (error) {
      showToast('❌ Ocorreu um erro inesperado.', 'error');
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
      showToast('💔 Removido dos favoritos.', 'info');
    } else {
      nextFavorites = [...favorites, { name: stopName, destination: destName }];
      showToast('❤️ Guardado nos favoritos!', 'success');
    }
    
    setFavorites(nextFavorites);
    // Safely write to localStorage with fallback
    try {
      localStorage.setItem('andor_favorites', JSON.stringify(nextFavorites));
    } catch (err1) {
      // silent fail
    }

    // Also update andor_favorite_activities for the favorites page with error handling
    const storedActs = localStorage.getItem('andor_favorite_activities');
    let favActivities = [];
    if (storedActs) {
      try { favActivities = JSON.parse(storedActs) || []; } catch (e) {}
    }
    if (exists) {
      favActivities = favActivities.filter(a => a.name !== stopName);
    } else {
      favActivities.push({
        id: stopName.toLowerCase().replace(/\s+/g, '-'),
        name: stopName,
        type: stop.type || 'Actividade',
        cost: stop.cost !== undefined ? `€${stop.cost}` : stop.estimatedCost || 'Grátis',
        duration: stop.duration || '2h',
        city: dest.city || dest.name || (typeof itinerary?.destination === 'string' ? itinerary.destination : ''),
        destinationSlug: dest.slug || 'tokyo',
        image: stop.photoKeyword ? `https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=75&auto=format&fit=crop` : '',
        dateSaved: new Date().toLocaleDateString('pt-PT')
      });
    }
    try {
      localStorage.setItem('andor_favorite_activities', JSON.stringify(favActivities));
    } catch (err2) {
      // silent fail
    }
    
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
  const currentDay = itinerary.days?.[activeDay] || {};
  
  // Budget estimate
  const budgetMin = trip.budgetBreakdown?.grandTotal?.min;
  const budgetMax = trip.budgetBreakdown?.grandTotal?.max;
  const budgetDisplay = budgetMin
    ? `€${budgetMin} – €${budgetMax}`
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
                <span className={styles.headerFlag}>{dest.flag || '📍'}</span>
                {dest.city || dest.name || itinerary.destination}
              </h1>
              <div className={styles.headerMeta}>
                <span className={styles.headerMetaChip}>
                  📅 {trip.totalDays || itinerary.days?.length || '–'} dias
                </span>
                <span className={styles.headerMetaChip}>
                  👥 {trip.groupType || 'Casal'}
                </span>
                <span className={styles.headerMetaChip}>
                  🎨 {trip.travelStyle || 'Cultural'}
                </span>
                {budgetDisplay && (
                  <span className={styles.headerMetaChipGold}>
                    💰 {budgetDisplay}
                  </span>
                )}
              </div>
            </div>
            <div className={styles.headerActionsDesktop}>
              <button className={styles.btnSecondary} onClick={handleShare}>🔗 Partilhar</button>
              <button className={styles.btnSecondary} onClick={handleExportPDF}>📄 PDF</button>
              <button className={styles.btnPrimary} onClick={openAIChat}>💬 Pedir ao Andor</button>
            </div>
          </div>
        </header>

        {/* TABS DOS DIAS */}
        <div className={styles.dayTabsWrapper}>
          <div className={styles.dayTabs}>
            {itinerary.days?.map((day, i) => {
              const dayBudget = getDayBudget(day);
              return (
                <button
                  key={i}
                  className={`${styles.dayTab} ${activeDay === i ? styles.dayTabActive : ''}`}
                  onClick={() => handleDayChange(i)}
                >
                  <div className={styles.dayTabEmoji}>
                    {isAdapting && activeDay === i ? '⏳' : getDayEmoji(day)}
                  </div>
                  <div className={styles.dayTabContent}>
                    <div className={styles.dayTabNumber}>DIA {i + 1}</div>
                    <div className={styles.dayTabTitle} title={day.title || `Dia ${i + 1}`}>
                      {(day.title?.length > 16 ? day.title.substring(0, 16) + '…' : day.title) || `Dia ${i + 1}`}
                    </div>
                    {dayBudget > 0 && (
                      <div className={styles.dayTabBudget}>~€{dayBudget}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN LAYOUT (DOIS PAINÉIS) */}
        <div className={styles.twoPanelLayout}>
          
          {/* PAINEL ESQUERDO */}
          <div className={styles.leftPanel}>
            
            {/* MAPA INTERACTIVO */}
            <div className={styles.mapContainer}>
              <ErrorBoundary>
                <LiveMap stops={currentDay.stops || []} destination={dest} />
              </ErrorBoundary>
            </div>

            <DailyPlanTimeline dailyPlans={itinerary.days} destination={dest.city || dest.name} />

            {/* CLIMA E TRANSPORTE */}
            <div className={styles.dayMetaCards}>
              {currentDay.weather && (
                <div className={styles.metaCard}>
                  <span className={styles.metaIcon}>{currentDay.weather.emoji || '⛅'}</span>
                  <div>
                    <div className={styles.metaLabel}>Clima</div>
                    <div className={styles.metaValue}>{currentDay.weather.avgTemp} · {currentDay.weather.condition}</div>
                  </div>
                </div>
              )}
              {currentDay.transport && (
                <div className={styles.metaCard}>
                  <span className={styles.metaIcon}>🚃</span>
                  <div>
                    <div className={styles.metaLabel}>Transporte do Dia</div>
                    <div className={styles.metaValue}>
                      {currentDay.transport.mainMode || currentDay.transport.mainRecommendation}
                    </div>
                    <div className={styles.metaValueSub}>
                      Est. €{currentDay.transport.cost}
                      {currentDay.transport.dayPass && (
                        <span> · Passe diário: €{currentDay.transport.dayPass.price || currentDay.transport.dayPass}</span>
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
                <button className={styles.btnRegenerate} onClick={() => setShowAdaptModal(true)} disabled={isAdapting}>
                  {isAdapting ? '⏳ A processar...' : '🔄 Regenerar este dia'}
                </button>
              </div>

              {isAdapting ? (
                <div style={{ padding: '20px 0' }}>
                  <SkeletonLoader variant="text" />
                  <div style={{ height: '20px' }}></div>
                  <SkeletonLoader variant="card" count={2} />
                </div>
              ) : ['morning', 'afternoon', 'evening'].map(periodKey => {
                  const stops = groupedStops[periodKey];
                  if (!stops || stops.length === 0) return null;
                  
                  const periodNames = { morning: 'MANHÃ 🌅', afternoon: 'TARDE ☀️', evening: 'NOITE 🌙' };

                  return (
                    <div key={periodKey} className={styles.periodSection}>
                    <h3 className={styles.periodHeading}>{periodNames[periodKey]}</h3>
                    <div className={styles.periodStops}>
                      {stops.map((stop) => {
                        const idx = globalStopCounter++;
                        const isExpanded = !!expandedStops[idx];
                        const isSaved = isStopSaved(stop.name);
                        const crowd = getCrowdLabel(stop.crowdLevel);
                        
                        return (
                          <div key={idx} className={`${styles.activityCard} ${isExpanded ? styles.expanded : ''}`}>
                            
                            {/* Collapsed State */}
                            <div className={styles.activityHeader} onClick={() => toggleStop(idx)}>
                              <div className={styles.activityHeaderLeft}>
                                {stop.photoKeyword && (
                                  <img
                                    src={`https://source.unsplash.com/128x128/?${encodeURIComponent(stop.photoKeyword || stop.name)}`}
                                    alt=""
                                    className={styles.activityThumb}
                                  />
                                )}
                                <div className={styles.activityIcon}>{getStopIcon(stop)}</div>
                                <div className={styles.activityName}>{stop.name}</div>
                              </div>
                              <div className={styles.activityHeaderRight}>
                                <span className={styles.activityMeta}>⏱️ {stop.duration || (stop.durationMinutes ? stop.durationMinutes + 'm' : '2h')}</span>
                                <span className={styles.activityMeta}>💰 {stop.cost !== undefined ? `€${stop.cost}` : stop.estimatedCost || 'Grátis'}</span>
                                {crowd && (
                                  <span className={`${styles.activityCrowd} ${styles[crowd.cls]}`}>
                                    👥 {crowd.label}
                                  </span>
                                )}
                                <span className={styles.chevron}>{isExpanded ? '▲' : '▼'}</span>
                              </div>
                            </div>

                            {/* Expanded State */}
                            {isExpanded && (
                              <div className={styles.activityBody}>
                                {stop.photoKeyword && (
                                  <div className={styles.activityPhotoWrapper}>
                                    <img 
                                      src={`https://source.unsplash.com/800x400/?${encodeURIComponent(stop.photoKeyword || stop.name)}`} 
                                      alt={stop.name}
                                      className={styles.activityPhoto}
                                    />
                                  </div>
                                )}
                                <div className={styles.activityDetails}>
                                  <div className={styles.activityDetailRow}>
                                    <strong>📍 Endereço:</strong> {stop.address || dest.city}
                                  </div>
                                  {stop.transportFromPrevious && (
                                    <div className={styles.activityDetailRow}>
                                      <strong>🚇 Como chegar:</strong> {stop.transportFromPrevious.mode} ({stop.transportFromPrevious.duration})
                                      {stop.transportFromPrevious.directions && (
                                        <span className={styles.transportDirections}> — {stop.transportFromPrevious.directions}</span>
                                      )}
                                    </div>
                                  )}
                                  {stop.insiderTip && (
                                    <div className={styles.insiderTipBox}>
                                      <span className={styles.insiderTipIcon}>💡</span>
                                      <div>
                                        <strong>Segredo do Andor:</strong>
                                        <p className={styles.insiderTipText}>&ldquo;{stop.insiderTip}&rdquo;</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className={styles.activityActions}>
                                  <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.name + ' ' + (stop.address || dest.city))}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={styles.btnOutline}
                                  >
                                    🗺️ Ver no Mapa
                                  </a>
                                  {stop.bookingUrl && (
                                    <a
                                      href={stop.bookingUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={styles.btnOutline}
                                    >
                                      🎟️ Reservar
                                    </a>
                                  )}
                                  <button
                                    className={`${styles.btnOutline} ${isSaved ? styles.btnSaved : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSaved(stop);
                                    }}
                                  >
                                    {isSaved ? '❤️ Guardado' : '🤍 Guardar'}
                                  </button>
                                </div>
                              </div>
                            )}
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
                <h3 className={styles.sectionTitle}>🍽️ Refeições do Dia</h3>
                <div className={styles.mealsGrid}>
                  {['breakfast', 'lunch', 'dinner'].map(mealType => {
                    const meal = currentDay.meals[mealType];
                    if (!meal) return null;
                    const icons = { breakfast: '🌅 Pequeno-almoço', lunch: '☀️ Almoço', dinner: '🌙 Jantar' };
                    const borderClass = {
                      breakfast: styles.mealBorderGold,
                      lunch: styles.mealBorderBlue,
                      dinner: styles.mealBorderPurple,
                    };
                    return (
                      <div key={mealType} className={`${styles.mealCard} ${borderClass[mealType]}`}>
                        <div className={styles.mealHeader}>{icons[mealType]}</div>
                        <div className={styles.mealName}>{meal.name}</div>
                        <div className={styles.mealMeta}>
                          {meal.cuisine || meal.type}
                          <span className={styles.mealCost}> · {meal.priceRange || `€${meal.cost}`}</span>
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
                          📍 Ver no Google Maps
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SEGREDO LOCAL */}
            {(currentDay.localSecret || currentDay.culturalNote) && (
              <div className={styles.localSecretCard}>
                <div className={styles.localSecretIcon}>🔑</div>
                <div className={styles.localSecretContent}>
                  <h4 className={styles.localSecretTitle}>Segredo Local do Andor</h4>
                  <p>{currentDay.localSecret}</p>
                  {currentDay.culturalNote && <p className={styles.culturalNote}><em>Nota Cultural:</em> {currentDay.culturalNote}</p>}
                </div>
              </div>
            )}
          </div>

          {/* PAINEL LATERAL (DIREITO) */}
          <div className={styles.rightPanel}>
            
            <BudgetVisualization budget={trip.budget || trip.budgetScenarios || (trip.budgetBreakdown ? { 
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
              ⚙️ Ajustar Orçamento
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
                <h3 className={styles.tipsHeading}>📋 Dicas Top do Andor</h3>
                <ul className={styles.tipsList}>
                  {trip.topTips.map((tip, i) => (
                    <li key={i} className={styles.tipsItem}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* ACTIONS */}
            <div className={styles.sidebarActionsCol}>
              <button className={styles.btnSecondaryFull} onClick={handleExportPDF}>📄 Exportar PDF</button>
              <button className={styles.btnSecondaryFull} onClick={handleShare}>🔗 Partilhar Link</button>
              <button className={styles.btnPrimaryFull} onClick={openAIChat}>💬 Pedir ao Andor</button>
            </div>

          </div>
        </div>
      </div>
      </ErrorBoundary>

      {/* REGENERATE MODAL */}
      {showAdaptModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAdaptModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>🔄 Regenerar Dia {activeDay + 1}</h3>
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
              <button className={styles.btnPrimary} onClick={handleRegenerateDay}>Regenerar</button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER AJUSTAR ORÇAMENTO */}
      {showBudgetDrawer && (
        <div className={styles.modalOverlay} onClick={() => setShowBudgetDrawer(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>⚙️ Ajustar Orçamento</h3>
              <button className={styles.modalClose} onClick={() => setShowBudgetDrawer(false)} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>&times;</button>
            </div>
            <div className={styles.modalBody} style={{ padding: '20px 0' }}>
              <ErrorBoundary>
                <BudgetCalculator 
                  baseCost={trip.budgetBreakdown?.grandTotal?.min || 500} 
                  daysCount={trip.totalDays || itinerary.days?.length || 3} 
                  currency="€" 
                />
              </ErrorBoundary>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnPrimary} onClick={() => setShowBudgetDrawer(false)}>Concluído</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
