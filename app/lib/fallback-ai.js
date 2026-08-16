import { geocodeServerSide } from './geocoding';
import { getDestinationCenter } from './coordinate-validator';

// Smart fallback data for when no AI API key is configured.
// This ensures the app ALWAYS works, even without an API key.

const destinationData = {
  'lisbon': { 
    name: 'Lisbon, Portugal', 
    tripOverview: 'Experience the magic of the city of seven hills, where ancient history meets modern creative energy.',
    currency: '€', 
    flights: { suggestion: 'Fly into Lisbon Portela (LIS). TAP Air Portugal offers great local connections.', averagePrice: '€120-200' },
    accommodation: { hotelName: 'The Lumiares Hotel & Spa', type: 'Luxury Boutique', reason: 'Prime location in Bairro Alto with a stunning rooftop bar.' },
    days: [
      { 
        title: 'Day 1 — Belém & History', 
        transportTip: 'Take the iconic Tram 15 from Praça do Comércio.', 
        localSecrets: 'Avoid queueing at the main ticket office for the Jerónimos Monastery by purchasing a combined ticket online in advance.',
        stops: [
          { time: '09:00', name: 'Pastéis de Belém', type: 'Breakfast — Famous pastry shop since 1837', isRestaurant: true, estimatedCost: '€5', coordinates: { lat: 38.6975, lng: -9.2032 }, localSecret: 'Buy the pastéis at the take-away counter to skip the main sit-down queue.' },
          { time: '10:30', name: 'Jerónimos Monastery', type: 'UNESCO World Heritage — Manueline masterpiece', estimatedCost: '€10', coordinates: { lat: 38.6979, lng: -9.2064 }, localSecret: 'Entrance is free on Sunday mornings for Portuguese residents, but get there by 9 AM.' },
          { time: '12:00', name: 'Torre de Belém', type: 'Landmark — 16th-century fortified tower', estimatedCost: '€6', coordinates: { lat: 38.6916, lng: -9.2160 }, localSecret: 'Take photos from the gardens instead of waiting to go inside; the interior is mostly empty.' },
          { time: '13:30', name: 'Time Out Market', type: 'Lunch — Gourmet food hall with 40+ stalls', isRestaurant: true, estimatedCost: '€20', coordinates: { lat: 38.7071, lng: -9.1468 }, localSecret: 'Walk to the outer ring tables; they are quieter than the chaotic center tables.' },
          { time: '15:30', name: 'MAAT Museum', type: 'Culture — Modern architecture & contemporary art', estimatedCost: '€9', coordinates: { lat: 38.6959, lng: -9.1932 }, localSecret: 'You can walk up the curved roof for free to get an amazing view of the 25th of April Bridge.' },
          { time: '18:00', name: 'Miradouro da Graça', type: 'Viewpoint — Stunning sunset panorama', estimatedCost: 'Free', coordinates: { lat: 38.7162, lng: -9.1315 }, localSecret: 'Grab a kiosk beer and sit on the wall; it is cheaper than the café tables.' },
          { time: '20:00', name: 'Taberna da Rua das Flores', type: 'Dinner — Traditional Portuguese tapas', isRestaurant: true, estimatedCost: '€25', coordinates: { lat: 38.7107, lng: -9.1432 }, localSecret: 'Put your name on the list at 18:00, then grab a drink nearby while you wait for opening.' },
        ]
      },
      { 
        title: 'Day 2 — Alfama & Local Life', 
        transportTip: 'Walk the narrow streets of Alfama; wear comfortable shoes!', 
        localSecrets: 'Look for the tiny metal signs with photos of local elders hanging outside Alfama houses — it is part of a local community art project.',
        stops: [
          { time: '09:00', name: 'Café A Brasileira', type: 'Breakfast — Historic café in Chiado', isRestaurant: true, estimatedCost: '€6', coordinates: { lat: 38.7106, lng: -9.1421 }, localSecret: 'Sip your coffee standing at the counter like locals; it is significantly cheaper than sitting down.' },
          { time: '10:00', name: 'Alfama District Walking Tour', type: 'Culture — Oldest neighborhood, narrow streets', estimatedCost: 'Free', coordinates: { lat: 38.7120, lng: -9.1300 }, localSecret: 'Get lost in the narrowest alleys; you might run into locals serving Ginjinha from their doorsteps for €1.' },
          { time: '11:30', name: 'Sé de Lisboa Cathedral', type: 'History — 12th-century Romanesque cathedral', estimatedCost: '€5', coordinates: { lat: 38.7099, lng: -9.1326 }, localSecret: 'The cloisters at the back contain active archaeological excavations dating back to Roman times.' },
          { time: '13:00', name: 'Mercado da Ribeira', type: 'Lunch — Fresh seafood & local produce', isRestaurant: true, estimatedCost: '€18', coordinates: { lat: 38.7071, lng: -9.1468 }, localSecret: 'Head to the fresh food market side before 14:00 to see fishmongers in action.' },
          { time: '15:00', name: 'Tram 28 Ride', type: 'Experience — Iconic yellow tram through the hills', estimatedCost: '€3', coordinates: { lat: 38.7110, lng: -9.1340 }, localSecret: 'Board at Martim Moniz (the start of the line) to guarantee a seat, and keep your bags safe.' },
          { time: '16:30', name: 'LX Factory', type: 'Shopping — Creative hub with boutiques & street art', estimatedCost: 'Free', coordinates: { lat: 38.7029, lng: -9.1782 }, localSecret: 'Visit the Ler Devagar bookstore — one of the most unique bookstores globally with a flying bicycle sculpture.' },
          { time: '19:00', name: 'Bairro Alto', type: 'Nightlife — Fado music & rooftop bars', estimatedCost: '€15', coordinates: { lat: 38.7126, lng: -9.1444 }, localSecret: 'Skip the generic commercial fado places and find tiny tascas where amateur singers perform spontaneously.' },
        ]
      },
      { 
        title: 'Day 3 — Sintra Day Trip', 
        transportTip: 'Take the train from Rossio Station (40 min).', 
        localSecrets: 'Skip the tourist bus inside Sintra and hike the Villa Sassetti path to the Moorish Castle; it is green, quiet, and beautiful.',
        stops: [
          { time: '08:30', name: 'Train to Sintra', type: 'Transport — Rossio Station departure', estimatedCost: '€5', coordinates: { lat: 38.7142, lng: -9.1408 }, localSecret: 'Buy your train tickets the night before to avoid the huge morning queue at the ticket machines.' },
          { time: '10:00', name: 'Palácio da Pena', type: 'UNESCO — Colorful Romanticist castle on a hilltop', estimatedCost: '€20', coordinates: { lat: 38.7876, lng: -9.3906 }, localSecret: 'Book the first entry slot at 09:30 AM to explore the terraces before the tourist buses arrive.' },
          { time: '12:30', name: 'Quinta da Regaleira', type: 'Gardens — Initiation Well & mystical grounds', estimatedCost: '€12', coordinates: { lat: 38.7963, lng: -9.3960 }, localSecret: 'Bring a pocket flashlight (or your phone) to explore the unlit underground stone tunnels safely.' },
          { time: '14:00', name: 'Tascantiga', type: 'Lunch — Traditional cuisine in Sintra village', isRestaurant: true, estimatedCost: '€15', coordinates: { lat: 38.7972, lng: -9.3908 }, localSecret: 'Their codfish fritters and local cheeses are outstanding. Grab an outdoor terrace table.' },
          { time: '15:30', name: 'Cabo da Roca', type: 'Nature — Westernmost point of mainland Europe', estimatedCost: 'Free', coordinates: { lat: 38.7804, lng: -9.4989 }, localSecret: 'Walk about 100 meters south along the dirt trails to escape the crowd at the main monument.' },
          { time: '17:30', name: 'Cascais Beach Walk', type: 'Relax — Coastal town & sunset by the sea', estimatedCost: 'Free', coordinates: { lat: 38.6979, lng: -9.4223 }, localSecret: 'Rent a free municipal bike (Bicas) near the Cascais train station to cycle to Boca do Inferno.' },
          { time: '20:00', name: 'Cervejaria Ramiro', type: 'Dinner — Best seafood restaurant in Lisbon', isRestaurant: true, estimatedCost: '€40', coordinates: { lat: 38.7224, lng: -9.1352 }, localSecret: 'Ask for the Prego (beef sandwich) at the end of your meal — it is the traditional way to end a seafood feast.' },
        ]
      },
    ], 
    mustEat: ['Pastel de Nata', 'Bacalhau à Brás', 'Grilled Sardines'],
    contingency: { emergencyInfo: 'Call 112 for emergencies. British Hospital is recommended for tourists.', unexpectedTips: 'Pickpockets are common on Tram 28. Keep bags in front.' },
    totalCost: '€380' 
  },
  'barcelona': { 
    name: 'Barcelona, Spain', 
    tripOverview: 'Experience the colorful world of Catalonia, where modernist architecture meets a vibrant beach culture.',
    currency: '€',
    flights: { suggestion: 'Fly into Barcelona-El Prat Airport (BCN). The Aerobús is the fastest link to the city center.', averagePrice: '€140-220' },
    accommodation: { hotelName: 'H10 Casa Mimosa', type: 'Boutique Hotel', reason: 'Behind La Pedrera with a private garden patio and views of Gaudi\'s chimneys.' },
    days: [
      { 
        title: 'Day 1 — Gaudí & Gothic Quarter', 
        transportTip: 'Walk the Eixample district and use the T-Casual metro card.',
        localSecrets: 'Get a perfect photo of the Sagrada Família from the small park across the pond (Plaça de Gaudí).',
        stops: [
          { time: '09:00', name: 'La Boqueria Market', type: 'Breakfast — Fresh juices & local bites', isRestaurant: true, estimatedCost: '€8', coordinates: { lat: 41.3817, lng: 2.1721 }, localSecret: 'Go to the stalls at the very back for better prices on fresh fruit juices.' },
          { time: '10:30', name: 'Sagrada Família', type: 'UNESCO — Gaudí\'s unfinished basilica masterpiece', estimatedCost: '€26', coordinates: { lat: 41.4036, lng: 2.1744 }, localSecret: 'Book the early morning ticket at 09:00 AM to see the stained glass illuminated by the morning sun.' },
          { time: '13:00', name: 'Gothic Quarter Walking Tour', type: 'History — Medieval streets & hidden plazas', estimatedCost: 'Free', coordinates: { lat: 41.3825, lng: 2.1770 }, localSecret: 'Look for the Plaça de Sant Felip Neri, a hidden plaza with a tragic Spanish Civil War history.' },
          { time: '14:30', name: 'Can Culleretes', type: 'Lunch — Barcelona\'s oldest restaurant (1786)', isRestaurant: true, estimatedCost: '€22', coordinates: { lat: 41.3808, lng: 2.1748 }, localSecret: 'Order the traditional crema catalana for dessert; it is the oldest recipe in town.' },
          { time: '16:00', name: 'Park Güell', type: 'UNESCO — Gaudí\'s mosaic wonderland', estimatedCost: '€10', coordinates: { lat: 41.4145, lng: 2.1677 }, localSecret: 'Enter through the side gate at Baixada de la Glòria to avoid the steep uphill stairs.' },
          { time: '18:30', name: 'Casa Batlló', type: 'Architecture — Gaudí\'s dragon-inspired building', estimatedCost: '€35', coordinates: { lat: 41.3917, lng: 2.1649 }, localSecret: 'Skip the interior if on a budget; the exterior facade is the true artistic masterpiece.' },
          { time: '20:30', name: 'El Nacional', type: 'Dinner — 4 restaurants under one gorgeous roof', isRestaurant: true, estimatedCost: '€30', coordinates: { lat: 41.3892, lng: 2.1684 }, localSecret: 'Try the La Taperia area where tapas are shouted out and grabbed fresh from servers.' },
        ]
      },
      { 
        title: 'Day 2 — Beach, Art & Tapas', 
        transportTip: 'Take the metro L4 (Yellow Line) to Barceloneta.',
        localSecrets: 'For cheap craft beers and authentic pintxos, visit Carrer de Blai in Poble-sec.',
        stops: [
          { time: '09:30', name: 'Barceloneta Beach', type: 'Morning — Mediterranean swim & boardwalk', estimatedCost: 'Free', coordinates: { lat: 41.3784, lng: 2.1925 }, localSecret: 'Avoid buying drinks from beach vendors; they are unsanitary. Grab a drink at a supermarket nearby.' },
          { time: '11:00', name: 'Picasso Museum', type: 'Art — Picasso\'s formative years', estimatedCost: '€12', coordinates: { lat: 41.3852, lng: 2.1808 }, localSecret: 'Admission is free on Thursday afternoons from 4 PM to 7 PM, but requires advance booking.' },
          { time: '13:00', name: 'El Born Market', type: 'Lunch — Tapas crawl through El Born district', isRestaurant: true, estimatedCost: '€15', coordinates: { lat: 41.3860, lng: 2.1820 }, localSecret: 'Look for Cal Pep; wait in line for their fried baby squid.' },
          { time: '15:00', name: 'Montjuïc Castle & Gardens', type: 'Views — Panoramic hilltop overlooking the city', estimatedCost: '€9', coordinates: { lat: 41.3630, lng: 2.1664 }, localSecret: 'Walk down through the Laribal Gardens for quiet water features and beautiful shaded pathways.' },
          { time: '17:00', name: 'Magic Fountain Show', type: 'Experience — Light, water & music spectacle', estimatedCost: 'Free', coordinates: { lat: 41.3712, lng: 2.1518 }, localSecret: 'Stand on the bridge on Avinguda Maria Cristina to get the best symmetry for photos.' },
          { time: '19:30', name: 'La Rambla Sunset Walk', type: 'Culture — Barcelona\'s most famous boulevard', estimatedCost: 'Free', coordinates: { lat: 41.3800, lng: 2.1730 }, localSecret: 'Watch out for street shell game scams and watch your pockets carefully.' },
          { time: '21:00', name: 'Cervecería Catalana', type: 'Dinner — Classic Barcelona tapas bar', isRestaurant: true, estimatedCost: '€25', coordinates: { lat: 41.3923, lng: 2.1608 }, localSecret: 'Order the patatas bravas and the "flauta de jamón" — simple but unmatched quality.' },
        ]
      },
    ], 
    mustEat: ['Paella', 'Pan con Tomate', 'Patatas Bravas'],
    contingency: { emergencyInfo: 'Call 112 for emergencies. Hospital Clinic has English-speaking staff.', unexpectedTips: 'Pickpocketing is extremely common on Metro Line 3. Keep backpack on your front.' },
    totalCost: '€310' 
  },
  'paris': { 
    name: 'Paris, France', 
    tripOverview: 'Experience romance, art, and world-class gastronomy in the City of Light.',
    currency: '€',
    flights: { suggestion: 'Fly to Charles de Gaulle (CDG) or Orly (ORY). Take the RER B train to the center.', averagePrice: '€150-250' },
    accommodation: { hotelName: 'Hotel Caron de Beaumarchais', type: 'Boutique Stay', reason: 'Charming 18th-century themed decor in the heart of the historic Marais district.' },
    days: [
      { 
        title: 'Day 1 — Icons & Romance', 
        transportTip: 'Use the Paris Metro; buy a pack of Navigo tickets.',
        localSecrets: 'Best view of the Eiffel Tower is from the Avenue de Camoëns, a quiet residential dead-end street.',
        stops: [
          { time: '09:00', name: 'Café de Flore', type: 'Breakfast — Legendary Saint-Germain café', isRestaurant: true, estimatedCost: '€18', coordinates: { lat: 48.8542, lng: 2.3287 }, localSecret: 'Sit on the ground floor terrace; it is where the artistic history occurred.' },
          { time: '10:30', name: 'Eiffel Tower', type: 'Landmark — Summit visit with city views', estimatedCost: '€28', coordinates: { lat: 48.8584, lng: 2.2945 }, localSecret: 'Book tickets 60 days in advance. If sold out, try buying a stairs-only ticket at the kiosk.' },
          { time: '13:00', name: 'Le Champ de Mars Picnic', type: 'Lunch — French baguette, cheese & wine', isRestaurant: true, estimatedCost: '€12', coordinates: { lat: 48.8560, lng: 2.2980 }, localSecret: 'Get your supplies from Rue Cler, a market street nearby, instead of tourist shops near the tower.' },
          { time: '15:00', name: 'Musée d\'Orsay', type: 'Art — Impressionist masterpieces', estimatedCost: '€16', coordinates: { lat: 48.8599, lng: 2.3265 }, localSecret: 'Head directly to the fifth floor to see the masterpieces (Van Gogh, Monet) first.' },
          { time: '17:30', name: 'Seine River Cruise', type: 'Experience — Golden hour boat ride', estimatedCost: '€15', coordinates: { lat: 48.8615, lng: 2.3011 }, localSecret: 'Sit on the open-air top deck on the right-hand side for the best viewpoints of the monuments.' },
          { time: '19:30', name: 'Le Marais Quarter', type: 'Culture — Trendy neighborhood & galleries', estimatedCost: 'Free', coordinates: { lat: 48.8576, lng: 2.3602 }, localSecret: 'Explore the Place des Vosges, Paris oldest planned square, hidden behind arched portals.' },
          { time: '21:00', name: 'Le Bouillon Chartier', type: 'Dinner — Classic Parisian bistro since 1896', isRestaurant: true, estimatedCost: '€20', coordinates: { lat: 48.8719, lng: 2.3435 }, localSecret: 'The waiters write your order directly on the paper tablecloth. Expect a queue, but it moves very fast.' },
        ]
      },
      { 
        title: 'Day 2 — Art, History & Montmartre', 
        transportTip: 'Take Metro Line 12 to Abbesses for Montmartre.',
        localSecrets: 'To get into the Louvre quickly, enter through the underground Carrousel entrance rather than the main glass pyramid.',
        stops: [
          { time: '09:00', name: 'Louvre Museum', type: 'Art — Mona Lisa & 35,000 works of art', estimatedCost: '€17', coordinates: { lat: 48.8606, lng: 2.3376 }, localSecret: 'Skip the Mona Lisa queue unless you must see it; the Winged Victory and Venus de Milo are much easier to appreciate.' },
          { time: '12:30', name: 'Tuileries Garden', type: 'Lunch — Relaxing stroll & café stop', isRestaurant: true, estimatedCost: '€10', coordinates: { lat: 48.8638, lng: 2.3275 }, localSecret: 'Grab one of the iconic green metal chairs near the fountains to read and relax.' },
          { time: '14:00', name: 'Notre-Dame Cathedral', type: 'History — Gothic masterpiece', estimatedCost: 'Free', coordinates: { lat: 48.8530, lng: 2.3499 }, localSecret: 'Walk around the back to the Square Jean-XXIII for the best view of the flying buttresses.' },
          { time: '15:30', name: 'Sainte-Chapelle', type: 'Architecture — Stunning 13th-century stained glass', estimatedCost: '€115', coordinates: { lat: 48.8554, lng: 2.3450 }, localSecret: 'Visit on a sunny day; the sun shining through the 15-meter stained glass windows is breathtaking.' },
          { time: '17:00', name: 'Sacré-Cœur & Montmartre', type: 'Culture — Artist quarter & basilica views', estimatedCost: 'Free', coordinates: { lat: 48.8867, lng: 2.3431 }, localSecret: 'Take the steps behind the basilica for quiet cobblestone roads and vineyards.' },
          { time: '19:00', name: 'Place du Tertre', type: 'Experience — Street artists & portrait painters', estimatedCost: 'Free', coordinates: { lat: 48.8865, lng: 2.3408 }, localSecret: 'Negotiate the price in advance if you choose to have your portrait sketched.' },
          { time: '20:30', name: 'Pink Mamma', type: 'Dinner — 4-story Italian restaurant', isRestaurant: true, estimatedCost: '€28', coordinates: { lat: 48.8827, lng: 2.3379 }, localSecret: 'Try to book the top floor glasshouse roof terrace; the natural light and plants make it a dream.' },
        ]
      },
    ], 
    mustEat: ['Croissants & Baguettes', 'Escargots', 'Beef Bourguignon'],
    contingency: { emergencyInfo: 'Call 112. American Hospital of Paris has fluent English doctors.', unexpectedTips: 'Never sign petitions offered by youths near tourist spots; it is a distraction for pickpocketing.' },
    totalCost: '€420' 
  },
  'tokyo': { 
    name: 'Tokyo, Japan', 
    tripOverview: 'Immerse yourself in a neon-lit metropolis blending futuristic sights with ancient traditions.',
    currency: '¥',
    flights: { suggestion: 'Fly to Haneda Airport (HND) for easy train links to Tokyo center.', averagePrice: '¥65,000-110,000' },
    accommodation: { hotelName: 'The Gate Hotel Kaminarimon', type: 'Premium Design', reason: 'Stunning rooftop view of Tokyo Skytree and a short walk to Senso-ji temple.' },
    days: [
      { 
        title: 'Day 1 — Tradition & Modernity', 
        transportTip: 'Get a Tokyo Subway Pass (24/48/72h) for unlimited Metro usage.',
        localSecrets: 'Visit Shibuya Sky building at twilight for the best panoramic view of the crossing and Mt. Fuji.',
        stops: [
          { time: '08:00', name: 'Tsukiji Outer Market', type: 'Breakfast — Fresh sushi & street food at dawn', isRestaurant: true, estimatedCost: '¥2,500', coordinates: { lat: 35.6655, lng: 139.7702 }, localSecret: 'Try the tamagoyaki (sweet omelet) on a stick for only ¥100.' },
          { time: '10:00', name: 'Senso-ji Temple', type: 'History — Tokyo\'s oldest temple in Asakusa', estimatedCost: 'Free', coordinates: { lat: 35.7148, lng: 139.7967 }, localSecret: 'Draw an Omikuji (fortune slip). If it predicts bad luck, tie it to the wire rack to leave it behind.' },
          { time: '12:00', name: 'Akihabara District', type: 'Culture — Electronics & gaming paradise', estimatedCost: 'Free', coordinates: { lat: 35.6997, lng: 139.7715 }, localSecret: 'Explore Super Potato for vintage 80s/90s gaming consoles and retro candies.' },
          { time: '13:30', name: 'Ichiran Ramen', type: 'Lunch — Solo booth tonkotsu ramen experience', isRestaurant: true, estimatedCost: '¥1,200', coordinates: { lat: 35.7001, lng: 139.7718 }, localSecret: 'You customize your noodles firmness and spice level on an order slip; add a soft-boiled egg.' },
          { time: '15:00', name: 'Meiji Shrine', type: 'Spiritual — Forested shrine in Harajuku', estimatedCost: 'Free', coordinates: { lat: 35.6764, lng: 139.6993 }, localSecret: 'Take a quiet walk through the northern paths; they are completely secluded from tourist crowds.' },
          { time: '17:00', name: 'Shibuya Crossing', type: 'Experience — World\'s busiest pedestrian crossing', estimatedCost: 'Free', coordinates: { lat: 35.6595, lng: 139.7005 }, localSecret: 'Watch the crossing from the 2nd-floor glass window of the Starbucks across the street.' },
          { time: '19:00', name: 'Shinjuku Golden Gai', type: 'Nightlife — Tiny bars district', estimatedCost: '¥3,000', coordinates: { lat: 35.6938, lng: 139.7042 }, localSecret: 'Look for doors with signs indicating "No Cover Charge" to avoid paying entry fees of ¥500-1000.' },
        ]
      },
    ], 
    mustEat: ['Sushi', 'Ramen', 'Tempura'],
    contingency: { emergencyInfo: 'Call 119 for fire/ambulance, 110 for police. Tokyo Metropolitan Health has English service.', unexpectedTips: 'Keep a small plastic bag in your pocket; there are almost no public trash bins in Tokyo.' },
    totalCost: '¥85,000' 
  },
};

