// Client-side itinerary store for passing data between pages.
// Uses sessionStorage for generated itineraries and provides
// pre-built community itineraries by slug.

export function saveGeneratedItinerary(itinerary) {
  const id = 'gen-' + Date.now();
  const stored = { ...itinerary, id, createdAt: new Date().toISOString() };
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(`andor_itinerary_${id}`, JSON.stringify(stored));
  }
  return id;
}

export function getItinerary(id) {
  // Check community itineraries first
  const community = communityItineraries[id];
  if (community) return community;

  // Check sessionStorage for generated itineraries
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem(`andor_itinerary_${id}`);
    if (stored) return JSON.parse(stored);
  }

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
