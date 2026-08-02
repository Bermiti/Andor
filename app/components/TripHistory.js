'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  PlaneTakeoff,
  ReceiptText,
  Route,
  WalletCards,
  Trash2,
  Copy,
  Edit2,
  Search,
  MoreVertical,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import styles from './TripHistory.module.css';
import { useTranslations } from '../context/LanguageContext';
import { deleteSavedTrip, duplicateSavedTrip, renameSavedTrip } from '../lib/itinerary-store';
import { getUnitedKingdomNumericCode } from '../lib/destination-geography';
import ConfirmDialog from './ConfirmDialog';
import TripExpenseManager from './TripExpenseManager';
import { Modal } from './ui/Modal';

const COUNTRY_NAMES = {
  argentina: '032',
  australia: '036',
  austria: '040',
  belgium: '056',
  brazil: '076',
  canada: '124',
  chile: '152',
  china: '156',
  colombia: '170',
  croatia: '191',
  czech: '203',
  denmark: '208',
  egypt: '818',
  finland: '246',
  france: '250',
  germany: '276',
  greece: '300',
  iceland: '352',
  india: '356',
  indonesia: '360',
  ireland: '372',
  italy: '380',
  japan: '392',
  kenya: '404',
  malaysia: '458',
  mexico: '484',
  morocco: '504',
  netherlands: '528',
  norway: '578',
  peru: '604',
  philippines: '608',
  poland: '616',
  portugal: '620',
  qatar: '634',
  romania: '642',
  singapore: '702',
  'south africa': '710',
  'south korea': '410',
  spain: '724',
  sweden: '752',
  switzerland: '756',
  thailand: '764',
  turkey: '792',
  uae: '784',
  'united arab emirates': '784',
  uk: '826',
  'united kingdom': '826',
  usa: '840',
  'united states': '840',
  vietnam: '704',
  azores: '620',
  lisbon: '620',
  lisboa: '620',
  porto: '620',
  barcelona: '724',
  madrid: '724',
  paris: '250',
  london: '826',
  rome: '380',
  roma: '380',
  berlin: '276',
  tokyo: '392',
  tóquio: '392',
  kyoto: '392',
  bangkok: '764',
  bali: '360',
  'new york': '840',
  nyc: '840',
};