const CURATED_FIXTURE_LOADERS = {
  tokyo: () => import('../../scripts/eval-fixtures/tokyo-7-days.json').then((module) => module.default),
  paris: () => import('../../scripts/eval-fixtures/paris-5-days.json').then((module) => module.default),
  bali: () => import('../../scripts/eval-fixtures/bali-10-days.json').then((module) => module.default),
  lisbon: () => import('../../scripts/eval-fixtures/lisbon-3-days.json').then((module) => module.default),
  'new york': () => import('../../scripts/eval-fixtures/new-york-4-days.json').then((module) => module.default),
  rome: () => import('../../scripts/eval-fixtures/rome-4-days.json').then((module) => module.default),
};

const DESTINATION_ALIASES = {
  lisboa: 'lisbon',
  lisbon: 'lisbon',
  toquio: 'tokyo',
  tokyo: 'tokyo',
  paris: 'paris',
  bali: 'bali',
  'nova iorque': 'new york',
  nyc: 'new york',
  'new york': 'new york',
  roma: 'rome',
  rome: 'rome',
};

const OFFLINE_PLACE_SEEDS = {
  azores: [
    ['Portas da Cidade', 'landmark', 37.7394, -25.6687],
    ['Mercado da Graça', 'food', 37.7415, -25.6654],
    ['Jardim António Borges', 'nature', 37.7465, -25.6752],
    ['A Tasca', 'food', 37.7393, -25.6698],
    ['Miradouro da Vista do Rei', 'nature', 37.8395, -25.7948],
    ['Miradouro da Boca do Inferno', 'nature', 37.8251, -25.7604],
    ['Sete Cidades lakeside', 'nature', 37.8610, -25.7941],
    ['Piscinas Naturais dos Mosteiros', 'nature', 37.8909, -25.8246],
    ['Caldeira Velha', 'nature', 37.7814, -25.4986],
    ['Miradouro da Lagoa do Fogo', 'nature', 37.7570, -25.4664],
    ['Centro histórico da Ribeira Grande', 'landmark', 37.8218, -25.5214],
    ['Associação Agrícola de São Miguel', 'food', 37.8041, -25.5628],
    ['Lagoa das Furnas e caldeiras', 'nature', 37.7637, -25.3302],
    ['Parque Terra Nostra', 'nature', 37.7726, -25.3138],
    ['Poça da Dona Beija', 'nature', 37.7694, -25.3171],
    ["Tony's Restaurant", 'food', 37.7723, -25.3092],
    ['Miradouro da Ponta do Sossego', 'nature', 37.8087, -25.1458],
    ['Salto do Prego trail', 'nature', 37.7463, -25.2038],
    ['Ilhéu de Vila Franca do Campo', 'nature', 37.7034, -25.4431],
    ['Bar Caloura', 'food', 37.7063, -25.5060],
  ],
  madeira: [
    ['Mercado dos Lavradores', 'food', 32.6487, -16.9041],
    ['Zona Velha do Funchal', 'landmark', 32.6482, -16.8997],
    ['Monte Palace Madeira', 'culture', 32.6754, -16.9028],
    ['Armazém do Sal', 'food', 32.6482, -16.9081],
    ['Cabo Girão Skywalk', 'nature', 32.6564, -17.0041],
    ['Baía de Câmara de Lobos', 'landmark', 32.6489, -16.9758],
    ['Fajã dos Padres', 'nature', 32.6571, -17.0218],
    ['Vila do Peixe', 'food', 32.6497, -16.9764],
    ['Pico do Arieiro', 'nature', 32.7354, -16.9288],
    ['Balcões de Ribeiro Frio', 'nature', 32.8077, -16.8869],
    ['Casas típicas de Santana', 'culture', 32.8024, -16.8819],
    ['Quinta do Furão', 'food', 32.8181, -16.8814],
    ['Floresta do Fanal', 'nature', 32.8096, -17.1440],
    ['Piscinas Naturais do Porto Moniz', 'nature', 32.8669, -17.1667],
    ['Praia do Seixal', 'nature', 32.8243, -17.1039],
    ['Véu da Noiva viewpoint', 'nature', 32.8155, -17.0910],
    ['Ponta de São Lourenço', 'nature', 32.7430, -16.7006],
    ['Baía de Machico', 'nature', 32.7161, -16.7628],
    ['Engenho do Norte', 'culture', 32.7739, -16.8291],
    ['Jaca restaurant Porto da Cruz', 'food', 32.7727, -16.8280],
  ],
  london: [
    ['Borough Market', 'food', 51.5055, -0.0910],
    ['Tate Modern', 'culture', 51.5076, -0.0994],
    ['South Bank riverside walk', 'nature', 51.5067, -0.1145],
    ['Flat Iron Square', 'food', 51.5042, -0.0958],
    ['Westminster Abbey', 'landmark', 51.4993, -0.1273],
    ["St James's Park", 'nature', 51.5025, -0.1349],
    ['National Gallery', 'culture', 51.5089, -0.1283],
    ['Seven Dials', 'landmark', 51.5145, -0.1269],
    ['Columbia Road Flower Market', 'experience', 51.5290, -0.0708],
    ['Brick Lane', 'food', 51.5211, -0.0716],
    ['Barbican Conservatory', 'nature', 51.5202, -0.0937],
    ['Dishoom Shoreditch', 'food', 51.5244, -0.0775],
    ['Victoria and Albert Museum', 'culture', 51.4966, -0.1722],
    ['Hyde Park and Serpentine', 'nature', 51.5073, -0.1657],
    ['Notting Hill backstreets', 'experience', 51.5150, -0.2050],
    ['Goldborne Road food stops', 'food', 51.5224, -0.2104],
  ],
};

