// Client-side itinerary store for passing data between pages.
// Uses sessionStorage for generated itineraries and provides
// pre-built community itineraries by slug.

import { safeParse } from './safe-json';
import { getJson, setJson, removeItem } from './storage';
import { deriveTripStatus } from './trip-lifecycle';

const TRIP_DATA_VERSION = 4;

export function migrateTripData(trip) {
  if (!trip) return null;

  let migrated = { ...trip };
  const currentVersion = migrated.dataVersion || 1;

  if (currentVersion < 2) {
    migrated.tripStatus = migrated.tripStatus || 'draft';
    migrated.lastUpdated = migrated.lastUpdated || migrated.savedAt || new Date().toISOString();
  }

  if (currentVersion < 3) {
    migrated.lifecycle = migrated.lifecycle || {};
    if (!migrated.lifecycle.status) {
      migrated.lifecycle.status = deriveTripStatus(migrated);
    }
    migrated.shareConfig = migrated.shareConfig || { visibility: 'private' };
  }

  if (currentVersion < 4) {
    if (typeof migrated.destination === 'string') {
      migrated.destinationText = migrated.destination;
      migrated.destinationEntity = null;
      migrated.resolutionStatus = 'legacy_unresolved';
    } else if (migrated.destination && typeof migrated.destination === 'object') {
      migrated.destinationEntity = migrated.destination.entityId ? migrated.destination : null;
      migrated.destinationText = migrated.destination.canonicalName || migrated.destination.city || '';
      migrated.resolutionStatus = migrated.destination.resolutionStatus || (migrated.destination.entityId ? 'resolved' : 'legacy_unresolved');
    }
  }

  migrated.dataVersion = TRIP_DATA_VERSION;
  return migrated;
}

export function unwrapGeneratedItinerary(response) {
  if (!response || typeof response !== 'object') return response;
  if (response.itinerary && typeof response.itinerary === 'object') {
    return {
      ...response.itinerary,
      id: response.itinerary.id || response.id,
      shareToken: response.itinerary.shareToken || response.shareToken,
      persistence: response.persistence,
    };
  }
  return response;
}

export function enrichItineraryData(itinerary) {
  if (!itinerary) return null;
  
  let enriched;
  try {
    const raw = typeof itinerary === 'string' ? safeParse(itinerary, null) : itinerary;
    enriched = raw ? JSON.parse(JSON.stringify(unwrapGeneratedItinerary(raw))) : null;
    if (!enriched) return null;
  } catch (e) {
    return null;
  }

  // Persistence hydration is shape-only. Provider/API enrichment happens in
  // dedicated flows; stored values must never gain synthetic coordinates,
  // costs, tips, or venue facts merely because they were read from storage.
  return enriched;
}

export function saveGeneratedItinerary(itinerary) {
  const normalizedInput = unwrapGeneratedItinerary(itinerary);
  const id = normalizedInput?.id || 'gen-' + Date.now();
  const savedAt = new Date().toISOString();
  const stored = migrateTripData({ ...normalizedInput, id, createdAt: normalizedInput?.createdAt || savedAt, savedAt: normalizedInput?.savedAt || savedAt, lastUpdated: savedAt });
  setJson(`andor_itinerary_${id}`, stored, 'session');
  setJson(`andor_itinerary_${id}`, stored, 'local');
  setJson(`andor_shared_${id}`, stored, 'local');

  const savedTrips = getJson('andor_saved_trips', [], 'local') || [];
  const summary = normalizeTripForJourney(stored, id);
  if (summary) {
    const deduped = savedTrips.filter((trip) => trip?.id !== id);
    setJson('andor_saved_trips', [summary, ...deduped].slice(0, 30), 'local');
  }

  return id;
}

export function getItinerary(id) {
  // Session edits win so regenerated community trips survive refreshes.
  let stored = getJson(`andor_itinerary_${id}`, null, 'session');
  if (stored) return enrichItineraryData(migrateTripData(stored));

  let persisted = getJson(`andor_itinerary_${id}`, null, 'local');
  if (persisted) return enrichItineraryData(migrateTripData(persisted));

  const community = communityItineraries[id];
  if (community) {
    return enrichItineraryData(migrateTripData({
      ...community,
      metadata: {
        ...(community.metadata || {}),
        source: 'curated-demo',
        generationSource: 'fallback',
      },
    }));
  }

  return null;
}

