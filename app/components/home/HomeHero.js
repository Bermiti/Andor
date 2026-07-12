'use client';
import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { Compass, FileText, Search, Sparkles, WalletCards } from 'lucide-react';
import styles from './HomeHero.module.css';

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
  'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1509840841025-9088ba78a826?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504150558240-0b4fd8946624?q=80&w=800&auto=format&fit=crop'
];

const salesChatSequence = [
  { type: 'user', text: 'Vou a Paris em Outubro com a minha namorada. 5 dias.' },
  { type: 'ai', text: 'Perfeito. Vou equilibrar bairros bonitos, reservas prioritárias e deslocações curtas.' },
  { type: 'user', text: 'Orçamento de 1500€ para os dois, sem voos.' },
  { type: 'ai', text: 'A criar um plano de 5 dias com custos por dia, reservas importantes e PDF para partilhar.' }
];

export default function HomeHero({ onOpenWizard }) {
  const [destIndex, setDestIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState('');
  const [selectedDestinationName, setSelectedDestinationName] = useState('');
  const [chatStep, setChatStep] = useState(1);
  const displayDestination = selectedDestinationName || destinations[destIndex];

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

  // Rotate destination text with smooth animation
  const [animState, setAnimState] = useState('visible');
  
  useEffect(() => {
    if (selectedDestinationName) return;

    const interval = setInterval(() => {
      setAnimState('exit');
      setTimeout(() => {
        setDestIndex((prev) => (prev + 1) % destinations.length);
        setAnimState('enter');
        setTimeout(() => setAnimState('visible'), 400);
      }, 400);
      }, 2500);
    return () => clearInterval(interval);
  }, [selectedDestinationName]);

  // Animate Chat Sequence
  useEffect(() => {
    if (chatStep >= salesChatSequence.length) return;
    
    const delays = [1000, 2000, 1500, 2500]; // simulate typing delays
    const timer = setTimeout(() => {
      setChatStep(prev => prev + 1);
    }, delays[chatStep]);
    
    return () => clearTimeout(timer);
  }, [chatStep]);

  const handleSearch = (e) => {
    e.preventDefault();
    setIsFocused(false);
    if (onOpenWizard) {
      onOpenWizard(query, 1);
    }
  };

  const handleDestinationSelect = (destination) => {
    const value = `${destination.city}, ${destination.country}`;
    setQuery(value);
    setSelectedDestinationName(destination.city === 'Tokyo' ? 'Tóquio' : destination.city);
    setSelectedPhoto(`${destinationPhotos[destination.slug]}?auto=format&fit=crop&w=2200&q=85`);
    setIsFocused(false);
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
            <Image
              src={src}
              alt="Destino"
              width={800}
              height={600}
              className={styles.gridImg}
              style={{ animationDelay: `-${i * 2}s` }}
              loading={i < 6 ? 'eager' : 'lazy'}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality={75}
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
          <div>
            <h1 className={styles.title}>
              Descobre <br/>
              <span 
                className={styles.goldText}
                style={{
                  opacity: animState === 'visible' ? 1 : 0,
                  transform: animState === 'exit' ? 'translateY(-20px)' : 
                            animState === 'enter' ? 'translateY(20px)' : 'translateY(0)',
                  transition: 'opacity 400ms, transform 400ms',
                  display: 'inline-block',
                }}
              >
                {displayDestination}
              </span>{' '}
              com um concierge AI
            </h1>
            <p className={styles.subtitle}>
              Transforma uma ideia vaga num roteiro pronto a usar: dias estruturados, orçamento, reservas importantes e um dossier bonito para levar ou enviar.
            </p>
            <div className={styles.statsBar} aria-label="Provas do produto">
              <span><Sparkles size={14} aria-hidden="true" /> Plano em minutos</span>
              <span><WalletCards size={14} aria-hidden="true" /> Orçamento claro</span>
              <span><FileText size={14} aria-hidden="true" /> PDF partilhável</span>
            </div>

            <form onSubmit={handleSearch} className={`${styles.searchForm} ${isFocused ? styles.focused : ''}`} data-testid="home-search-form">
              <div className={`${styles.fieldShell} ${styles.destinationShell}`}>
                <label className={styles.fieldLabel} htmlFor="home-destination-input">
                  Destino
                </label>
                <div className={styles.searchField}>
                  <Search size={22} aria-hidden="true" />
                  <input 
                    id="home-destination-input"
                    type="text" 
                    placeholder="Cidade, país ou ideia de viagem" 
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSelectedDestinationName('');
                      setSelectedPhoto('');
                      setIsFocused(true);
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
                    className={styles.searchInput}
                    aria-label="Destino"
                    aria-expanded={isFocused && filteredDestinations.length > 0}
                    autoComplete="off"
                    data-testid="home-destination-input"
                  />
                </div>

                {isFocused && filteredDestinations.length > 0 && (
                  <div className={styles.autocomplete} role="listbox" aria-label="Sugestões de destino">
                    {filteredDestinations.map((destination) => (
                      <button
                        type="button"
                        key={`${destination.city}-${destination.country}`}
                        className={styles.autoItem}
                        role="option"
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
              </div>

              <div className={styles.formControls}>
                <button type="submit" className={styles.searchButton} onClick={handleSearch} data-testid="home-explore-button">
                  Criar roteiro
                </button>
              </div>

              <p className={styles.formHint}>
                Começa com uma cidade. Podes afinar datas, orçamento e ritmo no passo seguinte.
              </p>
            </form>
          </div>
        </div>

        <div className={styles.contentRight}>
          <div className={`${styles.chatShowcase} glass`}>
            <div className={styles.chatHeader}>
              <div className={styles.chatAvatar}>
                <Compass size={18} aria-hidden="true" />
              </div>
              <div className={styles.chatHeaderInfo}>
                <h4>Andor Concierge</h4>
                <span>Online</span>
              </div>
            </div>
            <div className={styles.chatBody}>
              {salesChatSequence.slice(0, chatStep).map((msg, i) => (
                <div key={i} className={`${styles.chatMsg} ${msg.type === 'ai' ? styles.msgAi : styles.msgUser}`}>
                  {msg.text}
                </div>
              ))}
              {chatStep < salesChatSequence.length && salesChatSequence[chatStep].type === 'ai' && (
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
