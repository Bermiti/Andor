/**
 * Itinerary Enricher - Transforms AI-generated itinerary into full-featured structure
 * Ensures all components have data even when AI response is incomplete
 */

export function enrichItinerary(rawItinerary) {
  if (!rawItinerary || typeof rawItinerary !== 'object') {
    return createMinimalItinerary('Unknown Destination');
  }

  const dest = rawItinerary.destination || {};
  const trip = rawItinerary.trip || {};
  const days = rawItinerary.days || [];

  // Core data
  const enriched = {
    destination: {
      name: dest.name || dest.city || 'Unknown',
      city: dest.city || dest.name || 'Unknown',
      country: dest.country || 'Unknown',
      coordinates: dest.coordinates || [0, 0],
      timezone: dest.timezone || 'UTC',
      currency: dest.currency || { code: 'EUR', symbol: '€' },
      ...dest,
    },
    trip: {
      startDate: trip.startDate || new Date().toISOString().split('T')[0],
      endDate: trip.endDate || new Date().toISOString().split('T')[0],
      totalDays: trip.totalDays || days.length || 1,
      travelStyle: trip.travelStyle || 'balanced',
      budget: trip.budget || { min: 500, max: 2000, estimated: 1200, currency: 'EUR' },
      travelers: trip.travelers || 1,
      ...trip,
    },
    days: enrichDays(days, trip.totalDays || days.length || 1),
    
    // Structured components for UI
    flights: enrichFlights(rawItinerary.flights),
    accommodation: enrichAccommodation(rawItinerary.accommodation),
    airportTransfer: enrichAirportTransfer(rawItinerary.airportTransfer),
    localTransport: enrichLocalTransport(rawItinerary.localTransport),
    budgetScenarios: enrichBudgetScenarios(rawItinerary.budget || trip.budget),
    bookingChecklist: enrichBookingChecklist(rawItinerary.bookingChecklist),
    warnings: enrichWarnings(rawItinerary.warnings),
    
    // Metadata
    metadata: {
      generatedAt: new Date().toISOString(),
      source: 'andor-ai',
      version: '2.0',
      ...rawItinerary.metadata,
    },
  };

  return enriched;
}

function enrichDays(days, totalDays) {
  if (!Array.isArray(days) || days.length === 0) {
    return generatePlaceholderDays(totalDays);
  }

  return days.map((day, idx) => ({
    dayNumber: day.dayNumber || idx + 1,
    title: day.title || `Dia ${idx + 1}`,
    theme: day.theme || 'Exploration',
    emoji: day.emoji || '📍',
    stops: (day.stops || day.activities || []).map(stop => ({
      name: stop.name || 'Unnamed Stop',
      type: stop.type || 'attraction',
      description: stop.description || '',
      time: stop.time || '10:00',
      duration: stop.duration || '2h',
      cost: stop.cost || 0,
      coordinates: stop.coordinates || [0, 0],
      bookingRequired: stop.bookingRequired || false,
      emoji: stop.emoji || '📍',
    })),
    meals: enrichMeals(day.meals),
    transport: day.transport || { type: 'walk', duration: '30min', cost: 0 },
    budgetEstimate: calculateDayBudget(day),
    highlights: day.highlights || [],
    localSecret: day.localSecret || day.localTip || '',
    culturalNote: day.culturalNote || '',
  }));
}

function enrichMeals(meals) {
  return {
    breakfast: meals?.breakfast || {
      name: 'Café da manhã local',
      cuisine: 'Local',
      price: '€5-8',
      note: 'A descobrir',
    },
    lunch: meals?.lunch || {
      name: 'Almoço típico',
      cuisine: 'Local',
      price: '€10-15',
      note: 'A descobrir',
    },
    dinner: meals?.dinner || {
      name: 'Jantar especial',
      cuisine: 'Local',
      price: '€15-25',
      note: 'A descobrir',
    },
  };
}

function calculateDayBudget(day) {
  let total = 0;
  if (day.stops) {
    day.stops.forEach(s => {
      total += typeof s.cost === 'number' ? s.cost : parseFloat(s.cost) || 0;
    });
  }
  if (day.meals) {
    ['breakfast', 'lunch', 'dinner'].forEach(m => {
      const price = day.meals[m]?.price || '€0';
      const num = parseFloat(price.replace('€', '').split('-')[0]) || 0;
      total += num;
    });
  }
  return total;
}