export function updateSavedTrip(id, updater) {
  if (!id || typeof window === 'undefined') return null;

  let trip = getJson(`andor_itinerary_${id}`, null, 'local')
    || getJson(`andor_itinerary_${id}`, null, 'session')
    || communityItineraries[id]
    || null;
  if (!trip) return null;

  trip = migrateTripData(trip);
  const updated = updater(trip);
  if (!updated || typeof updated !== 'object') return null;

  updated.lastUpdated = new Date().toISOString();
  updated.lifecycle = updated.lifecycle || {};
  updated.lifecycle.status = deriveTripStatus(updated);

  setJson(`andor_itinerary_${id}`, updated, 'session');
  setJson(`andor_itinerary_${id}`, updated, 'local');
  setJson(`andor_shared_${id}`, updated, 'local');

  const savedTrips = getJson('andor_saved_trips', [], 'local') || [];
  const summary = normalizeTripForJourney(updated, id);
  if (summary) {
    const idx = savedTrips.findIndex(t => t.id === id);
    if (idx !== -1) {
      savedTrips[idx] = summary;
    } else {
      savedTrips.unshift(summary);
    }
    setJson('andor_saved_trips', savedTrips.slice(0, 30), 'local');
  }

  return updated;
}

export function deleteSavedTrip(id) {
  if (!id || typeof window === 'undefined') return false;

  removeItem(`andor_itinerary_${id}`, 'local');
  removeItem(`andor_itinerary_${id}`, 'session');
  removeItem(`andor_shared_${id}`, 'local');
  removeItem(`andor_itinerary_versions_${id}`, 'local');
  removeItem(`andor_booking_checklist_${id}`, 'local');
  removeItem(`andor_documents_checklist_${id}`, 'local');
  removeItem(`andor_rental_car_${id}`, 'local');
  removeItem(`andor_packing_${id}`, 'local');
  removeItem(`andor_packing_checked_${id}`, 'local');

  const savedTrips = getJson('andor_saved_trips', [], 'local') || [];
  const deduped = savedTrips.filter((trip) => trip?.id !== id);
  setJson('andor_saved_trips', deduped, 'local');

  return true;
}

export function duplicateSavedTrip(id, newName) {
  const trip = getItinerary(id);
  if (!trip) return null;

  const newId = 'gen-' + Date.now();
  const duplicated = {
    ...trip,
    id: newId,
    title: newName || `${trip.title || 'Viagem'} (Cópia)`,
    createdAt: new Date().toISOString(),
    savedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  saveGeneratedItinerary(duplicated);
  return newId;
}

export function renameSavedTrip(id, newName) {
  return updateSavedTrip(id, (trip) => {
    return { ...trip, title: newName };
  });
}

export function getTripOperationalSummary(trip) {
  if (!trip) return null;

  const bookingItems = trip.bookingChecklist?.items || [];
  const requiredDocs = (trip.documentsChecklist?.items || []).filter(d => d.importance === 'required');
  const backupPlans = trip.backupPlans?.items || [];

  const bookingsReady = bookingItems.filter(i => ['booked', 'confirmed'].includes(i.status)).length;
  const docsReady = requiredDocs.filter(d => ['ready', 'uploaded_confirmed', 'not_applicable'].includes(d.status)).length;

  return {
    status: trip.lifecycle?.status || deriveTripStatus(trip),
    bookings: {
      total: bookingItems.length,
      ready: bookingsReady,
      missing: bookingItems.length - bookingsReady,
      isComplete: bookingItems.length > 0 && bookingsReady === bookingItems.length
    },
    documents: {
      required: requiredDocs.length,
      ready: docsReady,
      missing: requiredDocs.length - docsReady,
      isComplete: requiredDocs.length === 0 || docsReady === requiredDocs.length
    },
    backups: {
      total: backupPlans.length,
      isHealthy: backupPlans.length >= 8
    },
    lastUpdated: trip.lastUpdated || trip.savedAt
  };
}

function getStorageEntries(kind) {
  if (typeof window === 'undefined') return [];
  const entries = [];
  try {
    const storage = kind === 'session' ? window.sessionStorage : window.localStorage;
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key || !key.startsWith('andor_itinerary_') || key.startsWith('andor_itinerary_versions_')) {
        continue;
      }
      const id = key.replace('andor_itinerary_', '');
      const value = getJson(key, null, kind);
      entries.push([id, value]);
    }
  } catch (error) {
    return [];
  }
  return entries;
}

function getDestinationLabel(itinerary) {
  if (!itinerary) return 'Viagem';
  const rawParts = typeof itinerary.destination === 'string'
    ? [itinerary.destination]
    : [
        itinerary.destination?.city,
        itinerary.destination?.name,
        itinerary.destination?.country,
      ].filter(Boolean);
  const parts = rawParts.flatMap((part) => String(part || '').split(','));

  const cleanParts = parts
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .filter((part, index, list) => (
      list.findIndex((candidate) => candidate.toLowerCase() === part.toLowerCase()) === index
    ));

  return cleanParts.join(', ') || itinerary.title || 'Viagem';
}