function getOfflineSeedPlaces(destination = '') {
  const lookup = normalizeDestinationLookup(destination);
  const key = /azores|acores|sao miguel/.test(lookup)
    ? 'azores'
    : /madeira|funchal/.test(lookup)
      ? 'madeira'
      : /london|londres/.test(lookup)
        ? 'london'
        : '';
  return (OFFLINE_PLACE_SEEDS[key] || []).map(([name, category, lat, lng]) => ({
    name,
    displayName: `${name}, ${destination}`,
    type: category,
    category,
    coordinates: { lat, lng },
    coordinateSource: 'curated',
  }));
}

function normalizeDestinationLookup(value = '') {
  return String(value)
    .split(',')[0]
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function getCuratedDestinationKey(destination = '') {
  const lookup = normalizeDestinationLookup(destination);
  const direct = DESTINATION_ALIASES[lookup];
  if (direct) return direct;
  return Object.keys(CURATED_FIXTURE_LOADERS).find((key) => lookup.includes(key) || key.includes(lookup)) || '';
}

function findLegacyDestinationData(destination = '') {
  const lookup = normalizeDestinationLookup(destination);
  const canonical = DESTINATION_ALIASES[lookup] || lookup;
  return Object.entries(destinationData).find(([key]) => canonical.includes(key) || key.includes(canonical)) || null;
}

function scaledMoney(value, ratio) {
  return Number.isFinite(Number(value)) ? Math.round(Number(value) * ratio) : value;
}

function resizeCuratedBudget(budget, ratio) {
  if (!budget || typeof budget !== 'object') return budget;
  const next = clone(budget);
  ['accommodation', 'food', 'activities', 'transport'].forEach((key) => {
    if (!next[key]) return;
    ['total', 'min', 'max'].forEach((field) => {
      if (next[key][field] !== undefined) next[key][field] = scaledMoney(next[key][field], ratio);
    });
  });
  const flightMin = Number(next.flights?.min) || 0;
  const flightMax = Number(next.flights?.max) || flightMin;
  const variableTotal = ['accommodation', 'food', 'activities', 'transport']
    .reduce((sum, key) => sum + (Number(next[key]?.total) || 0), 0);
  if (next.grandTotal) {
    next.grandTotal.min = flightMin + variableTotal;
    next.grandTotal.max = flightMax + variableTotal;
  }
  if (next.perPersonEstimate) {
    next.perPersonEstimate.min = next.grandTotal?.min || next.perPersonEstimate.min;
    next.perPersonEstimate.max = next.grandTotal?.max || next.perPersonEstimate.max;
  }
  return next;
}

function addCuratedEveningStop(day, dayIndex, destinationLabel) {
  const stops = Array.isArray(day?.stops) ? day.stops.map((stop) => ({ ...stop })) : [];
  const hasEveningStop = stops.some((stop) => {
    const hour = Number.parseInt(String(stop.startTime || stop.time || '').split(':')[0], 10);
    return stop.period === 'evening' || (Number.isFinite(hour) && hour >= 18);
  });
  const dinner = day?.meals?.dinner;
  if (hasEveningStop || !dinner?.name) return { ...day, stops };

  const fallbackCoords = stops[stops.length - 1]?.coordinates || null;
  const dinnerStop = {
    id: `d${dayIndex + 1}-evening-table`,
    name: dinner.name,
    type: `Jantar - ${dinner.cuisine || 'cozinha local'}`,
    category: 'food',
    description: `Jantar planeado para fechar o dia na mesma zona, sem uma deslocação desnecessária em ${destinationLabel}.`,
    whyMatters: 'Transforma a sugestão de restaurante numa decisão prática, com horário, custo e reserva visíveis no plano.',
    address: dinner.address || destinationLabel,
    coordinates: dinner.coordinates || fallbackCoords,
    startTime: '19:30',
    time: '19:30',
    period: 'evening',
    duration: '90 min',
    cost: dinner.cost || 0,
    priceRange: dinner.priceRange || '',
    bookingRequired: dinner.bookingRequired !== false,
    bookingTip: 'Reserva 1-3 semanas antes quando a sala for pequena ou o dia coincidir com fim de semana.',
    insiderTip: dinner.insiderNote || 'Confirma o primeiro ou último turno para uma sala mais calma.',
    backupOption: 'Guarda uma segunda mesa sem pré-pagamento na mesma zona e cancela-a assim que a principal estiver confirmada.',
    practicalNote: 'Confirma horário, política de atraso, restrições alimentares e método de pagamento.',
    transportFromPrevious: {
      mode: 'A pé ou transporte direto curto',
      line: 'Ligação dentro da zona do dia',
      duration: '15-25 min',
      cost: 3,
      directions: 'Segue diretamente da última visita para o jantar; não regreses ao hotel salvo se precisares de uma pausa.',
    },
  };
  stops.push(dinnerStop);
  const periods = day?.periods && typeof day.periods === 'object' ? day.periods : {};
  return {
    ...day,
    stops,
    activities: stops,
    periods: {
      ...periods,
      evening: {
        ...(periods.evening || {}),
        timeRange: periods.evening?.timeRange || '18:00-22:00',
        activities: [...(periods.evening?.activities || []), dinnerStop],
      },
    },
  };
}

function markCuratedCoordinates(day) {
  const mark = (item) => {
    if (!item || typeof item !== 'object' || !item.coordinates) return item;
    return { ...item, coordinateSource: 'curated' };
  };
  const periods = Object.fromEntries(
    Object.entries(day?.periods || {}).map(([periodKey, period]) => [
      periodKey,
      {
        ...period,
        activities: (period?.activities || []).map(mark),
      },
    ]),
  );
  const meals = Object.fromEntries(
    Object.entries(day?.meals || {}).map(([mealKey, meal]) => [mealKey, mark(meal)]),
  );
  const stops = (day?.stops || []).map(mark);
  return {
    ...day,
    stops,
    activities: stops,
    periods,
    meals,
  };
}

async function loadCuratedFallback(destination, requestedDays, preferences = {}) {
  const key = getCuratedDestinationKey(destination);
  const loader = CURATED_FIXTURE_LOADERS[key];
  if (!loader) return null;

  try {
    const fixture = clone(await loader());
    const originalDays = Math.max(1, fixture.days?.length || 1);
    const { city, country } = parseDestinationParts(destination);
    const centerArray = fixture.destination?.coordinates || getDestinationCenter(destination);
    const center = { lat: Number(centerArray[0]), lng: Number(centerArray[1]) };
    const currency = fixture.destination?.currency || { code: 'EUR', symbol: 'EUR' };
    const days = (fixture.days || []).slice(0, requestedDays);
    while (days.length < requestedDays) {
      days.push(buildSupplementalDay(city, days.length, center, currency.symbol || currency.code || 'EUR'));
    }

    fixture.destination = {
      ...(fixture.destination || {}),
      city,
      name: country ? `${city}, ${country}` : city,
      country: country || fixture.destination?.country || '',
      andorVerdict: `Plano de demonstração com locais específicos, tempos realistas e logística prática para ${city}.`,
    };
    fixture.days = days.map((day, index) => markCuratedCoordinates({
      ...addCuratedEveningStop(day, index, city),
      dayNumber: index + 1,
    }));
    fixture.trip = {
      ...(fixture.trip || {}),
      totalDays: requestedDays,
      tripPace: preferences.pace || fixture.trip?.tripPace || 'balanced',
      budgetBreakdown: resizeCuratedBudget(fixture.trip?.budgetBreakdown, requestedDays / originalDays),
    };
    fixture.tripOverview = fixture.summary?.andorVerdict || `Roteiro prático e específico para ${city}.`;
    fixture.currency = currency.symbol || currency.code || 'EUR';
    fixture.metadata = {
      ...(fixture.metadata || {}),
      source: 'curated-demo-fallback',
      generatedAt: new Date().toISOString(),
      mapDataSource: 'curated-and-evaluated',
    };
    return fixture;
  } catch (error) {
    return null;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseRequestedDays(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 2;
  return Math.min(14, Math.max(1, parsed));
}

function getDestinationCenterFromDays(days, fallback = { lat: 38.7223, lng: -9.1393 }) {
  for (const day of days || []) {
    for (const stop of day.stops || []) {
      const coords = stop.coordinates;
      if (coords && Number.isFinite(Number(coords.lat)) && Number.isFinite(Number(coords.lng))) {
        return { lat: Number(coords.lat), lng: Number(coords.lng) };
      }
    }
  }
  return fallback;
}

const FALLBACK_CURRENCY_BY_COUNTRY = [
  { match: /japan|jap/i, symbol: '¥', code: 'JPY' },
  { match: /united states|usa|states/i, symbol: '$', code: 'USD' },
  { match: /united kingdom|uk|england|scotland/i, symbol: '£', code: 'GBP' },
  { match: /indonesia|bali/i, symbol: 'Rp', code: 'IDR' },
  { match: /morocco|marrocos/i, symbol: 'MAD', code: 'MAD' },
  { match: /iceland|islandia|reykjavik/i, symbol: 'ISK', code: 'ISK' },
];

function getCurrencyForDestination(destination = '') {
  const match = FALLBACK_CURRENCY_BY_COUNTRY.find((item) => item.match.test(destination));
  return match || { symbol: '€', code: 'EUR' };
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(a, b) {
  if (!a || !b) return Infinity;
  const radius = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const x = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function parseDestinationParts(destination = '') {
  const parts = String(destination).split(',').map((part) => part.trim()).filter(Boolean);
  return {
    city: parts[0] || String(destination).trim() || 'Destino',
    country: parts.slice(1).join(', ') || '',
  };
}

function cleanPlaceName(value = '') {
  return String(value)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(', ');
}

function classifyPlace(item) {
  const haystack = `${item.class || ''} ${item.type || ''} ${item.display_name || ''}`.toLowerCase();
  if (/restaurant|cafe|food|bar|pub|market|bakery|deli/.test(haystack)) return 'food';
  if (/museum|gallery|theatre|art|library/.test(haystack)) return 'culture';
  if (/park|garden|beach|viewpoint|peak|nature|water/.test(haystack)) return 'nature';
  if (/castle|church|cathedral|temple|monument|attraction|historic/.test(haystack)) return 'landmark';
  return 'experience';
}

async function searchDestinationPlaces(query, center, country = '') {
  try {
    const scoped = country ? `${query}, ${country}` : query;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(scoped)}&format=json&limit=8&addressdetails=1&dedupe=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Andor-Travel-App/1.0',
        'Accept-Language': 'pt,en;q=0.9',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .map((item) => ({
        name: cleanPlaceName(item.display_name),
        displayName: item.display_name,
        type: item.type || item.class || 'place',
        category: classifyPlace(item),
        coordinates: {
          lat: Number.parseFloat(item.lat),
          lng: Number.parseFloat(item.lon),
        },
      }))
      .filter((place) => Number.isFinite(place.coordinates.lat) && Number.isFinite(place.coordinates.lng))
      .filter((place) => getDistanceKm(center, place.coordinates) < 120)
      .filter((place) => place.name && !/^unnamed/i.test(place.name));
  } catch (error) {
    return [];
  }
}

function uniquePlaces(places) {
  const seen = new Set();
  return places.filter((place) => {
    const key = place.name.toLowerCase().replace(/[^\w]+/g, ' ').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildPhotoKeyword(place, destinationLabel) {
  const category = place.category === 'food' ? 'local food restaurant'
    : place.category === 'nature' ? 'landscape viewpoint'
      : place.category === 'culture' ? 'museum architecture'
        : 'landmark travel';
  return `${place.name} ${destinationLabel} ${category}`;
}

function buildRealStop(place, index, destinationLabel, symbol) {
  const times = ['09:00', '11:15', '14:00', '19:00', '20:30'];
  const typeLabel = {
    food: 'Comida - mesa local que vale planear',
    culture: 'Cultura - visita focada com contexto',
    nature: 'Natureza - pausa cenica mais lenta',
    landmark: 'Marco local - lugar assinatura da rota',
    experience: 'Experiencia - ancora local do percurso',
  }[place.category] || 'Experiencia - ancora local do percurso';
  return {
    time: times[index % times.length],
    name: place.name,
    type: typeLabel,
    category: place.category,
    description: `${place.name} is the specific ${place.category || 'local'} anchor for this part of the route in ${destinationLabel}.`,
    whyMatters: `It keeps this day specific to ${destinationLabel} and avoids an unnecessary cross-city detour.`,
    duration: place.category === 'food' ? '75 min planeados' : '90 min planeados',
    cost: null,
    estimatedCost: null,
    coordinates: { lat: place.coordinates.lat, lng: place.coordinates.lng },
    address: place.displayName,
    coordinateSource: place.coordinateSource || 'nominatim',
    source: place.coordinateSource === 'curated' ? 'curated' : 'openstreetmap',
    bookingRequired: null,
    crowd: null,
    photoKeyword: buildPhotoKeyword(place, destinationLabel),
    backupOption: `If ${place.name} is closed or weather makes it impractical, keep the same time block and use a nearby indoor stop in this area.`,
    practicalNote: 'Confirm current opening hours, access, and parking or transport conditions the day before.',
    localSecret: `Usa este ponto como ancora da zona em ${destinationLabel}; guarda a morada offline antes de sair do hotel.`,
    insiderTip: `Confirma os horarios recentes antes de sair; sitios pequenos mudam horarios com frequencia.`,
    transportFromPrevious: {
      mode: index === 0 ? 'Comecar na zona onde ficas' : 'A pe ou salto curto de transporte publico',
      duration: '',
      cost: null,
      directions: 'Confirma a rota e o tempo atuais no mapa antes de sair.',
    },
  };
}

function makeDayTitle(dayIndex, stops, cityName) {
  const first = stops[0]?.name?.split(',')[0] || cityName;
  const second = stops[1]?.name?.split(',')[0] || 'local streets';
  const hooks = [
    'Primeira Luz',
    'Pulso Local',
    'Horas de Mercado',
    'Cantos Calmos',
    'Ultima Rota Dourada',
    'Bairro em Profundidade',
    'Agua e Pedra',
  ];
  return `${hooks[dayIndex % hooks.length]}: ${first} e ${second}`;
}

function buildDestinationAwareDay(cityName, destinationLabel, dayIndex, places, center, symbol) {
  const sliceStart = dayIndex * 2;
  const selected = places.slice(sliceStart, sliceStart + 4);

  const stops = selected.map((place, index) => buildRealStop(place, index, destinationLabel, symbol));
  return {
    dayNumber: dayIndex + 1,
    title: makeDayTitle(dayIndex, stops, cityName),
    theme: dayIndex === 0 ? 'Chegada, orientacao e primeiro bairro real' : 'Rota local compacta',
    moodDescription: dayIndex === 0
      ? `Uma entrada suave em ${cityName}, com estrutura suficiente para te orientares e espaco para recuperar.`
      : `Uma rota feita com lugares reais em ${cityName}, agrupados para evitar voltas sem sentido.`,
    transportTip: 'Mantem cada dia geograficamente compacto e usa transporte so no salto mais longo.',
    localSecret: `Nao tentes apanhar todos os pontos famosos no mesmo dia. Escolhe o melhor conjunto em ${cityName} e deixa as ruas pequenas fazerem parte da viagem.`,
    stops,
    meals: {
      breakfast: null,
      lunch: stops.find((stop) => stop.category === 'food')
        ? { name: stops.find((stop) => stop.category === 'food').name, source: 'openstreetmap', cost: null }
        : null,
      dinner: null,
    },
    weather: { avgTemp: '', condition: 'Confirmar previsao', emoji: 'WX', tip: 'Confirma a meteorologia 48 horas antes.' },
    transport: { mainMode: 'Confirmar ligações no mapa', apps: [], cost: null },
    budgetEstimate: null,
  };
}

export async function generateDestinationAwareFallbackItinerary(destination, numDays = 2, budget = '', preferences = {}) {
  const requestedDays = parseRequestedDays(numDays);
  const curated = await loadCuratedFallback(destination, requestedDays, preferences);
  if (curated?.days?.length) return curated;

  const { city, country } = parseDestinationParts(destination);
  const destinationLabel = country ? `${city}, ${country}` : city;
  const currency = getCurrencyForDestination(destinationLabel);

  const centerGeo = await geocodeServerSide(destinationLabel, country);
  const [fallbackLat, fallbackLng] = getDestinationCenter(destinationLabel);
  const center = centerGeo
    ? { lat: centerGeo.lat, lng: centerGeo.lng }
    : { lat: fallbackLat, lng: fallbackLng };
  const themes = [
    `${city} landmarks`,
    `${city} museum`,
    `${city} market`,
    `${city} viewpoint`,
    `${city} old town`,
    `${city} park`,
    `${city} restaurant`,
  ];

  const found = getOfflineSeedPlaces(destinationLabel);
  for (const theme of themes) {
    if (found.length >= requestedDays * 4) break;
    const results = await searchDestinationPlaces(theme, center, country);
    found.push(...results);
  }

  const places = uniquePlaces(found);
  if (places.length < requestedDays * 2) return null;
  const days = Array.from({ length: requestedDays }, (_, dayIndex) =>
    buildDestinationAwareDay(city, destinationLabel, dayIndex, places, center, currency.symbol)
  );
  const originText = preferences.originCity ? `de ${preferences.originCity}` : 'do teu aeroporto';
  const paceLabel = {
    relaxed: 'calmo',
    balanced: 'equilibrado',
    intense: 'intenso',
  }[preferences.pace] || preferences.pace || 'equilibrado';

  const result = {
    destination: {
      name: destinationLabel,
      city,
      country,
      coordinates: [center.lat, center.lng],
      currency: { code: currency.code, symbol: currency.symbol },
      andorVerdict: `Fallback sem IA externa, mas centrado em dados práticos e locais para ${destinationLabel}.`,
    },
    tripOverview: `Uma rota adaptada a ${destinationLabel}, criada com contexto local em vez de um template generico.`,
    flights: { suggestion: `Pesquisa voos atuais para ${city} a partir ${originText} num fornecedor externo.` },
    accommodation: { overview: 'Pesquisa uma base adequada ao percurso e confirma disponibilidade num fornecedor externo.', hotels: [] },
    currency: currency.symbol,
    days,
    mustEat: [],
    contingency: { emergencyInfo: 'Confirma numeros de emergencia locais e guarda o contacto da embaixada.', unexpectedTips: 'Horarios e precos sao estimativas; confirma paragens-chave antes de viajar.' },
    suggestions: [
      `Mais local em ${city}`,
      `Trocar um dia por natureza perto de ${city}`,
      `Ajustar para ritmo ${paceLabel}`,
    ],
    metadata: {
      source: 'destination-aware-fallback',
      memoryMode: preferences.memoryMode || 'none',
      mapDataSource: 'nominatim',
      generatedAt: new Date().toISOString(),
    },
  };

  return attachTripSummary(result, requestedDays, budget);
}

function buildSupplementalDay(cityName, dayIndex, center, symbol = '€') {
  const themes = [
    'Local Markets & Quiet Districts',
    'Design Streets & Independent Cafes',
    'Gardens, Galleries & Slow Evening',
    'Neighbourhood Food Route',
    'Waterfront Views & Last-Night Rituals',
    'Hidden Museums & Residential Lanes',
    'Day Trip Edges & Sunset Return',
  ];
  const title = `Day ${dayIndex + 1} — ${themes[dayIndex % themes.length]}`;
  const offset = (step) => ({
    lat: center.lat + Math.sin(dayIndex + step) * 0.018,
    lng: center.lng + Math.cos(dayIndex + step) * 0.018,
  });
  const amounts = symbol === '¥'
    ? { breakfast: 900, lunch: 1800, culture: 1200, dinner: 3600 }
    : { breakfast: 8, lunch: 18, culture: 10, dinner: 32 };

  const result = {
    title,
    transportTip: 'Keep the day grouped by neighbourhood and use public transport only for the longest hop.',
    localSecrets: `Ask a cafe or hotel team member in ${cityName} where they go after work; those streets often beat the obvious guidebook route.`,
    stops: [
      { time: '09:00', name: `${cityName} neighbourhood cafe`, type: 'Breakfast — local start', isRestaurant: true, estimatedCost: `${symbol}${amounts.breakfast}`, coordinates: offset(1), localSecret: 'Sit at the counter if available; service is faster and staff often share better tips.' },
      { time: '10:30', name: `${cityName} independent market`, type: 'Market — local produce and makers', estimatedCost: 'Free', coordinates: offset(2), localSecret: 'Walk the outer aisles first; the best small vendors are rarely at the main entrance.' },
      { time: '12:30', name: `${cityName} casual lunch room`, type: 'Lunch — practical regional food', isRestaurant: true, estimatedCost: `${symbol}${amounts.lunch}`, coordinates: offset(3), localSecret: 'Ask for the daily plate before reading the full menu.' },
      { time: '14:30', name: `${cityName} small museum or gallery`, type: 'Culture — focused visit', estimatedCost: `${symbol}${amounts.culture}`, coordinates: offset(4), localSecret: 'Check if the temporary exhibition is included; it is usually the best part.' },
      { time: '17:00', name: `${cityName} golden-hour viewpoint`, type: 'Views — unhurried stop', estimatedCost: 'Free', coordinates: offset(5), localSecret: 'Arrive 30 minutes before sunset and leave by a side street rather than the main exit.' },
      { time: '20:00', name: `${cityName} dinner reservation`, type: 'Dinner — local recommendation', isRestaurant: true, estimatedCost: `${symbol}${amounts.dinner}`, coordinates: offset(6), localSecret: 'Book the first or last seating for a calmer room.' },
    ],
  };
  return result;
}

function attachTripSummary(result, requestedDays, budget) {
  const currencyCode = result.currency === '¥' ? 'JPY' : result.currency === '$' ? 'USD' : 'EUR';
  const dayCost = result.currency === '¥' ? 8500 : result.currency === '$' ? 120 : 95;
  const min = dayCost * requestedDays;
  const max = Math.round(min * 1.25);

  result.trip = {
    ...(result.trip || {}),
    totalDays: requestedDays,
    travelStyle: result.trip?.travelStyle || 'cultural',
    groupType: result.trip?.groupType || 'travellers',
    budgetTier: budget || result.trip?.budgetTier || 'comfort',
    budgetBreakdown: {
      flights: { min: 0, max: 0 },
      accommodation: { total: Math.round(min * 0.45) },
      food: { total: Math.round(min * 0.28) },
      activities: { total: Math.round(min * 0.18) },
      transport: { total: Math.round(min * 0.09) },
      grandTotal: { min, max },
      perPersonEstimate: { min, max },
      currency: currencyCode,
    },
    topTips: result.trip?.topTips || [
      'Book the most constrained activity first.',
      'Keep one late afternoon flexible every two days.',
      'Save all addresses offline before leaving the hotel.',
    ],
  };
  result.totalCost = `${result.currency || '€'}${min}-${result.currency || '€'}${max}`;
  return result;
}

// Generate a smart itinerary for any destination
export function generateFallbackItinerary(destination, numDays = 2, budget = '') {
  const requestedDays = parseRequestedDays(numDays);
  const legacyEntry = findLegacyDestinationData(destination);

  if (legacyEntry) {
    const result = clone(legacyEntry[1]);
    const cityName = destination.split(',')[0].trim() || result.name || destination;
    const center = getDestinationCenterFromDays(result.days);
    result.destination = destination;
    result.days = result.days.slice(0, requestedDays);
    while (result.days.length < requestedDays) {
      result.days.push(buildSupplementalDay(cityName, result.days.length, center, result.currency || '€'));
    }
    return attachTripSummary(result, requestedDays, budget);
  }

  // Generic fallback for unknown destinations
  const cityName = destination.split(',')[0].trim() || destination;
  
  const [destinationLat, destinationLng] = getDestinationCenter(destination);
  const baseLat = destinationLat;
  const baseLng = destinationLng;

  const result = {
    destination: destination,
    tripOverview: `Discover the best of ${cityName} with this curated professional itinerary.`,
    flights: { suggestion: `Direct flights to ${cityName} available from major hubs.`, averagePrice: '€150-300' },
    accommodation: { hotelName: `${cityName} Grand Hotel`, type: 'Boutique', reason: 'Central location with excellent reviews.' },
    currency: '€',
    days: Array.from({ length: requestedDays }, (_, i) => ({
      title: `Day ${i + 1} — ${['Secrets and Ancient Streets', 'Culinary Wonders and Hidden Alleys', 'Sunset Vistas and Local Life', 'Cultural Legends and Modern Pulse', 'Scenic Escapes and Quiet Paths'][i % 5]} of ${cityName}`,
      transportTip: 'Local public transport is highly efficient and recommended.',
      localSecrets: `Visit the small alleys off the main street in ${cityName} to find local artisan shops.`,
      stops: [
        { time: '09:00', name: `Historic Center Walking Tour`, type: `Culture — Discover old town & main square`, isRestaurant: false, estimatedCost: 'Free', coordinates: { lat: baseLat + 0.015, lng: baseLng - 0.012 }, localSecret: 'The local tourism bureau offers free brochures with self-guided walks.' },
        { time: '11:00', name: `${cityName} Main Cathedral/Temple`, type: `History — Iconic religious site`, isRestaurant: false, estimatedCost: '€6', coordinates: { lat: baseLat + 0.022, lng: baseLng - 0.005 }, localSecret: 'Dress appropriately to respect local customs; photography inside might be limited.' },
        { time: '13:00', name: `Local Market & Street Food`, type: `Lunch — Authentic local cuisine`, isRestaurant: true, estimatedCost: '€12', coordinates: { lat: baseLat + 0.008, lng: baseLng - 0.025 }, localSecret: 'Always look for stalls with queues of locals — that is where the best quality is.' },
        { time: '15:00', name: `${cityName} Museum of Art`, type: `Art — Regional masterpieces & exhibitions`, isRestaurant: false, estimatedCost: '€8', coordinates: { lat: baseLat - 0.010, lng: baseLng - 0.018 }, localSecret: 'Entry is half-price or free on Wednesday afternoons. Check their website.' },
        { time: '17:00', name: `Panoramic Viewpoint`, type: `Views — Best sunset spot in ${cityName}`, isRestaurant: false, estimatedCost: 'Free', coordinates: { lat: baseLat - 0.018, lng: baseLng + 0.010 }, localSecret: 'Get there 30 minutes before sunset to secure a good spot on the rocks.' },
        { time: '19:30', name: `Traditional Restaurant`, type: `Dinner — Locally recommended cuisine`, isRestaurant: true, estimatedCost: '€22', coordinates: { lat: baseLat - 0.005, lng: baseLng + 0.022 }, localSecret: 'Order the house special wine; it is usually cheaper and better than generic bottles.' },
      ],
    })),
    mustEat: ['Local Signature Dish', 'Street Food Specialty', 'Traditional Dessert'],
    contingency: { emergencyInfo: 'Call local emergency services (112 in EU). Keep copies of your ID.', unexpectedTips: 'Book main attractions 48h in advance to skip lines.' },
    totalCost: budget ? `€${budget}` : '€250',
  };
  return attachTripSummary(result, requestedDays, budget);
}

// Smart chat responses
const chatKnowledge = {
  greetings: [
    "Hello! 👋 I'm your Andor travel assistant. How can I help you? I can suggest destinations, give tips about any city, or help you plan your next adventure!",
  ],
  destinations: {
    'lisboa': "🇵🇹 **Lisbon** is absolutely incredible! I recommend:\n\n🏛️ **Belém** — Pastéis de Belém + Jerónimos (morning)\n🚃 **Tram 28** — Iconic ride through the hills\n🌅 **Miradouro da Graça** — Best sunset\n🎵 **Fado in Alfama** — A must-do evening experience\n🍽️ **Time Out Market** — To eat a bit of everything\n\n💡 *Tip*: Buy the Lisboa Card (€27/24h) for unlimited transport and free entry!",
    'lisbon': "🇵🇹 **Lisbon** is absolutely incredible! I recommend:\n\n🏛️ **Belém** — Pastéis de Belém + Jerónimos (morning)\n🚃 **Tram 28** — Iconic ride through the hills\n🌅 **Miradouro da Graça** — Best sunset\n🎵 **Fado in Alfama** — A must-do evening experience\n🍽️ **Time Out Market** — To eat a bit of everything\n\n💡 *Tip*: Buy the Lisboa Card (€27/24h) for unlimited transport and free entry!",
    'porto': "🇵🇹 **Porto** is magical! Don't miss:\n\n🍷 **Port Wine Cellars** — Tastings in Vila Nova de Gaia\n📚 **Livraria Lello** — One of the most beautiful bookstores in the world\n🌉 **Dom Luís I Bridge** — Incredible views from both sides\n🏖️ **Foz do Douro** — Seaside walk at sunset\n🍽️ **Francesinha** — The traditional dish you HAVE to try\n\n💡 *Tip*: The 6 bridges cruise (€15) is spectacular!",
    'paris': "🇫🇷 **Paris** — the city of light! The essentials:\n\n🗼 **Eiffel Tower** — Magical at sunset\n🎨 **Musée d'Orsay** — Better than the Louvre for Impressionism\n🥐 **Le Marais** — Trendy neighborhood with the best croissants\n⛪ **Sacré-Cœur** — Montmartre at dusk\n🛥️ **Seine Cruise** — At night, with the city illuminated\n\n💡 *Tip*: The Museum Pass (€52/2 days) gives access to 50+ museums!",
    'barcelona': "🇪🇸 **Barcelona** is pure energy! Must-sees:\n\n⛪ **Sagrada Família** — Book online in advance!\n🏖️ **Barceloneta** — Beach + chiringuitos\n🎨 **Park Güell** — Gaudí mosaics with a view\n🍷 **El Born** — Tapas crawl through local bars\n\n💡 *Tip*: Eat at local markets (La Boqueria, Santa Caterina) — it's cheaper and more authentic!",
    'tokyo': "🇯🇵 **Tokyo em setembro** é uma escolha forte: ainda quente e húmido (26-29°C), menos caótico que agosto, com matsuri de bairro e noites ótimas para izakayas.\n\n✈️ **Voos desde LIS**: Finnair via HEL (~€720-€920 pp) é normalmente o melhor equilíbrio; Lufthansa via FRA/MUC (~€780-€1.050 pp) é mais previsível em ligações. Confirma preços atuais no Skyscanner/Google Flights.\n\n🏨 **Hotel**: Hotel Gracery Shinjuku ou Nohga Hotel Ueno Tokyo, 4★, ~€130-€180/noite. Shinjuku dá noite e ligações; Ueno poupa tempo para Asakusa/Tsukiji.\n\n🎬 **7 dias com títulos cinematográficos**:\n1. The City Wakes Up: Tsukiji at Dawn & Senso-ji in Silence\n2. Neon Cathedrals: Shibuya Crossing & Golden Gai After Dark\n3. Quiet Tokyo: Yanaka Lanes & Ueno’s Museum Bones\n4. Kitchen Heat: Kappabashi Tools & Counter Sushi Rituals\n5. Sacred Green: Meiji Shrine, Omotesando & Harajuku Side Streets\n6. Future Glow: teamLab, Odaiba Bay & Late-Night Ramen\n7. Last Morning Light: Depachika Breakfast & Airport Farewell\n\n💡 3 dicas úteis: carrega Suica no telemóvel, reserva restaurantes pequenos 2-3 semanas antes, e evita táxis salvo depois da meia-noite.\n\nSUGGESTIONS: Hotéis em Shinjuku | Roteiro gastronómico | Orçamento dia a dia",
  },
};

export function generateChatResponse(message) {
  const lower = message.toLowerCase();
  
  // Check for destination mentions
  for (const [key, response] of Object.entries(chatKnowledge.destinations)) {
    if (lower.includes(key)) return response;
  }
  
  // Common questions
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('good morning') || lower.includes('good afternoon')) {
    return chatKnowledge.greetings[0];
  }
  if (lower.includes('hotel') || lower.includes('stay') || lower.includes('accommodation') || lower.includes('sleep')) {
    return "🏨 For accommodation, I recommend:\n\n• **Booking.com** — Best for hotels with free cancellation\n• **Hostelworld** — If you're looking for hostels and socializing\n• **Airbnb** — For longer stays or groups\n\n💡 *Tip*: Book 2-3 months in advance for the best prices. In high season (Jul-Aug), book 4-6 months out!";
  }
  if (lower.includes('flight') || lower.includes('plane') || lower.includes('fly')) {
    return "✈️ For cheap flights:\n\n• **Google Flights** — Best overall comparator\n• **Skyscanner** — Great for flexible destinations\n• **Ryanair / Wizz Air** — Low-cost in Europe\n\n💡 *Tip*: Tuesday and Wednesday are the cheapest days to fly. Book 6-8 weeks in advance for the best price!";
  }
  if (lower.includes('cheap') || lower.includes('budget') || lower.includes('save') || lower.includes('money')) {
    return "💰 Tips to travel on a budget:\n\n1. **Travel in the off-season** (Sep-Nov, Feb-Apr)\n2. **Cook in your accommodation** — Save 40% on food\n3. **Public transport** — Never take taxis in the center\n4. **Free walking tours** — Tip-based, excellent\n5. **Tourist cards** — Often pay off\n6. **Tap water** — Safe in most of Europe\n\n💡 Average daily budget per person:\n• 🟢 Budget: €30-50/day\n• 🟡 Medium: €80-120/day\n• 🔴 Comfortable: €150-250/day";
  }
  if (lower.includes('bag') || lower.includes('pack') || lower.includes('luggage')) {
    return "🎒 Essential packing list:\n\n👕 **Clothes**: 3-4 t-shirts, 2 pants, 1 light jacket\n👟 **Shoes**: Comfortable sneakers + flip flops\n🧴 **Hygiene**: Travel size (<100ml for cabin)\n📱 **Tech**: Charger, universal adapter, powerbank\n📄 **Docs**: Passport, travel insurance, digital copies\n\n💡 *Golden rule*: If you don't know if you need it, don't bring it!";
  }
  
  // Default response
  return `Great question! 🤔\n\nI can help you with:\n\n🗺️ **Destinations** — Ask me about any city (e.g., "tell me about Lisbon")\n✈️ **Flights** — Tips to find cheap flights\n🏨 **Accommodation** — Where to stay anywhere\n💰 **Budget** — How to travel on a budget\n\nTry asking: *"What to visit in Barcelona?"* or *"How to save money traveling?"*`;
}