function enrichFlights(flights) {
  if (flights && flights.options && Array.isArray(flights.options) && flights.options.length > 0) {
    return flights;
  }

  return {
    overview: 'Opções de voos não geradas — utiliza Google Flights, Skyscanner ou Kayak para consultar preços actualizados',
    options: [
      {
        tier: 'economical',
        name: 'Económica',
        airline: 'Diversos',
        estimatedCost: 200,
        outbound: '08:00 - 16:30',
        return: '10:00 - 18:30',
        duration: '6-8 horas com escalas',
        stops: 1,
        advantages: ['Preço mais acessível', 'Múltiplas opções de datas'],
        disadvantages: ['Escalas, chegada tarde', 'Bagagem pode ter custo extra'],
        description: 'Voos com escalas — ideal para viajantes com orçamento limitado',
        bestFor: 'Viajantes com orçamento flexível',
      },
      {
        tier: 'balanced',
        name: 'Equilibrada',
        airline: 'TAP/Lufthansa',
        estimatedCost: 350,
        outbound: '09:00 - 18:00',
        return: '11:00 - 19:00',
        duration: '5-6 horas (direto/1 escala)',
        stops: 0,
        advantages: ['Bom preço-benefício', 'Sem escalas ou poucas escalas', 'Horários bons'],
        disadvantages: ['Menos flexibilidade de datas'],
        description: 'Equilíbrio perfeito entre preço e comodidade',
        bestFor: 'Viajantes que querem qualidade e preço',
      },
      {
        tier: 'comfortable',
        name: 'Premium',
        airline: 'TAP/Air Europa',
        estimatedCost: 500,
        outbound: '10:00 - 19:00',
        return: '12:00 - 21:00',
        duration: '5 horas (direto)',
        stops: 0,
        advantages: ['Horários ideais', 'Diretos', 'Bagagem incluída', 'Conforto premium'],
        disadvantages: ['Preço mais elevado', 'Menos flexibilidade'],
        description: 'Voos premium com máximo conforto e conveniência',
        bestFor: 'Viajantes que valorizam conforto e tempo',
      },
    ],
    externalLinks: {
      googleFlights: 'https://www.google.com/flights',
      skyscanner: 'https://www.skyscanner.pt',
      kayak: 'https://www.kayak.pt',
    },
  };
}

function enrichAccommodation(accommodation) {
  if (accommodation && accommodation.hotels && Array.isArray(accommodation.hotels)) {
    return accommodation;
  }

  return {
    overview: 'Recomendações de alojamento conforme o teu perfil e orçamento',
    recommendedArea: 'Centro Histórico',
    whyRecommended: 'Localização central, fácil acesso a transporte e atracções principais. Perfeito para primeira viagem.',
    hotels: [
      {
        tier: 'economical',
        name: 'Budget-Friendly',
        type: 'Hostel / Guesthouse com Character',
        pricePerNight: '€30-50',
        stars: 3,
        examples: 'Hostels centrais, pousadas familiares',
        advantages: ['Muito acessível', 'Ambiente social', 'Flexível'],
        disadvantages: ['Compartilhado', 'Menos privacidade'],
        bookingLink: 'https://www.booking.com',
      },
      {
        tier: 'boutique',
        name: 'Mid-Range',
        type: 'Hotel 3-4 Estrelas com Soul',
        pricePerNight: '€70-120',
        stars: 4,
        examples: 'Hotels locais, não correntes genéricas',
        advantages: ['Bom equilíbrio', 'Personalizado', 'Bom staff'],
        disadvantages: ['Menos premium', 'Pode estar perto de rua barulhenta'],
        bookingLink: 'https://www.booking.com',
      },
      {
        tier: 'premium',
        name: 'Premium',
        type: 'Hotel 5 Estrelas / Luxury Boutique',
        pricePerNight: '€150-300',
        stars: 5,
        examples: 'Hotels especiais e memoráveis',
        advantages: ['Luxo', 'Experiência única', 'Serviço impecável'],
        disadvantages: ['Investimento maior', 'Pode parecer demasiado formal'],
        bookingLink: 'https://www.booking.com',
      },
    ],
    alternativeAreas: [
      {
        name: 'Zona Moderna',
        distance: '15-20 minutos a pé',
        vibe: 'Contemporâneo, cafés, mais local',
        pros: ['Menos turístico', 'Cafés modernos', 'Atmosphere local'],
        cons: ['Precisa transporte', 'Menos atracções walking-distance'],
      },
      {
        name: 'Zona de Praia',
        distance: '30-40 minutos',
        vibe: 'Relaxado, beira-mar',
        pros: ['Praia perto', 'Muito calmo', 'Óptimo para relaxar'],
        cons: ['Longe do centro', 'Menos vida nocturna'],
      },
    ],
    externalLinks: {
      booking: 'https://www.booking.com',
      googleHotels: 'https://hotels.google.com',
      airbnb: 'https://www.airbnb.com',
    },
  };
}

