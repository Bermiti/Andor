'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { saveGeneratedItinerary, enrichItineraryData } from '../lib/itinerary-store';
import styles from './ItineraryGenerator.module.css';

const interests = ['History', 'Nature', 'Architecture', 'Shopping', 'Food', 'Nightlife', 'Art', 'Photography', 'Beach', 'Adventure'];

const dayOptions = [
  { value: '1', label: '1 Day', desc: 'Quick Escape', icon: '🌅' },
  { value: '2', label: '2 Days', desc: 'Weekend Getaway', icon: '🏞️' },
  { value: '3', label: '3 Days', desc: 'Classic Tour', icon: '🏰' },
  { value: '5', label: '5 Days', desc: 'Deep Discovery', icon: '🌴' },
  { value: '7', label: '7 Days', desc: 'Grand Explorer', icon: '🚢' },
];

const travelerOptions = [
  { value: '1', label: 'Solo', desc: '1 Person', icon: '👤' },
  { value: '2', label: 'Couple', desc: '2 People', icon: '👩‍❤️‍👨' },
  { value: '3', label: 'Family', desc: '3 People', icon: '👨‍👩‍👧' },
  { value: '4', label: 'Friends', desc: '4 People', icon: '👥' },
  { value: '5+', label: 'Group', desc: '5+ People', icon: '🚌' },
];

const styleOptions = [
  { value: 'cultural', label: 'Cultural', desc: 'History & Heritage', icon: '🏛️' },
  { value: 'adventure', label: 'Adventure', desc: 'Active & Outdoors', icon: '🥾' },
  { value: 'luxury', label: 'Luxury', desc: 'Premium Services', icon: '👑' },
  { value: 'budget', label: 'Budget', desc: 'Value & Local Finds', icon: '🪙' },
  { value: 'nightlife', label: 'Nightlife', desc: 'Parties & Clubs', icon: '🎭' },
  { value: 'romantic', label: 'Romantic', desc: 'Charming & Cozy', icon: '👩‍❤️‍👨' },
];

const sampleItinerary = {
  destination: 'Lisbon, Portugal',
  days: [
    {
      title: 'Day 1 — Historic Heart',
      stops: [
        { time: '09:00', name: 'Pastéis de Belém', type: '☕ Breakfast — Famous pastéis de nata' },
        { time: '10:30', name: 'Jerónimos Monastery', type: '🏛️ UNESCO Heritage Site' },
        { time: '13:00', name: 'Time Out Market', type: '🍽️ Lunch — Gourmet food hall' },
        { time: '15:00', name: 'Alfama District Walk', type: '🚶 Cultural — Oldest neighborhood' },
        { time: '17:00', name: 'Miradouro da Graça', type: '🌅 Viewpoint — Sunset panorama' },
        { time: '20:00', name: 'Taberna da Rua das Flores', type: '🍷 Dinner — Traditional Portuguese' },
      ],
    },
    {
      title: 'Day 2 — Coast & Culture',
      stops: [
        { time: '08:30', name: 'Café A Brasileira', type: '☕ Breakfast — Historic café in Chiado' },
        { time: '10:00', name: 'Tram 28 Ride', type: '🚋 Experience — Iconic tram route' },
        { time: '12:00', name: 'São Jorge Castle', type: '🏰 Heritage — Moorish castle' },
        { time: '14:00', name: 'Cervejaria Ramiro', type: '🦐 Lunch — Best seafood in Lisbon' },
        { time: '16:00', name: 'LX Factory', type: '🎨 Creative hub — Art & shops' },
        { time: '19:30', name: 'Fado in Alfama', type: '🎵 Music — Traditional Fado show' },
      ],
    },
  ],
  totalCost: '€178',
};

const loadingTips = [
  "A calcular a rota perfeita...",
  "A descobrir restaurantes escondidos...",
  "A verificar eventos locais...",
  "A encontrar segredos que os guias não contam...",
  "A optimizar cada euro do teu orçamento...",
  "Quase pronto para a aventura..."
];

