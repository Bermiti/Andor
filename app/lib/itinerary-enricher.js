/**
 * Itinerary Enricher - Transforms AI-generated itinerary into full-featured structure
 * Ensures all components have data even when AI response is incomplete
 */

const DESTINATION_COORDINATES = {
  tokyo: [35.6762, 139.6503],
  paris: [48.8566, 2.3522],
  bali: [-8.4095, 115.1889],
  lisbon: [38.7223, -9.1393],
  lisboa: [38.7223, -9.1393],
  london: [51.5074, -0.1278],
  nyc: [40.7128, -74.006],
  'new york': [40.7128, -74.006],
  barcelona: [41.3874, 2.1686],
  rome: [41.9028, 12.4964],
  roma: [41.9028, 12.4964],
  amsterdam: [52.3676, 4.9041],
  marrakech: [31.6295, -7.9811],
  marrakesh: [31.6295, -7.9811],
  kyoto: [35.0116, 135.7681],
  osaka: [34.6937, 135.5023],
  porto: [41.1579, -8.6291],
  madrid: [40.4168, -3.7038],
  berlin: [52.52, 13.405],
};

function fallbackCoordinates(destination = '') {
  const value = String(destination || '').toLowerCase();
  const match = Object.entries(DESTINATION_COORDINATES).find(([name]) => value.includes(name));
  return match ? [...match[1]] : [38.7223, -9.1393];
}