function enrichAirportTransfer(transfer) {
  if (transfer && transfer.options && Array.isArray(transfer.options)) {
    return transfer;
  }

  return {
    options: [
      {
        tier: 'economical',
        name: 'Autocarro Público',
        duration: '45-60min',
        cost: '€3-5',
        pros: ['Muito barato', 'Autêntico'],
        cons: ['Lento', 'Luggage complexo'],
        steps: ['Compra bilhete na estação', 'Espera pela linha certa', 'Desce na estação final'],
        apps: ['Google Maps', 'App local de transportes'],
        warnings: ['Pode estar lotado', 'Atrasos frequentes'],
      },
      {
        tier: 'balanced',
        name: 'Táxi / Uber',
        duration: '25-35min',
        cost: '€20-35',
        pros: ['Rápido', 'Door-to-door', 'Confortável'],
        cons: ['Preço variável', 'Picos de hora-de-ponta'],
        steps: ['Pede no aeroporto ou app', 'Confirma rota', 'Paga com cartão'],
        apps: ['Uber', 'Bolt', 'Táxi local'],
        warnings: ['Taxistas deshonestos', 'Peak time caro'],
      },
      {
        tier: 'comfortable',
        name: 'Transfer Pré-reservado',
        duration: '30-40min',
        cost: '€35-50',
        pros: ['Seguro', 'Sem espera', 'Profissional'],
        cons: ['Preço premium', 'Menos flexível'],
        steps: ['Reserva com antecedência', 'Levantam sinal com nome', 'Carro à espera'],
        apps: ['GetYourGuide', 'Booking.com'],
        warnings: ['Cancela com antecedência se necessário'],
      },
    ],
  };
}

function enrichLocalTransport(transport) {
  if (transport && transport.passes) {
    return transport;
  }

  return {
    passes: [
      {
        name: 'Bilhete Único (Dia)',
        cost: '€6-8',
        validFor: '1 dia (24h)',
        includes: ['Metro', 'Autocarro', 'Comboio'],
        worthIt: 'Sim, se usares +3 vezes',
      },
      {
        name: '7-Day Card',
        cost: '€25-35',
        validFor: '7 dias corridos',
        includes: ['Metro', 'Autocarro', 'Comboio', 'Elétricos'],
        worthIt: 'Recomendado para estadias médias',
      },
    ],
    apps: [
      {
        name: 'Google Maps',
        icon: '🗺️',
        use: 'Rotas, tempo real, integração com transportes',
      },
      {
        name: 'Local Transit App',
        icon: '🚌',
        use: 'Horários precisos, alertas de atrasos',
      },
      {
        name: 'Taxi App',
        icon: '🚕',
        use: 'Táxi, Uber, Bolt conforme país',
      },
    ],
    modes: [
      { type: 'Metro', best: 'Rotas longas, rápidas', cost: '€1-2', coverage: 'Centro' },
      { type: 'Autocarro', best: 'Ver a cidade', cost: '€1-2', coverage: 'Todo', },
      { type: 'Comboio', best: 'Aeroporto, cidades próximas', cost: '€3-10', coverage: 'Região' },
      { type: 'Táxi/Uber', best: 'Noite, muitos volumes', cost: '€10-30', coverage: 'Toda' },
      { type: 'A pé', best: 'Centro, exploração', cost: 'Grátis', coverage: 'Centro histórico' },
    ],
    tips: [
      'Compra pass se fico 3+ dias',
      'Google Maps tem tempo real',
      'Anda a pé pelas ruas pequenas',
      'Transportes noturnos mais caros',
      'Evita hora de ponta (07:00-09:00, 17:00-19:00)',
    ],
  };
}

function enrichBudgetScenarios(budget) {
  if (budget && budget.scenarios && budget.scenarios.length > 0) {
    return budget;
  }

  const totalBudget = budget?.total || budget?.estimated || 1200;

  return {
    total: totalBudget,
    perDay: Math.round(totalBudget / 5),
    scenarios: [
      {
        name: 'Económica',
        total: Math.round(totalBudget * 0.7),
        breakdown: {
          flights: Math.round(totalBudget * 0.25),
          accommodation: Math.round(totalBudget * 0.25),
          food: Math.round(totalBudget * 0.15),
          activities: Math.round(totalBudget * 0.10),
          transport: Math.round(totalBudget * 0.08),
          misc: Math.round(totalBudget * 0.02),
        },
      },
      {
        name: 'Equilibrada',
        total: totalBudget,
        breakdown: {
          flights: Math.round(totalBudget * 0.30),
          accommodation: Math.round(totalBudget * 0.30),
          food: Math.round(totalBudget * 0.20),
          activities: Math.round(totalBudget * 0.12),
          transport: Math.round(totalBudget * 0.05),
          misc: Math.round(totalBudget * 0.03),
        },
      },
      {
        name: 'Premium',
        total: Math.round(totalBudget * 1.4),
        breakdown: {
          flights: Math.round(totalBudget * 0.35),
          accommodation: Math.round(totalBudget * 0.40),
          food: Math.round(totalBudget * 0.15),
          activities: Math.round(totalBudget * 0.15),
          transport: Math.round(totalBudget * 0.08),
          misc: Math.round(totalBudget * 0.02),
        },
      },
    ],
  };
}

