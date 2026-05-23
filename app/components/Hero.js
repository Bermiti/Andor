'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from '../context/LanguageContext';
import styles from './Hero.module.css';

/* ──────────────────────────────────────────────
   AnimatedCounter
   ────────────────────────────────────────────── */
function AnimatedCounter({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = performance.now();
          const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ──────────────────────────────────────────────
   Constants & Autocomplete Data
   ────────────────────────────────────────────── */
const DESTINATIONS_PT = ["Tóquio", "Paris", "Bali", "Nova Iorque", "Santorini", "Marrocos"];

const AUTOCOMPLETE_DATA = [
  { city: 'Tokyo', country: 'Japan', flag: '🇯🇵', continent: 'Ásia' },
  { city: 'Paris', country: 'France', flag: '🇫🇷', continent: 'Europa' },
  { city: 'Bali', country: 'Indonesia', flag: '🇮🇩', continent: 'Ásia' },
  { city: 'Nova Iorque', country: 'USA', flag: '🇺🇸', continent: 'Américas' },
  { city: 'Lisboa', country: 'Portugal', flag: '🇵🇹', continent: 'Europa' },
  { city: 'Barcelona', country: 'Spain', flag: '🇪🇸', continent: 'Europa' },
  { city: 'Roma', country: 'Italy', flag: '🇮🇹', continent: 'Europa' },
  { city: 'Amesterdão', country: 'Netherlands', flag: '🇳🇱', continent: 'Europa' },
  { city: 'Londres', country: 'UK', flag: '🇬🇧', continent: 'Europa' },
  { city: 'Berlim', country: 'Germany', flag: '🇩🇪', continent: 'Europa' },
  { city: 'Praga', country: 'Czech Republic', flag: '🇨🇿', continent: 'Europa' },
  { city: 'Santorini', country: 'Greece', flag: '🇬🇷', continent: 'Europa' },
  { city: 'Dubrovnik', country: 'Croatia', flag: '🇭🇷', continent: 'Europa' },
  { city: 'Reykjavik', country: 'Iceland', flag: '🇮🇸', continent: 'Europa' },
  { city: 'Dubai', country: 'UAE', flag: '🇦🇪', continent: 'Médio Oriente' },
  { city: 'Marraquexe', country: 'Morocco', flag: '🇲🇦', continent: 'África' },
  { city: 'Cairo', country: 'Egypt', flag: '🇪🇬', continent: 'África' },
  { city: 'Cidade do Cabo', country: 'South Africa', flag: '🇿🇦', continent: 'África' },
  { city: 'Bangkok', country: 'Thailand', flag: '🇹🇭', continent: 'Ásia' },
  { city: 'Singapura', country: 'Singapore', flag: '🇸🇬', continent: 'Ásia' },
  { city: 'Kyoto', country: 'Japan', flag: '🇯🇵', continent: 'Ásia' },
  { city: 'Seul', country: 'South Korea', flag: '🇰🇷', continent: 'Ásia' },
  { city: 'Maldivas', country: 'Maldives', flag: '🇲🇻', continent: 'Ásia' },
  { city: 'Hanói', country: 'Vietnam', flag: '🇻🇳', continent: 'Ásia' },
  { city: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷', continent: 'Américas' },
  { city: 'Rio de Janeiro', country: 'Brazil', flag: '🇧🇷', continent: 'Américas' },
  { city: 'México City', country: 'Mexico', flag: '🇲🇽', continent: 'Américas' },
  { city: 'São Francisco', country: 'USA', flag: '🇺🇸', continent: 'Américas' },
  { city: 'Sydney', country: 'Australia', flag: '🇦🇺', continent: 'Oceânia' }
];

const COLLAGE_IMAGES = [
  'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800', // Tokyo
  'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800', // Santorini
  'https://images.unsplash.com/photo-1553603227-2358aabe821e?w=800', // Morocco
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800', // New York
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', // Bali
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', // Paris
  'https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=800', // Iceland
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', // Dubai
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', // Kyoto
];

/* ──────────────────────────────────────────────
   Hero Component
   ────────────────────────────────────────────── */
export default function Hero({ onOpenWizard }) {
  const heroRef = useRef(null);
  const dropdownRef = useRef(null);
  const travelersRef = useRef(null);
  const t = useTranslations('hero');

  // Destination typings
  const [destination, setDestination] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('andor_user');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          if (u.name) setUserName(u.name);
        } catch (e) {}
      }
    }
  }, []);

  // Date selectors
  const [dateArrival, setDateArrival] = useState('');
  const [dateDeparture, setDateDeparture] = useState('');

  // Travelers count separate
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [showTravelers, setShowTravelers] = useState(false);

  // Rotating words
  const [wordIdx, setWordIdx] = useState(0);
  const [fadeClass, setFadeClass] = useState(styles.fadeUpEnter);

  // Exploring anim
  const [isExploring, setIsExploring] = useState(false);

  // Live Counter state
  const [liveCounter, setLiveCounter] = useState(0);

  useEffect(() => {
    setLiveCounter(200 + Math.floor(Math.random() * 100));
  }, []);

  useEffect(() => {
    if (liveCounter === 0) return;
    const interval = setInterval(() => {
      const delta = Math.floor(Math.random() * 21) - 10; // -10 to +10
      setLiveCounter(prev => Math.max(100, prev + delta));
    }, 8000 + Math.random() * 7000); // 8-15s
    return () => clearInterval(interval);
  }, [liveCounter]);

  // Word rotations
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeClass(styles.fadeUpExit);
      setTimeout(() => {
        setWordIdx((prev) => (prev + 1) % DESTINATIONS_PT.length);
        setFadeClass(styles.fadeUpEnter);
      }, 350);
    }, 2150); // 2.5s cycle total (2150ms + 350ms transition)
    return () => clearInterval(interval);
  }, []);

  const filteredDestinations = destination.trim().length >= 2
    ? AUTOCOMPLETE_DATA.filter((d) =>
        d.city.toLowerCase().includes(destination.toLowerCase()) ||
        d.country.toLowerCase().includes(destination.toLowerCase())
      )
    : AUTOCOMPLETE_DATA.slice(0, 6);

  useEffect(() => {
    setActiveSuggestionIdx(0);
  }, [destination]);

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase()
            ? <strong key={i} style={{ color: 'var(--gold)' }}>{part}</strong>
            : part
        )}
      </>
    );
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIdx((prev) => 
        (prev + 1) % filteredDestinations.length
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIdx((prev) => 
        (prev - 1 + filteredDestinations.length) % filteredDestinations.length
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredDestinations[activeSuggestionIdx]) {
        handleSelectDestination(filteredDestinations[activeSuggestionIdx]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleSelectDestination = (destItem) => {
    const formatted = `${destItem.city}, ${destItem.country}`;
    setDestination(formatted);
    setShowDropdown(false);
    onOpenWizard(formatted, 2);
  };

  const handleOpenWizardDefault = () => {
    onOpenWizard('', 1);
  };

  // Handle outside clicks for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (travelersRef.current && !travelersRef.current.contains(e.target)) {
        setShowTravelers(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Parallax translation
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        heroRef.current.style.setProperty('--scroll-y', `${window.scrollY}px`);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleExploreSubmit = (e) => {
    e.preventDefault();
    setIsExploring(true);
    setTimeout(() => {
      setIsExploring(false);
      // Dispatch search custom event caught by FloatingAi (chat panel)
      const event = new CustomEvent('andor-search-trigger', {
        detail: {
          destination: destination || 'Lisboa, Portugal',
          dateArrival,
          dateDeparture,
          adults,
          children
        }
      });
      window.dispatchEvent(event);
    }, 1600);
  };

  const handleScrollToSection = useCallback((e, targetId) => {
    e.preventDefault();
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <section ref={heroRef} className={styles.hero} id="hero">
      {/* Option A: Collage Dinâmico Parallax Grid */}
      <div 
        className={styles.collageGrid} 
        style={{ transform: 'translateY(calc(var(--scroll-y, 0px) * 0.18))' }}
      >
        {COLLAGE_IMAGES.map((url, i) => (
          <div key={i} className={styles.collageItem}>
            <img src={url} alt="Destino" loading="lazy" />
          </div>
        ))}
      </div>

      {/* Dark overlay gradient mask */}
      <div className={styles.overlay} />

      {/* Floating Notification Cards */}
      <div 
        className={`${styles.floatingCard} ${styles.floatingCard1}`}
        style={{ transform: 'translateY(calc(var(--scroll-y, 0px) * -0.12))' }}
      >
        <div className={styles.floatingCardInner}>
          <div className={styles.floatIcon}>🗺️</div>
          <div className={styles.floatText}>
            <span className={styles.floatTitle}>Rota Otimizada</span>
            <span className={styles.floatSub}>Menos 45 min de trânsito</span>
          </div>
        </div>
      </div>

      <div 
        className={`${styles.floatingCard} ${styles.floatingCard2}`}
        style={{ transform: 'translateY(calc(var(--scroll-y, 0px) * -0.22))' }}
      >
        <div className={styles.floatingCardInner}>
          <div className={styles.floatIcon}>⚡</div>
          <div className={styles.floatText}>
            <span className={styles.floatTitle}>AI Concierge Ativo</span>
            <span className={styles.floatSub}>Plano adaptado a chuva</span>
          </div>
        </div>
      </div>

      <div 
        className={`${styles.floatingCard} ${styles.floatingCard3}`}
        style={{ transform: 'translateY(calc(var(--scroll-y, 0px) * -0.06))' }}
      >
        <div className={styles.floatingCardInner}>
          <div className={styles.floatIcon}>💰</div>
          <div className={styles.floatText}>
            <span className={styles.floatTitle}>Orçamento: 84%</span>
            <span className={styles.floatSub}>Sob controlo</span>
          </div>
        </div>
      </div>

      {/* Centered Main Layout */}
      <div className={styles.content}>
        {userName && (
          <div className={styles.personalGreeting}>
            Olá, {userName}! Com base no teu perfil...
          </div>
        )}
        {/* Editorial Heading */}
        <h1 className={styles.title}>
          <div className={styles.descobreText}>{t('discover')}</div>
          <div className={`${styles.rotatingWord} ${fadeClass}`}>
            {DESTINATIONS_PT[wordIdx]}
          </div>
        </h1>

        {/* Subtitle with increased contrast and text shadow */}
        <p className={styles.subtitle}>
          {t('subtitle')}
        </p>

        {/* Redesigned Search CTA - Opens Wizard */}
        <div className={styles.searchBar} ref={dropdownRef}>
          <div className={styles.searchRow}>
            <div className={styles.searchField}>
              <div className={styles.searchFieldLabel}>
                <span className={styles.fieldIcon}>🔍</span> {t('search_label') || 'Para onde sonhas ir?'}
              </div>
              <input
                type="text"
                placeholder="Ex: Tóquio, Paris, Bali..."
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleKeyDown}
              />
              {showDropdown && (
                <div className={styles.dropdownList}>
                  {filteredDestinations.map((d, index) => (
                    <div
                      key={index}
                      className={`${styles.dropdownItem} ${activeSuggestionIdx === index ? styles.dropdownItemActive : ''}`}
                      onClick={() => handleSelectDestination(d)}
                    >
                      <span className={styles.dropdownFlag}>{d.flag}</span>
                      <span className={styles.dropdownName}>
                        {highlightMatch(`${d.city}, ${d.country}`, destination)}
                      </span>
                      <span className={styles.dropdownContinent} style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.6 }}>
                        {d.continent}
                      </span>
                    </div>
                  ))}
                  {filteredDestinations.length === 0 && (
                    <div style={{ padding: '12px 16px', fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
                      Sem resultados encontrados
                    </div>
                  )}
                </div>
              )}
            </div>
            <button 
              className={styles.exploreBtn} 
              onClick={handleOpenWizardDefault}
            >
              ✨ Começar
            </button>
          </div>
        </div>



        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              <AnimatedCounter end={50} suffix="K+" />
            </span>
            <span className={styles.statLabel}>{t('stats_trips')}</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              <AnimatedCounter end={120} suffix="+" />
            </span>
            <span className={styles.statLabel}>{t('stats_countries')}</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              <AnimatedCounter end={49} suffix="" duration={2500} />
              <span className={styles.starIcon}>★</span>
            </span>
            <span className={styles.statLabel}>{t('stats_rating')}</span>
          </div>
        </div>

        {/* Live Active Explorers Counter */}
        <div className={styles.liveCounterContainer} style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontWeight: 600, fontSize: '0.92rem' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', animation: 'pulse 1.8s infinite' }}></span>
          {liveCounter} pessoas a explorar destinos agora
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className={styles.scrollIndicator}
        onClick={(e) => handleScrollToSection(e, 'destinos')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') handleScrollToSection(e, 'destinos'); }}
      >
        <svg
          className={styles.scrollChevron}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <span className={styles.scrollText}>SCROLL PARA EXPLORAR</span>
      </div>

      {/* Wave Transition to fold */}
      <div className={styles.waveBottom}>
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0 40C240 10 480 70 720 40C960 10 1200 70 1440 40V80H0V40Z" fill="var(--bg-secondary)" />
        </svg>
      </div>
    </section>
  );
}