const TRIP_PHOTOS = [
  { match: /tokyo|japan|toquio|tóquio/i, url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=900&q=80' },
  { match: /lisboa|lisbon|portugal/i, url: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=80' },
  { match: /paris|france/i, url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80' },
  { match: /new york|usa|united states/i, url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=900&q=80' },
  { match: /rome|roma|italy/i, url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=900&q=80' },
  { match: /bali|indonesia/i, url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=80' },
  { match: /rio|brazil|brasil/i, url: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=900&q=80' },
  { match: /beijing|china/i, url: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=900&q=80' },
];

function getCountryCodeFromDestination(destination) {
  if (!destination) return null;
  const ukCode = getUnitedKingdomNumericCode(destination);
  if (ukCode) return ukCode;
  const lower = destination.toLowerCase();
  for (const [name, code] of Object.entries(COUNTRY_NAMES)) {
    if (lower.includes(name)) return code;
  }
  return null;
}

function getTripPhoto(trip) {
  const destination = `${trip.destination || ''} ${trip.title || ''}`;
  return TRIP_PHOTOS.find((item) => item.match.test(destination))?.url ||
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80';
}

function formatTripDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getStopCount(trip) {
  if (!Array.isArray(trip.days)) return 0;
  return trip.days.reduce((sum, day) => sum + (day.stops?.length || 0), 0);
}

function getTripOverview(trip) {
  const overviewSource = String(
    trip.tripOverviewSource || trip.descriptionSource || trip.metadata?.overviewSource || ''
  ).toLowerCase();

  if (['provider', 'provider-api', 'official', 'user-confirmed'].includes(overviewSource)) {
    return trip.tripOverview || trip.description;
  }

  return 'Proposta guardada. Confirma locais, horários, custos e disponibilidade nas fontes oficiais antes de viajar.';
}

function getTripProvenanceLabel(trip) {
  const source = String(
    trip.metadata?.generationSource || trip.generationSource || trip.source || ''
  ).toLowerCase();

  if (trip.metadata?.isDemo || source.includes('fallback') || source.includes('curated-demo')) {
    return 'Demonstração — confirmar';
  }

  if (source.includes('gemini') || source.includes('groq') || source.includes('anthropic') || source.includes('ai')) {
    return 'Proposta IA — confirmar';
  }

  return 'Dados legados — confirmar';
}

function TripCard({
  trip,
  t,
  status = 'planned',
  featured = false,
  onRequestDelete,
  onOpenExpenses,
  onRenameTrip,
  onDuplicateTrip,
}) {
  const viewHref = trip.viewHref || (trip.id ? `/itinerary/${trip.id}` : null);
  const daysCount = Array.isArray(trip.days) ? trip.days.length : trip.daysCount;
  const stopsLabel = (n) => `${n} ${t('stops')}`;
  const daysLabel = (n) => `${n} ${n === 1 ? t('day') : t('days')}`;
  const statusLabel = status === 'completed' ? 'Concluida' : 'Planeada';
  const destinationName = trip.destination || trip.title || 'Viagem';
  const savedLabel = formatTripDate(trip.savedAt);
  const stopCount = getStopCount(trip);
  const overview = getTripOverview(trip);
  const provenanceLabel = getTripProvenanceLabel(trip);
  const toneLabel = status === 'completed' ? 'Memória guardada' : 'Próxima aventura';

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(destinationName);
  const [actionPending, setActionPending] = useState(false);
  const canEdit = !trip.permission || ['owner', 'editor'].includes(trip.permission);
  const canDelete = !trip.permission || trip.permission === 'owner';

  const handleDelete = (e) => {
    e.preventDefault();
    setIsMenuOpen(false);
    onRequestDelete?.(trip);
  };

  const handleDuplicate = async (e) => {
    e.preventDefault();
    setActionPending(true);
    try {
      if (onDuplicateTrip) await onDuplicateTrip(trip, `${destinationName} (Cópia)`);
      else {
        duplicateSavedTrip(trip.id, `${destinationName} (Cópia)`);
        window.location.reload();
      }
    } finally {
      setActionPending(false);
      setIsMenuOpen(false);
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (newName && newName !== destinationName) {
      setActionPending(true);
      try {
        if (onRenameTrip) await onRenameTrip(trip, newName);
        else {
          renameSavedTrip(trip.id, newName);
          window.location.reload();
        }
      } finally {
        setActionPending(false);
      }
    }
    setIsRenaming(false);
  };

  const opStatus = trip.operationalStatus;
  const renderOpBadge = () => {
    if (!opStatus) return null;
    if (opStatus.status === 'ready_to_travel') return <span className={`${styles.opBadge} ${styles.opReady}`}><CheckCircle size={12}/> Pronto a Viajar</span>;
    if (opStatus.status === 'ready_to_send') return <span className={`${styles.opBadge} ${styles.opSend}`}><CheckCircle size={12}/> Pronto a Enviar</span>;
    if (opStatus.bookings?.missing > 0) return <span className={`${styles.opBadge} ${styles.opMissing}`}><AlertCircle size={12}/> Confirmar ({opStatus.bookings.missing})</span>;
    return <span className={`${styles.opBadge} ${styles.opDraft}`}>{opStatus.status === 'draft' ? 'Rascunho' : opStatus.status}</span>;
  };

  return (
    <article className={`${styles.tripCard} ${featured ? styles.tripCardFeatured : ''}`}>
      <div
        className={styles.tripCover}
        style={{ backgroundImage: `url(${getTripPhoto(trip)})` }}
      >
        <div className={styles.tripCoverOverlay}>
          <div className={styles.tripCoverTop}>
            <span className={`${styles.statusBadge} ${status === 'completed' ? styles.statusCompleted : styles.statusPlanned}`}>
              {statusLabel}
            </span>
            {(canEdit || canDelete) && <div className={styles.tripMenuWrapper}>
              <button className={styles.tripMenuBtn} onClick={(e) => { e.preventDefault(); setIsMenuOpen(!isMenuOpen); }}>
                <MoreVertical size={16} />
              </button>
              {isMenuOpen && (
                <div className={styles.tripMenu}>
                  {canEdit && <button disabled={actionPending} onClick={() => setIsRenaming(true)}><Edit2 size={14}/> Renomear</button>}
                  {canEdit && <button disabled={actionPending} onClick={handleDuplicate}><Copy size={14}/> Duplicar</button>}
                  {canDelete && <button disabled={actionPending} onClick={handleDelete} className={styles.textDanger}><Trash2 size={14}/> Eliminar</button>}
                </div>
              )}
            </div>}
          </div>
          {isRenaming ? (
            <form onSubmit={handleRename} className={styles.renameForm}>
              <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} onBlur={handleRename} className={styles.renameInput} />
            </form>
          ) : (
            <h3 className={styles.tripCoverTitle}>{destinationName}</h3>
          )}
        </div>
      </div>

      <div className={styles.tripBody}>
        <div className={styles.tripTopline}>
          <span className={styles.tripKicker}>{toneLabel} · {provenanceLabel}</span>
          <div className={styles.tripToplineRight}>
            {renderOpBadge()}
            {savedLabel && (
              <span className={styles.destDate}>
                <CalendarDays size={14} />
                {savedLabel}
              </span>
            )}
          </div>
        </div>

        <p className={styles.tripOverview}>{overview}</p>

        <div className={styles.tripMeta} aria-label="Resumo do roteiro">
          {daysCount ? (
            <span className={styles.metaTag}>
              <Clock3 size={14} />
              {daysLabel(daysCount)}
            </span>
          ) : null}
          {stopCount ? (
            <span className={styles.metaTag}>
              <Route size={14} />
              {stopsLabel(stopCount)}
            </span>
          ) : null}
          {trip.totalCost ? (
            <span className={styles.metaTag} title="Valor guardado como estimativa, sem confirmação de fornecedor">
              <WalletCards size={14} />
              Estimativa guardada: {trip.totalCost}
            </span>
          ) : null}
          {trip.style ? (
            <span className={styles.metaTag}>
              <CheckCircle2 size={14} />
              {trip.style}
            </span>
          ) : null}
        </div>

        {Array.isArray(trip.days) && trip.days.length > 0 && (
          <div className={styles.daysList}>
            {trip.days.slice(0, 3).map((day, dayIndex) => (
              <details key={`${trip.id || trip.destination}-${dayIndex}`} className={styles.dayAccordion}>
                <summary className={styles.daySummary}>
                  <span className={styles.dayDot}></span>
                  <span className={styles.dayTitle}>{day.title || `${t('day')} ${dayIndex + 1}`}</span>
                  <span className={styles.dayStopCount}>{stopsLabel(day.stops?.length || 0)}</span>
                  <ArrowRight size={15} className={styles.chevron} />
                </summary>
                <div className={styles.dayContent}>
                  {day.stops?.slice(0, 5).map((stop, stopIndex) => (
                    <div key={`${stop.name || stopIndex}-${stopIndex}`} className={styles.stop}>
                      <span className={styles.stopTime}>{stop.time || '--:--'}</span>
                      <div className={styles.stopLine}></div>
                      <div className={styles.stopInfo}>
                        <span className={styles.stopName}>{stop.name}</span>
                        <span className={styles.stopType}>{stop.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}

        {(viewHref || trip.id) && (
          <div className={styles.tripActions}>
            {viewHref && (
            <Link href={viewHref} className={styles.viewBtn} aria-label="Ver roteiro completo">
              {t('viewFullItinerary')}
              <ArrowRight size={16} />
            </Link>
            )}
            {trip.id && (
              <button type="button" className={styles.expenseBtn} onClick={() => onOpenExpenses?.(trip)}>
                <ReceiptText size={16} /> Despesas
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function TripHistory({
  trips = [],
  visitedCountries = [],
  onDeleteTrip,
  onRenameTrip,
  onDuplicateTrip,
}) {
  const t = useTranslations('myTrips');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updated_desc');
  const [tripPendingDelete, setTripPendingDelete] = useState(null);
  const [expenseTrip, setExpenseTrip] = useState(null);

  const { completed, planned, drafts, company, missingBookings, readyToSend, readyToTravel, allTrips } = useMemo(() => {
    const grouped = { completed: [], planned: [], drafts: [], company: [], missingBookings: [], readyToSend: [], readyToTravel: [], allTrips: [] };

    trips.forEach((trip) => {
      const code = getCountryCodeFromDestination(trip.destination);
      const status = code && visitedCountries.includes(code) ? 'completed' : 'planned';
      const normalized = { ...trip, __status: status };

      const opStatus = trip.operationalStatus?.status;
      const missB = trip.operationalStatus?.bookings?.missing || 0;

      grouped[status].push(normalized);
      grouped.allTrips.push(normalized);

      if (opStatus === 'draft') grouped.drafts.push(normalized);
      if (trip.companyName || trip.clientName) grouped.company.push(normalized);
      if (missB > 0) grouped.missingBookings.push(normalized);
      if (opStatus === 'ready_to_send') grouped.readyToSend.push(normalized);
      if (opStatus === 'ready_to_travel') grouped.readyToTravel.push(normalized);
    });

    return grouped;
  }, [trips, visitedCountries]);

  if (trips.length === 0) {
    return (
      <section className={styles.section} id="journey-history">
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.badge}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.badgeIcon}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              {t('journalBadge')}
            </span>
            <h2 className={styles.title}>{t('journalTitle')}</h2>
            <p className={styles.subtitle}>{t('journalSubtitle')}</p>
          </div>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <MapPin size={48} strokeWidth={1.5} color="var(--gold)" />
          </div>
          <h3 className={styles.emptyTitle}>{t('noItineraries')}</h3>
          <p className={styles.emptyText}>{t('noItinerariesText')}</p>
          <Link href="/itineraries" className={styles.emptyAction}>
            Criar primeira viagem
          </Link>
        </div>
      </section>
    );
  }

  const filters = [
    { id: 'all', label: 'Todos', count: allTrips.length },
    { id: 'planned', label: 'Próximas', count: planned.length },
    { id: 'drafts', label: 'Rascunhos', count: drafts.length },
    { id: 'company', label: 'Cliente', count: company.length },
    { id: 'missingBookings', label: 'Confirmações pendentes', count: missingBookings.length },
    { id: 'readyToSend', label: 'Pronto a Enviar', count: readyToSend.length },
    { id: 'readyToTravel', label: 'Pronto a Viajar', count: readyToTravel.length },
    { id: 'completed', label: t('completed'), count: completed.length },
  ];

  let visibleTrips = allTrips;
  if (activeFilter === 'planned') visibleTrips = planned;
  else if (activeFilter === 'completed') visibleTrips = completed;
  else if (activeFilter === 'drafts') visibleTrips = drafts;
  else if (activeFilter === 'company') visibleTrips = company;
  else if (activeFilter === 'missingBookings') visibleTrips = missingBookings;
  else if (activeFilter === 'readyToSend') visibleTrips = readyToSend;
  else if (activeFilter === 'readyToTravel') visibleTrips = readyToTravel;

  if (searchQuery) {
    const lowerQ = searchQuery.toLowerCase();
    visibleTrips = visibleTrips.filter(t =>
      (t.title && t.title.toLowerCase().includes(lowerQ)) ||
      (t.destination && t.destination.toLowerCase().includes(lowerQ)) ||
      (t.clientName && t.clientName.toLowerCase().includes(lowerQ))
    );
  }

  visibleTrips = [...visibleTrips].sort((a, b) => {
    if (sortBy === 'updated_desc') {
      return new Date(b.lastUpdated || b.savedAt).getTime() - new Date(a.lastUpdated || a.savedAt).getTime();
    }
    if (sortBy === 'status') {
      const sA = a.operationalStatus?.status || '';
      const sB = b.operationalStatus?.status || '';
      return sA.localeCompare(sB);
    }
    if (sortBy === 'destination') {
      const dA = a.destination || a.title || '';
      const dB = b.destination || b.title || '';
      return dA.localeCompare(dB);
    }
    return 0;
  });

  const visibleCountLabel = visibleTrips.length === 1
    ? '1 roteiro nesta vista'
    : `${visibleTrips.length} roteiros nesta vista`;
  const plannedCountLabel = planned.length === 1
    ? '1 planeada'
    : `${planned.length} planeadas`;
  const completedCountLabel = completed.length === 1
    ? '1 concluida'
    : `${completed.length} concluidas`;

  const insightText = planned.length > 0
    ? 'Tens roteiros prontos para transformar em viagem. Abre o mais recente, ajusta datas e fecha os proximos passos.'
    : 'Marca paises visitados no mapa para transformar roteiros planeados em memorias guardadas.';

  const handleConfirmDelete = async () => {
    if (!tripPendingDelete?.id) {
      setTripPendingDelete(null);
      return;
    }

    try {
      if (onDeleteTrip) await onDeleteTrip(tripPendingDelete);
      else {
        deleteSavedTrip(tripPendingDelete.id);
        window.location.reload();
      }
    } finally {
      setTripPendingDelete(null);
    }
  };

  return (
    <>
      <section className={styles.section} id="journey-history">
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.badge}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.badgeIcon}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              {t('journalBadge')}
            </span>
            <h2 className={styles.title}>{t('journalTitle')}</h2>
            <p className={styles.subtitle}>{t('journalSubtitle')}</p>
          </div>
          <div className={styles.headerActionCard}>
            <span>Estado da jornada</span>
            <strong>{plannedCountLabel} / {completedCountLabel}</strong>
            <p>{insightText}</p>
          </div>
        </div>

        <div className={styles.journeyBoard}>
          <div className={styles.boardTopline}>
            <div className={styles.boardIntro}>
              <PlaneTakeoff size={18} />
              <span>{visibleCountLabel}</span>
            </div>
            <div className={styles.dashboardControls}>
              <div className={styles.searchBar}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Pesquisar roteiros..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.sortSelect}>
                <option value="updated_desc">Mais recentes</option>
                <option value="status">Estado</option>
                <option value="destination">Destino</option>
              </select>
            </div>
          </div>
          <div className={styles.filterTabsWrapper}>
            <div className={styles.filterTabs} role="tablist" aria-label="Filtrar roteiros">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={activeFilter === filter.id}
                  className={`${styles.filterTab} ${activeFilter === filter.id ? styles.filterTabActive : ''}`}
                  onClick={() => setActiveFilter(filter.id)}
                >
                  {filter.label}
                  <span>{filter.count}</span>
                </button>
              ))}
            </div>
          </div>

          {visibleTrips.length === 0 ? (
            <div className={styles.columnEmpty}>
              <p>{activeFilter === 'completed' ? t('completedEmpty') : t('plannedEmpty')}</p>
            </div>
          ) : (
            <div className={styles.tripGrid}>
              {visibleTrips.map((trip, index) => (
                <TripCard
                  key={trip.id || trip.destination || index}
                  trip={trip}
                  t={t}
                  status={trip.__status}
                  featured={index === 0 && activeFilter !== 'completed'}
                  onRequestDelete={setTripPendingDelete}
                  onOpenExpenses={setExpenseTrip}
                  onRenameTrip={onRenameTrip}
                  onDuplicateTrip={onDuplicateTrip}
                />
              ))}
            </div>
          )}
        </div>
      </section>
      <ConfirmDialog
        isOpen={Boolean(tripPendingDelete)}
        title="Eliminar roteiro?"
        description={`Esta ação remove "${tripPendingDelete?.destination || tripPendingDelete?.title || 'este roteiro'}" das tuas viagens guardadas.`}
        confirmLabel="Eliminar"
        cancelLabel="Manter"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setTripPendingDelete(null)}
      />
      <Modal
        isOpen={Boolean(expenseTrip)}
        onClose={() => setExpenseTrip(null)}
        title={`Despesas · ${expenseTrip?.destination || expenseTrip?.title || 'Viagem'}`}
        className={styles.expenseModal}
      >
        {expenseTrip && <TripExpenseManager trip={expenseTrip} />}
      </Modal>
    </>
  );
}
