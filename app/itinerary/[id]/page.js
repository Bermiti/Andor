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

export default function ItineraryPage() {
  const params = useParams();
  const router = useRouter();
  const { user, saveTrip } = useAuth();
  
  const [itinerary, setItinerary] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedStops, setExpandedStops] = useState({});
  const [isAdapting, setIsAdapting] = useState(false);
  const [showAdaptModal, setShowAdaptModal] = useState(false);
  const [adaptFeedback, setAdaptFeedback] = useState('');
  
  const printRef = useRef();

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
      alert('✅ Link copiado para a área de transferência!');
    } catch (error) {
      console.error(error);
      alert('Erro ao partilhar link.');
    }
  };

  const handleExportPDF = () => {
    if (!printRef.current) return;
    const opt = {
      margin:       10,
      filename:     `Andor_${itinerary.destination?.city || 'Itinerario'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(printRef.current).save();
  };

  const handleRegenerateDay = async () => {
    if (!adaptFeedback) return;
    setIsAdapting(true);
    setShowAdaptModal(false);
    try {
      // Dummy API call integration for regen
      const response = await fetch('/api/adapt-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itinerary,
          activeDayIndex: activeDay,
          context: adaptFeedback
        })
      });

      if (!response.ok) {
        // Mocking a successful response for now as the endpoint might not exist
        setTimeout(() => {
          alert('Dia regenerado com sucesso! (Mock)');
          setIsAdapting(false);
        }, 2000);
        return;
      }
      
      const newDay = await response.json();
      const newItinerary = { ...itinerary };
      newItinerary.days[activeDay] = newDay;
      setItinerary(newItinerary);
    } catch (error) {
      console.error(error);
      alert('Failed to regenerate day.');
    } finally {
      setIsAdapting(false);
      setAdaptFeedback('');
    }
  };

  const toggleStop = (idx) => {
    setExpandedStops(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.content} style={{ marginTop: '80px' }}>
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
  
  // Group stops for the current day
  const periods = ['morning', 'afternoon', 'evening'];
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
            <h1>{dest.flag || '📍'} {dest.city || dest.name || itinerary.destination}</h1>
            <div className={styles.headerActionsDesktop}>
              <button className={styles.btnSecondary}>✏️ Editar</button>
              <button className={styles.btnSecondary} onClick={handleShare}>🔗 Partilhar</button>
              <button className={styles.btnSecondary} onClick={handleExportPDF}>📄 PDF</button>
              <button className={styles.btnPrimary} onClick={() => alert('Abrindo chat...')}>💬 Pedir ao Andor</button>
            </div>
          </div>
          <div className={styles.headerSubtitle}>
            {trip.totalDays || itinerary.days?.length} dias · {trip.groupType || 'Casal'} · {trip.travelStyle || 'Cultural'}
          </div>
        </header>

        {/* TABS DOS DIAS */}
        <div className={styles.dayTabsWrapper}>
          <div className={styles.dayTabs}>
            {itinerary.days?.map((day, i) => (
              <button
                key={i}
                className={`${styles.dayTab} ${activeDay === i ? styles.dayTabActive : ''}`}
                onClick={() => setActiveDay(i)}
              >
                <div className={styles.dayTabEmoji}>{getDayEmoji(day)}</div>
                <div className={styles.dayTabContent}>
                  <div className={styles.dayTabNumber}>DIA {i + 1}</div>
                  <div className={styles.dayTabTitle} title={day.title}>
                    {day.title?.length > 18 ? day.title.substring(0, 15) + '...' : day.title}
                  </div>
                </div>
              </button>
            ))}
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
                    <div className={styles.metaValue}>{currentDay.transport.mainRecommendation} (Est. €{currentDay.transport.cost})</div>
                  </div>
                </div>
              )}
            </div>

            {/* TIMELINE (MANHÃ, TARDE, NOITE) */}
            <div className={`${styles.timeline} ${isAdapting ? styles.loading : ''}`}>
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
                        
                        return (
                          <div key={idx} className={`${styles.activityCard} ${isExpanded ? styles.expanded : ''}`}>
                            
                            {/* Collapsed State */}
                            <div className={styles.activityHeader} onClick={() => toggleStop(idx)}>
                              <div className={styles.activityHeaderLeft}>
                                <div className={styles.activityIcon}>{getStopIcon(stop)}</div>
                                <div className={styles.activityTitle}>{stop.name}</div>
                              </div>
                              <div className={styles.activityHeaderRight}>
                                <span className={styles.activityMeta}>⏱️ {stop.duration || stop.durationMinutes + 'm' || '2h'}</span>
                                <span className={styles.activityMeta}>💰 {stop.cost !== undefined ? `€${stop.cost}` : stop.estimatedCost || 'Grátis'}</span>
                                <span className={styles.chevron}>{isExpanded ? '↑' : '↓'}</span>
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
                                    </div>
                                  )}
                                  {stop.insiderTip && (
                                    <div className={styles.activityTip}>
                                      💡 <strong>Segredo:</strong> "{stop.insiderTip}"
                                    </div>
                                  )}
                                </div>
                                <div className={styles.activityActions}>
                                  <button className={styles.btnOutline}>🗺️ Ver no Mapa</button>
                                  <button className={styles.btnOutline}>🔖 Guardar</button>
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
                <h3 className={styles.sectionTitle}>Refeições do Dia</h3>
                <div className={styles.mealsGrid}>
                  {['breakfast', 'lunch', 'dinner'].map(mealType => {
                    const meal = currentDay.meals[mealType];
                    if (!meal) return null;
                    const icons = { breakfast: '🌅 Pequeno-almoço', lunch: '☀️ Almoço', dinner: '🌙 Jantar' };
                    return (
                      <div key={mealType} className={styles.mealCard}>
                        <div className={styles.mealHeader}>{icons[mealType]}</div>
                        <div className={styles.mealName}>{meal.name}</div>
                        <div className={styles.mealMeta}>{meal.cuisine || meal.type} · {meal.priceRange || `€${meal.cost}`}</div>
                        {(meal.mustOrder || meal.note) && (
                          <div className={styles.mealTip}>"{meal.mustOrder || meal.note}"</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SEGREDO LOCAL */}
            {(currentDay.localSecret || currentDay.culturalNote) && (
              <div className={styles.localSecretCard}>
                <div className={styles.localSecretIcon}>💡</div>
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
                  {trip.budgetBreakdown?.grandTotal?.min 
                    ? `€${trip.budgetBreakdown.grandTotal.min} - €${trip.budgetBreakdown.grandTotal.max}`
                    : itinerary.totalCost || '€---'
                  }
                </div>
              </div>
              
              {trip.budgetBreakdown && (
                <div className={styles.budgetList}>
                  <div className={styles.budgetItem}><span>✈️ Voos</span> <strong>€{trip.budgetBreakdown.flights?.min || 0}</strong></div>
                  <div className={styles.budgetItem}><span>🏨 Hotel</span> <strong>€{trip.budgetBreakdown.accommodation?.total || 0}</strong></div>
                  <div className={styles.budgetItem}><span>🍽️ Comida</span> <strong>€{trip.budgetBreakdown.food?.total || 0}</strong></div>
                  <div className={styles.budgetItem}><span>🚇 Transp.</span> <strong>€{trip.budgetBreakdown.transport?.total || 0}</strong></div>
                  <div className={styles.budgetItem}><span>🎭 Activ.</span> <strong>€{trip.budgetBreakdown.activities?.total || 0}</strong></div>
                </div>
              )}
              
              <button className={styles.btnFullWidth} onClick={() => alert('Abrir modal de Budget')}>
                Ajustar Budget
              </button>
            </div>

            {/* VOOS */}
            {itinerary.flightOptions && itinerary.flightOptions.map((flight, idx) => (
              <div key={idx} className={styles.sidebarCard}>
                <div className={styles.badge}>{flight.badge === 'recommended' ? 'Recomendado' : 'Opção de Voo'}</div>
                <h4 className={styles.cardTitle}>✈️ {flight.airline}</h4>
                <div className={styles.cardMeta}>{flight.route}</div>
                <div className={styles.cardMeta}>{flight.totalDuration} · {flight.stops} escala(s)</div>
                <div className={styles.cardPrices}>
                  <span>Economy: ~€{flight.estimatedPrice?.economy}</span>
                  <span>Business: ~€{flight.estimatedPrice?.business}</span>
                </div>
                {flight.tip && <div className={styles.cardTip}>💡 {flight.tip}</div>}
                <a href={flight.searchUrl || '#'} target="_blank" className={styles.btnOutlineFull}>Pesquisar no Skyscanner →</a>
              </div>
            ))}

            {/* HOTEL */}
            {itinerary.accommodation?.recommended && (
              <div className={styles.sidebarCard}>
                <h4 className={styles.cardTitle}>🏨 {itinerary.accommodation.recommended.name}</h4>
                <div className={styles.cardMeta}>📍 {itinerary.accommodation.recommended.area}</div>
                <div className={styles.cardMeta}>⭐ {itinerary.accommodation.recommended.stars} estrelas</div>
                <div className={styles.cardPrice}>~€{itinerary.accommodation.recommended.pricePerNight}/noite</div>
                <p className={styles.cardDesc}>"{itinerary.accommodation.recommended.whyHere}"</p>
                <button className={styles.btnOutlineFull}>Ver no Booking.com →</button>
              </div>
            )}

            {/* TOP TIPS */}
            {trip.topTips && (
              <div className={styles.sidebarCard}>
                <h3>📋 Dicas Top do Andor</h3>
                <ul className={styles.tipsList}>
                  {trip.topTips.map((tip, i) => <li key={i}>{tip}</li>)}
                </ul>
              </div>
            )}

            {/* ACTIONS */}
            <div className={styles.sidebarActionsCol}>
              <button className={styles.btnSecondaryFull} onClick={handleExportPDF}>📄 Exportar PDF</button>
              <button className={styles.btnSecondaryFull} onClick={handleShare}>🔗 Partilhar Link</button>
              <button className={styles.btnPrimaryFull} onClick={() => alert('Abrindo chat...')}>💬 Pedir ao Andor</button>
            </div>

          </div>
        </div>
      </div>

      {/* REGENERATE MODAL */}
      {showAdaptModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAdaptModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>🔄 Regenerar este dia</h3>
            <p>O que não gostaste neste dia?</p>
            <textarea 
              className={styles.adaptTextarea} 
              placeholder="Ex: Muito intenso, prefiro algo mais relaxado perto da praia..."
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
