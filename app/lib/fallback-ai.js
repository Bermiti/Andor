// Smart fallback data for when no AI API key is configured.
// This ensures the app ALWAYS works, even without an API key.

const destinationData = {
  'lisbon': { name: 'Lisbon, Portugal', currency: '€', days: [
    { title: 'Day 1 — Belém & History', stops: [
      { time: '09:00', name: 'Pastéis de Belém', type: 'Breakfast — Famous pastry shop since 1837' },
      { time: '10:30', name: 'Jerónimos Monastery', type: 'UNESCO World Heritage — Manueline masterpiece' },
      { time: '12:00', name: 'Torre de Belém', type: 'Landmark — 16th-century fortified tower' },
      { time: '13:30', name: 'Time Out Market', type: 'Lunch — Gourmet food hall with 40+ stalls' },
      { time: '15:30', name: 'MAAT Museum', type: 'Culture — Modern architecture & contemporary art' },
      { time: '18:00', name: 'Miradouro da Graça', type: 'Viewpoint — Stunning sunset panorama' },
      { time: '20:00', name: 'Taberna da Rua das Flores', type: 'Dinner — Traditional Portuguese tapas' },
    ]},
    { title: 'Day 2 — Alfama & Local Life', stops: [
      { time: '09:00', name: 'Café A Brasileira', type: 'Breakfast — Historic café in Chiado' },
      { time: '10:00', name: 'Alfama District Walking Tour', type: 'Culture — Oldest neighborhood, narrow streets' },
      { time: '11:30', name: 'Sé de Lisboa Cathedral', type: 'History — 12th-century Romanesque cathedral' },
      { time: '13:00', name: 'Mercado da Ribeira', type: 'Lunch — Fresh seafood & local produce' },
      { time: '15:00', name: 'Tram 28 Ride', type: 'Experience — Iconic yellow tram through the hills' },
      { time: '16:30', name: 'LX Factory', type: 'Shopping — Creative hub with boutiques & street art' },
      { time: '19:00', name: 'Bairro Alto', type: 'Nightlife — Fado music & rooftop bars' },
    ]},
    { title: 'Day 3 — Sintra Day Trip', stops: [
      { time: '08:30', name: 'Train to Sintra (40 min)', type: 'Transport — Rossio Station departure' },
      { time: '10:00', name: 'Palácio da Pena', type: 'UNESCO — Colorful Romanticist castle on a hilltop' },
      { time: '12:30', name: 'Quinta da Regaleira', type: 'Gardens — Initiation Well & mystical grounds' },
      { time: '14:00', name: 'Tascantiga', type: 'Lunch — Traditional cuisine in Sintra village' },
      { time: '15:30', name: 'Cabo da Roca', type: 'Nature — Westernmost point of mainland Europe' },
      { time: '17:30', name: 'Cascais Beach Walk', type: 'Relax — Coastal town & sunset by the sea' },
      { time: '20:00', name: 'Cervejaria Ramiro', type: 'Dinner — Best seafood restaurant in Lisbon' },
    ]},
  ], totalCost: '€380' },
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
    days: Array.from({ length: Math.min(parseInt(numDays) || 2, 5) }, (_, i) => ({
      title: `Day ${i + 1} — Explore ${cityName}`,
      stops: [
        { time: '09:00', name: `Historic Center Walking Tour`, type: `Culture — Discover old town & main square` },
        { time: '11:00', name: `${cityName} Main Cathedral/Temple`, type: `History — Iconic religious site` },
        { time: '13:00', name: `Local Market & Street Food`, type: `Lunch — Authentic local cuisine` },
        { time: '15:00', name: `${cityName} Museum of Art`, type: `Art — Regional masterpieces & exhibitions` },
        { time: '17:00', name: `Panoramic Viewpoint`, type: `Views — Best sunset spot in ${cityName}` },
        { time: '19:30', name: `Traditional Restaurant`, type: `Dinner — Locally recommended cuisine` },
      ],
    })),
    totalCost: budget ? `€${budget}` : '€250',
  };
}

