// Client-side itinerary store for passing data between pages.
// Uses sessionStorage for generated itineraries and provides
// pre-built community itineraries by slug.

import { safeParse } from './safe-json';
import { getJson, setJson } from './storage';

export function enrichItineraryData(itinerary) {
  if (!itinerary) return null;
  
  let enriched;
  try {
    enriched = typeof itinerary === 'string' ? safeParse(itinerary, null) : JSON.parse(JSON.stringify(itinerary));
    if (!enriched) return null;
  } catch (e) {
    return null;
  }

  const coordsLookup = {
    // Lisbon
    'padaria da graça': { lat: 38.7180, lng: -9.1305 },
    'feira da ladra flea market': { lat: 38.7153, lng: -9.1248 },
    'tasca do chico': { lat: 38.7123, lng: -9.1437 },
    'mercado de santa clara': { lat: 38.7157, lng: -9.1252 },
    'miradouro da graça': { lat: 38.7162, lng: -9.1315 },
    'mouraria district walk': { lat: 38.7165, lng: -9.1350 },
    'o velho eurico': { lat: 38.7126, lng: -9.1298 },
    'copenhagen coffee lab': { lat: 38.7088, lng: -9.1554 },
    'lx factory': { lat: 38.7029, lng: -9.1782 },
    'ponto final': { lat: 38.6852, lng: -9.1568 },
    'underdogs gallery': { lat: 38.7299, lng: -9.1026 },
    'village underground lisboa': { lat: 38.7022, lng: -9.1793 },
    'jardim da estrela': { lat: 38.7136, lng: -9.1594 },
    'taberna da rua das flores': { lat: 38.7107, lng: -9.1432 },
    'manteigaria': { lat: 38.7109, lng: -9.1439 },
    'praia de carcavelos': { lat: 38.6792, lng: -9.3364 },
    'ponto de encontro': { lat: 38.6865, lng: -9.3340 },
    'belém riverside walk': { lat: 38.6961, lng: -9.1990 },
    'jardim botânico tropical': { lat: 38.6983, lng: -9.2045 },
    'miradouro de santa catarina': { lat: 38.7095, lng: -9.1476 },
    'cervejaria ramiro': { lat: 38.7224, lng: -9.1352 },
    
    // Barcelona
    'la boqueria market': { lat: 41.3817, lng: 2.1721 },
    'gothic quarter walking tour': { lat: 41.3825, lng: 2.1770 },
    'bo de b': { lat: 41.3809, lng: 2.1794 },
    'barcelona cathedral': { lat: 41.3839, lng: 2.1762 },
    'park de la ciutadella': { lat: 41.3882, lng: 2.1856 },
    'barceloneta beach': { lat: 41.3784, lng: 2.1925 },
    'la pepita': { lat: 41.3989, lng: 2.1614 },
    'sagrada família (exterior)': { lat: 41.4036, lng: 2.1744 },
    'casa batlló (exterior walk)': { lat: 41.3917, lng: 2.1649 },
    'mercat de santa caterina': { lat: 41.3860, lng: 2.1782 },
    'montjuïc castle walk': { lat: 41.3630, lng: 2.1664 },
    'mnac terrace': { lat: 41.3685, lng: 2.1534 },
    'magic fountain show': { lat: 41.3712, lng: 2.1518 },
    'cervecería catalana': { lat: 41.3923, lng: 2.1608 },
    
    // Paris
    'café de flore': { lat: 48.8542, lng: 2.3287 },
    'eiffel tower': { lat: 48.8584, lng: 2.2945 },
    'champ de mars picnic': { lat: 48.8560, lng: 2.2980 },
    'musée d\'orsay': { lat: 48.8599, lng: 2.3265 },
    'seine river cruise': { lat: 48.8615, lng: 2.3011 },
    'le marais quarter': { lat: 48.8576, lng: 2.3602 },
    'le bouillon chartier': { lat: 48.8719, lng: 2.3435 },
    'maison rose': { lat: 48.8878, lng: 2.3398 },
    'sacré-cœur basilica': { lat: 48.8867, lng: 2.3431 },
    'place du tertre': { lat: 48.8865, lng: 2.3408 },
    'shakespeare and company': { lat: 48.8525, lng: 2.3471 },
    'luxembourg gardens': { lat: 48.8462, lng: 2.3371 },
    'pont des arts': { lat: 48.8586, lng: 2.3375 },
    'pink mamma': { lat: 48.8827, lng: 2.3379 },
    
    // Tokyo
    'tsukiji outer market': { lat: 35.6655, lng: 139.7702 },
    'senso-ji temple': { lat: 35.7148, lng: 139.7967 },
    'asakusa hoppy street': { lat: 35.7140, lng: 139.7950 },
    'ichiran ramen': { lat: 35.7001, lng: 139.7718 },
    'yanaka ginza': { lat: 35.7275, lng: 139.7675 },
    'ameya-yokocho market': { lat: 35.7084, lng: 139.7743 },
    'yakitori alley (yurakucho)': { lat: 35.6740, lng: 139.7610 },
    'shinjuku gyoen gardens': { lat: 35.6852, lng: 139.7101 },
    'depachika (isetan b1)': { lat: 35.6917, lng: 139.7047 },
    'fuunji ramen': { lat: 35.6880, lng: 139.6950 },
    'harajuku crepe street': { lat: 35.6702, lng: 139.7049 },
    'shibuya crossing': { lat: 35.6595, lng: 139.7005 },
    'nonbei yokocho': { lat: 35.6599, lng: 139.7012 },
    'shinjuku golden gai': { lat: 35.6938, lng: 139.7042 },

    // Switzerland / Scenic
    'zurich hauptbahnhof': { lat: 47.3779, lng: 8.5402 },
    'train to lucerne (45 min)': { lat: 47.1650, lng: 8.4410 },
    'chapel bridge': { lat: 47.0502, lng: 8.3076 },
    'old town lucerne': { lat: 47.0525, lng: 8.3059 },
    'mount pilatus cogwheel': { lat: 46.9792, lng: 8.2547 },
    'lake lucerne sunset cruise': { lat: 47.0010, lng: 8.3680 },
    'restaurant fritschi': { lat: 47.0520, lng: 8.3055 },
    'lucerne to andermatt': { lat: 46.8500, lng: 8.5200 },
    'board glacier express': { lat: 46.6341, lng: 8.5947 },
    'oberalp pass (2,033m)': { lat: 46.6575, lng: 8.6558 },
    'lunch on the train': { lat: 46.6710, lng: 9.1230 },
    'landwasser viaduct': { lat: 46.6806, lng: 9.6756 },
    'arrive in zermatt': { lat: 46.0207, lng: 7.7491 },
    'matterhorn view dinner': { lat: 46.0210, lng: 7.7485 },

    // Azores
    'hotel pickup': { lat: 37.7394, lng: -25.6680 },
    'vista do rei viewpoint': { lat: 37.8427, lng: -25.7903 },
    'sete cidades hike': { lat: 37.8631, lng: -25.7876 },
    'village of sete cidades': { lat: 37.8636, lng: -25.7831 },
    'mosteiros beach': { lat: 37.8931, lng: -25.8239 },
    'ponta da ferraria hot spring': { lat: 37.8587, lng: -25.8507 },
    'restaurante alcides': { lat: 37.7397, lng: -25.6668 },
    'ponta delgada marina': { lat: 37.7409, lng: -25.6599 },
    'drive to furnas valley': { lat: 37.7600, lng: -25.4000 },
    'cozido das furnas': { lat: 37.7710, lng: -25.3180 },
    'terra nostra park': { lat: 37.7725, lng: -25.3148 },
    'furnas lake caldeiras': { lat: 37.7611, lng: -25.3315 },
    'lagoa do fogo viewpoint': { lat: 37.7656, lng: -25.4851 },
    'a tasca': { lat: 37.7393, lng: -25.6698 },

    // Bali
    'batu bolong beach': { lat: -8.6595, lng: 115.1301 },
    'crate café': { lat: -8.6517, lng: 115.1354 },
    'dojo bali': { lat: -8.6548, lng: 115.1327 },
    'warung local': { lat: -8.6530, lng: 115.1360 },
    'dojo bali (afternoon)': { lat: -8.6548, lng: 115.1327 },
    'old man\'s': { lat: -8.6593, lng: 115.1305 },
    'la brisa': { lat: -8.6545, lng: 115.1221 },
    'tegallalang rice terraces': { lat: -8.4357, lng: 115.2785 },
    'seniman coffee': { lat: -8.5080, lng: 115.2625 },
    'ubud monkey forest': { lat: -8.5188, lng: 115.2627 },
    'locavore': { lat: -8.5147, lng: 115.2652 },
    'tirta empul temple': { lat: -8.4264, lng: 115.3150 },
    'campuhan ridge walk': { lat: -8.5036, lng: 115.2547 },
    'hujan locale': { lat: -8.5083, lng: 115.2642 },

    // NYC
    'central park morning walk': { lat: 40.7812, lng: -73.9665 },
    'metropolitan museum of art': { lat: 40.7794, lng: -73.9632 },
    'joe\'s pizza': { lat: 40.7306, lng: -74.0022 },
    'top of the rock': { lat: 40.7590, lng: -73.9794 },
    'times square': { lat: 40.7580, lng: -73.9855 },
    'broadway show': { lat: 40.7590, lng: -73.9845 },
    'katz\'s delicatessen': { lat: 40.7222, lng: -73.9874 },
    'brooklyn bridge walk': { lat: 40.7061, lng: -73.9969 },
    'dumbo': { lat: 40.7033, lng: -73.9897 },
    'chelsea market': { lat: 40.7420, lng: -74.0062 },
    'high line park': { lat: 40.7480, lng: -74.0048 },
    'statue of liberty ferry': { lat: 40.7013, lng: -74.0130 },
    '9/11 memorial': { lat: 40.7115, lng: -74.0135 },
    'di fara pizza': { lat: 40.6253, lng: -73.9615 },
  };

  const regionDefaults = {
    'lisbon': { lat: 38.7223, lng: -9.1393 },
    'lisboa': { lat: 38.7223, lng: -9.1393 },
    'barcelona': { lat: 41.3851, lng: 2.1734 },
    'paris': { lat: 48.8566, lng: 2.3522 },
    'tokyo': { lat: 35.6762, lng: 139.6503 },
    'tóquio': { lat: 35.6762, lng: 139.6503 },
    'switzerland': { lat: 46.8182, lng: 8.2275 },
    'suíça': { lat: 46.8182, lng: 8.2275 },
    'azores': { lat: 37.7412, lng: -25.6756 },
    'açores': { lat: 37.7412, lng: -25.6756 },
    'bali': { lat: -8.4095, lng: 115.1889 },
    'new york': { lat: 40.7128, lng: -74.0060 },
    'nova iorque': { lat: 40.7128, lng: -74.0060 },
    'japan': { lat: 35.6762, lng: 139.6503 },
    'japão': { lat: 35.6762, lng: 139.6503 }
  };

  let baseCoords = { lat: 38.7223, lng: -9.1393 };
  const destinationLabel = typeof enriched.destination === 'string'
    ? enriched.destination
    : [
        enriched.destination?.city,
        enriched.destination?.name,
        enriched.destination?.country,
      ].filter(Boolean).join(', ');
  const destLower = destinationLabel.toLowerCase();
  for (const [region, coords] of Object.entries(regionDefaults)) {
    if (destLower.includes(region)) {
      baseCoords = coords;
      break;
    }
  }

  // 1. Validate destination & coordinates bounding box for Tokyo/Tóquio/Japan
  const isTokyo = destLower.includes('tokyo') || destLower.includes('tóquio') || destLower.includes('japan') || destLower.includes('japão');

  // 2. Enforce unique day titles. 
  // "Se um dia tem o mesmo título que outro → regenera automaticamente"
  if (enriched.days) {
    const seenTitles = new Set();
    enriched.days.forEach((day, idx) => {
      let currentTitle = day.title || '';
      // Strip out prefixes like "Day X —" or "Dia X —" to get clean title
      let cleanTitle = currentTitle.replace(/^(dia|day)\s+\d+\s*(—|-)\s*/i, '').trim();
      
      if (!cleanTitle || seenTitles.has(cleanTitle.toLowerCase()) || cleanTitle.toLowerCase() === 'explore' || cleanTitle.toLowerCase() === 'explorar') {
        // Regenerate unique title automatically
        const uniqueThemes = [
          'Historic Heart & Cultural Secrets',
          'Modern Streets & Neon Lights',
          'Gastronomy Tour & Hidden Bites',
          'Nature Retreat & Golden Hour Views',
          'Art Districts & Design Culture',
          'Coastal Vistas & Local Encounters',
          'Ancient Paths & Sacred Shrines',
          'Sunset Horizons & Night Explorers'
        ];
        const newTheme = uniqueThemes[idx % uniqueThemes.length];
        day.title = `Day ${idx + 1} — ${newTheme}`;
      } else {
        day.title = `Day ${idx + 1} — ${cleanTitle}`;
      }
      seenTitles.add(cleanTitle.toLowerCase());
    });
  }

  // 3. Coordinate validation & fallback
  enriched.days?.forEach((day, dayIdx) => {
    if (!day.localSecrets) {
      day.localSecrets = `Enjoy the unique vibe here. Seek out local cafes off the tourist pathways to experience the true essence of the neighborhood.`;
    }

    day.stops?.forEach((stop, stopIdx) => {
      const stopNameLower = stop.name.toLowerCase().trim();
      let resolvedCoords = null;

      for (const [key, value] of Object.entries(coordsLookup)) {
        if (stopNameLower.includes(key) || key.includes(stopNameLower)) {
          resolvedCoords = value;
          break;
        }
      }

      let currentCoords = stop.coordinates;

      // Handle array format coordinates: [lat, lng]
      if (Array.isArray(currentCoords)) {
        currentCoords = {
          lat: currentCoords[0],
          lng: currentCoords[1]
        };
      }

      // Se coordinates são zero-zero ou null, usa geocoding da cidade como fallback.
      if (
        !currentCoords ||
        currentCoords.lat === null ||
        currentCoords.lng === null ||
        currentCoords.lat === undefined ||
        currentCoords.lng === undefined ||
        (Number(currentCoords.lat) === 0 && Number(currentCoords.lng) === 0)
      ) {
        if (resolvedCoords) {
          currentCoords = resolvedCoords;
        } else {
          currentCoords = {
            lat: baseCoords.lat + (Math.sin(stopIdx + dayIdx + 1) * 0.008),
            lng: baseCoords.lng + (Math.cos(stopIdx + dayIdx + 1) * 0.008)
          };
        }
      }

      // Convert fields to floats to prevent string operations in leaflet mapping
      currentCoords = {
        lat: parseFloat(currentCoords.lat),
        lng: parseFloat(currentCoords.lng)
      };

      // "Se destination é "Tokyo/Tóquio/Japan" → coordenadas devem ter lat entre 35.0-36.5 e lng entre 138.5-140.5"
      if (isTokyo) {
        if (
          currentCoords.lat < 35.0 ||
          currentCoords.lat > 36.5 ||
          currentCoords.lng < 138.5 ||
          currentCoords.lng > 140.5
        ) {
          // Force fallback to Tokyo region defaults
          currentCoords = {
            lat: 35.6762 + (Math.sin(stopIdx + dayIdx + 1) * 0.015),
            lng: 139.6503 + (Math.cos(stopIdx + dayIdx + 1) * 0.015)
          };
        }
      }

      stop.coordinates = currentCoords;

      if (!stop.estimatedCost) {
        if (stop.name.toLowerCase().includes('free') || stop.type.toLowerCase().includes('free')) {
          stop.estimatedCost = 'Free';
        } else if (stop.type.toLowerCase().includes('breakfast') || stop.type.toLowerCase().includes('coffee')) {
          stop.estimatedCost = '€6';
        } else if (stop.type.toLowerCase().includes('lunch') || stop.type.toLowerCase().includes('tasca')) {
          stop.estimatedCost = '€18';
        } else if (stop.type.toLowerCase().includes('dinner') || stop.type.toLowerCase().includes('restaurant')) {
          stop.estimatedCost = '€30';
        } else if (stop.type.toLowerCase().includes('hike') || stop.type.toLowerCase().includes('walk') || stop.type.toLowerCase().includes('beach')) {
          stop.estimatedCost = 'Free';
        } else {
          stop.estimatedCost = '€12';
        }
      }

      if (!stop.localSecret) {
        if (stop.type.toLowerCase().includes('breakfast') || stop.type.toLowerCase().includes('coffee') || stop.type.toLowerCase().includes('lunch') || stop.type.toLowerCase().includes('dinner') || stop.isRestaurant) {
          stop.localSecret = 'Ask for the daily specials (prato do dia) which are fresher and cheaper.';
        } else {
          stop.localSecret = 'Enter through the side doors or buy tickets online to skip the main queues.';
        }
      }
    });
  });

  return enriched;
}

