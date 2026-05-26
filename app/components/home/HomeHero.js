'use client';
import { useMemo, useRef, useState, useEffect } from 'react';
import styles from './HomeHero.module.css';
import ActiveTravelers from '../ActiveTravelers';
import AnimatedCounter from '../AnimatedCounter';

const destinations = ['Tóquio', 'Paris', 'Nova Iorque', 'Roma', 'Lisboa', 'Bali'];

const destinationPhotos = {
  tokyo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
  paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
  bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
  barcelona: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4',
  rome: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5',
  amsterdam: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017',
  'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9',
  marrakech: 'https://images.unsplash.com/photo-1553603227-2358aabe821e',
  london: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad',
  santorini: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff',
};

const destinationOptions = [
  { city: 'Tokyo', country: 'Japan', region: 'Ásia', flag: '🇯🇵', slug: 'tokyo', popularity: 100 },
  { city: 'Paris', country: 'France', region: 'Europa', flag: '🇫🇷', slug: 'paris', popularity: 98 },
  { city: 'Paraty', country: 'Brasil', region: 'América do Sul', flag: '🇧🇷', slug: 'paraty', popularity: 74 },
  { city: 'Bali', country: 'Indonesia', region: 'Ásia', flag: '🇮🇩', slug: 'bali', popularity: 94 },
  { city: 'Barcelona', country: 'Spain', region: 'Europa', flag: '🇪🇸', slug: 'barcelona', popularity: 91 },
  { city: 'Rome', country: 'Italy', region: 'Europa', flag: '🇮🇹', slug: 'rome', popularity: 90 },
  { city: 'Amsterdam', country: 'Netherlands', region: 'Europa', flag: '🇳🇱', slug: 'amsterdam', popularity: 86 },
  { city: 'New York', country: 'USA', region: 'América do Norte', flag: '🇺🇸', slug: 'new york', popularity: 88 },
  { city: 'Marrakech', country: 'Morocco', region: 'África', flag: '🇲🇦', slug: 'marrakech', popularity: 82 },
  { city: 'London', country: 'United Kingdom', region: 'Europa', flag: '🇬🇧', slug: 'london', popularity: 87 },
  { city: 'Santorini', country: 'Greece', region: 'Europa', flag: '🇬🇷', slug: 'santorini', popularity: 84 },
];

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
  const [selectedPhoto, setSelectedPhoto] = useState('');
  const [chatStep, setChatStep] = useState(0);
  const dateInputRef = useRef(null);

  const filteredDestinations = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return destinationOptions
      .filter((item) => `${item.city} ${item.country}`.toLowerCase().includes(term))
      .sort((a, b) => {
        const aExact = a.city.toLowerCase().startsWith(term) ? 1 : 0;
        const bExact = b.city.toLowerCase().startsWith(term) ? 1 : 0;
        return bExact - aExact || b.popularity - a.popularity;
      })
      .slice(0, 5);
  }, [query]);

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

  const handleDestinationSelect = (destination) => {
    const value = `${destination.city}, ${destination.country}`;
    setQuery(value);
    setSelectedPhoto(`${destinationPhotos[destination.slug]}?auto=format&fit=crop&w=2200&q=85`);
    setIsFocused(false);
    window.setTimeout(() => dateInputRef.current?.focus(), 80);
  };

  const renderHighlighted = (name) => {
    const term = query.trim();
    if (!term) return name;
    const idx = name.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return name;
    return (
      <>
        {name.slice(0, idx)}
        <mark>{name.slice(idx, idx + term.length)}</mark>
        {name.slice(idx + term.length)}
      </>
    );
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
      <div
        className={`${styles.destinationBackdrop} ${selectedPhoto ? styles.destinationBackdropVisible : ''}`}
        style={selectedPhoto ? { backgroundImage: `url(${selectedPhoto})` } : undefined}
        aria-hidden="true"
      />
      <div className={styles.bgOverlay}></div>

      <div className={styles.container}>
        <div className={styles.contentLeft}>
          <div className="animate-fade-in-up">
            <h1 className={styles.title}>
              Descobre <br/>
              <span className={styles.goldText} key={destIndex}>{destinations[destIndex]}</span>
            </h1>
            <p className={styles.subtitle}>
              Planeador de viagens com IA que transforma uma ideia num itinerário completo: voos, hotéis, rotas, restaurantes e segredos locais.
            </p>
            
            <ActiveTravelers embedded={true} />
            <div className={styles.statsBar} aria-label="Confiança Andor">
              <span><AnimatedCounter target={50} suffix="K+" /> viagens</span>
              <span><AnimatedCounter target={4.9} suffix="★" decimals={1} /> média</span>
              <span><AnimatedCounter target={120} suffix="+" /> países</span>
            </div>

            <form onSubmit={handleSearch} className={`${styles.searchForm} ${isFocused ? styles.focused : ''}`} data-testid="home-search-form">
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
                  data-testid="home-destination-input"
                />
              </div>
              <input
                ref={dateInputRef}
                type="date"
                value={travelDate}
                onChange={(event) => setTravelDate(event.target.value)}
                className={styles.compactInput}
                aria-label="Data de partida"
                data-testid="home-date-input"
              />
              <select
                value={travelers}
                onChange={(event) => setTravelers(event.target.value)}
                className={styles.compactInput}
                aria-label="Viajantes"
                data-testid="home-travellers-input"
              >
                <option value="1">1 viajante</option>
                <option value="2">2 viajantes</option>
                <option value="3">3 viajantes</option>
                <option value="4">4 viajantes</option>
                <option value="5">5+ viajantes</option>
              </select>
              <button type="submit" className={styles.searchButton} data-testid="home-explore-button">
                Desenhar a viagem
              </button>

              {isFocused && filteredDestinations.length > 0 && (
                <div className={styles.autocomplete}>
                  {filteredDestinations.map((destination) => (
                    <button
                      type="button"
                      key={`${destination.city}-${destination.country}`}
                      className={styles.autoItem}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleDestinationSelect(destination);
                      }}
                    >
                      <span className={styles.autoMain}>
                        <span>{destination.flag}</span>
                        <strong>{renderHighlighted(destination.city)}</strong>
                        <span>{destination.country}</span>
                      </span>
                      <span className={styles.autoRegion}>{destination.region}</span>
                    </button>
                  ))}
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
