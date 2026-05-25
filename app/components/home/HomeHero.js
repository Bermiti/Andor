'use client';
import { useState, useEffect } from 'react';
import styles from './HomeHero.module.css';
import ActiveTravelers from '../ActiveTravelers';

const destinations = ['Tóquio', 'Paris', 'Nova Iorque', 'Roma', 'Lisboa', 'Bali'];

const bgImages = [
  'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1509840841025-9088ba78a826?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504150558240-0b4fd8946624?q=80&w=800&auto=format&fit=crop'
];

const chatSequence = [
  { type: 'user', text: 'Vou a Paris em Outubro com a minha namorada. 5 dias.' },
  { type: 'ai', text: 'Fantástico! Paris no outono é mágico. Qual é o orçamento aproximado?' },
  { type: 'user', text: 'Cerca de 1500€ para os dois, sem voos.' },
  { type: 'ai', text: 'Perfeito. A desenhar um itinerário romântico e equilibrado: cafés em Le Marais, jantar no Sena e passeios artísticos...' }
];

export default function HomeHero({ onOpenWizard }) {
  const [destIndex, setDestIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [travelers, setTravelers] = useState('2');
  const [isFocused, setIsFocused] = useState(false);
  
  const [chatStep, setChatStep] = useState(0);

  // Rotate destination text
  useEffect(() => {
    const interval = setInterval(() => {
      setDestIndex((prev) => (prev + 1) % destinations.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Animate Chat Sequence
  useEffect(() => {
    if (chatStep >= chatSequence.length) return;
    
    const delays = [1000, 2000, 1500, 2500]; // simulate typing delays
    const timer = setTimeout(() => {
      setChatStep(prev => prev + 1);
    }, delays[chatStep]);
    
    return () => clearTimeout(timer);
  }, [chatStep]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onOpenWizard) onOpenWizard(query, 1);
  };

  return (
    <section className={styles.heroWrapper}>
      {/* 3x3 Grid Background */}
      <div className={styles.bgGrid}>
        {bgImages.map((src, i) => (
          <div key={i} className={styles.gridImgWrapper}>
            <img
              src={src}
              alt="Destino"
              className={styles.gridImg}
              style={{ animationDelay: `-${i * 2}s` }}
              width="800"
              height="600"
              loading={i < 3 ? 'eager' : 'lazy'}
              decoding="async"
            />
          </div>
        ))}
      </div>
      <div className={styles.bgOverlay}></div>

      <div className={styles.container}>
        <div className={styles.contentLeft}>
          <div className="animate-fade-in-up">
            <h1 className={styles.title}>
              Descobre <br/>
              <span className={styles.goldText} key={destIndex}>{destinations[destIndex]}</span>
            </h1>
            <p className={styles.subtitle}>
              O teu concierge de viagens IA. Planeamento perfeito, personalizado e instantâneo.
            </p>
            
            <ActiveTravelers embedded={true} />

            <form onSubmit={handleSearch} className={`${styles.searchForm} ${isFocused ? styles.focused : ''}`}>
              <div className={styles.searchField}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  placeholder="Para onde queres ir?" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className={styles.searchInput}
                  aria-label="Destino"
                />
              </div>
              <input
                type="date"
                value={travelDate}
                onChange={(event) => setTravelDate(event.target.value)}
                className={styles.compactInput}
                aria-label="Data de partida"
              />
              <select
                value={travelers}
                onChange={(event) => setTravelers(event.target.value)}
                className={styles.compactInput}
                aria-label="Viajantes"
              >
                <option value="1">1 viajante</option>
                <option value="2">2 viajantes</option>
                <option value="3">3 viajantes</option>
                <option value="4">4 viajantes</option>
                <option value="5">5+ viajantes</option>
              </select>
              <button type="submit" className={styles.searchButton}>
                Desenhar a viagem
              </button>

              {/* Autocomplete mocked dropdown */}
              {isFocused && query.length > 0 && (
                <div className={styles.autocomplete}>
                  <div className={styles.autoItem} onMouseDown={() => setQuery(query + ' (Capital)')}>{query} (Capital)</div>
                  <div className={styles.autoItem} onMouseDown={() => setQuery(query + ' e arredores')}>{query} e arredores</div>
                </div>
              )}
            </form>
          </div>
        </div>

        <div className={styles.contentRight}>
          <div className={`${styles.chatShowcase} glass`}>
            <div className={styles.chatHeader}>
              <div className={styles.chatAvatar}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12 2.1 7.1"/></svg>
              </div>
              <div className={styles.chatHeaderInfo}>
                <h4>Andor Concierge</h4>
                <span>Online</span>
              </div>
            </div>
            <div className={styles.chatBody}>
              {chatSequence.slice(0, chatStep).map((msg, i) => (
                <div key={i} className={`${styles.chatMsg} ${msg.type === 'ai' ? styles.msgAi : styles.msgUser}`}>
                  {msg.text}
                </div>
              ))}
              {chatStep < chatSequence.length && chatSequence[chatStep].type === 'ai' && (
                <div className={`${styles.chatMsg} ${styles.msgAi} ${styles.typing}`}>
                  <span className={styles.dot}></span><span className={styles.dot}></span><span className={styles.dot}></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
