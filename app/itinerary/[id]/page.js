'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getItinerary, saveGeneratedItinerary } from '../../lib/itinerary-store';
import { validateAndNormalize } from '../../lib/itinerary-validate';
import { safeParse } from '../../lib/safe-json';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import LiveMap from '../../components/LiveMap';
import BudgetCalculator from '../../components/BudgetCalculator';
import SkeletonLoader from '../../components/SkeletonLoader';
import { useToast } from '../../components/ToastProvider';
import styles from './itinerary.module.css';
import html2pdf from 'html2pdf.js';

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
  const [showAdaptModal, setShowAdaptModal] = useState(false);
  const [adaptFeedback, setAdaptFeedback] = useState('');
  const [adaptChecks, setAdaptChecks] = useState({});
  const [savedStops, setSavedStops] = useState({});
  
  const printRef = useRef();
  const timelineRef = useRef();

  useEffect(() => {
    let data = null;
    if (params.id === 'share') {
      const urlParams = new URLSearchParams(window.location.search);
      const sharedData = urlParams.get('data');
      if (sharedData) {
        try {
          data = safeParse(decodeURIComponent(escape(atob(sharedData))), null);
        } catch (e) {
          console.error('Failed to decode shared itinerary', e);
        }
      }
    } else {
      data = getItinerary(params.id);
    }

    if (data) {
      try {
        const val = validateAndNormalize(data);
        if (val.fatal) {
          setValidationError(val.errors.join('; '));
        } else {
          setItinerary(val.normalized || data);
          setExpandedStops({ 0: true });
        }
      } catch (e) {
        console.error('Validation failed', e);
        setItinerary(data);
      }
    }
    setLoading(false);
  }, [params.id]);

  const handleShare = async () => {
    try {
      const uuid = crypto.randomUUID();
      localStorage.setItem(`andor_shared_${uuid}`, JSON.stringify(itinerary));
      const shareUrl = `${window.location.origin}/itinerary/share?id=${uuid}`;
      // For immediate URL fallback if uuid server side not implemented:
      const payload = btoa(unescape(encodeURIComponent(JSON.stringify(itinerary))));
      const payloadUrl = `${window.location.origin}/itinerary/share?data=${payload}`;
      
      await navigator.clipboard.writeText(payloadUrl);
      showToast('✅ Link copiado para a área de transferência!', 'success');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showToast('❌ Erro ao partilhar.', 'error');
    }
  };

  const handleExportPDF = () => {
    if (typeof window === 'undefined') return;
    showToast('📄 A gerar PDF...', 'info');
    const element = printRef.current;
    const opt = {
      margin: 10,
      filename: `Andor_${itinerary.destination?.city || 'Itinerario'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save().then(() => {
      showToast('✅ PDF exportado com sucesso!', 'success');
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
      const response = await fetch('/api/adapt-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalItinerary: itinerary,
          dayIndex: activeDay,
          feedback: combined
        })
      });

      if (!response.ok) {
        showToast('❌ Erro ao regenerar o dia.', 'error');
        return;
      }
      
      const newDay = await response.json();
      const newItinerary = { ...itinerary };
      newItinerary.days[activeDay] = newDay;
      setItinerary(newItinerary);
      showToast('✅ Dia regenerado com sucesso!', 'success');
    } catch (error) {
      console.error(error);
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

  const toggleSaved = (idx) => {
    setSavedStops(prev => {
      const next = { ...prev, [idx]: !prev[idx] };
      showToast(next[idx] ? '❤️ Guardado nos favoritos!' : '💔 Removido dos favoritos.', next[idx] ? 'success' : 'info');
      return next;
    });
  };

  const handleDayChange = (i) => {
    setActiveDay(i);
    if (timelineRef.current) {
      timelineRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

  const dest = itinerary.destination || {};
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
                  <div className={styles.dayTabEmoji}>{getDayEmoji(day)}</div>
                  <div className={styles.dayTabContent}>
                    <div className={styles.dayTabNumber}>DIA {i + 1}</div>
                    <div className={styles.dayTabTitle} title={day.title}>
                      {day.title?.length > 16 ? day.title.substring(0, 16) + '…' : day.title}
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
              <LiveMap stops={currentDay.stops || []} />
            </div>

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
            <div className={`${styles.timeline} ${isAdapting ? styles.loading : ''}`} ref={timelineRef}>
              <div className={styles.timelineHeader}>
                <h2 className={styles.dayHeading}>{currentDay.title}</h2>
                <button className={styles.btnRegenerate} onClick={() => setShowAdaptModal(true)}>
                  🔄 Regenerar este dia
                </button>
              </div>

              {['morning', 'afternoon', 'evening'].map(periodKey => {
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
                        const isSaved = !!savedStops[idx];
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
                                      toggleSaved(idx);
                                    }}
                                  >
                                    {isSaved ? '❤️' : '🤍'} Guardar
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
            
            {/* ORÇAMENTO */}
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarCardHeader}>
                <h3>💰 Orçamento</h3>
                <div className={styles.budgetTotal}>
                  {budgetDisplay || '€---'}
                </div>
              </div>
              
              {trip.budgetBreakdown && (
                <div className={styles.budgetList}>
                  <div className={styles.budgetItem}><span>✈️ Voos</span> <strong>€{trip.budgetBreakdown.flights?.min || 0} – €{trip.budgetBreakdown.flights?.max || 0}</strong></div>
                  <div className={styles.budgetItem}><span>🏨 Alojamento</span> <strong>€{trip.budgetBreakdown.accommodation?.total || 0}</strong></div>
                  <div className={styles.budgetItem}><span>🍽️ Alimentação</span> <strong>€{trip.budgetBreakdown.food?.total || 0}</strong></div>
                  <div className={styles.budgetItem}><span>🚇 Transportes</span> <strong>€{trip.budgetBreakdown.transport?.total || 0}</strong></div>
                  <div className={styles.budgetItem}><span>🎭 Actividades</span> <strong>€{trip.budgetBreakdown.activities?.total || 0}</strong></div>
                  {trip.budgetBreakdown.shopping && (
                    <div className={styles.budgetItem}><span>🛍️ Compras</span> <strong>€{trip.budgetBreakdown.shopping?.total || 0}</strong></div>
                  )}
                  {trip.budgetBreakdown.misc && (
                    <div className={styles.budgetItem}><span>📦 Outros</span> <strong>€{trip.budgetBreakdown.misc?.total || 0}</strong></div>
                  )}
                  <div className={`${styles.budgetItem} ${styles.budgetItemTotal}`}>
                    <span>Total estimado</span>
                    <strong>{budgetDisplay || '€---'}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* VOOS */}
            {itinerary.flightOptions && itinerary.flightOptions.map((flight, idx) => (
              <div key={idx} className={styles.sidebarCard}>
                {flight.badge && (
                  <div className={styles.badge}>{flight.badge === 'recommended' ? '⭐ Recomendado' : 'Opção de Voo'}</div>
                )}
                <h4 className={styles.cardTitle}>✈️ {flight.airline}</h4>
                <div className={styles.cardMeta}>{flight.route}</div>
                <div className={styles.cardMeta}>{flight.totalDuration} · {flight.stops} escala(s)</div>
                <div className={styles.cardPrices}>
                  <span>Economy: ~€{flight.estimatedPrice?.economy}</span>
                  <span>Business: ~€{flight.estimatedPrice?.business}</span>
                </div>
                {flight.tip && <div className={styles.cardTip}>💡 {flight.tip}</div>}
                <a
                  href={flight.searchUrl || `https://www.skyscanner.pt/transport/flights/${encodeURIComponent(dest.city || '')}?adults=2`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btnOutlineFull}
                >
                  Pesquisar no Skyscanner →
                </a>
              </div>
            ))}

            {/* HOTEL */}
            {itinerary.accommodation?.recommended && (
              <div className={styles.sidebarCard}>
                <h4 className={styles.cardTitle}>🏨 {itinerary.accommodation.recommended.name}</h4>
                <div className={styles.cardMeta}>📍 {itinerary.accommodation.recommended.area}</div>
                <div className={styles.cardMeta}>⭐ {itinerary.accommodation.recommended.stars} estrelas</div>
                <div className={styles.cardPrice}>~€{itinerary.accommodation.recommended.pricePerNight}/noite</div>
                <p className={styles.cardDesc}>&ldquo;{itinerary.accommodation.recommended.whyHere}&rdquo;</p>
                <a
                  href={itinerary.accommodation.recommended.bookingUrl || `https://www.booking.com/search.html?ss=${encodeURIComponent(itinerary.accommodation.recommended.name + ' ' + (dest.city || ''))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btnOutlineFull}
                >
                  Ver no Booking.com →
                </a>
              </div>
            )}

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
    </>
  );
}
