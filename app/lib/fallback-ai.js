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
    { title: 'Day 1 — Belém & History', transportTip: 'Take the iconic Tram 15 from Praça do Comércio.', stops: [
      { time: '09:00', name: 'Pastéis de Belém', type: 'Breakfast — Famous pastry shop since 1837', isRestaurant: true },
      { time: '10:30', name: 'Jerónimos Monastery', type: 'UNESCO World Heritage — Manueline masterpiece' },
      { time: '12:00', name: 'Torre de Belém', type: 'Landmark — 16th-century fortified tower' },
      { time: '13:30', name: 'Time Out Market', type: 'Lunch — Gourmet food hall with 40+ stalls', isRestaurant: true },
      { time: '15:30', name: 'MAAT Museum', type: 'Culture — Modern architecture & contemporary art' },
      { time: '18:00', name: 'Miradouro da Graça', type: 'Viewpoint — Stunning sunset panorama' },
      { time: '20:00', name: 'Taberna da Rua das Flores', type: 'Dinner — Traditional Portuguese tapas', isRestaurant: true },
    ]},
    { title: 'Day 2 — Alfama & Local Life', transportTip: 'Walk the narrow streets of Alfama; wear comfortable shoes!', stops: [
      { time: '09:00', name: 'Café A Brasileira', type: 'Breakfast — Historic café in Chiado', isRestaurant: true },
      { time: '10:00', name: 'Alfama District Walking Tour', type: 'Culture — Oldest neighborhood, narrow streets' },
      { time: '11:30', name: 'Sé de Lisboa Cathedral', type: 'History — 12th-century Romanesque cathedral' },
      { time: '13:00', name: 'Mercado da Ribeira', type: 'Lunch — Fresh seafood & local produce', isRestaurant: true },
      { time: '15:00', name: 'Tram 28 Ride', type: 'Experience — Iconic yellow tram through the hills' },
      { time: '16:30', name: 'LX Factory', type: 'Shopping — Creative hub with boutiques & street art' },
      { time: '19:00', name: 'Bairro Alto', type: 'Nightlife — Fado music & rooftop bars' },
    ]},
    { title: 'Day 3 — Sintra Day Trip', transportTip: 'Take the train from Rossio Station (40 min).', stops: [
      { time: '08:30', name: 'Train to Sintra', type: 'Transport — Rossio Station departure' },
      { time: '10:00', name: 'Palácio da Pena', type: 'UNESCO — Colorful Romanticist castle on a hilltop' },
      { time: '12:30', name: 'Quinta da Regaleira', type: 'Gardens — Initiation Well & mystical grounds' },
      { time: '14:00', name: 'Tascantiga', type: 'Lunch — Traditional cuisine in Sintra village', isRestaurant: true },
      { time: '15:30', name: 'Cabo da Roca', type: 'Nature — Westernmost point of mainland Europe' },
      { time: '17:30', name: 'Cascais Beach Walk', type: 'Relax — Coastal town & sunset by the sea' },
      { time: '20:00', name: 'Cervejaria Ramiro', type: 'Dinner — Best seafood restaurant in Lisbon', isRestaurant: true },
    ]},
  ], 
  mustEat: ['Pastel de Nata', 'Bacalhau à Brás', 'Grilled Sardines'],
  contingency: { emergencyInfo: 'Call 112 for emergencies. British Hospital is recommended for tourists.', unexpectedTips: 'Pickpockets are common on Tram 28. Keep bags in front.' },
  totalCost: '€380' 
  },
  'barcelona': { name: 'Barcelona, Spain', currency: '€', days: [
    { title: 'Day 1 — Gaudí & Gothic Quarter', stops: [
      { time: '09:00', name: 'La Boqueria Market', type: 'Breakfast — Fresh juices & local bites' },
      { time: '10:30', name: 'Sagrada Família', type: 'UNESCO — Gaudí\'s unfinished basilica masterpiece' },
      { time: '13:00', name: 'Gothic Quarter Walking Tour', type: 'History — Medieval streets & hidden plazas' },
      { time: '14:30', name: 'Can Culleretes', type: 'Lunch — Barcelona\'s oldest restaurant (1786)' },
      { time: '16:00', name: 'Park Güell', type: 'UNESCO — Gaudí\'s mosaic wonderland' },
      { time: '18:30', name: 'Casa Batlló', type: 'Architecture — Gaudí\'s dragon-inspired building' },
      { time: '20:30', name: 'El Nacional', type: 'Dinner — 4 restaurants under one gorgeous roof' },
    ]},
    { title: 'Day 2 — Beach, Art & Tapas', stops: [
      { time: '09:30', name: 'Barceloneta Beach', type: 'Morning — Mediterranean swim & boardwalk' },
      { time: '11:00', name: 'Picasso Museum', type: 'Art — 4,200+ works from Picasso\'s formative years' },
      { time: '13:00', name: 'El Born Market', type: 'Lunch — Tapas crawl through El Born district' },
      { time: '15:00', name: 'Montjuïc Castle & Gardens', type: 'Views — Panoramic hilltop overlooking the city' },
      { time: '17:00', name: 'Magic Fountain Show', type: 'Experience — Light, water & music spectacle' },
      { time: '19:30', name: 'La Rambla Sunset Walk', type: 'Culture — Barcelona\'s most famous boulevard' },
      { time: '21:00', name: 'Tickets Bar', type: 'Dinner — Creative tapas by the Adrià brothers' },
    ]},
  ], totalCost: '€310' },
  'paris': { name: 'Paris, France', currency: '€', days: [
    { title: 'Day 1 — Icons & Romance', stops: [
      { time: '09:00', name: 'Café de Flore', type: 'Breakfast — Legendary Saint-Germain café' },
      { time: '10:30', name: 'Eiffel Tower', type: 'Landmark — Summit visit with city views' },
      { time: '13:00', name: 'Le Champ de Mars Picnic', type: 'Lunch — French baguette, cheese & wine' },
      { time: '15:00', name: 'Musée d\'Orsay', type: 'Art — Impressionist masterpieces (Monet, Van Gogh)' },
      { time: '17:30', name: 'Seine River Cruise', type: 'Experience — Golden hour boat ride' },
      { time: '19:30', name: 'Le Marais Quarter', type: 'Culture — Trendy neighborhood & galleries' },
      { time: '21:00', name: 'Le Bouillon Chartier', type: 'Dinner — Classic Parisian bistro since 1896' },
    ]},
    { title: 'Day 2 — Art, History & Montmartre', stops: [
      { time: '09:00', name: 'Louvre Museum', type: 'Art — Mona Lisa & 35,000 works of art' },
      { time: '12:30', name: 'Tuileries Garden', type: 'Lunch — Relaxing stroll & café stop' },
      { time: '14:00', name: 'Notre-Dame Cathedral', type: 'History — Gothic masterpiece (exterior visit)' },
      { time: '15:30', name: 'Sainte-Chapelle', type: 'Architecture — Stunning 13th-century stained glass' },
      { time: '17:00', name: 'Sacré-Cœur & Montmartre', type: 'Culture — Artist quarter & basilica views' },
      { time: '19:00', name: 'Place du Tertre', type: 'Experience — Street artists & portrait painters' },
      { time: '20:30', name: 'Pink Mamma', type: 'Dinner — 4-story Italian restaurant, rooftop terrace' },
    ]},
  ], totalCost: '€420' },
  'tokyo': { name: 'Tokyo, Japan', currency: '¥', days: [
    { title: 'Day 1 — Tradition & Modernity', stops: [
      { time: '08:00', name: 'Tsukiji Outer Market', type: 'Breakfast — Fresh sushi & street food at dawn' },
      { time: '10:00', name: 'Senso-ji Temple', type: 'History — Tokyo\'s oldest temple in Asakusa' },
      { time: '12:00', name: 'Akihabara District', type: 'Culture — Electronics, anime & gaming paradise' },
      { time: '13:30', name: 'Ichiran Ramen', type: 'Lunch — Solo booth tonkotsu ramen experience' },
      { time: '15:00', name: 'Meiji Shrine', type: 'Spiritual — Forested shrine in Harajuku' },
      { time: '17:00', name: 'Shibuya Crossing', type: 'Experience — World\'s busiest pedestrian crossing' },
      { time: '19:00', name: 'Shinjuku Golden Gai', type: 'Nightlife — Tiny bars district with 200+ venues' },
    ]},
    { title: 'Day 2 — Culture & Views', stops: [
      { time: '09:00', name: 'TeamLab Borderless', type: 'Art — Immersive digital art museum' },
      { time: '11:30', name: 'Harajuku & Takeshita Street', type: 'Shopping — Youth fashion & kawaii culture' },
      { time: '13:00', name: 'Conveyor Belt Sushi', type: 'Lunch — Authentic kaiten-zushi experience' },
      { time: '14:30', name: 'Imperial Palace Gardens', type: 'Nature — Former Edo Castle grounds' },
      { time: '16:30', name: 'Tokyo Skytree', type: 'Views — 634m observation deck' },
      { time: '19:00', name: 'Roppongi Hills', type: 'Dinner — Sky-high dining with city views' },
    ]},
  ], totalCost: '¥85,000' },
  'rome': { name: 'Rome, Italy', currency: '€', days: [
    { title: 'Day 1 — Ancient Rome', stops: [
      { time: '08:30', name: 'Colosseum', type: 'History — Gladiatorial arena, built 70-80 AD' },
      { time: '10:30', name: 'Roman Forum', type: 'Ruins — Heart of ancient Roman public life' },
      { time: '12:30', name: 'Trattoria Da Enzo', type: 'Lunch — Best cacio e pepe in Trastevere' },
      { time: '14:30', name: 'Pantheon', type: 'Architecture — 2,000-year-old temple with perfect dome' },
      { time: '16:00', name: 'Trevi Fountain', type: 'Landmark — Baroque masterpiece, toss a coin' },
      { time: '17:30', name: 'Spanish Steps', type: 'Culture — Iconic staircase & Piazza di Spagna' },
      { time: '20:00', name: 'Roscioli', type: 'Dinner — Roman cuisine & exceptional wine cellar' },
    ]},
    { title: 'Day 2 — Vatican & Trastevere', stops: [
      { time: '08:00', name: 'Vatican Museums', type: 'Art — Sistine Chapel & Raphael Rooms' },
      { time: '11:00', name: 'St. Peter\'s Basilica', type: 'Architecture — World\'s largest church, climb the dome' },
      { time: '13:00', name: 'Pizzarium Bonci', type: 'Lunch — Best pizza al taglio in Rome' },
      { time: '14:30', name: 'Castel Sant\'Angelo', type: 'History — Fortress & panoramic views' },
      { time: '16:30', name: 'Trastevere Walk', type: 'Culture — Cobblestone streets & artisan shops' },
      { time: '18:00', name: 'Gianicolo Hill Sunset', type: 'Viewpoint — Best sunset spot in Rome' },
      { time: '20:30', name: 'Da Felice', type: 'Dinner — Legendary Roman-style trattoria' },
    ]},
  ], totalCost: '€350' },
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
  return {
    destination: destination,
    tripOverview: `Discover the best of ${cityName} with this curated professional itinerary.`,
    flights: { suggestion: `Direct flights to ${cityName} available from major hubs.`, averagePrice: '€150-300' },
    accommodation: { hotelName: `${cityName} Grand Hotel`, type: 'Boutique', reason: 'Central location with excellent reviews.' },
    days: Array.from({ length: Math.min(parseInt(numDays) || 2, 5) }, (_, i) => ({
      title: `Day ${i + 1} — Explore ${cityName}`,
      transportTip: 'Local public transport is highly efficient and recommended.',
      stops: [
        { time: '09:00', name: `Historic Center Walking Tour`, type: `Culture — Discover old town & main square`, isRestaurant: false },
        { time: '11:00', name: `${cityName} Main Cathedral/Temple`, type: `History — Iconic religious site`, isRestaurant: false },
        { time: '13:00', name: `Local Market & Street Food`, type: `Lunch — Authentic local cuisine`, isRestaurant: true },
        { time: '15:00', name: `${cityName} Museum of Art`, type: `Art — Regional masterpieces & exhibitions`, isRestaurant: false },
        { time: '17:00', name: `Panoramic Viewpoint`, type: `Views — Best sunset spot in ${cityName}`, isRestaurant: false },
        { time: '19:30', name: `Traditional Restaurant`, type: `Dinner — Locally recommended cuisine`, isRestaurant: true },
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
    'barcelona': "🇪🇸 **Barcelona** is pure energy! Must-sees:\n\n⛪ **Sagrada Família** — Book online in advance!\n🏖️ **Barceloneta** — Beach + chiringuitos\n🎨 **Park Güell** — Gaudí mosaics with a view\n🍷 **El Born** — Tapas crawl through local bars\n🌃 **Bunkers del Carmel** — Best secret view of BCN\n\n💡 *Tip*: Eat at local markets (La Boqueria, Santa Caterina) — it's cheaper and more authentic!",
    'tokyo': "🇯🇵 **Tokyo** — where the future meets tradition:\n\n⛩️ **Senso-ji** — Temple in Asakusa, go early morning\n🍣 **Tsukiji** — Fresh sushi at 7 AM\n🌸 **Meiji Shrine** — Oasis of peace in Harajuku\n🏙️ **Shibuya** — The most famous intersection in the world\n🎮 **Akihabara** — Gaming & anime paradise\n\n💡 *Tip*: Buy a Suica Card at the airport for all transport!",
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
    return "✈️ For cheap flights:\n\n• **Google Flights** — Best overall comparator\n• **Skyscanner** — Great for flexible destinations\n• **Ryanair / Wizz Air** — Low-cost in Europe\n• **Hopper** — Good for price prediction\n\n💡 *Tip*: Tuesday and Wednesday are the cheapest days to fly. Book 6-8 weeks in advance for the best price!";
  }
  if (lower.includes('cheap') || lower.includes('budget') || lower.includes('save') || lower.includes('money')) {
    return "💰 Tips to travel on a budget:\n\n1. **Travel in the off-season** (Sep-Nov, Feb-Apr)\n2. **Cook in your accommodation** — Save 40% on food\n3. **Public transport** — Never take taxis in the center\n4. **Free walking tours** — Tip-based, excellent\n5. **Tourist cards** — Often pay off\n6. **Tap water** — Safe in most of Europe\n\n💡 Average daily budget per person:\n• 🟢 Budget: €30-50/day\n• 🟡 Medium: €80-120/day\n• 🔴 Comfortable: €150-250/day";
  }
  if (lower.includes('bag') || lower.includes('pack') || lower.includes('luggage')) {
    return "🎒 Essential packing list:\n\n👕 **Clothes**: 3-4 t-shirts, 2 pants, 1 light jacket\n👟 **Shoes**: Comfortable sneakers + flip flops\n🧴 **Hygiene**: Travel size (<100ml for cabin)\n📱 **Tech**: Charger, universal adapter, powerbank\n📄 **Docs**: Passport, travel insurance, digital copies\n💊 **Health**: Basic first aid kit\n\n💡 *Golden rule*: If you don't know if you need it, don't bring it!";
  }
  
  // Default response
  return `Great question! 🤔\n\nI can help you with:\n\n🗺️ **Destinations** — Ask me about any city (e.g., "tell me about Lisbon")\n✈️ **Flights** — Tips to find cheap flights\n🏨 **Accommodation** — Where to stay anywhere\n💰 **Budget** — How to travel on a budget\n🎒 **Packing** — What to bring\n\nTry asking: *"What to visit in Barcelona?"* or *"How to save money traveling?"*`;
}
