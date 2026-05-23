'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './favorites.module.css';

export default function FavoritesPage() {
  const [activeTab, setActiveTab] = useState('destinos'); // 'destinos', 'actividades', 'itinerarios'
  const [favDestinations, setFavDestinations] = useState([]);
  const [favActivities, setFavActivities] = useState([]);
  const [favItineraries, setFavItineraries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteType, setConfirmDeleteType] = useState(null); // 'dest', 'act', 'itinerary'

  useEffect(() => {
    document.title = "Os Meus Favoritos · Andor";
    
    const loadFavorites = () => {
      // Load destinations
      const storedDests = localStorage.getItem('andor_favorite_destinations');
      if (storedDests) {
        try {
          setFavDestinations(JSON.parse(storedDests));
        } catch (e) {
          setFavDestinations([]);
        }
      } else {
        // Fallback demo destination if none favorited yet to make page alive
        const demoDest = [
          {
            slug: 'tokyo',
            city: 'Tokyo',
            country: 'Japão',
            flag: '🇯🇵',
            image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=75&auto=format&fit=crop',
            dateSaved: new Date().toLocaleDateString('pt-PT')
          }
        ];
        localStorage.setItem('andor_favorite_destinations', JSON.stringify(demoDest));
        setFavDestinations(demoDest);
      }

      // Load activities
      const storedActs = localStorage.getItem('andor_favorite_activities');
      if (storedActs) {
        try {
          setFavActivities(JSON.parse(storedActs));
        } catch (e) {
          setFavActivities([]);
        }
      } else {
        // Fallback demo activities
        const demoActs = [
          {
            id: 'shibuya-crossing',
            name: 'Shibuya Crossing',
            type: 'Icónico',
            cost: 'Grátis',
            duration: '30min',
            city: 'Tokyo',
            destinationSlug: 'tokyo',
            image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=75&auto=format&fit=crop',
            dateSaved: new Date().toLocaleDateString('pt-PT')
          }
        ];
        localStorage.setItem('andor_favorite_activities', JSON.stringify(demoActs));
        setFavActivities(demoActs);
      }

      // Load itineraries
      let storedItins = [];
      const userStored = localStorage.getItem('andor_user');
      if (userStored) {
        try {
          const userData = JSON.parse(userStored);
          if (userData && userData.trips) {
            storedItins = userData.trips;
          }
        } catch (e) {}
      }
      
      const storedSavedTrips = localStorage.getItem('andor_saved_trips');
      if (storedSavedTrips) {
        try {
          const savedTrips = JSON.parse(storedSavedTrips);
          // merge unique
          const ids = new Set(storedItins.map(t => t.id));
          savedTrips.forEach(t => {
            if (!ids.has(t.id)) {
              storedItins.push(t);
            }
          });
        } catch (e) {}
      }

      if (storedItins.length > 0) {
        setFavItineraries(storedItins);
      } else {
        // Demo itinerary
        const demoItins = [
          {
            id: 'demo-tokyo-5d',
            destination: 'Tokyo, Japão',
            daysCount: 5,
            style: 'Cultural',
            createdDate: new Date().toLocaleDateString('pt-PT'),
            totalCost: '€1.480'
          }
        ];
        setFavItineraries(demoItins);
      }
      setLoaded(true);
    };

    loadFavorites();
  }, []);

  const handleRemoveDestination = (slug) => {
    const updated = favDestinations.filter(d => d.slug !== slug);
    setFavDestinations(updated);
    localStorage.setItem('andor_favorite_destinations', JSON.stringify(updated));
    setConfirmDeleteId(null);
  };

  const handleRemoveActivity = (id) => {
    const updated = favActivities.filter(a => a.id !== id);
    setFavActivities(updated);
    localStorage.setItem('andor_favorite_activities', JSON.stringify(updated));
    setConfirmDeleteId(null);
  };

  const handleRemoveItinerary = (id) => {
    // Remove from local state
    const updated = favItineraries.filter(i => i.id !== id);
    setFavItineraries(updated);
    
    // Save back to local storage and auth context structure
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
    setConfirmDeleteId(null);
  };

  const handleDuplicateItinerary = (itinerary) => {
    const duplicated = {
      ...itinerary,
      id: `dup-${Date.now()}`,
      destination: `${itinerary.destination} (Cópia)`,
      createdDate: new Date().toLocaleDateString('pt-PT')
    };

    const updated = [duplicated, ...favItineraries];
    setFavItineraries(updated);
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

  // Group activities by destination city
  const groupedActivities = favActivities.reduce((acc, act) => {
    const city = act.city || 'Desconhecido';
    if (!acc[city]) {
      acc[city] = [];
    }
    acc[city].push(act);
    return acc;
  }, {});

  if (!loaded) {
    return (
      <>
        <Navbar />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>A carregar os seus favoritos...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <span className={styles.badge}>❤️ OS MEUS FAVORITOS</span>
            <h1 className={styles.title}>O Teu Portefólio de Sonhos</h1>
            <p className={styles.subtitle}>
              Guarda destinos inspiradores, atividades imperdíveis e itinerários planeados pelo Andor.
            </p>
          </div>
        </div>

        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            <button
              onClick={() => setActiveTab('destinos')}
              className={`${styles.tab} ${activeTab === 'destinos' ? styles.tabActive : ''}`}
            >
              🏝️ Destinos
              <span className={styles.tabCount}>{favDestinations.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('actividades')}
              className={`${styles.tab} ${activeTab === 'actividades' ? styles.tabActive : ''}`}
            >
              🎪 Atividades
              <span className={styles.tabCount}>{favActivities.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('itinerarios')}
              className={`${styles.tab} ${activeTab === 'itinerarios' ? styles.tabActive : ''}`}
            >
              🗺️ Itinerários
              <span className={styles.tabCount}>{favItineraries.length}</span>
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {/* TABS: DESTINOS */}
          {activeTab === 'destinos' && (
            favDestinations.length > 0 ? (
              <div className={styles.destGrid}>
                {favDestinations.map((dest) => (
                  <div key={dest.slug} className={styles.destCard}>
                    <div className={styles.destImgContainer}>
                      <img src={dest.image} alt={dest.city} className={styles.destImg} />
                      <div className={styles.destOverlay}></div>
                      <span className={styles.destFlag}>{dest.flag}</span>
                    </div>
                    <div className={styles.destInfo}>
                      <div className={styles.destTitleRow}>
                        <h3 className={styles.destName}>{dest.city}</h3>
                        <span className={styles.destCountry}>{dest.country}</span>
                      </div>
                      <p className={styles.destDate}>Guardado em {dest.dateSaved || 'N/A'}</p>
                      <div className={styles.destActions}>
                        <a
                          href={`/?wizard=true&dest=${encodeURIComponent(dest.city + ', ' + dest.country)}&step=2`}
                          className={styles.primaryBtn}
                        >
                          Criar Itinerário
                        </a>
                        {confirmDeleteId === dest.slug && confirmDeleteType === 'dest' ? (
                          <div className={styles.confirmRow}>
                            <button
                              onClick={() => handleRemoveDestination(dest.slug)}
                              className={styles.dangerConfirmBtn}
                            >
                              Sim
                            </button>
                            <button
                              onClick={() => { setConfirmDeleteId(null); setConfirmDeleteType(null); }}
                              className={styles.cancelBtn}
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setConfirmDeleteId(dest.slug); setConfirmDeleteType('dest'); }}
                            className={styles.removeBtn}
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <svg className={styles.emptySvg} viewBox="0 0 100 100" width="80" height="80">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(212, 168, 67, 0.2)" strokeWidth="2"/>
                  <path d="M50 30 C35 15, 15 35, 50 70 C85 35, 65 15, 50 30 Z" fill="rgba(212, 168, 67, 0.1)" stroke="var(--gold)" strokeWidth="2"/>
                </svg>
                <h3>Nenhum destino nos favoritos</h3>
                <p>Navega pelas páginas de destinos individuais ou conversa com o Andor para guardares os teus locais favoritos.</p>
                <a href="/#destinos" className={styles.ctaExplore}>
                  Descobrir Destinos
                </a>
              </div>
            )
          )}

          {/* TABS: ACTIVIDADES */}
          {activeTab === 'actividades' && (
            favActivities.length > 0 ? (
              <div className={styles.activitySection}>
                {Object.keys(groupedActivities).map((city) => (
                  <div key={city} className={styles.cityGroup}>
                    <h2 className={styles.cityGroupTitle}>📍 {city}</h2>
                    <div className={styles.actGrid}>
                      {groupedActivities[city].map((act) => (
                        <div key={act.id} className={styles.actCard}>
                          <div className={styles.actImgContainer}>
                            <img src={act.image} alt={act.name} className={styles.actImg} />
                            <div className={styles.actOverlay}></div>
                            <span className={styles.actType}>{act.type}</span>
                          </div>
                          <div className={styles.actInfo}>
                            <h3 className={styles.actName}>{act.name}</h3>
                            <div className={styles.actMeta}>
                              <span>⏱️ {act.duration}</span>
                              <span>💰 {act.cost}</span>
                            </div>
                            <p className={styles.destDate}>Guardado em {act.dateSaved}</p>
                            <div className={styles.actActions}>
                              <a
                                href={`/itinerary/${act.destinationSlug || 'tokyo'}#activity-${encodeURIComponent(act.name)}`}
                                className={styles.secondaryBtn}
                              >
                                Ver no itinerário
                              </a>
                              {confirmDeleteId === act.id && confirmDeleteType === 'act' ? (
                                <div className={styles.confirmRow}>
                                  <button
                                    onClick={() => handleRemoveActivity(act.id)}
                                    className={styles.dangerConfirmBtn}
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    onClick={() => { setConfirmDeleteId(null); setConfirmDeleteType(null); }}
                                    className={styles.cancelBtn}
                                  >
                                    Não
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setConfirmDeleteId(act.id); setConfirmDeleteType('act'); }}
                                  className={styles.removeBtn}
                                >
                                  Remover
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <svg className={styles.emptySvg} viewBox="0 0 100 100" width="80" height="80">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(212, 168, 67, 0.2)" strokeWidth="2"/>
                  <path d="M30 40 L50 60 L70 40" fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round"/>
                  <rect x="40" y="30" width="20" height="15" rx="3" fill="none" stroke="var(--gold)" strokeWidth="2"/>
                </svg>
                <h3>Nenhuma atividade nos favoritos</h3>
                <p>Abra os seus itinerários criados e guarde as atividades que mais lhe interessarem para mais tarde.</p>
                <button
                  onClick={() => window.dispatchEvent(new Event('open-ai-chat'))}
                  className={styles.ctaExplore}
                >
                  Planear Viagem
                </button>
              </div>
            )
          )}

          {/* TABS: ITINERARIOS */}
          {activeTab === 'itinerarios' && (
            favItineraries.length > 0 ? (
              <div className={styles.itinGrid}>
                {favItineraries.map((itin) => (
                  <div key={itin.id} className={styles.itinCard}>
                    <div className={styles.itinHeader}>
                      <span className={styles.itinIcon}>🗺️</span>
                      <div>
                        <h3 className={styles.itinTitle}>{itin.destination}</h3>
                        <p className={styles.itinSubtitle}>
                          {itin.daysCount || itin.days?.length || 5} dias · Estilo {itin.style || 'Custom'}
                        </p>
                      </div>
                    </div>
                    <div className={styles.itinMeta}>
                      <span>Custo Est.: {itin.totalCost || '€1.480'}</span>
                      <span>Criado: {itin.createdDate || itin.savedAt ? new Date(itin.createdDate || itin.savedAt).toLocaleDateString('pt-PT') : new Date().toLocaleDateString('pt-PT')}</span>
                    </div>
                    <div className={styles.itinActions}>
                      <a href={`/itinerary/${itin.id}`} className={styles.primaryBtn}>
                        Abrir
                      </a>
                      <button
                        onClick={() => handleDuplicateItinerary(itin)}
                        className={styles.secondaryBtn}
                      >
                        Duplicar
                      </button>
                      {confirmDeleteId === itin.id && confirmDeleteType === 'itinerary' ? (
                        <div className={styles.confirmRow}>
                          <button
                            onClick={() => handleRemoveItinerary(itin.id)}
                            className={styles.dangerConfirmBtn}
                          >
                            Eliminar
                          </button>
                          <button
                            onClick={() => { setConfirmDeleteId(null); setConfirmDeleteType(null); }}
                            className={styles.cancelBtn}
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setConfirmDeleteId(itin.id); setConfirmDeleteType('itinerary'); }}
                          className={styles.removeBtn}
                        >
                          Apagar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <svg className={styles.emptySvg} viewBox="0 0 100 100" width="80" height="80">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(212, 168, 67, 0.2)" strokeWidth="2"/>
                  <path d="M35 30 H65 V70 H35 Z" fill="none" stroke="var(--gold)" strokeWidth="2"/>
                  <path d="M45 40 H55 M45 50 H55 M45 60 H55" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <h3>Nenhum itinerário guardado</h3>
                <p>Utilize o nosso assistente AI ou o configurador para criar e guardar o seu itinerário ideal.</p>
                <a href="/" className={styles.ctaExplore}>
                  Criar Itinerário
                </a>
              </div>
            )
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