function safeCoordinates(value, destination = '', offset = 0) {
  if (Array.isArray(value) && value.length >= 2) {
    const lat = Number(value[0]);
    const lng = Number(value[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
      return [lat, lng];
    }
  }

  const [lat, lng] = fallbackCoordinates(destination);
  return [Number((lat + offset * 0.004).toFixed(6)), Number((lng + offset * 0.004).toFixed(6))];
}

function cleanText(value, fallback = '') {
  const result = value == null ? '' : String(value).trim();
  return result || fallback;
}

function numberOr(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function inferPeriod(stop = {}, index = 0) {
  const explicit = cleanText(stop.period || stop.dayPeriod || '').toLowerCase();
  if (['morning', 'afternoon', 'evening', 'night'].includes(explicit)) {
    return explicit === 'night' ? 'evening' : explicit;
  }

  const time = cleanText(stop.startTime || stop.time || stop.hour);
  const hour = Number((time.match(/\d{1,2}/) || [])[0]);
  if (Number.isFinite(hour)) {
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  if (index === 0) return 'morning';
  if (index === 1) return 'afternoon';
  return 'evening';
}

function normalizeStopTransport(value, isFirstStop) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    ...source,
    mode: cleanText(source.mode || source.type, isFirstStop ? 'walk' : 'public transport'),
    line: cleanText(source.line, isFirstStop ? 'hotel start' : 'direct route'),
    duration: cleanText(source.duration || source.estimatedDuration, isFirstStop ? '10 min' : '18 min'),
    cost: numberOr(source.cost || source.estimatedCost, 0),
    directions: cleanText(
      source.directions || source.note,
      isFirstStop ? 'Start from the recommended base area.' : 'Travel directly from the previous stop.'
    ),
  };
}

function collectStopsFromPeriods(day) {
  const periods = day?.periods && typeof day.periods === 'object' ? day.periods : {};
  return ['morning', 'afternoon', 'evening']
    .flatMap((periodKey) => {
      const activities = Array.isArray(periods[periodKey]?.activities)
        ? periods[periodKey].activities
        : [];
      return activities.map((activity) => ({ ...activity, period: activity.period || periodKey }));
    });
}

function normalizeActivityStop(stop, stopIdx, dayIdx, destinationName) {
  const source = stop && typeof stop === 'object' ? stop : { name: stop };
  const name = cleanText(source.name || source.title, `Stop ${stopIdx + 1}`);
  const type = cleanText(source.type || source.category, 'experience');
  const cost = numberOr(source.cost ?? source.estimatedCost ?? source.price, 0);
  const period = inferPeriod(source, stopIdx);
  const startTime = cleanText(source.startTime || source.time || source.hour, stopIdx === 0 ? '09:30' : stopIdx === 1 ? '14:00' : '19:00');

  return {
    ...source,
    id: cleanText(source.id, `d${dayIdx + 1}-a${stopIdx + 1}`),
    name,
    title: source.title || name,
    type,
    category: cleanText(source.category || source.type, type),
    description: cleanText(source.description || source.summary, ''),
    address: cleanText(source.address || source.location || source.area, destinationName),
    time: cleanText(source.time || source.startTime, startTime),
    startTime,
    bestTime: cleanText(source.bestTime || source.bestTimeToGo || source.timeRecommendation, startTime),
    duration: cleanText(source.duration || source.estimatedDuration, '90 min'),
    durationMinutes: numberOr(source.durationMinutes, numberOr(source.duration, 90)),
    cost,
    estimatedCost: source.estimatedCost ?? cost,
    priceRange: cleanText(source.priceRange || source.estimatedPriceRange, cost > 0 ? `${cost}` : 'Free'),
    currency: source.currency || 'EUR',
    coordinates: safeCoordinates(source.coordinates || source.coords || source.location, destinationName, stopIdx + dayIdx),
    bookingRequired: Boolean(source.bookingRequired || source.reservationRequired),
    reservationRequired: source.reservationRequired ?? Boolean(source.bookingRequired),
    bookingUrl: source.bookingUrl || source.booking || source.ticketUrl || null,
    bookingTip: cleanText(source.bookingTip || source.reservationNote, ''),
    rating: numberOr(source.rating, 4.6),
    crowd: cleanText(source.crowd || source.crowdLevel, 'moderate'),
    emoji: cleanText(source.emoji, 'pin'),
    period,
    photoKeyword: cleanText(source.photoKeyword, `${name} ${destinationName} ${type}`),
    insiderTip: cleanText(
      source.insiderTip || source.localTip || source.localSecret,
      `Confirm the best entrance or quietest time for ${name} before leaving the hotel.`
    ),
    localTip: cleanText(source.localTip || source.insiderTip || source.localSecret, ''),
    whyMatters: cleanText(
      source.whyMatters || source.whyItFits || source.reason || source.description,
      `${name} is included because it anchors this part of the route in ${destinationName} without unnecessary backtracking.`
    ),
    backupOption: cleanText(source.backupOption || source.backup || source.skipIf, `If ${name} is unavailable, keep this slot in the same area and choose a nearby indoor alternative.`),
    practicalNote: cleanText(source.practicalNote || source.note || source.crowdTip, 'Check opening hours and ticket rules the day before.'),
    transportFromPrevious: normalizeStopTransport(source.transportFromPrevious || source.transport, stopIdx === 0),
    coordinateSource: source.coordinateSource || 'ai',
    source: source.source || 'ai',
  };
}

function buildEnrichedPeriods(day, stops) {
  const existing = day?.periods && typeof day.periods === 'object' ? day.periods : {};
  const periodDefaults = {
    morning: '09:00 - 12:00',
    afternoon: '13:00 - 17:00',
    evening: '18:00 - 22:00',
  };

  return Object.fromEntries(
    Object.entries(periodDefaults).map(([periodKey, timeRange]) => {
      const period = existing[periodKey] || {};
      return [
        periodKey,
        {
          ...period,
          title: period.title || period.label || periodKey,
          timeRange: period.timeRange || period.time || timeRange,
          activities: stops.filter((stop) => stop.period === periodKey),
        },
      ];
    })
  );
}

export function enrichItinerary(rawItinerary) {
  if (!rawItinerary || typeof rawItinerary !== 'object') {
    return createMinimalItinerary('Unknown Destination');
  }

  let dest = rawItinerary.destination || {};
  if (typeof dest === 'string') {
    dest = { 
      name: dest, 
      city: dest.split(',')[0].trim(), 
      country: dest.split(',')[1]?.trim() || 'Unknown' 
    };
  }
  const trip = rawItinerary.trip || {};
  const days = rawItinerary.days || [];
  const destinationName = dest.city || dest.name || 'Unknown';
  const destinationCoordinates = safeCoordinates(dest.coordinates, destinationName);

  // Core data
  const enriched = {
    ...rawItinerary,
    destination: {
      name: dest.name || dest.city || 'Unknown',
      city: destinationName,
      country: dest.country || 'Unknown',
      coordinates: destinationCoordinates,
      timezone: dest.timezone || 'UTC',
      currency: dest.currency || { code: 'EUR', symbol: '€' },
      ...dest,
      coordinates: destinationCoordinates,
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
    days: enrichStructuredDays(days, trip.totalDays || days.length || 1, destinationName, destinationCoordinates),
    
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
      enrichmentStatus: rawItinerary.metadata?.enrichmentStatus || 'pending',
      ...rawItinerary.metadata,
    },
  };

  return enriched;
}

function enrichStructuredDays(days, totalDays, destinationName, destinationCoordinates) {
  if (!Array.isArray(days) || days.length === 0) {
    return generateFallbackDays(totalDays, destinationName, destinationCoordinates);
  }

  return days.map((day, idx) => {
    const sourceStops = Array.isArray(day.stops) && day.stops.length > 0
      ? day.stops
      : Array.isArray(day.activities) && day.activities.length > 0
        ? day.activities
        : collectStopsFromPeriods(day);
    const stops = sourceStops.map((stop, stopIdx) => normalizeActivityStop(stop, stopIdx, idx, destinationName));
    const periods = buildEnrichedPeriods(day, stops);

    return {
      ...day,
      dayNumber: day.dayNumber || idx + 1,
      title: day.title || [`First Light Route`, `Markets and Memory`, `Waterfront Pause`, `Last Local Notes`][idx % 4],
      theme: day.theme || 'Local route',
      emoji: day.emoji || 'pin',
      periods,
      activities: stops,
      stops,
      meals: enrichMeals(day.meals),
      transport: day.transport || { type: 'walk', duration: '30min', cost: 0 },
      budgetEstimate: day.budgetEstimate ?? calculateDayBudget({ ...day, stops }),
      highlights: day.highlights || [],
      backupPlan: day.backupPlan || day.alternativePlans?.rainy || day.alternativePlans?.relaxed || `Keep the same neighborhood plan and swap outdoor stops for museums, covered markets, or cafes in ${destinationName}.`,
      practicalNote: day.practicalNote || day.notes || 'Verify opening hours, booking windows, and local transport alerts the night before.',
      localSecret: day.localSecret || day.localTip || `Keep one unscheduled hour near the last stop in ${destinationName}; ask a cafe owner where they would eat after work.`,
      culturalNote: day.culturalNote || '',
    };
  });
}

function enrichDays(days, totalDays, destinationName, destinationCoordinates) {
  if (!Array.isArray(days) || days.length === 0) {
    return generateFallbackDays(totalDays, destinationName, destinationCoordinates);
  }

  return days.map((day, idx) => ({
    dayNumber: day.dayNumber || idx + 1,
    title: day.title || [`First Light Route`, `Markets and Memory`, `Waterfront Pause`, `Last Local Notes`][idx % 4],
    theme: day.theme || 'Local route',
    emoji: day.emoji || '📍',
    stops: (day.stops || day.activities || []).map((stop, stopIdx) => ({
      name: stop.name || 'Unnamed Stop',
      type: stop.type || 'attraction',
      description: stop.description || '',
      time: stop.time || '10:00',
      duration: stop.duration || '2h',
      cost: stop.cost || 0,
      coordinates: safeCoordinates(stop.coordinates, destinationName, stopIdx + idx),
      bookingRequired: stop.bookingRequired || false,
      emoji: stop.emoji || '📍',
      coordinateSource: stop.coordinateSource || 'ai',
      source: stop.source || 'ai',
    })),
    meals: enrichMeals(day.meals),
    transport: day.transport || { type: 'walk', duration: '30min', cost: 0 },
    budgetEstimate: calculateDayBudget(day),
    highlights: day.highlights || [],
    localSecret: day.localSecret || day.localTip || `Keep one unscheduled hour near the last stop in ${destinationName}; ask a cafe owner where they would eat after work.`,
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
        apps: ['App local de transportes'],
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
        name: 'Local Transit App',
        icon: '🚌',
        use: 'Horarios, passes e alertas de transportes',
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
      'Confirma horarios e alertas na app local de transportes',
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

function checklistPriority(priority) {
  if (['critical', 'high', 'medium', 'low'].includes(priority)) return priority;
  if (priority === 1 || priority === '1') return 'critical';
  if (priority === 2 || priority === '2') return 'high';
  if (priority === 3 || priority === '3') return 'medium';
  return priority || 'medium';
}

function enrichBookingChecklistItem(item, index) {
  const source = item && typeof item === 'object' ? item : { task: item };
  return {
    id: source.id || `${source.category || 'task'}-${index + 1}`,
    category: source.category || 'general',
    task: source.task || source.title || source.item || 'Review booking task',
    description: source.description || source.note || source.why || '',
    priority: checklistPriority(source.priority),
    status: source.status || 'not_started',
    daysBeforeDeparture: source.daysBeforeDeparture ?? source.daysAhead ?? source.daysInAdvance ?? null,
    searchUrl: source.searchUrl || source.url || '',
    reference: source.reference || source.confirmationNumber || '',
    price: source.price || source.selectedPrice || '',
    notes: source.notes || source.howToDo || '',
  };
}

function enrichBookingChecklist(checklist) {
  if (checklist && typeof checklist === 'object' && !Array.isArray(checklist) && Array.isArray(checklist.items)) {
    return {
      ...checklist,
      items: checklist.items.map(enrichBookingChecklistItem),
      notes: checklist.notes || 'Statuses are manual. Andor does not purchase or confirm bookings automatically.',
    };
  }

  if (checklist && Array.isArray(checklist) && checklist.length > 0) {
    return checklist.map(enrichBookingChecklistItem);
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

function generateFallbackDays(totalDays, destinationName = 'the destination', destinationCoordinates) {
  const base = safeCoordinates(destinationCoordinates, destinationName);
  return Array.from({ length: totalDays }, (_, i) => ({
    dayNumber: i + 1,
    title: [`First Light Arrival`, `Markets and Side Streets`, `Slow Views and Local Tables`, `Last Morning Favourites`][i % 4],
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
        coordinates: safeCoordinates(base, destinationName, i),
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
        coordinates: safeCoordinates(base, destinationName, i + 0.4),
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
        coordinates: safeCoordinates(base, destinationName, i + 0.8),
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
        coordinates: safeCoordinates(base, destinationName, i + 1.2),
        bookingRequired: false,
        emoji: '🍷',
      },
    ],
    meals: enrichMeals({}),
    transport: { type: 'walk', duration: '30min', cost: 0 },
    budgetEstimate: 60,
    highlights: [`Stay within one compact area of ${destinationName}`],
    localSecret: `Ask at a small cafe near the final stop where staff eat after service; it is usually more reliable than a viral list.`,
    culturalNote: 'Respeita as tradições e costumes locais',
  }));
}

function createMinimalItinerary(destination) {
  const coordinates = safeCoordinates(null, destination);
  return {
    destination: {
      name: destination,
      city: destination,
      country: 'Unknown',
      coordinates,
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
    days: generateFallbackDays(1, destination, coordinates),
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
