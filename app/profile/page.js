'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './profile.module.css';

// Simple world map vector paths for major countries to highlight visited/planned countries
const COUNTRY_PATHS = [
  { id: '840', name: 'EUA', path: 'M15,25 L35,25 L35,38 L15,38 Z M20,18 L30,18 L30,24 L20,24 Z' }, // USA & Alaska
  { id: '124', name: 'Canadá', path: 'M12,8 L40,8 L40,22 L12,22 Z' }, // Canada
  { id: '484', name: 'México', path: 'M22,39 L28,39 L26,45 L22,43 Z' }, // Mexico
  { id: '076', name: 'Brasil', path: 'M30,50 L45,46 L48,60 L38,65 Z' }, // Brazil
  { id: '032', name: 'Argentina', path: 'M35,66 L42,66 L38,82 L34,82 Z' }, // Argentina
  { id: '620', name: 'Portugal', path: 'M45,28 L47,28 L47,30 L45,30 Z' }, // Portugal
  { id: '724', name: 'Espanha', path: 'M47,29 L51,28 L51,32 L47,32 Z' }, // Spain
  { id: '250', name: 'França', path: 'M49,24 L53,24 L53,27 L49,27 Z' }, // France
  { id: '380', name: 'Itália', path: 'M53,28 L55,32 L53,34 L52,30 Z' }, // Italy
  { id: '826', name: 'Reino Unido', path: 'M47,20 L49,20 L49,23 L47,23 Z' }, // UK
  { id: '276', name: 'Alemanha', path: 'M52,22 L55,22 L55,25 L52,25 Z' }, // Germany
  { id: '300', name: 'Grécia', path: 'M55,33 L57,33 L57,35 L55,35 Z' }, // Greece
  { id: '191', name: 'Croácia', path: 'M54,29 L56,29 L56,31 L54,31 Z' }, // Croatia
  { id: '352', name: 'Islândia', path: 'M41,14 L45,14 L45,16 M41,16 Z' }, // Iceland
  { id: '528', name: 'Países Baixos', path: 'M51,21 L53,21 L53,23 L51,23 Z' }, // Netherlands
  { id: '203', name: 'República Checa', path: 'M55,25 L57,25 L57,27 L55,27 Z' }, // Czech Republic
  { id: '504', name: 'Marrocos', path: 'M44,38 L48,38 L48,42 L44,42 Z' }, // Morocco
  { id: '818', name: 'Egito', path: 'M54,42 L59,42 L59,47 L54,47 Z' }, // Egypt
  { id: '710', name: 'África do Sul', path: 'M52,69 L58,69 L57,76 L51,74 Z' }, // South Africa
  { id: '784', name: 'EAU', path: 'M62,43 L64,43 L64,45 L62,45 Z' }, // UAE
  { id: '356', name: 'Índia', path: 'M67,41 L73,41 L71,51 L68,48 Z' }, // India
  { id: '156', name: 'China', path: 'M68,26 L83,26 L81,38 L70,38 Z' }, // China
  { id: '392', name: 'Japão', path: 'M85,26 L87,26 L85,34 L83,30 Z' }, // Japan
  { id: '410', name: 'Coreia do Sul', path: 'M81,30 L83,30 L83,32 L81,32 Z' }, // South Korea
  { id: '764', name: 'Tailândia', path: 'M74,47 L77,47 L76,52 L74,51 Z' }, // Thailand
  { id: '702', name: 'Singapura', path: 'M76,55 L77,55 L77,56 M76,56 Z' }, // Singapore
  { id: '360', name: 'Indonésia', path: 'M73,56 L83,56 L82,60 L75,60 Z' }, // Indonesia (Bali)
  { id: '036', name: 'Austrália', path: 'M78,67 L92,67 L90,80 L79,78 Z' }, // Australia
];

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#3B82F6', '#10B981', '#D4A843', '#E8604A', '#8B5CF6', '#EC4899'];
  return colors[Math.abs(hash) % colors.length];
}