function enrichBookingChecklist(checklist) {
  if (checklist && Array.isArray(checklist) && checklist.length > 0) {
    return checklist;
  }

  return [
    { category: 'Crítico', task: 'Passaporte válido (6+ meses)', daysAhead: 30, priority: 1 },
    { category: 'Crítico', task: 'Voos reservados', daysAhead: 45, priority: 1 },
    { category: 'Crítico', task: 'Alojamento reservado', daysAhead: 30, priority: 1 },
    { category: 'Importante', task: 'Seguro de viagem', daysAhead: 20, priority: 2 },
    { category: 'Importante', task: 'Transfer aeroporto', daysAhead: 7, priority: 2 },
    { category: 'Importante', task: 'Reservas de restaurantes', daysAhead: 14, priority: 2 },
    { category: 'Nice-to-have', task: 'Cartão internacional', daysAhead: 10, priority: 3 },
    { category: 'Nice-to-have', task: 'Converter moeda', daysAhead: 3, priority: 3 },
  ];
}

function enrichWarnings(warnings) {
  if (warnings && Array.isArray(warnings) && warnings.length > 0) {
    return warnings;
  }

  return [
    {
      type: 'scams',
      title: 'Scams Comuns',
      items: [
        'Táxis sem taxímetro — sempre pede táxi oficial',
        'Restaurantes "recomendados" — são armadilhas turísticas',
        'Câmbio falsificado — só troca no banco',
      ],
    },
    {
      type: 'safety',
      title: 'Segurança',
      items: [
        'Evita bairros X após as 22:00',
        'Bolsa junto ao corpo em multidões',
        'Cuidado com carteiristas em transportes',
      ],
    },
    {
      type: 'practical',
      title: 'Dicas Práticas',
      items: [
        'Muitos locais fecham entre 14:00-18:00',
        'Domingo: muitos museus/lojas fechados',
        'Leva moedas para máquinas de bilhetes',
      ],
    },
  ];
}

function generatePlaceholderDays(totalDays) {
  return Array.from({ length: totalDays }, (_, i) => ({
    dayNumber: i + 1,
    title: `Dia ${i + 1}`,
    theme: 'Exploração',
    emoji: '📍',
    stops: [
      {
        name: 'Manhã — Exploração',
        type: 'exploration',
        description: 'A descobrir',
        time: '09:00',
        duration: '3h',
        cost: 0,
        coordinates: [0, 0],
        bookingRequired: false,
        emoji: '🌅',
      },
      {
        name: 'Almoço',
        type: 'food',
        description: 'Culinária local',
        time: '13:00',
        duration: '1.5h',
        cost: 15,
        coordinates: [0, 0],
        bookingRequired: false,
        emoji: '🍽️',
      },
      {
        name: 'Tarde — Atividades',
        type: 'activity',
        description: 'A descobrir',
        time: '15:00',
        duration: '3h',
        cost: 20,
        coordinates: [0, 0],
        bookingRequired: false,
        emoji: '🎭',
      },
      {
        name: 'Jantar',
        type: 'food',
        description: 'Experiência local',
        time: '19:30',
        duration: '2h',
        cost: 25,
        coordinates: [0, 0],
        bookingRequired: false,
        emoji: '🍷',
      },
    ],
    meals: enrichMeals({}),
    transport: { type: 'walk', duration: '30min', cost: 0 },
    budgetEstimate: 60,
    highlights: ['A descobrir'],
    localSecret: 'Pergunta aos locais sobre os seus segredos favoritos',
    culturalNote: 'Respeita as tradições e costumes locais',
  }));
}

function createMinimalItinerary(destination) {
  return {
    destination: {
      name: destination,
      city: destination,
      country: 'Unknown',
      coordinates: [0, 0],
      timezone: 'UTC',
      currency: { code: 'EUR', symbol: '€' },
    },
    trip: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      totalDays: 1,
      travelStyle: 'balanced',
      budget: { min: 500, max: 2000, estimated: 1200, currency: 'EUR' },
      travelers: 1,
    },
    days: generatePlaceholderDays(1),
    flights: enrichFlights(null),
    accommodation: enrichAccommodation(null),
    airportTransfer: enrichAirportTransfer(null),
    localTransport: enrichLocalTransport(null),
    budgetScenarios: enrichBudgetScenarios(null),
    bookingChecklist: enrichBookingChecklist(null),
    warnings: enrichWarnings(null),
    metadata: {
      generatedAt: new Date().toISOString(),
      source: 'fallback',
      version: '2.0',
    },
  };
}
