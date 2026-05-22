'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CreationWizard.module.css';

const AUTOCOMPLETE_DATA = [
  { name: 'Lisboa, Portugal', flag: '🇵🇹' },
  { name: 'Tóquio, Japão', flag: '🇯🇵' },
  { name: 'Paris, França', flag: '🇫🇷' },
  { name: 'Nova Iorque, EUA', flag: '🇺🇸' },
  { name: 'Bali, Indonésia', flag: '🇮🇩' }
];

export default function CreationWizard({ isOpen, onClose }) {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState('');
  const [isSurprise, setIsSurprise] = useState(false);
  const [dates, setDates] = useState({ start: '', end: '', flexible: false });
  const [travelers, setTravelers] = useState({ adults: 2, children: 0 });
  const [stylesList, setStylesList] = useState([]);
  const [budgetTier, setBudgetTier] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

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
        days: 5, // calculate from dates ideally
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
      alert('Erro ao gerar itinerário');
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
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.surpriseBox}>
                    <h3>Temos o destino perfeito para esta época.</h3>
                    <p>Vamos escolher baseado no clima e eventos actuais.</p>
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
                    { id: 'aventura', icon: '🏔️', label: 'Aventura' },
                    { id: 'gastronomia', icon: '🍽️', label: 'Gastronomia' },
                    { id: 'cultura', icon: '🏛️', label: 'Cultura' },
                    { id: 'romance', icon: '💑', label: 'Romance' },
                    { id: 'familia', icon: '👨‍👩‍👧', label: 'Família' },
                    { id: 'bem-estar', icon: '🧘', label: 'Bem-estar' }
                  ].map(s => (
                    <div 
                      key={s.id} 
                      className={`${styles.styleCard} ${stylesList.includes(s.id) ? styles.selected : ''}`}
                      onClick={() => handleStyleToggle(s.id)}
                    >
                      <span className={styles.styleIcon}>{s.icon}</span>
                      <span className={styles.styleLabel}>{s.label}</span>
                    </div>
                  ))}
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
            <h2 className={styles.loadingText}>A planear a viagem da tua vida...</h2>
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