// Smart chat responses
const chatKnowledge = {
  greetings: [
    "Olá! 👋 Sou o teu assistente de viagem Andor. Em que posso ajudar? Posso sugerir destinos, dar dicas sobre qualquer cidade, ou ajudar-te a planear a tua próxima aventura!",
  ],
  destinations: {
    'lisboa': "🇵🇹 **Lisboa** é absolutamente incrível! Recomendo:\n\n🏛️ **Belém** — Pastéis de Belém + Jerónimos (manhã)\n🚃 **Tram 28** — Percurso icónico pelas colinas\n🌅 **Miradouro da Graça** — Melhor pôr do sol\n🎵 **Fado em Alfama** — Experiência obrigatória à noite\n🍽️ **Time Out Market** — Para comer de tudo\n\n💡 *Dica*: Compra o Lisboa Card (€27/24h) para transportes ilimitados e entradas grátis!",
    'porto': "🇵🇹 **Porto** é mágico! Não percas:\n\n🍷 **Caves do Vinho do Porto** — Provas em Vila Nova de Gaia\n📚 **Livraria Lello** — Uma das mais bonitas do mundo\n🌉 **Ponte D. Luís I** — Vista incrível das duas margens\n🏖️ **Foz do Douro** — Passeio à beira-mar ao pôr do sol\n🍽️ **Francesinha** — O prato típico que TENS de provar\n\n💡 *Dica*: O cruzeiro das 6 pontes (€15) é espetacular!",
    'paris': "🇫🇷 **Paris** — a cidade luz! Os essenciais:\n\n🗼 **Tour Eiffel** — Ao pôr do sol é mágico\n🎨 **Musée d'Orsay** — Melhor que o Louvre para Impressionismo\n🥐 **Le Marais** — Bairro trendy com os melhores croissants\n⛪ **Sacré-Cœur** — Montmartre ao entardecer\n🛥️ **Cruzeiro no Sena** — À noite, com a cidade iluminada\n\n💡 *Dica*: O Museum Pass (€52/2 dias) dá acesso a 50+ museus!",
    'barcelona': "🇪🇸 **Barcelona** é energia pura! Imperdíveis:\n\n⛪ **Sagrada Família** — Reserva online com antecedência!\n🏖️ **Barceloneta** — Praia + chiringuitos\n🎨 **Park Güell** — Mosaicos de Gaudí com vista\n🍷 **El Born** — Tapas crawl pelos bares locais\n🌃 **Bunkers del Carmel** — Melhor vista secreta de BCN\n\n💡 *Dica*: Come nos mercados locais (La Boqueria, Santa Caterina) — é mais barato e autêntico!",
    'tokyo': "🇯🇵 **Tóquio** — onde o futuro encontra a tradição:\n\n⛩️ **Senso-ji** — Templo em Asakusa, vai de manhã cedo\n🍣 **Tsukiji** — Sushi fresco às 7 da manhã\n🌸 **Meiji Shrine** — Oásis de paz em Harajuku\n🏙️ **Shibuya** — O cruzamento mais famoso do mundo\n🎮 **Akihabara** — Paraíso gaming & anime\n\n💡 *Dica*: Compra o Suica Card no aeroporto para todos os transportes!",
  },
};

export function generateChatResponse(message) {
  const lower = message.toLowerCase();
  
  // Check for destination mentions
  for (const [key, response] of Object.entries(chatKnowledge.destinations)) {
    if (lower.includes(key)) return response;
  }
  
  // Common questions
  if (lower.includes('olá') || lower.includes('ola') || lower.includes('hey') || lower.includes('hi') || lower.includes('bom dia') || lower.includes('boa tarde')) {
    return chatKnowledge.greetings[0];
  }
  if (lower.includes('hotel') || lower.includes('ficar') || lower.includes('alojamento') || lower.includes('dormir')) {
    return "🏨 Para alojamento, recomendo:\n\n• **Booking.com** — Melhor para hotéis com cancelamento grátis\n• **Hostelworld** — Se procuras hostels e socializar\n• **Airbnb** — Para estadias mais longas ou grupos\n\n💡 *Dica*: Reserva com 2-3 meses de antecedência para melhores preços. Em época alta (Jul-Ago), reserva com 4-6 meses!";
  }
  if (lower.includes('voo') || lower.includes('avião') || lower.includes('aviao') || lower.includes('flight') || lower.includes('voar')) {
    return "✈️ Para voos baratos:\n\n• **Google Flights** — Melhor comparador geral\n• **Skyscanner** — Ótimo para destinos flexíveis\n• **Ryanair / Wizz Air** — Low-cost na Europa\n• **TAP** — Promoções frequentes para PT\n\n💡 *Dica*: Terça e quarta são os dias mais baratos para voar. Reserva 6-8 semanas antes para melhor preço!";
  }
  if (lower.includes('barato') || lower.includes('budget') || lower.includes('poupar') || lower.includes('dinheiro')) {
    return "💰 Dicas para viajar barato:\n\n1. **Viaja em época baixa** (Set-Nov, Fev-Abr)\n2. **Cozinha nas acomodações** — Poupa 40% em comida\n3. **Transportes públicos** — Nunca táxis no centro\n4. **Free walking tours** — Tip-based, excelentes\n5. **Cartões turísticos** — Muitas vezes compensam\n6. **Água da torneira** — Na maioria da Europa é segura\n\n💡 Orçamento diário médio por pessoa:\n• 🟢 Budget: €30-50/dia\n• 🟡 Médio: €80-120/dia\n• 🔴 Confortável: €150-250/dia";
  }
  if (lower.includes('mala') || lower.includes('levar') || lower.includes('pack')) {
    return "🎒 Lista de bagagem essencial:\n\n👕 **Roupa**: 3-4 t-shirts, 2 calças, 1 casaco leve\n👟 **Calçado**: Ténis confortáveis + chinelos\n🧴 **Higiene**: Tamanho viagem (<100ml para cabine)\n📱 **Tech**: Carregador, adaptador universal, powerbank\n📄 **Docs**: Passaporte, seguro viagem, cópias digitais\n💊 **Saúde**: Kit primeiros socorros básico\n\n💡 *Regra de ouro*: Se não sabes se precisas, não levas!";
  }
  
  // Default response
  return `Boa pergunta! 🤔\n\nPosso ajudar-te com:\n\n🗺️ **Destinos** — Pergunta-me sobre qualquer cidade (ex: "fala-me de Lisboa")\n✈️ **Voos** — Dicas para encontrar voos baratos\n🏨 **Alojamento** — Onde ficar em qualquer destino\n💰 **Budget** — Como viajar com pouco dinheiro\n🎒 **O que levar** — Checklist de bagagem\n\nExperimenta perguntar: *"O que visitar em Barcelona?"* ou *"Como poupar dinheiro a viajar?"*`;
}