export function saveGeneratedItinerary(itinerary) {
  const id = 'gen-' + Date.now();
  const stored = { ...itinerary, id, createdAt: new Date().toISOString() };
  setJson(`andor_itinerary_${id}`, stored, 'session');
  return id;
}

export function getItinerary(id) {
  // Session edits win so regenerated community trips survive refreshes.
  const stored = getJson(`andor_itinerary_${id}`, null, 'session');
  if (stored) return enrichItineraryData(stored);

  const community = communityItineraries[id];
  if (community) return enrichItineraryData(community);

  return null;
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
          { time: '09:00', name: 'Padaria da Graça', type: '☕ Breakfast — Hidden neighborhood bakery' },
          { time: '10:30', name: 'Feira da Ladra Flea Market', type: '🛍️ Shopping — Vintage treasures every Tuesday & Saturday' },
          { time: '12:30', name: 'Tasca do Chico', type: '🎵 Culture — Authentic fado in a tiny Alfama tavern' },
          { time: '14:00', name: 'Mercado de Santa Clara', type: '🍽️ Lunch — Local produce & artisan food stalls' },
          { time: '16:00', name: 'Miradouro da Graça', type: '🌅 Viewpoint — Sunset over the Tagus River' },
          { time: '18:00', name: 'Mouraria District Walk', type: '🚶 Culture — Lisbon\'s multicultural melting pot' },
          { time: '20:00', name: 'O Velho Eurico', type: '🍷 Dinner — Traditional tavern in Alfama' },
        ],
      },
      {
        title: 'Day 2 — Street Art & Alternative Culture',
        stops: [
          { time: '09:30', name: 'Copenhagen Coffee Lab', type: '☕ Breakfast — Specialty coffee in Santos' },
          { time: '11:00', name: 'LX Factory', type: '🎨 Art — Creative hub with murals & indie shops' },
          { time: '13:00', name: 'Ponto Final', type: '🍽️ Lunch — Hidden gem across the river in Almada' },
          { time: '15:00', name: 'Underdogs Gallery', type: '🖼️ Art — World-class street art gallery' },
          { time: '16:30', name: 'Village Underground Lisboa', type: '🎶 Culture — Converted shipping containers' },
          { time: '18:30', name: 'Jardim da Estrela', type: '🌳 Relax — Peaceful garden at golden hour' },
          { time: '20:30', name: 'Taberna da Rua das Flores', type: '🍷 Dinner — Famous petiscos & natural wine' },
        ],
      },
      {
        title: 'Day 3 — Coastal Secrets & Belém',
        stops: [
          { time: '08:30', name: 'Manteigaria', type: '☕ Breakfast — Best pastéis de nata (locals\' choice)' },
          { time: '10:00', name: 'Praia de Carcavelos', type: '🏖️ Beach — Surf & swim (train from Cais do Sodré)' },
          { time: '12:30', name: 'Ponto de Encontro', type: '🍽️ Lunch — Seafood shack by the beach' },
          { time: '14:30', name: 'Belém Riverside Walk', type: '🚶 Walk — MAAT to Torre de Belém' },
          { time: '16:30', name: 'Jardim Botânico Tropical', type: '🌿 Nature — Hidden tropical garden in Belém' },
          { time: '18:30', name: 'Miradouro de Santa Catarina', type: '🌅 Viewpoint — Sundowner with river views' },
          { time: '20:30', name: 'Cervejaria Ramiro', type: '🦐 Dinner — Lisbon\'s legendary seafood restaurant' },
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
          { time: '07:00', name: 'Tsukiji Outer Market', type: '🍣 Breakfast — Fresh sushi at dawn' },
          { time: '09:30', name: 'Senso-ji Temple', type: '⛩️ Culture — Nakamise street snacks' },
          { time: '11:30', name: 'Asakusa Hoppy Street', type: '🍺 Drinks — Retro izakaya alley' },
          { time: '13:00', name: 'Ichiran Ramen', type: '🍜 Lunch — Solo booth tonkotsu ramen' },
          { time: '15:00', name: 'Yanaka Ginza', type: '🚶 Walk — Old Tokyo shopping street' },
          { time: '17:00', name: 'Ameya-Yokocho Market', type: '🛍️ Market — Street food & bargains' },
          { time: '19:30', name: 'Yakitori Alley (Yurakucho)', type: '🍗 Dinner — Under-the-tracks grilled skewers' },
        ],
      },
      {
        title: 'Day 2 — Shibuya, Shinjuku & Ramen',
        stops: [
          { time: '09:00', name: 'Shinjuku Gyoen Gardens', type: '🌸 Morning — Peaceful breakfast in the park' },
          { time: '11:00', name: 'Depachika (Isetan B1)', type: '🍱 Food hall — Luxury basement food floor' },
          { time: '12:30', name: 'Fuunji Ramen', type: '🍜 Lunch — Legendary tsukemen (dipping noodles)' },
          { time: '14:30', name: 'Harajuku Crepe Street', type: '🍰 Snack — Takeshita Street desserts' },
          { time: '16:00', name: 'Shibuya Crossing', type: '📸 Experience — World\'s busiest intersection' },
          { time: '18:00', name: 'Nonbei Yokocho', type: '🍶 Drinks — "Drunkard\'s Alley" tiny bars' },
          { time: '20:00', name: 'Shinjuku Golden Gai', type: '🍻 Dinner — 200+ tiny themed bars' },
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