export default function ProfilePage() {
  const [user, setUser] = useState({ name: 'Explorador', email: '' });
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('itinerarios'); // 'itinerarios', 'favoritos', 'stats', 'pedidos'
  const [visitedCountries, setVisitedCountries] = useState([]);
  const [plannedCountries, setPlannedCountries] = useState([]);
  const [savedTrips, setSavedTrips] = useState([]);
  const [favDestinations, setFavDestinations] = useState([]);
  const [favActivities, setFavActivities] = useState([]);
  const [customRequests, setCustomRequests] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState(null);

  // Counter states for travel stats animation
  const [countriesCount, setCountriesCount] = useState(0);
  const [kmCount, setKmCount] = useState(0);
  const [daysCount, setDaysCount] = useState(0);
  const [spentCount, setSpentCount] = useState(0);
  const statsGridRef = useRef(null);

  useEffect(() => {
    document.title = "O Meu Perfil · Andor";

    // Load data from localStorage
    const storedUser = localStorage.getItem('andor_user');
    let uName = 'Explorador';
    let uEmail = '';
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        uName = parsedUser.name || 'Explorador';
        uEmail = parsedUser.email || '';
      } catch (e) {}
    }

    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      try {
        setProfile(JSON.parse(storedProfile));
      } catch (e) {}
    }

    const storedVisited = localStorage.getItem('andor_visited_countries');
    let visited = [];
    if (storedVisited) {
      try {
        visited = JSON.parse(storedVisited);
        setVisitedCountries(visited);
      } catch (e) {}
    } else {
      visited = ['620', '724', '250']; // Portugal, Espanha, França default
      setVisitedCountries(visited);
      localStorage.setItem('andor_visited_countries', JSON.stringify(visited));
    }

    // Load saved trips
    let trips = [];
    const savedTripsStored = localStorage.getItem('andor_saved_trips');
    if (savedTripsStored) {
      try {
        trips = JSON.parse(savedTripsStored);
      } catch (e) {}
    }
    
    // Merge auth trips
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u.trips && u.trips.length > 0) {
          const ids = new Set(trips.map(t => t.id));
          u.trips.forEach(t => {
            if (!ids.has(t.id)) trips.push(t);
          });
        }
      } catch (e) {}
    }
    if (trips.length === 0) {
      trips = [
        { id: 'demo-tokyo-5d', destination: 'Tokyo, Japão', daysCount: 5, style: 'Cultural', createdDate: new Date().toLocaleDateString('pt-PT'), totalCost: '€1.480' }
      ];
    }
    setSavedTrips(trips);

    // Load favorites
    const storedDests = localStorage.getItem('andor_favorite_destinations');
    let dests = [];
    if (dests) {
      try {
        dests = JSON.parse(storedDests) || [];
        setFavDestinations(dests);
      } catch (e) {}
    }

    const storedActs = localStorage.getItem('andor_favorite_activities');
    if (storedActs) {
      try {
        setFavActivities(JSON.parse(storedActs) || []);
      } catch (e) {}
    }

    // Calculate planned countries based on saved trips and favorite destinations
    const planned = [];
    trips.forEach(t => {
      const dest = t.destination?.toLowerCase() || '';
      if (dest.includes('tokyo') || dest.includes('japão')) planned.push('392');
      if (dest.includes('bali') || dest.includes('indonésia')) planned.push('360');
      if (dest.includes('maldivas')) planned.push('191'); // Maldives
      if (dest.includes('nova iorque') || dest.includes('eua')) planned.push('840');
    });
    setPlannedCountries([...new Set(planned)]);

    // Load custom requests
    const storedReqs = localStorage.getItem('andor_custom_requests');
    if (storedReqs) {
      try {
        setCustomRequests(JSON.parse(storedReqs));
      } catch (e) {}
    }

    setLoaded(true);
  }, []);

  // Trigger stats animation when entering viewport
  useEffect(() => {
    if (activeTab !== 'stats') return;
    
    let isCancelled = false;
    const targetCountries = Math.max(visitedCountries.length, 3);
    const targetKm = Math.max(savedTrips.length * 3500, 12400);
    const targetDays = Math.max(savedTrips.reduce((acc, t) => acc + (t.daysCount || 5), 0), 24);
    const targetSpent = Math.max(savedTrips.length * 1500, 6800);

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        // Start animation
        const duration = 1500; // 1.5s
        const startTime = performance.now();

        const animate = (now) => {
          if (isCancelled) return;
          const progress = Math.min((now - startTime) / duration, 1);
          // Easing out quad
          const ease = progress * (2 - progress);

          setCountriesCount(Math.floor(ease * targetCountries));
          setKmCount(Math.floor(ease * targetKm));
          setDaysCount(Math.floor(ease * targetDays));
          setSpentCount(Math.floor(ease * targetSpent));

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
        // Unobserve after running once
        if (statsGridRef.current) {
          observer.unobserve(statsGridRef.current);
        }
      }
    }, { threshold: 0.1 });

    const currentRef = statsGridRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      isCancelled = true;
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [activeTab, visitedCountries, savedTrips]);

  // TRAVEL PERSONA ENGINE
  const calculatePersona = () => {
    let scoreUrbano = 0;
    let scoreNomada = 0;
    let scoreCurado = 0;
    let scoreAventureiro = 0;

    // Check onboarding profile
    if (profile) {
      const type = profile.travelerType;
      const budget = profile.budgetRange;
      if (type === 'Aventureiro') scoreAventureiro += 5;
      if (type === 'Relaxar') scoreCurado += 4;
      if (type === 'Gourmet') scoreUrbano += 4;
      if (type === 'Cultural') { scoreUrbano += 3; scoreNomada += 3; }

      if (budget === '€' || budget === '€€') scoreAventureiro += 3;
      if (budget === '€€€€') scoreCurado += 5;
      if (budget === '€€€') scoreCurado += 2;
    }

    // Check saved destinations
    favDestinations.forEach(dest => {
      const name = dest.city?.toLowerCase() || '';
      if (['tokyo', 'nova iorque', 'barcelona', 'berlim', 'paris', 'london', 'roma', 'amesterdão', 'londres'].includes(name)) scoreUrbano += 3;
      if (['bali', 'nepal', 'etiópia', 'peru', 'marraquexe', 'cairo'].includes(name)) scoreNomada += 4;
      if (['maldivas', 'kyoto', 'amalfi', 'santorini', 'patagónia'].includes(name)) scoreCurado += 4;
      if (['rio de janeiro', 'cidade do cabo', 'bangkok', 'reykjavik', 'croácia'].includes(name)) scoreAventureiro += 3;
    });

    // Check saved activities
    favActivities.forEach(act => {
      const type = act.type?.toLowerCase() || '';
      if (type.includes('cultur') || type.includes('icon') || type.includes('urbano') || type.includes('arte')) scoreUrbano += 2;
      if (type.includes('nature') || type.includes('aventura') || type.includes('trilho')) scoreAventureiro += 3;
      if (type.includes('luxo') || type.includes('michelin') || type.includes('spa') || type.includes('curad')) scoreCurado += 3;
      if (type.includes('espirit') || type.includes('yoga') || type.includes('locais') || type.includes('segred')) scoreNomada += 3;
    });

    // Evaluate
    const maxScore = Math.max(scoreUrbano, scoreNomada, scoreCurado, scoreAventureiro);
    if (maxScore === 0) {
      // Default based on initials or fallback
      return {
        title: "O Explorador Urbano",
        emoji: "🏙️",
        color: "#3B82F6",
        desc: "Energias das grandes cidades, gastronomia de rua e cultura contemporânea são o teu habitat natural.",
        dests: "Tokyo, NYC, Barcelona, Berlim"
      };
    }

    if (maxScore === scoreUrbano) {
      return {
        title: "O Explorador Urbano",
        emoji: "🏙️",
        color: "#3B82F6",
        desc: "Energias das grandes cidades, gastronomia de rua e cultura contemporânea são o teu habitat natural.",
        dests: "Tokyo, NYC, Barcelona, Berlim"
      };
    } else if (maxScore === scoreNomada) {
      return {
        title: "O Nómada Espiritual",
        emoji: "🧘",
        color: "#10B981",
        desc: "Buscas experiências transformadoras, natureza selvagem e culturas que ainda não foram diluídas.",
        dests: "Bali, Nepal, Etiópia, Peru"
      };
    } else if (maxScore === scoreCurado) {
      return {
        title: "O Viajante Curado",
        emoji: "💎",
        color: "#D4A843",
        desc: "Menos destinos, vividos com toda a profundidade. A qualidade de cada experiência é inegociável.",
        dests: "Maldivas, Kyoto, Amalfi, Patagónia"
      };
    } else {
      return {
        title: "O Aventureiro Eficiente",
        emoji: "⚡",
        color: "#E8604A",
        desc: "Vês mais do mundo do que qualquer pessoa que conheces, sem gastar uma fortuna. O teu superpoder é optimizar.",
        dests: "SE Ásia, Europa de Leste, América do Sul"
      };
    }
  };

  const persona = calculatePersona();
  const avatarBg = stringToColor(user.name || 'Explorador');
  const userInitials = (user.name || 'EX').split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);

  const handleRemoveTrip = (id) => {
    const updated = savedTrips.filter(t => t.id !== id);
    setSavedTrips(updated);
    localStorage.setItem('andor_saved_trips', JSON.stringify(updated));
    
    const userStored = localStorage.getItem('andor_user');
    if (userStored) {
      try {
        const userData = JSON.parse(userStored);
        if (userData) {
          userData.trips = updated;
          localStorage.setItem('andor_user', JSON.stringify(userData));
        }
      } catch (e) {}
    }
  };

  const handleDuplicateTrip = (trip) => {
    const duplicated = {
      ...trip,
      id: `dup-${Date.now()}`,
      destination: `${trip.destination} (Cópia)`,
      createdDate: new Date().toLocaleDateString('pt-PT')
    };

    const updated = [duplicated, ...savedTrips];
    setSavedTrips(updated);
    localStorage.setItem('andor_saved_trips', JSON.stringify(updated));

    const userStored = localStorage.getItem('andor_user');
    if (userStored) {
      try {
        const userData = JSON.parse(userStored);
        if (userData) {
          userData.trips = updated;
          localStorage.setItem('andor_user', JSON.stringify(userData));
        }
      } catch (e) {}
    }
  };

  if (!loaded) {
    return (
      <>
        <Navbar />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>A carregar o seu perfil...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* PROFILE HEADER */}
        <div className={styles.profileHeader}>
          <div className={styles.headerInner}>
            <div className={styles.avatarLarge} style={{ backgroundColor: avatarBg }}>
              {userInitials}
            </div>
            <div className={styles.headerInfo}>
              <h1 className={styles.userName}>{user.name || 'Explorador Andor'}</h1>
              <p className={styles.userEmail}>{user.email || 'explorador@andortravels.com'}</p>
              
              <div className={styles.personaBadge} style={{ borderColor: persona.color, color: persona.color, backgroundColor: `${persona.color}15` }}>
                <span className={styles.personaEmoji}>{persona.emoji}</span> {persona.title}
              </div>
            </div>
            <div className={styles.quickStats}>
              <div className={styles.quickStat}>
                <span className={styles.statVal}>{savedTrips.length}</span>
                <span className={styles.statLbl}>Itinerários</span>
              </div>
              <div className={styles.statSep}>·</div>
              <div className={styles.quickStat}>
                <span className={styles.statVal}>{favDestinations.length}</span>
                <span className={styles.statLbl}>Destinos</span>
              </div>
              <div className={styles.statSep}>·</div>
              <div className={styles.quickStat}>
                <span className={styles.statVal}>{visitedCountries.length}</span>
                <span className={styles.statLbl}>Países</span>
              </div>
            </div>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className={styles.tabsWrapper}>
          <div className={styles.tabs}>
            <button
              onClick={() => setActiveTab('itinerarios')}
              className={`${styles.tab} ${activeTab === 'itinerarios' ? styles.tabActive : ''}`}
            >
              🗺️ Itinerários
            </button>
            <button
              onClick={() => setActiveTab('favoritos')}
              className={`${styles.tab} ${activeTab === 'favoritos' ? styles.tabActive : ''}`}
            >
              ❤️ Favoritos
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`${styles.tab} ${activeTab === 'stats' ? styles.tabActive : ''}`}
            >
              📈 Travel Stats
            </button>
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`${styles.tab} ${activeTab === 'pedidos' ? styles.tabActive : ''}`}
            >
              ✨ Pedidos
            </button>
          </div>
        </div>

        {/* TAB CONTENTS */}
        <div className={styles.container}>
          {/* ITINERARIOS TAB */}
          {activeTab === 'itinerarios' && (
            <div className={styles.tabContent}>
              <h2 className={styles.tabHeading}>Os Meus Itinerários Planeados</h2>
              {savedTrips.length > 0 ? (
                <div className={styles.tripsGrid}>
                  {savedTrips.map((trip) => (
                    <div key={trip.id} className={styles.tripCard}>
                      <div className={styles.tripHeader}>
                        <span className={styles.tripIcon}>🗺️</span>
                        <div>
                          <h3 className={styles.tripTitle}>{trip.destination}</h3>
                          <p className={styles.tripStyle}>
                            {trip.daysCount || trip.days?.length || 5} dias · {trip.style || 'Bespoke'}
                          </p>
                        </div>
                      </div>
                      <div className={styles.tripMeta}>
                        <span>Custo: {trip.totalCost || '€1.480'}</span>
                        <span>{trip.createdDate || 'Guardado recentemente'}</span>
                      </div>
                      <div className={styles.tripActions}>
                        <a href={`/itinerary/${trip.id}`} className={styles.primaryBtn}>
                          Abrir Itinerário
                        </a>
                        <button
                          onClick={() => handleDuplicateTrip(trip)}
                          className={styles.secondaryBtn}
                        >
                          Duplicar
                        </button>
                        <button
                          onClick={() => handleRemoveTrip(trip.id)}
                          className={styles.removeBtn}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyCard}>
                  <p>Ainda não tens nenhum itinerário guardado.</p>
                  <a href="/" className={styles.primaryBtn} style={{ display: 'inline-block', width: 'auto', marginTop: '12px' }}>
                    Criar a Primeira Viagem →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* FAVORITOS TAB */}
          {activeTab === 'favoritos' && (
            <div className={styles.tabContent}>
              <div className={styles.favoritesHeaderRow}>
                <h2 className={styles.tabHeading}>Os Meus Favoritos</h2>
                <a href="/favorites" className={styles.manageFavoritesLink}>
                  Gerir na página dedicada →
                </a>
              </div>
              <div className={styles.favSectionRow}>
                <div className={styles.favColumn}>
                  <h3>🏝️ Destinos Guardados ({favDestinations.length})</h3>
                  {favDestinations.length > 0 ? (
                    <div className={styles.miniList}>
                      {favDestinations.map(d => (
                        <div key={d.slug} className={styles.miniItem}>
                          <span className={styles.miniFlag}>{d.flag}</span>
                          <div className={styles.miniDetails}>
                            <strong>{d.city}</strong>
                            <span>{d.country}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyText}>Sem destinos nos favoritos.</p>
                  )}
                </div>

                <div className={styles.favColumn}>
                  <h3>🎪 Atividades Guardadas ({favActivities.length})</h3>
                  {favActivities.length > 0 ? (
                    <div className={styles.miniList}>
                      {favActivities.map(a => (
                        <div key={a.id} className={styles.miniItem}>
                          <span className={styles.miniIcon}>✨</span>
                          <div className={styles.miniDetails}>
                            <strong>{a.name}</strong>
                            <span>{a.city} · {a.type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyText}>Sem atividades guardadas.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TRAVEL STATS TAB */}
          {activeTab === 'stats' && (
            <div className={styles.tabContent}>
              <h2 className={styles.tabHeading}>Métricas de Exploração</h2>
              
              {/* Rich Stats Grid */}
              <div className={styles.statsPanelGrid} ref={statsGridRef}>
                <div className={styles.statPanelCard}>
                  <span className={styles.statIcon}>🌍</span>
                  <div className={styles.statPanelInfo}>
                    <h4 className={styles.statPanelNum}>{countriesCount}</h4>
                    <p className={styles.statPanelLabel}>países explorados</p>
                  </div>
                </div>
                <div className={styles.statPanelCard}>
                  <span className={styles.statIcon}>✈️</span>
                  <div className={styles.statPanelInfo}>
                    <h4 className={styles.statPanelNum}>{kmCount.toLocaleString('pt-PT')}</h4>
                    <p className={styles.statPanelLabel}>km planeados</p>
                  </div>
                </div>
                <div className={styles.statPanelCard}>
                  <span className={styles.statIcon}>🗓️</span>
                  <div className={styles.statPanelInfo}>
                    <h4 className={styles.statPanelNum}>{daysCount}</h4>
                    <p className={styles.statPanelLabel}>dias de aventura</p>
                  </div>
                </div>
                <div className={styles.statPanelCard}>
                  <span className={styles.statIcon}>💰</span>
                  <div className={styles.statPanelInfo}>
                    <h4 className={styles.statPanelNum}>€{spentCount.toLocaleString('pt-PT')}</h4>
                    <p className={styles.statPanelLabel}>em experiências</p>
                  </div>
                </div>
              </div>

              {/* Persona Showcase Box */}
              <div className={styles.personaBox} style={{ borderLeftColor: persona.color }}>
                <div className={styles.personaBoxHeader}>
                  <span className={styles.personaBoxEmoji}>{persona.emoji}</span>
                  <div>
                    <h3 className={styles.personaBoxTitle}>{persona.title}</h3>
                    <p className={styles.personaBoxSubtitle}>A tua Travel Persona Andor</p>
                  </div>
                </div>
                <p className={styles.personaBoxText}>{persona.desc}</p>
                <div className={styles.personaBoxIdealDests}>
                  <strong>Destinos ideais para ti:</strong> {persona.dests}
                </div>
              </div>

              {/* WORLD MAP */}
              <div className={styles.mapSection}>
                <div className={styles.mapHeader}>
                  <h3>🗺️ O Teu Mapa do Mundo</h3>
                  <span className={styles.mapCounter}>{visitedCountries.length}/195 países descobertos</span>
                </div>
                <div className={styles.mapContainer}>
                  {hoveredCountry && (
                    <div className={styles.tooltip}>
                      {hoveredCountry}
                    </div>
                  )}
                  <svg className={styles.worldSvg} viewBox="0 0 100 100" width="100%" height="auto">
                    {/* Ocean Background */}
                    <rect width="100" height="100" fill="none" />
                    
                    {/* Draw countries */}
                    {COUNTRY_PATHS.map((country) => {
                      const isVisited = visitedCountries.includes(country.id);
                      const isPlanned = plannedCountries.includes(country.id);
                      
                      let fillColor = 'rgba(255, 255, 255, 0.08)'; // Unvisited
                      if (isVisited) {
                        fillColor = '#D4A843'; // Visited: Gold
                      } else if (isPlanned) {
                        fillColor = 'rgba(212, 168, 67, 0.4)'; // Planned: Semi-gold
                      }

                      return (
                        <path
                          key={country.id}
                          d={country.path}
                          fill={fillColor}
                          stroke="rgba(255,255,255,0.15)"
                          strokeWidth="0.5"
                          className={styles.mapCountryPath}
                          onMouseEnter={() => setHoveredCountry(`${country.name} (${isVisited ? 'Visitado' : isPlanned ? 'Planeado' : 'Não visitado'})`)}
                          onMouseLeave={() => setHoveredCountry(null)}
                        />
                      );
                    })}
                  </svg>
                </div>
                <div className={styles.mapLegend}>
                  <div className={styles.legendItem}>
                    <span className={`${styles.legendDot} ${styles.legendGold}`}></span>
                    <span>Visitado</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={`${styles.legendDot} ${styles.legendSemiGold}`}></span>
                    <span>Planeado</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={`${styles.legendDot} ${styles.legendGray}`}></span>
                    <span>Não visitado</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PEDIDOS TAB */}
          {activeTab === 'pedidos' && (
            <div className={styles.tabContent}>
              <h2 className={styles.tabHeading}>Os Meus Pedidos Bespoke</h2>
              {customRequests.length > 0 ? (
                <div className={styles.requestsList}>
                  {customRequests.map((req) => (
                    <div key={req.id} className={styles.requestCard}>
                      <div className={styles.requestHeader}>
                        <div>
                          <h3 className={styles.reqDest}>{req.destination}</h3>
                          <p className={styles.reqDates}>📅 {req.startDate} a {req.endDate}</p>
                        </div>
                        <span className={`${styles.reqStatus} ${req.status === 'Pendente' ? styles.statusPending : styles.statusProcessed}`}>
                          {req.status}
                        </span>
                      </div>
                      <div className={styles.reqDetails}>
                        <div className={styles.reqMetaItem}>👥 <strong>Viajantes:</strong> {req.travelers} pessoas</div>
                        <div className={styles.reqMetaItem}>💰 <strong>Orçamento:</strong> €{req.budget}</div>
                      </div>
                      {req.notes && (
                        <div className={styles.reqNotes}>
                          <strong>Notas:</strong> {req.notes}
                        </div>
                      )}
                      <p className={styles.reqDateSubmitted}>Pedido submetido em {req.dateSubmitted}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyCard}>
                  <p>Ainda não submeteste nenhum pedido personalizado (Bespoke).</p>
                  <button
                    onClick={() => window.dispatchEvent(new Event('open-custom-request'))}
                    className={styles.primaryBtn}
                    style={{ marginTop: '12px' }}
                  >
                    Fazer Pedido de Viagem Bespoke ✨
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