export default function ItineraryGenerator() {
  const { user, saveTrip } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState(500);
  const [days, setDays] = useState('2');
  const [travelers, setTravelers] = useState('2');
  const [style, setStyle] = useState('cultural');
  const [activeInterests, setActiveInterests] = useState(['History', 'Food', 'Architecture']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingTip, setLoadingTip] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleGenerate = async () => {
    if (!destination) return alert('Por favor, introduz um destino!');
    setLoading(true);
    setResult(null);
    setErrorMsg(null);
    setLoadingProgress(0);
    setLoadingTip(0);

    // Setup false progress bar interval (0% -> 85% in 8 seconds with non-linear easing)
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= 8000) {
        setLoadingProgress(85);
      } else {
        const x = elapsed / 8000;
        const ease = 1 - Math.pow(1 - x, 3); // easeOutCubic
        setLoadingProgress(parseFloat((ease * 85).toFixed(1)));
      }
    }, 100);

    // Setup rotating tips interval (every 2.5s)
    const tipsInterval = setInterval(() => {
      setLoadingTip(t => (t + 1) % loadingTips.length);
    }, 2500);

    try {
      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination, budget: `€${budget}`, days, style, travelers, interests: activeInterests
        })
      });
      
      if (!response.ok) throw new Error('Ocorreu um erro no servidor da API. Por favor tenta novamente.');
      
      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error('O JSON retornado pela API é inválido ou está malformado.');
      }

      // Front-end enrichment & validation (Tokyo coordinates clamping, day titles unique, geocoding fallback)
      const enrichedData = enrichItineraryData(data);
      if (!enrichedData) {
        throw new Error('Não foi possível processar ou estruturar os dados do itinerário.');
      }

      // Finish progress bar to 100%
      clearInterval(progressInterval);
      setLoadingProgress(100);

      // Short delay for visual smoothness before navigating
      await new Promise(resolve => setTimeout(resolve, 300));
      const id = saveGeneratedItinerary(enrichedData);
      router.push(`/itinerary/${id}`);
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || 'Ocorreu um erro inesperado ao criar o teu itinerário.');
    } finally {
      clearInterval(progressInterval);
      clearInterval(tipsInterval);
      setLoading(false);
    }
  };

  const toggleInterest = (interest) => {
    setActiveInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  return (
    <section className={styles.planner} id="planner">
      <div className={styles.header}>
        <span className="section-label">🧠 AI Planner</span>
        <h2 className="section-title">Generate your perfect itinerary</h2>
        <p className="section-subtitle mx-auto">
          Tell us about your trip and our AI will create an optimized, personalized plan in seconds.
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.formSide}>
          <div className={styles.formCard}>
            {/* Wizard Progress Bar */}
            <div className={styles.wizardProgress}>
              <div className={styles.progressTrack}></div>
              <div className={styles.progressFill} style={{ width: `${(step - 1) * 50}%` }}></div>
              <div className={`${styles.progressNode} ${step >= 1 ? styles.progressNodeActive : ''} ${step > 1 ? styles.progressNodeDone : ''}`}>
                {step > 1 ? '✓' : '1'}
                <span className={styles.progressNodeLabel}>Destino</span>
              </div>
              <div className={`${styles.progressNode} ${step >= 2 ? styles.progressNodeActive : ''} ${step > 2 ? styles.progressNodeDone : ''}`}>
                {step > 2 ? '✓' : '2'}
                <span className={styles.progressNodeLabel}>Viajantes</span>
              </div>
              <div className={`${styles.progressNode} ${step >= 3 ? styles.progressNodeActive : ''}`}>
                3
                <span className={styles.progressNodeLabel}>Estilo</span>
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-6)' }}>
              {step === 1 && (
                <div className="fade-in">
                  <h3 className={styles.formTitle}>📍 Onde e Quando?</h3>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Destino</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Ex: Lisboa, Tóquio, Paris..."
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Duração</label>
                    <div className={styles.wizardGrid}>
                      {dayOptions.map(opt => (
                        <div 
                          key={opt.value} 
                          className={`${styles.wizardCard} ${days === opt.value ? styles.wizardCardActive : ''}`}
                          onClick={() => setDays(opt.value)}
                        >
                          <span className={styles.wizardCardIcon}>{opt.icon}</span>
                          <span className={styles.wizardCardTitle}>{opt.label}</span>
                          <span className={styles.wizardCardDesc}>{opt.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="fade-in">
                  <h3 className={styles.formTitle}>👥 Quem e Quanto?</h3>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Viajantes</label>
                    <div className={styles.wizardGrid}>
                      {travelerOptions.map(opt => (
                        <div 
                          key={opt.value} 
                          className={`${styles.wizardCard} ${travelers === opt.value ? styles.wizardCardActive : ''}`}
                          onClick={() => setTravelers(opt.value)}
                        >
                          <span className={styles.wizardCardIcon}>{opt.icon}</span>
                          <span className={styles.wizardCardTitle}>{opt.label}</span>
                          <span className={styles.wizardCardDesc}>{opt.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Orçamento estimado (por pessoa)</label>
                    <div className={styles.sliderContainer}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={styles.budgetValueBadge}>€{budget}</span>
                        <span style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: 600 }}>
                          {budget <= 250 ? '🎒 Mochileiro' : budget <= 999 ? '🏨 Conforto' : budget <= 2999 ? '✨ Luxo' : '👑 Elite/Ultra-Luxe'}
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="100" 
                        max="5000" 
                        step="50" 
                        value={budget} 
                        onChange={(e) => setBudget(parseInt(e.target.value))} 
                        className={styles.sliderInput}
                      />
                      <div className={styles.sliderLabels}>
                        <span>€100</span>
                        <span>€2500</span>
                        <span>€5000+</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="fade-in">
                  <h3 className={styles.formTitle}>🎨 Estilo e Interesses</h3>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Estilo de Viagem</label>
                    <div className={styles.wizardGrid}>
                      {styleOptions.map(opt => (
                        <div 
                          key={opt.value} 
                          className={`${styles.wizardCard} ${style === opt.value ? styles.wizardCardActive : ''}`}
                          onClick={() => setStyle(opt.value)}
                        >
                          <span className={styles.wizardCardIcon}>{opt.icon}</span>
                          <span className={styles.wizardCardTitle}>{opt.label}</span>
                          <span className={styles.wizardCardDesc}>{opt.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.formGroup} style={{ marginTop: 'var(--space-4)' }}>
                    <label className={styles.formLabel}>Interesses</label>
                    <div className={styles.tags}>
                      {interests.map(interest => (
                        <button
                          key={interest}
                          className={`${styles.tag} ${activeInterests.includes(interest) ? styles.tagActive : ''}`}
                          onClick={() => toggleInterest(interest)}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.wizardFooter}>
              {step > 1 ? (
                <button 
                  type="button" 
                  className={styles.backWizardBtn} 
                  onClick={() => setStep(step - 1)}
                >
                  Voltar
                </button>
              ) : (
                <div></div>
              )}

              {step < 3 ? (
                <button 
                  type="button" 
                  className={styles.nextWizardBtn} 
                  onClick={() => {
                    if (step === 1 && !destination) {
                      alert('Por favor, indica um destino!');
                      return;
                    }
                    setStep(step + 1);
                  }}
                >
                  Seguinte
                </button>
              ) : (
                <button 
                  className={styles.generateBtn} 
                  onClick={handleGenerate} 
                  disabled={loading}
                  style={{ width: 'auto', margin: 0 }}
                >
                  {loading ? (
                    <>Gerando...</>
                  ) : (
                    <>
                      Gerar Roteiro
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 3L10 17M10 3L5 8M10 3L15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(90 10 10)"/>
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={styles.resultSide}>
          {!loading && !result && !errorMsg && (
            <div className={styles.placeholder}>
              <div className={styles.placeholderIcon}>🌍</div>
              <div className={styles.placeholderText}>O teu roteiro aparecerá aqui</div>
              <div className={styles.placeholderSub}>Preenche os detalhes da viagem e clica em gerar</div>
            </div>
          )}

          {!loading && errorMsg && (
            <div className={styles.errorCard}>
              <div className={styles.errorIcon}>⚠️</div>
              <h3 className={styles.errorTitle}>Não foi possível criar o roteiro</h3>
              <p className={styles.errorText}>{errorMsg}</p>
              <button className={styles.retryBtn} onClick={handleGenerate}>
                Tentar Novamente
              </button>
            </div>
          )}

          {loading && (
            <div className={styles.loader}>
              <div className={styles.abstractMapLoader}>
                <svg viewBox="0 0 200 120" className={styles.abstractMapSvg}>
                  {/* Background network of dots & lines representing cities */}
                  <circle cx="30" cy="30" r="4" fill="var(--gray-300)" opacity="0.4" />
                  <circle cx="80" cy="80" r="4" fill="var(--gray-300)" opacity="0.4" />
                  <circle cx="130" cy="40" r="4" fill="var(--gray-300)" opacity="0.4" />
                  <circle cx="170" cy="90" r="4" fill="var(--gray-300)" opacity="0.4" />
                  
                  <path d="M30 30 L80 80 L130 40 L170 90" stroke="var(--gray-200)" strokeWidth="1" strokeDasharray="3 3" fill="none" />
                  
                  {/* Animated route path */}
                  <path d="M30 30 L80 80 L130 40 L170 90" stroke="url(#mapGrad)" strokeWidth="3" strokeLinecap="round" strokeDasharray="20 180" strokeDashoffset="200" fill="none" className={styles.animatedRoute} />
                  
                  {/* Plane icon animating */}
                  <g className={styles.animatedPlane}>
                    <text fontSize="14" y="5" x="-7">✈️</text>
                  </g>

                  <defs>
                    <linearGradient id="mapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--ocean)" />
                      <stop offset="100%" stopColor="var(--sunset-coral)" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div className={styles.progressFillBar} style={{ width: `${loadingProgress}%` }}></div>
                </div>
                <div className={styles.progressLabel}>{Math.round(loadingProgress)}%</div>
              </div>

              <div className={styles.loaderText}>{loadingTips[loadingTip]}</div>
            </div>
          )}

          {result && (
            <div className={styles.resultCard}>
              <div className={styles.resultHeader}>
                <h3 className={styles.resultTitle}>📍 {result.destination}</h3>
                <span className={styles.resultBadge}>✓ AI Agency Grade</span>
              </div>

              <div className={styles.agencyPreview}>
                <p className={styles.overviewText}>{result.tripOverview}</p>
                <div className={styles.agencyHighlights}>
                  {result.flights && (
                    <div className={styles.highlightItem}>
                      <span className={styles.highlightIcon}>✈️</span>
                      <div>
                        <div className={styles.highlightLabel}>Suggested Flight</div>
                        <div className={styles.highlightValue}>{result.flights.suggestion}</div>
                      </div>
                    </div>
                  )}
                  {result.accommodation && (
                    <div className={styles.highlightItem}>
                      <span className={styles.highlightIcon}>🏨</span>
                      <div>
                        <div className={styles.highlightLabel}>Recommended Stay</div>
                        <div className={styles.highlightValue}>{result.accommodation.hotelName}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {result.days.map((day, di) => (
                <div key={di} className={styles.daySection}>
                  <h4 className={styles.dayTitle}>
                    <span className={styles.dayDot}></span>
                    {day.title}
                  </h4>
                  {day.stops.map((stop, si) => (
                    <div key={si} className={styles.stop}>
                      <span className={styles.stopTime}>{stop.time}</span>
                      <div className={styles.stopInfo}>
                        <div className={styles.stopName}>{stop.name}</div>
                        <div className={styles.stopType}>{stop.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              <div className={styles.resultFooter}>
                <div className={styles.totalCost}>
                  <span className={styles.costLabel}>Estimated Total</span>
                  <span className={styles.costValue}>{result.totalCost}</span>
                </div>
                <button className="btn btn-primary" onClick={() => {
                  if (!user) {
                    window.dispatchEvent(new Event('open-auth-modal'));
                  } else {
                    saveTrip(result);
                    alert('Trip saved! Go to the Dashboard to see it.');
                  }
                }}>
                  {user ? 'Save Itinerary ✓' : 'Save Itinerary'}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{background: 'var(--navy)', color: 'white'}}
                  onClick={() => router.push(`/itinerary/${result.id}`)}
                >
                  View Full Itinerary →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