function getTripTotalCost(itinerary) {
  const breakdown = itinerary?.trip?.budgetBreakdown;
  const budget = breakdown?.grandTotal;
  if (itinerary?.totalCost) return itinerary.totalCost;
  if (itinerary?.trip?.totalCost) return itinerary.trip.totalCost;

  const currencyValue = breakdown?.currency
    || itinerary?.trip?.currency
    || itinerary?.destination?.currency
    || itinerary?.currency;
  const currencyCode = typeof currencyValue === 'object'
    ? String(currencyValue?.code || '').toUpperCase()
    : String(currencyValue || '').toUpperCase();
  const explicitSymbol = typeof currencyValue === 'object' ? currencyValue?.symbol : '';
  const currencySymbols = { EUR: '€', GBP: '£', JPY: '¥', USD: '$' };
  const symbol = explicitSymbol || currencySymbols[currencyCode] || '';
  const formatAmount = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return null;
    const formatted = number.toLocaleString('pt-PT', { maximumFractionDigits: 2 });
    if (symbol) return `${symbol}${formatted}`;
    if (currencyCode) return `${currencyCode} ${formatted}`;
    return `${formatted} (moeda por confirmar)`;
  };

  const minimum = formatAmount(budget?.min);
  const maximum = formatAmount(budget?.max);
  if (minimum && maximum) return `${minimum}–${maximum}`;
  if (minimum) return `${minimum}+`;
  return null;
}

export function normalizeTripForJourney(itinerary, fallbackId = null) {
  if (!itinerary || typeof itinerary !== 'object') return null;
  const id = itinerary.id || fallbackId;
  if (!id) return null;

  const days = Array.isArray(itinerary.days) ? itinerary.days : [];
  const trip = itinerary.trip || {};
  const destination = getDestinationLabel(itinerary);
  const title = itinerary.title
    ? getDestinationLabel({ destination: itinerary.title })
    : itinerary.title;

  return {
    ...itinerary,
    id,
    title,
    destination,
    days,
    daysCount: itinerary.daysCount || trip.totalDays || days.length || null,
    style: itinerary.style || trip.travelStyle || trip.groupType || null,
    totalCost: getTripTotalCost(itinerary),
    savedAt: itinerary.savedAt || itinerary.createdAt || new Date().toISOString(),
    lastUpdated: itinerary.lastUpdated || itinerary.savedAt || new Date().toISOString(),
    lifecycle: itinerary.lifecycle || { status: deriveTripStatus(itinerary) },
    operationalStatus: getTripOperationalSummary(itinerary),
    viewHref: `/itinerary/${id}`,
  };
}

export function getStoredJourneyTrips() {
  if (typeof window === 'undefined') return [];

  const byId = new Map();
  const getTripSignature = (trip) => {
    const firstDay = Array.isArray(trip.days) ? trip.days[0] : null;
    const firstStop = Array.isArray(firstDay?.stops) ? firstDay.stops[0] : null;
    return [
      String(trip.destination || '').toLowerCase(),
      String(trip.daysCount || trip.days?.length || '').toLowerCase(),
      String(trip.style || '').toLowerCase(),
      String(trip.totalCost || '').toLowerCase(),
      String(firstDay?.title || '').toLowerCase(),
      String(firstStop?.name || '').toLowerCase(),
    ].join('|');
  };
  const getTripDisplayKey = (trip) => {
    const normalizeKey = (value) => String(value || '').trim().toLowerCase();
    const destinationKey = normalizeKey(trip.destination);
    const titleKey = normalizeKey(trip.title);

    if (!destinationKey) return titleKey || trip.id;
    if (!titleKey || titleKey === destinationKey || titleKey.includes(destinationKey)) {
      return destinationKey;
    }

    return `${destinationKey}|${titleKey}`;
  };

  const addTrip = (trip, fallbackId = null) => {
    const normalized = normalizeTripForJourney(trip, fallbackId);
    if (!normalized) return;

    byId.set(normalized.id, {
      ...byId.get(normalized.id),
      ...normalized,
    });
  };

  const savedTrips = getJson('andor_saved_trips', [], 'local') || [];
  savedTrips.forEach((trip) => addTrip(migrateTripData(trip)));

  const user = getJson('andor_user', null, 'local');
  (user?.trips || []).forEach((trip) => addTrip(migrateTripData(trip)));

  getStorageEntries('local').forEach(([id, trip]) => addTrip(migrateTripData(trip), id));
  getStorageEntries('session').forEach(([id, trip]) => addTrip(migrateTripData(trip), id));

  const bySignature = new Map();
  Array.from(byId.values()).forEach((trip) => {
    const signature = getTripSignature(trip);
    const existing = bySignature.get(signature);
    if (!existing || new Date(trip.savedAt || 0) > new Date(existing.savedAt || 0)) {
      bySignature.set(signature, trip);
    }
  });

  const byDisplay = new Map();
  Array.from(bySignature.values()).forEach((trip) => {
    const key = getTripDisplayKey(trip);
    const existing = byDisplay.get(key);
    if (!existing || new Date(trip.savedAt || 0) > new Date(existing.savedAt || 0)) {
      byDisplay.set(key, trip);
    }
  });

  return Array.from(byDisplay.values())
    .sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0))
    .slice(0, 30);
}

