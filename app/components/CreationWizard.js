'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './ToastProvider';
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

  useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
      setDestination(initialDestination);
      setIsSurprise(false);
    }
  }, [isOpen, initialDestination, initialStep]);

  // Backgrounds map
  const bgMap = {
    'Tóquio, Japão': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600',
    'Paris, França': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600',
    'Bali, Indonésia': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600',
    'Nova Iorque, EUA': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600',
    'Lisboa, Portugal': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1600'
  };
  const [bgImage, setBgImage] = useState('');

  useEffect(() => {
    if (bgMap[destination]) setBgImage(bgMap[destination]);
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

  const handleStyleToggle = (style) => {
    if (stylesList.includes(style)) {
      setStylesList(stylesList.filter(s => s !== style));
    } else {
      if (stylesList.length < 2) setStylesList([...stylesList, style]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Plane takeoff animation starts (CSS controlled by isSubmitting)
    
    // Simulate API call for aurora loader
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
      
      const data = await response.json();
      
      // We import saveGeneratedItinerary inline to avoid issues
      const { saveGeneratedItinerary } = await import('../lib/itinerary-store');
      const newId = saveGeneratedItinerary(data);
      
      // Delay to show takeoff animation
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
        router.push(`/itinerary/${newId}`);
      }, 1500);

    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      showToast('❌ Erro ao gerar itinerário. Tenta novamente.', 'error');
    }
  };

  const filteredDestinations = AUTOCOMPLETE_DATA.filter(d => d.name.toLowerCase().includes(destination.toLowerCase()));

  return (
    <div className={styles.wizardOverlay}>
      {bgImage && <div className={styles.wizardBg} style={{ backgroundImage: `url(${bgImage})` }}></div>}
      <div className={styles.wizardBgMask}></div>
      
      <div className={styles.wizardContainer}>
        {/* Progress Bar */}
        <div className={styles.progressBarWrapper}>
          <div className={styles.progressBar} style={{ width: `${(step / 4) * 100}%` }}></div>
        </div>

        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        {!isSubmitting ? (
          <div className={styles.wizardContent}>
            
            {/* STEP 1: DESTINATION */}
            {step === 1 && (
              <div className={styles.stepFadeIn}>
                <h2 className={styles.stepTitle}>Para onde vais?</h2>
                <div className={styles.destToggleRow}>
                  <button 
                    className={`${styles.destToggle} ${!isSurprise ? styles.active : ''}`}
                    onClick={() => setIsSurprise(false)}
                  >
                    Tenho destino
                  </button>
                  <button 
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
                    />
                    {showDropdown && destination && filteredDestinations.length > 0 && (
                      <div className={styles.autocomplete}>
                        {filteredDestinations.map(d => (
                          <div key={d.name} className={styles.autoItem} onClick={() => { setDestination(d.name); setShowDropdown(false); }}>
                            <span>{d.flag}</span> {d.name}
                            {d.continent && <span className={styles.autoContinent}>{d.continent}</span>}
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
                
                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label>Partida</label>
                    <input type="date" className={styles.dateInput} value={dates.start} onChange={e => setDates({...dates, start: e.target.value})} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Regresso</label>
                    <input type="date" className={styles.dateInput} value={dates.end} onChange={e => setDates({...dates, end: e.target.value})} />
                  </div>
                </div>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={dates.flexible} onChange={e => setDates({...dates, flexible: e.target.checked})} />
                  Datas Flexíveis (±3 dias)
                </label>

                <div className={styles.travelersBox}>
                  <div className={styles.travelerRow}>
                    <span>Adultos</span>
                    <div className={styles.stepper}>
                      <button onClick={() => setTravelers({...travelers, adults: Math.max(1, travelers.adults - 1)})}>-</button>
                      <span>{travelers.adults}</span>
                      <button onClick={() => setTravelers({...travelers, adults: travelers.adults + 1})}>+</button>
                    </div>
                  </div>
                  <div className={styles.travelerRow}>
                    <span>Crianças</span>
                    <div className={styles.stepper}>
                      <button onClick={() => setTravelers({...travelers, children: Math.max(0, travelers.children - 1)})}>-</button>
                      <span>{travelers.children}</span>
                      <button onClick={() => setTravelers({...travelers, children: travelers.children + 1})}>+</button>
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
                    { id: 'aventura', icon: '🏔️', label: 'Aventura', desc: 'Trilhos, desportos extremos e natureza selvagem', bg: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=70' },
                    { id: 'gastronomia', icon: '🍽️', label: 'Gastronomia', desc: 'Mercados locais, restaurantes estrelados e cooking classes', bg: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=70' },
                    { id: 'cultura', icon: '🏛️', label: 'Cultura', desc: 'Museus, história, arte e arquitectura', bg: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=70' },
                    { id: 'romance', icon: '💑', label: 'Romance', desc: 'Experiências íntimas, sunsets e jantares especiais', bg: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&q=70' },
                    { id: 'familia', icon: '👨‍👩‍👧', label: 'Família', desc: 'Actividades para todas as idades, ritmo mais calmo', bg: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400&q=70' },
                    { id: 'bem-estar', icon: '🧘', label: 'Bem-estar', desc: 'Spas, yoga, natureza e desconexão total', bg: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=70' }
                  ].map(s => {
                    const isSelected = stylesList.includes(s.id);
                    return (
                      <div 
                        key={s.id} 
                        className={`${styles.styleCard} ${isSelected ? styles.selected : ''}`}
                        onClick={() => handleStyleToggle(s.id)}
                      >
                        <div className={styles.styleCardBg} style={{ backgroundImage: `url(${s.bg})` }}></div>
                        <div className={styles.styleCardMask}></div>
                        {isSelected && <div className={styles.checkmark}>✓</div>}
                        <div className={styles.styleCardContent}>
                          <span className={styles.styleIcon}>{s.icon}</span>
                          <span className={styles.styleLabel}>{s.label}</span>
                          <span className={styles.styleDesc}>{s.desc}</span>
                        </div>
                      </div>
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
                  ].map(t => (
                    <div 
                      key={t.id} 
                      className={`${styles.budgetCard} ${budgetTier === t.id ? styles.selected : ''}`}
                      onClick={() => setBudgetTier(t.id)}
                    >
                      <div className={styles.budgetTop}>
                        <strong>{t.name}</strong>
                        <span className={styles.budgetRange}>{t.range}</span>
                      </div>
                      <div className={styles.budgetDesc}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div className={styles.wizardFooter}>
              {step > 1 ? (
                <button className={styles.backBtn} onClick={handleBack}>Voltar</button>
              ) : <div></div>}
              
              {step < 4 ? (
                <button className={styles.nextBtn} onClick={handleNext} disabled={step===1 && !isSurprise && !destination}>
                  Continuar →
                </button>
              ) : (
                <button className={styles.submitBtn} onClick={handleSubmit} disabled={!budgetTier}>
                  ✨ Criar o Meu Itinerário
                </button>
              )}
            </div>
            
          </div>
        ) : (
          /* LOADING SCREEN (Aurora + Takeoff) */
          <div className={styles.loadingScreen}>
            <div className={styles.auroraBg}></div>
            <div className={styles.takeoffAnim}>
              ✈️
            </div>
            <h2 className={styles.loadingText}>
              <LoadingTextRotator />
            </h2>
            <div className={styles.fakeProgress}>
              <div className={styles.fakeProgressBar}></div>
            </div>
            <p className={styles.loadingTip}>A cruzar dados de hotéis, voos e segredos locais.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingTextRotator() {
  const texts = [
    "A planear a viagem da tua vida...",
    "A analisar opções de voos e hotéis...",
    "A descobrir segredos locais...",
    "A desenhar o itinerário perfeito..."
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
