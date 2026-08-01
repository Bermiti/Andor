'use client';

import { useState, useEffect } from 'react';
import { MapPin, Ticket, Map } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/ToastProvider';
import { trackEvent } from '../lib/analytics';
import styles from './favorites.module.css';

export default function FavoritesPage() {
  const [activeTab, setActiveTab] = useState('destinos'); // 'destinos', 'actividades', 'itinerarios'
  const [favDestinations, setFavDestinations] = useState([]);
  const [favActivities, setFavActivities] = useState([]);
  const [favItineraries, setFavItineraries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteType, setConfirmDeleteType] = useState(null); // 'dest', 'act', 'itinerary'
  const [showCompare, setShowCompare] = useState(false);
  const { success } = useToast();

  useEffect(() => {
    document.title = "Os Meus Favoritos · Andor";
    trackEvent('page_view', { page: 'favorites' });
    
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
        setFavDestinations([]);
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
        setFavActivities([]);
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
        setFavItineraries([]);
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
    setConfirmDeleteType(null);
    success('Destino removido dos favoritos.');
    trackEvent('favorite_removed', { type: 'destination', slug });
  };

  const handleRemoveActivity = (id) => {
    const updated = favActivities.filter(a => a.id !== id);
    setFavActivities(updated);
    localStorage.setItem('andor_favorite_activities', JSON.stringify(updated));
    setConfirmDeleteId(null);
    setConfirmDeleteType(null);
    success('Atividade removida dos favoritos.');
    trackEvent('favorite_removed', { type: 'activity', id });
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
    setConfirmDeleteType(null);
    success('Itinerário eliminado.');
    trackEvent('favorite_removed', { type: 'itinerary', id });
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
    trackEvent('itinerary_duplicated', { destination: itinerary.destination });
  };

  const compareTrips = favItineraries.slice(0, 2);

  const getTripCity = (trip) => String(trip.destination || 'Destino').split(',')[0].trim();

  const getTripCountryFlag = (trip) => {
    const destination = String(trip.destination || '').toLowerCase();
    if (destination.includes('tokyo') || destination.includes('jap')) return '🇯🇵';
    if (destination.includes('paris') || destination.includes('fran')) return '🇫🇷';
    if (destination.includes('bali') || destination.includes('indon')) return '🇮🇩';
    return '✦';
  };

  const getTripNotes = (trip) => {
    return [
      'Verificar requisitos oficiais de entrada',
      'Consultar recomendações oficiais de segurança',
      'Confirmar meios de pagamento aceites',
      'Confirmar tomadas e adaptador',
    ];
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

  const requestRemove = (id, type) => {
    setConfirmDeleteId(id);
    setConfirmDeleteType(type);
  };

  const confirmRemove = () => {
    if (confirmDeleteType === 'dest') handleRemoveDestination(confirmDeleteId);
    if (confirmDeleteType === 'act') handleRemoveActivity(confirmDeleteId);
    if (confirmDeleteType === 'itinerary') handleRemoveItinerary(confirmDeleteId);
  };

  const confirmCopy = {
    dest: {
      title: 'Remover destino?',
      description: 'Este destino sai da tua lista de favoritos. Podes guardá-lo novamente mais tarde.',
      label: 'Remover',
    },
    act: {
      title: 'Remover atividade?',
      description: 'Esta atividade sai dos favoritos. Esta acção não pode ser desfeita nesta lista.',
      label: 'Remover',
    },
    itinerary: {
      title: 'Eliminar itinerário?',
      description: 'Este itinerário será removido dos guardados. Esta acção não pode ser desfeita.',
      label: 'Eliminar',
    },
  }[confirmDeleteType] || {
    title: 'Remover item?',
    description: 'Esta acção não pode ser desfeita.',
    label: 'Remover',
  };

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
                        <button
                            onClick={() => requestRemove(dest.slug, 'dest')}
                            className={styles.removeBtn}
                          >
                            Remover
                          </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <MapPin size={48} strokeWidth={1.5} className={styles.emptySvg} style={{ color: 'var(--gold)', marginBottom: '16px' }} />
                <h3>Nenhum destino nos favoritos</h3>
                <p>Navega pelas páginas de destinos individuais ou conversa com o Andor para guardares os teus locais favoritos.</p>
                <a href="/destinations" className={styles.ctaExplore}>
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
                              {act.duration && <span>⏱️ {act.duration}</span>}
                              {act.cost && <span>💰 {act.cost}</span>}
                              {!act.duration && !act.cost && <span>Detalhes não indicados</span>}
                            </div>
                            <p className={styles.destDate}>Guardado em {act.dateSaved}</p>
                            <div className={styles.actActions}>
                              {act.itineraryId && (
                                <a
                                  href={`/itinerary/${act.itineraryId}#activity-${encodeURIComponent(act.name)}`}
                                  className={styles.secondaryBtn}
                                >
                                  Ver no itinerário
                                </a>
                              )}
                              <button
                                  onClick={() => requestRemove(act.id, 'act')}
                                  className={styles.removeBtn}
                                >
                                  Remover
                                </button>
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
                <Ticket size={48} strokeWidth={1.5} className={styles.emptySvg} style={{ color: 'var(--gold)', marginBottom: '16px' }} />
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
              <>
              {favItineraries.length >= 2 && (
                <div className={styles.compareBanner}>
                  <div>
                    <h2>Comparar Viagens</h2>
                    <p>Vê custo, época, score e detalhes práticos lado a lado antes de escolher.</p>
                  </div>
                  <button className={styles.compareBtn} onClick={() => setShowCompare(true)}>
                    Comparar Viagens
                  </button>
                </div>
              )}
              <div className={styles.itinGrid}>
                {favItineraries.map((itin) => (
                  <div key={itin.id} className={styles.itinCard}>
                    <div className={styles.itinHeader}>
                      <span className={styles.itinIcon}>🗺️</span>
                      <div>
                        <h3 className={styles.itinTitle}>{itin.destination}</h3>
                        <p className={styles.itinSubtitle}>
                          {itin.daysCount || itin.days?.length || '—'} dias · Estilo {itin.style || 'Não indicado'}
                        </p>
                      </div>
                    </div>
                    <div className={styles.itinMeta}>
                      <span>{itin.totalCost ? `Custo estimado: ${itin.totalCost}` : 'Custo não calculado'}</span>
                      <span>{itin.createdDate || itin.savedAt ? `Criado: ${new Date(itin.createdDate || itin.savedAt).toLocaleDateString('pt-PT')}` : 'Data não disponível'}</span>
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
                      <button
                          onClick={() => requestRemove(itin.id, 'itinerary')}
                          className={styles.removeBtn}
                        >
                          Apagar
                        </button>
                    </div>
                  </div>
                ))}
              </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                <Map size={48} strokeWidth={1.5} className={styles.emptySvg} style={{ color: 'var(--gold)', marginBottom: '16px' }} />
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
      {showCompare && compareTrips.length >= 2 && (
        <div className={styles.compareOverlay} role="dialog" aria-modal="true" aria-label="Comparar viagens">
          <div className={styles.compareModal}>
            <button className={styles.compareClose} onClick={() => setShowCompare(false)} aria-label="Fechar comparação">×</button>
            <h2>Comparar Viagens</h2>
            <div className={styles.compareTable}>
              {compareTrips.map((trip) => (
                <article key={trip.id} className={styles.compareColumn}>
                  <h3>{getTripCountryFlag(trip)} {getTripCity(trip)} <span>{trip.daysCount || trip.days?.length || '—'} dias</span></h3>
                  <p className={styles.comparePrice}>{trip.totalCost || 'Custo não calculado'}{trip.totalCost && <small>/pessoa</small>}</p>
                  <p>{trip.season || 'Época não indicada'}</p>
                  <p>{Number.isFinite(Number(trip.score)) ? <>Andor Score: <strong>{trip.score}</strong></> : 'Sem score verificado'}</p>
                  <p>{trip.style || 'Estilo não indicado'}</p>
                  <ul>
                    {getTripNotes(trip).map((note) => <li key={note}>{note}</li>)}
                  </ul>
                  <a href={`/?wizard=true&dest=${encodeURIComponent(getTripCity(trip))}`} className={styles.primaryBtn}>
                    Criar Itinerário {getTripCity(trip)}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteId)}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.label}
        destructive
        onCancel={() => {
          setConfirmDeleteId(null);
          setConfirmDeleteType(null);
        }}
        onConfirm={confirmRemove}
      />
      <Footer />
    </>
  );
}