// Pre-built community itineraries with full detail data
export const communityItineraries = {
  'hidden-gems-lisbon': {
    id: 'hidden-gems-lisbon',
    destination: 'Lisbon, Portugal',
    title: 'Hidden Gems of Lisbon',
    author: { name: 'Maria S.', flag: '🇵🇹', avatar: 'M' },
    badge: '🔥 Trending',
    likes: '2.4K',
    saves: '890',
    price: '€4.99',
    duration: '3 days',
    style: 'Cultural',
    travelers: '1-2',
    image: 'https://images.unsplash.com/photo-1548705085-101177834f47?q=80&w=1200&auto=format&fit=crop',
    description: 'A 3-day cultural deep dive into Lisbon\'s lesser-known neighborhoods, local markets, and secret viewpoints that most tourists never find.',
    totalCost: '€285',
    days: [
      {
        title: 'Day 1 — Secret Alfama & Local Markets',
        stops: [
          { time: '09:00', name: 'Padaria da Graça', type: '☕ Breakfast — Hidden neighborhood bakery', coordinates: { lat: 38.7180, lng: -9.1305 } },
          { time: '10:30', name: 'Feira da Ladra Flea Market', type: '🛍️ Shopping — Vintage treasures every Tuesday & Saturday', coordinates: { lat: 38.7153, lng: -9.1248 } },
          { time: '12:30', name: 'Tasca do Chico', type: '🎵 Culture — Authentic fado in a tiny Alfama tavern', coordinates: { lat: 38.7123, lng: -9.1437 } },
          { time: '14:00', name: 'Mercado de Santa Clara', type: '🍽️ Lunch — Local produce & artisan food stalls', coordinates: { lat: 38.7157, lng: -9.1252 } },
          { time: '16:00', name: 'Miradouro da Graça', type: '🌅 Viewpoint — Sunset over the Tagus River', coordinates: { lat: 38.7162, lng: -9.1315 } },
          { time: '18:00', name: 'Mouraria District Walk', type: '🚶 Culture — Lisbon\'s multicultural melting pot', coordinates: { lat: 38.7165, lng: -9.1350 } },
          { time: '20:00', name: 'O Velho Eurico', type: '🍷 Dinner — Traditional tavern in Alfama', coordinates: { lat: 38.7126, lng: -9.1298 } },
        ],
      },
      {
        title: 'Day 2 — Street Art & Alternative Culture',
        stops: [
          { time: '09:30', name: 'Copenhagen Coffee Lab', type: '☕ Breakfast — Specialty coffee in Santos', coordinates: { lat: 38.7088, lng: -9.1554 } },
          { time: '11:00', name: 'LX Factory', type: '🎨 Art — Creative hub with murals & indie shops', coordinates: { lat: 38.7029, lng: -9.1782 } },
          { time: '13:00', name: 'Ponto Final', type: '🍽️ Lunch — Hidden gem across the river in Almada', coordinates: { lat: 38.6852, lng: -9.1568 } },
          { time: '15:00', name: 'Underdogs Gallery', type: '🖼️ Art — World-class street art gallery', coordinates: { lat: 38.7299, lng: -9.1026 } },
          { time: '16:30', name: 'Village Underground Lisboa', type: '🎶 Culture — Converted shipping containers', coordinates: { lat: 38.7022, lng: -9.1793 } },
          { time: '18:30', name: 'Jardim da Estrela', type: '🌳 Relax — Peaceful garden at golden hour', coordinates: { lat: 38.7136, lng: -9.1594 } },
          { time: '20:30', name: 'Taberna da Rua das Flores', type: '🍷 Dinner — Famous petiscos & natural wine', coordinates: { lat: 38.7107, lng: -9.1432 } },
        ],
      },
      {
        title: 'Day 3 — Coastal Secrets & Belém',
        stops: [
          { time: '08:30', name: 'Manteigaria', type: '☕ Breakfast — Best pastéis de nata (locals\' choice)', coordinates: { lat: 38.7109, lng: -9.1439 } },
          { time: '10:00', name: 'Praia de Carcavelos', type: '🏖️ Beach — Surf & swim (train from Cais do Sodré)', coordinates: { lat: 38.6792, lng: -9.3364 } },
          { time: '12:30', name: 'Ponto de Encontro', type: '🍽️ Lunch — Seafood shack by the beach', coordinates: { lat: 38.6865, lng: -9.3340 } },
          { time: '14:30', name: 'Belém Riverside Walk', type: '🚶 Walk — MAAT to Torre de Belém', coordinates: { lat: 38.6961, lng: -9.1990 } },
          { time: '16:30', name: 'Jardim Botânico Tropical', type: '🌿 Nature — Hidden tropical garden in Belém', coordinates: { lat: 38.6983, lng: -9.2045 } },
          { time: '18:30', name: 'Miradouro de Santa Catarina', type: '🌅 Viewpoint — Sundowner with river views', coordinates: { lat: 38.7095, lng: -9.1476 } },
          { time: '20:30', name: 'Cervejaria Ramiro', type: '🦐 Dinner — Lisbon\'s legendary seafood restaurant', coordinates: { lat: 38.7224, lng: -9.1352 } },
        ],
      },
    ],
  },
  'barcelona-budget': {
    id: 'barcelona-budget',
    destination: 'Barcelona, Spain',
    title: 'Barcelona on a Budget',
    author: { name: 'Carlos R.', flag: '🇪🇸', avatar: 'C' },
    badge: '⭐ Top Rated',
    likes: '1.8K',
    saves: '654',
    price: 'Free',
    duration: '5 days',
    style: 'Budget',
    travelers: '1-4',
    image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?q=80&w=1200&auto=format&fit=crop',
    description: 'Experience the best of Barcelona for under €50/day — free attractions, cheap eats, and local secrets that save you money without missing anything.',
    totalCost: '€245',
    days: [
      {
        title: 'Day 1 — Gothic Quarter & Free Attractions',
        stops: [
          { time: '09:00', name: 'La Boqueria Market', type: '☕ Breakfast — Fresh juice & pastry (€3)' },
          { time: '10:30', name: 'Gothic Quarter Walking Tour', type: '🚶 Free — Tip-based guided tour' },
          { time: '13:00', name: 'Bo de B', type: '🍽️ Lunch — Best €5 sandwich in Barcelona' },
          { time: '14:30', name: 'Barcelona Cathedral', type: '⛪ Free — Gothic masterpiece (free before 12:30)' },
          { time: '16:00', name: 'Park de la Ciutadella', type: '🌳 Free — Lake, fountain & relaxation' },
          { time: '18:00', name: 'Barceloneta Beach', type: '🏖️ Free — Swim & sunset on the Med' },
          { time: '20:30', name: 'La Pepita', type: '🍷 Dinner — Affordable tapas in Gràcia' },
        ],
      },
      {
        title: 'Day 2 — Gaudí & Montjuïc',
        stops: [
          { time: '09:00', name: 'Sagrada Família (exterior)', type: '📸 Free — Stunning from outside' },
          { time: '10:30', name: 'Casa Batlló (exterior walk)', type: '🚶 Free — Passeig de Gràcia architecture' },
          { time: '12:00', name: 'Mercat de Santa Caterina', type: '🍽️ Lunch — Local market, fresh & cheap' },
          { time: '14:00', name: 'Montjuïc Castle Walk', type: '🏰 Free — Panoramic views of the city' },
          { time: '16:00', name: 'MNAC Terrace', type: '🖼️ Free — Free entry Saturday after 3pm' },
          { time: '18:00', name: 'Magic Fountain Show', type: '✨ Free — Light & music spectacle (Thu-Sun)' },
          { time: '20:30', name: 'Cervecería Catalana', type: '🍻 Dinner — Classic Barcelona tapas bar' },
        ],
      },
    ],
  },
  'romantic-paris': {
    id: 'romantic-paris',
    destination: 'Paris, France',
    title: 'Romantic Paris Weekend',
    author: { name: 'Sophie L.', flag: '🇫🇷', avatar: 'S' },
    badge: '💕 Popular',
    likes: '3.1K',
    saves: '1.2K',
    price: '€5.99',
    duration: '2 days',
    style: 'Romantic',
    travelers: '2',
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=1200&auto=format&fit=crop',
    description: 'The ultimate couple\'s guide — candlelit dinners, Seine river walks, and the most intimate spots in Paris.',
    totalCost: '€420',
    days: [
      {
        title: 'Day 1 — Icons & Romance',
        stops: [
          { time: '09:00', name: 'Café de Flore', type: '☕ Breakfast — Legendary Saint-Germain café' },
          { time: '10:30', name: 'Eiffel Tower', type: '🗼 Landmark — Summit visit with city views' },
          { time: '13:00', name: 'Champ de Mars Picnic', type: '🧺 Lunch — Baguette, cheese & wine' },
          { time: '15:00', name: 'Musée d\'Orsay', type: '🎨 Art — Impressionist masterpieces' },
          { time: '17:30', name: 'Seine River Cruise', type: '🛥️ Experience — Golden hour boat ride' },
          { time: '19:30', name: 'Le Marais Quarter', type: '💕 Culture — Trendy neighborhood stroll' },
          { time: '21:00', name: 'Le Bouillon Chartier', type: '🍷 Dinner — Classic Parisian bistro since 1896' },
        ],
      },
      {
        title: 'Day 2 — Montmartre & Sunset',
        stops: [
          { time: '09:30', name: 'Maison Rose', type: '☕ Breakfast — Pink café in Montmartre' },
          { time: '11:00', name: 'Sacré-Cœur Basilica', type: '⛪ Views — Panoramic city views' },
          { time: '12:30', name: 'Place du Tertre', type: '🎨 Art — Portrait painters & street artists' },
          { time: '14:00', name: 'Shakespeare and Company', type: '📚 Culture — Iconic English bookshop' },
          { time: '15:30', name: 'Luxembourg Gardens', type: '🌳 Relax — Beautiful formal gardens' },
          { time: '17:30', name: 'Pont des Arts', type: '💕 Walk — Romantic bridge at sunset' },
          { time: '20:00', name: 'Pink Mamma', type: '🍝 Dinner — 4-story Italian, rooftop terrace' },
        ],
      },
    ],
  },
  'swiss-alps-train': {
    id: 'swiss-alps-train',
    destination: 'Switzerland',
    title: 'Swiss Alps Train Journey',
    author: { name: 'Heidi L.', flag: '🇨🇭', avatar: 'H' },
    badge: '🚂 Scenic',
    likes: '1.9K',
    saves: '800',
    price: '€12.99',
    duration: '5 days',
    style: 'Scenic',
    travelers: '1-4',
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=1200&auto=format&fit=crop',
    description: 'Glacier Express route and the most scenic mountain views in Switzerland.',
    totalCost: 'CHF 1,200',
    days: [
      {
        title: 'Day 1 — Zurich to Lucerne',
        stops: [
          { time: '09:00', name: 'Zurich Hauptbahnhof', type: '🚂 Departure — Begin the journey' },
          { time: '10:00', name: 'Train to Lucerne (45 min)', type: '🏔️ Scenic — Lake views along the route' },
          { time: '11:00', name: 'Chapel Bridge', type: '🌉 Landmark — Europe\'s oldest covered bridge' },
          { time: '13:00', name: 'Old Town Lucerne', type: '🍽️ Lunch — Lakeside dining' },
          { time: '15:00', name: 'Mount Pilatus Cogwheel', type: '🏔️ Experience — Steepest cogwheel railway' },
          { time: '18:00', name: 'Lake Lucerne Sunset Cruise', type: '🛥️ Scenic — Golden hour on the lake' },
          { time: '20:00', name: 'Restaurant Fritschi', type: '🍽️ Dinner — Traditional Swiss cuisine' },
        ],
      },
      {
        title: 'Day 2 — Glacier Express Day',
        stops: [
          { time: '08:00', name: 'Lucerne to Andermatt', type: '🚂 Transfer — Mountain pass route' },
          { time: '09:30', name: 'Board Glacier Express', type: '🚂 Iconic — "Slowest express train"' },
          { time: '12:00', name: 'Oberalp Pass (2,033m)', type: '🏔️ Summit — Highest point of the route' },
          { time: '13:00', name: 'Lunch on the Train', type: '🍽️ Fine dining at 2,000m altitude' },
          { time: '15:00', name: 'Landwasser Viaduct', type: '📸 Iconic — UNESCO World Heritage bridge' },
          { time: '17:00', name: 'Arrive in Zermatt', type: '🏔️ Arrival — Car-free village' },
          { time: '19:30', name: 'Matterhorn View Dinner', type: '🍷 Dinner — Restaurant with iconic peak views' },
        ],
      },
    ],
  },
  'azores-adventure': {
    id: 'azores-adventure',
    destination: 'Azores, Portugal',
    title: 'Azores Adventure Week',
    author: { name: 'João M.', flag: '🇵🇹', avatar: 'J' },
    badge: '🌿 Nature',
    likes: '1.2K',
    saves: '478',
    price: '€6.99',
    duration: '7 days',
    style: 'Adventure',
    travelers: '1-4',
    image: 'https://images.unsplash.com/photo-1582885938164-1af58ee6effa?q=80&w=1200&auto=format&fit=crop',
    description: 'Volcanic lakes, whale watching, hot springs, and hiking trails across São Miguel island.',
    totalCost: '€520',
    days: [
      {
        title: 'Day 1 — Sete Cidades & Crater Lakes',
        stops: [
          { time: '08:00', name: 'Hotel Pickup', type: '🚗 Transfer — Drive to the west coast' },
          { time: '09:30', name: 'Vista do Rei Viewpoint', type: '🌅 Views — Blue & Green twin crater lakes' },
          { time: '10:30', name: 'Sete Cidades Hike', type: '🥾 Hike — Circle the volcanic caldera (2.5h)' },
          { time: '13:00', name: 'Village of Sete Cidades', type: '🍽️ Lunch — Local açorda & fresh fish' },
          { time: '15:00', name: 'Mosteiros Beach', type: '🏖️ Beach — Black volcanic sand' },
          { time: '17:00', name: 'Ponta da Ferraria Hot Spring', type: '♨️ Nature — Ocean-heated natural pool' },
          { time: '20:00', name: 'Restaurante Alcides', type: '🍽️ Dinner — Famous Azorean steak' },
        ],
      },
      {
        title: 'Day 2 — Whale Watching & Furnas',
        stops: [
          { time: '08:30', name: 'Ponta Delgada Marina', type: '🐋 Whale watching — Sperm whales & dolphins' },
          { time: '12:00', name: 'Drive to Furnas Valley', type: '🚗 Transfer — Through the mountains' },
          { time: '13:00', name: 'Cozido das Furnas', type: '🍽️ Lunch — Stew cooked underground by volcanic heat' },
          { time: '14:30', name: 'Terra Nostra Park', type: '♨️ Hot spring — Iron-rich thermal pool (37°C)' },
          { time: '16:30', name: 'Furnas Lake Caldeiras', type: '🌋 Volcanic — Bubbling mud pots & geysers' },
          { time: '18:00', name: 'Lagoa do Fogo Viewpoint', type: '🌅 Views — Fire Lake at sunset' },
          { time: '20:00', name: 'A Tasca', type: '🍷 Dinner — Petiscos & local wines' },
        ],
      },
    ],
  },
  'tokyo-food': {
    id: 'tokyo-food',
    destination: 'Tokyo, Japan',
    title: 'Tokyo Food Tour',
    author: { name: 'Yuki T.', flag: '🇯🇵', avatar: 'Y' },
    badge: '🍜 Food',
    likes: '2.9K',
    saves: '1.1K',
    price: '€4.99',
    duration: '4 days',
    style: 'Food & Culture',
    travelers: '1-2',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1200&auto=format&fit=crop',
    description: 'From Tsukiji fish market to hidden ramen bars — a food lover\'s dream itinerary across Tokyo.',
    totalCost: '¥85,000',
    days: [
      {
        title: 'Day 1 — Tsukiji & Traditional Tokyo',
        stops: [
          { time: '07:00', name: 'Tsukiji Outer Market', type: '🍣 Breakfast — Fresh sushi at dawn', coordinates: { lat: 35.6655, lng: 139.7702 } },
          { time: '09:30', name: 'Senso-ji Temple', type: '⛩️ Culture — Nakamise street snacks', coordinates: { lat: 35.7148, lng: 139.7967 } },
          { time: '11:30', name: 'Asakusa Hoppy Street', type: '🍺 Drinks — Retro izakaya alley', coordinates: { lat: 35.7140, lng: 139.7950 } },
          { time: '13:00', name: 'Ichiran Ramen', type: '🍜 Lunch — Solo booth tonkotsu ramen', coordinates: { lat: 35.7001, lng: 139.7718 } },
          { time: '15:00', name: 'Yanaka Ginza', type: '🚶 Walk — Old Tokyo shopping street', coordinates: { lat: 35.7275, lng: 139.7675 } },
          { time: '17:00', name: 'Ameya-Yokocho Market', type: '🛍️ Market — Street food & bargains', coordinates: { lat: 35.7084, lng: 139.7743 } },
          { time: '19:30', name: 'Yakitori Alley (Yurakucho)', type: '🍗 Dinner — Under-the-tracks grilled skewers', coordinates: { lat: 35.6740, lng: 139.7610 } },
        ],
      },
      {
        title: 'Day 2 — Shibuya, Shinjuku & Ramen',
        stops: [
          { time: '09:00', name: 'Shinjuku Gyoen Gardens', type: '🌸 Morning — Peaceful breakfast in the park', coordinates: { lat: 35.6852, lng: 139.7101 } },
          { time: '11:00', name: 'Depachika (Isetan B1)', type: '🍱 Food hall — Luxury basement food floor', coordinates: { lat: 35.6917, lng: 139.7047 } },
          { time: '12:30', name: 'Fuunji Ramen', type: '🍜 Lunch — Legendary tsukemen (dipping noodles)', coordinates: { lat: 35.6880, lng: 139.6950 } },
          { time: '14:30', name: 'Harajuku Crepe Street', type: '🍰 Snack — Takeshita Street desserts', coordinates: { lat: 35.6702, lng: 139.7049 } },
          { time: '16:00', name: 'Shibuya Crossing', type: '📸 Experience — World\'s busiest intersection', coordinates: { lat: 35.6595, lng: 139.7005 } },
          { time: '18:00', name: 'Nonbei Yokocho', type: '🍶 Drinks — "Drunkard\'s Alley" tiny bars', coordinates: { lat: 35.6599, lng: 139.7012 } },
          { time: '20:00', name: 'Shinjuku Golden Gai', type: '🍻 Dinner — 200+ tiny themed bars', coordinates: { lat: 35.6938, lng: 139.7042 } },
        ],
      },
    ],
  },
  'bali-nomad': {
    id: 'bali-nomad',
    destination: 'Bali, Indonesia',
    title: 'Bali Digital Nomad',
    author: { name: 'Alex K.', flag: '🇮🇩', avatar: 'A' },
    badge: '💻 Remote',
    likes: '5.2K',
    saves: '3K',
    price: 'Free',
    duration: '30 days',
    style: 'Digital Nomad',
    travelers: '1',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200&auto=format&fit=crop',
    description: 'Work and surf in Canggu with the best cafes and co-working spaces.',
    totalCost: '$1,200',
    days: [
      {
        title: 'Day 1 — Canggu Setup',
        stops: [
          { time: '07:00', name: 'Batu Bolong Beach', type: '🏄 Surf — Morning surf session' },
          { time: '09:00', name: 'Crate Café', type: '☕ Breakfast — Best avocado toast in Canggu' },
          { time: '10:00', name: 'Dojo Bali', type: '💻 Cowork — Premium co-working space' },
          { time: '13:00', name: 'Warung Local', type: '🍽️ Lunch — Nasi Goreng for $2' },
          { time: '14:00', name: 'Dojo Bali (afternoon)', type: '💻 Work — Afternoon focus session' },
          { time: '17:00', name: 'Old Man\'s', type: '🍻 Social — Sunset drinks & live music' },
          { time: '19:30', name: 'La Brisa', type: '🍷 Dinner — Beach club dining at sunset' },
        ],
      },
      {
        title: 'Day 2 — Ubud Culture Day',
        stops: [
          { time: '07:00', name: 'Tegallalang Rice Terraces', type: '🌾 Nature — Iconic rice paddy views' },
          { time: '09:00', name: 'Seniman Coffee', type: '☕ Breakfast — Ubud\'s best specialty coffee' },
          { time: '10:30', name: 'Ubud Monkey Forest', type: '🐒 Nature — Sacred monkey sanctuary' },
          { time: '12:30', name: 'Locavore', type: '🍽️ Lunch — Fine dining with local ingredients' },
          { time: '14:30', name: 'Tirta Empul Temple', type: '⛩️ Culture — Sacred water purification' },
          { time: '17:00', name: 'Campuhan Ridge Walk', type: '🌅 Walk — Stunning ridge sunset walk' },
          { time: '19:30', name: 'Hujan Locale', type: '🍷 Dinner — Modern Indonesian cuisine' },
        ],
      },
    ],
  },
  'nyc-3-days': {
    id: 'nyc-3-days',
    destination: 'New York City, USA',
    title: 'NYC in 3 Days',
    author: { name: 'Jake W.', flag: '🇺🇸', avatar: 'J' },
    badge: '🗽 Classic',
    likes: '4.5K',
    saves: '2.1K',
    price: 'Free',
    duration: '3 days',
    style: 'Classic',
    travelers: '1-4',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=1200&auto=format&fit=crop',
    description: 'Hit every iconic spot — Central Park, Brooklyn Bridge, Broadway, and the best pizza in Manhattan.',
    totalCost: '$450',
    days: [
      {
        title: 'Day 1 — Manhattan Icons',
        stops: [
          { time: '08:00', name: 'Central Park Morning Walk', type: '🌳 Nature — Bethesda Fountain & Bow Bridge' },
          { time: '10:00', name: 'Metropolitan Museum of Art', type: '🎨 Art — "Pay what you wish" for NYC residents' },
          { time: '12:30', name: 'Joe\'s Pizza', type: '🍕 Lunch — NYC\'s most iconic dollar slice' },
          { time: '14:00', name: 'Top of the Rock', type: '🏙️ Views — Best skyline view (better than Empire State)' },
          { time: '16:00', name: 'Times Square', type: '📸 Iconic — The crossroads of the world' },
          { time: '18:00', name: 'Broadway Show', type: '🎭 Theater — Catch a matinee or evening show' },
          { time: '21:00', name: 'Katz\'s Delicatessen', type: '🍖 Dinner — Famous pastrami since 1888' },
        ],
      },
      {
        title: 'Day 2 — Brooklyn & Lower Manhattan',
        stops: [
          { time: '08:30', name: 'Brooklyn Bridge Walk', type: '🌉 Iconic — Walk across at sunrise' },
          { time: '10:00', name: 'DUMBO', type: '📸 Views — Manhattan Bridge view from Washington St' },
          { time: '11:30', name: 'Chelsea Market', type: '🍽️ Lunch — Food hall & artisan shops' },
          { time: '13:30', name: 'High Line Park', type: '🌿 Walk — Elevated park on old railway' },
          { time: '15:30', name: 'Statue of Liberty Ferry', type: '🗽 Landmark — Staten Island Ferry (free!)' },
          { time: '17:30', name: '9/11 Memorial', type: '🕊️ Memorial — Reflecting pools & museum' },
          { time: '20:00', name: 'Di Fara Pizza', type: '🍕 Dinner — Best pizza in Brooklyn' },
        ],
      },
    ],
  },
};
