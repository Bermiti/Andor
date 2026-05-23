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

// Generate a smart itinerary for any destination
export function generateFallbackItinerary(destination, numDays = 2, budget = '') {
  const key = destination.toLowerCase().split(',')[0].trim();
  
  // Check if we have pre-built data
  for (const [k, v] of Object.entries(destinationData)) {
    if (key.includes(k) || k.includes(key)) {
      const result = { ...v };
      result.destination = destination;
      result.days = result.days.slice(0, parseInt(numDays) || 2);
      return result;
    }
  }

  // Generic fallback for unknown destinations
  const cityName = destination.split(',')[0].trim() || destination;
  
  // Base coordinates around center point for Leaflet map mapping (mock values that look correct)
  const baseLat = 38.72 + (Math.random() - 0.5) * 5;
  const baseLng = -9.13 + (Math.random() - 0.5) * 5;

  return {
    destination: destination,
    tripOverview: `Discover the best of ${cityName} with this curated professional itinerary.`,
    flights: { suggestion: `Direct flights to ${cityName} available from major hubs.`, averagePrice: '€150-300' },
    accommodation: { hotelName: `${cityName} Grand Hotel`, type: 'Boutique', reason: 'Central location with excellent reviews.' },
    days: Array.from({ length: Math.min(parseInt(numDays) || 2, 5) }, (_, i) => ({
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
    'tokyo': "🇯🇵 **Tokyo** — where the future meets tradition:\n\n⛩️ **Senso-ji** — Temple in Asakusa, go early morning\n🍣 **Tsukiji** — Fresh sushi at 7 AM\n🌸 **Meiji Shrine** — Oasis of peace in Harajuku\n🏙️ **Shibuya** — The most famous intersection in the world\n\n💡 *Tip*: Buy a Suica Card at the airport for all transport!",
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
