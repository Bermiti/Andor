const DEFAULT_STATUS = 'not_started';

const STATUS_ORDER = ['not_started', 'searching', 'selected', 'booked', 'confirmed'];
const DOCUMENT_STATUS_ORDER = ['not_started', 'needed', 'ready', 'uploaded_confirmed', 'not_applicable'];
const DOCUMENT_IMPORTANCE_ORDER = ['required', 'recommended', 'optional'];

function clone(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return value;
  }
}

function text(value, fallback = '') {
  const result = value == null ? '' : String(value).trim();
  return result || fallback;
}

function list(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return [value];
}

function numberOr(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function destinationParts(itinerary) {
  const destination = itinerary?.destination || {};
  if (typeof destination === 'string') {
    const [city, country] = destination.split(',').map((part) => part.trim());
    return { city: city || destination, country: country || '', label: destination };
  }
  const city = destination.city || destination.name || itinerary?.city || 'Destination';
  const country = destination.country || '';
  return {
    city,
    country,
    label: [city, country].filter(Boolean).join(', ') || city,
  };
}

function getProfile(itinerary, context = {}) {
  return {
    ...(itinerary?.trip?.travelerProfile || {}),
    ...(context.profile || {}),
  };
}

function isCompanyTrip(profile = {}) {
  return Boolean(profile.companyMode || /business|client|company|b2b/i.test(profile.travelerType || ''));
}

function envValue(name) {
  if (typeof process === 'undefined' || !process.env) return '';
  return text(process.env[name], '');
}

function replaceTemplate(template, params) {
  if (!template) return '';
  return Object.entries(params).reduce((result, [key, value]) => (
    result.replaceAll(`{${key}}`, encodeURIComponent(text(value)))
  ), template);
}

function providerLink(envName, params, fallback) {
  const configured = replaceTemplate(envValue(envName), params);
  return configured || fallback;
}

function searchUrl(base, query) {
  return `${base}${encodeURIComponent(query)}`;
}

function getDates(itinerary, profile) {
  return {
    startDate: text(itinerary?.trip?.startDate || profile.startDate, ''),
    endDate: text(itinerary?.trip?.endDate || profile.endDate, ''),
  };
}

export function buildBookingProviderLinks(itinerary, context = {}) {
  const destination = destinationParts(itinerary);
  const profile = getProfile(itinerary, context);
  const dates = getDates(itinerary, profile);
  const origin = text(profile.originCity || profile.departureCity || profile.origin, '');
  const travelers = numberOr(profile.travelers, 2);
  const destinationQuery = destination.label;
  const flightQuery = origin
    ? `flights from ${origin} to ${destinationQuery} ${dates.startDate} ${dates.endDate}`
    : `flights to ${destinationQuery} ${dates.startDate} ${dates.endDate}`;
  const hotelQuery = `${destinationQuery} hotels ${dates.startDate} ${dates.endDate}`;
  const rentalQuery = `${destinationQuery} rental car ${dates.startDate} ${dates.endDate}`;

  const params = {
    origin,
    destination: destinationQuery,
    city: destination.city,
    country: destination.country,
    startDate: dates.startDate,
    endDate: dates.endDate,
    travelers,
  };

  return {
    flights: {
      google: providerLink(
        'FLIGHTS_PROVIDER_SEARCH_URL',
        params,
        searchUrl('https://www.google.com/travel/flights?q=', flightQuery)
      ),
      skyscanner: searchUrl('https://www.skyscanner.net/transport/flights/?search=', flightQuery),
    },
    hotels: {
      booking: providerLink(
        'HOTELS_PROVIDER_SEARCH_URL',
        params,
        `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destinationQuery)}`
      ),
      googleHotels: searchUrl('https://www.google.com/travel/hotels?q=', hotelQuery),
      airbnb: searchUrl('https://www.airbnb.com/s/', destinationQuery),
    },
    rentalCars: {
      search: providerLink(
        'RENTAL_CARS_PROVIDER_SEARCH_URL',
        params,
        searchUrl('https://www.rentalcars.com/SearchResults.do?location=', rentalQuery)
      ),
      google: searchUrl('https://www.google.com/search?q=', rentalQuery),
    },
    places: {
      search: providerLink(
        'PLACES_PROVIDER_SEARCH_URL',
        params,
        searchUrl('https://www.google.com/search?q=', `${destinationQuery} things to do`)
      ),
    },
  };
}

function moneyRange(price, fallbackCurrency) {
  if (!price) return 'Confirmar tarifas atuais';
  if (typeof price === 'string') return price;
  if (typeof price === 'number') return `${fallbackCurrency} ${Math.round(price)}`;
  const currency = price.currency || fallbackCurrency;
  const economy = price.economy ?? price.min ?? price.total ?? price.amount;
  const business = price.business ?? price.max;
  if (economy && business) return `${currency} ${economy}-${business}`;
  if (economy) return `${currency} ${economy}`;
  return 'Confirmar tarifas atuais';
}

function normalizeFlightOptions(itinerary, context, links) {
  const destination = destinationParts(itinerary);
  const profile = getProfile(itinerary, context);
  const currency = itinerary?.destination?.currency?.code || itinerary?.trip?.budgetBreakdown?.currency || 'EUR';
  const sourceOptions = Array.isArray(itinerary?.flightOptions)
    ? itinerary.flightOptions
    : list(itinerary?.flights?.options);
  const budgetFlights = itinerary?.trip?.budgetBreakdown?.flights || {};

  const normalized = sourceOptions.slice(0, 4).map((option, index) => ({
    ...option,
    operator: option.operator || option.airline || option.provider || ['Pesquisa de melhor preço', 'Pesquisa com datas flexíveis', 'Pesquisa direta na companhia'][index] || 'Pesquisa de voos',
    type: option.type || 'flight',
    timing: option.timing || option.route || (profile.originCity ? `${profile.originCity} -> ${destination.city}` : `Aeroporto de origem -> ${destination.city}`),
    duration: option.duration || option.totalDuration || option.durationText || 'Comparar horários atuais',
    stops: typeof option.stops === 'number' ? (option.stops === 0 ? 'Direto' : `${option.stops} escala(s)`) : option.stops || 'Variável',
    estimatedPrice: moneyRange(option.estimatedPrice || option.estimatedCost || option.price, currency),
    bookingUrl: option.bookingUrl || option.skyscannerUrl || links.flights.google,
    source: option.source || 'estimated',
    bookingRequired: false,
  }));

  if (normalized.length > 0) return normalized;

  const min = numberOr(budgetFlights.min, 0);
  const max = numberOr(budgetFlights.max, min ? Math.round(min * 1.35) : 0);
  const fallbackPrice = min || max ? `${currency} ${min || Math.round(max * 0.75)}-${max || Math.round(min * 1.35)}` : 'Confirmar tarifas em tempo real';

  return [
    {
      operator: 'Google Flights',
      type: 'flight',
      timing: profile.originCity ? `${profile.originCity} -> ${destination.city}` : `Pesquisar voos para ${destination.city}`,
      duration: 'Usar datas flexíveis para comparar horários',
      stops: 'Comparar direto e uma escala',
      estimatedPrice: fallbackPrice,
      bookingUrl: links.flights.google,
      source: 'estimated',
      bookingRequired: false,
    },
    {
      operator: 'Skyscanner',
      type: 'flight',
      timing: 'Pesquisa do melhor preço',
      duration: 'Comparar +/- 3 dias',
      stops: 'Flexível',
      estimatedPrice: fallbackPrice,
      bookingUrl: links.flights.skyscanner,
      source: 'estimated',
      bookingRequired: false,
    },
  ];
}

function hotelName(option, destination) {
  return text(
    option?.name || option?.hotelName || option?.title,
    `Pesquisar alojamento em ${destination.city}`
  );
}

function normalizeAccommodation(itinerary, context, links) {
  const destination = destinationParts(itinerary);
  const profile = getProfile(itinerary, context);
  const source = itinerary?.accommodation && typeof itinerary.accommodation === 'object'
    ? itinerary.accommodation
    : {};
  const recommended = source.recommended || source.primary || null;
  const sourceHotels = Array.isArray(source.hotels)
    ? source.hotels
    : [source.budget, recommended, source.luxury].filter(Boolean);
  const currency = itinerary?.destination?.currency?.code || itinerary?.trip?.budgetBreakdown?.currency || 'EUR';
  const budget = itinerary?.trip?.budgetBreakdown?.accommodation || {};
  const nightly = numberOr(recommended?.pricePerNight || budget.perNight, 0);

  const hotels = sourceHotels.length > 0
    ? sourceHotels.map((hotel, index) => ({
        ...hotel,
        tier: hotel.tier || ['economical', 'boutique', 'premium'][index] || 'boutique',
        name: hotelName(hotel, destination),
        type: hotel.type || hotel.style || (index === 0 ? 'Alojamento económico' : index === 2 ? 'Alojamento premium' : 'Alojamento recomendado'),
        stars: hotel.stars || (index === 2 ? 5 : index === 0 ? 3 : 4),
        rating: hotel.rating || null,
        pricePerNight: hotel.pricePerNight || hotel.estimatedNightlyPrice || nightly || null,
        currency: hotel.currency || currency,
        area: hotel.area || source.recommendedArea || recommended?.area || 'Base central',
        description: hotel.description || hotel.whyHere || hotel.reason || 'Usa esta opção como referência e confirma disponibilidade real antes de reservar.',
        bookingUrl: hotel.bookingUrl || links.hotels.booking,
        source: hotel.source || 'estimated',
      }))
    : [
        {
          tier: 'economical',
          name: `Alojamentos económicos em ${destination.city}`,
          type: 'Guesthouse ou aparthotel',
          pricePerNight: nightly ? Math.round(nightly * 0.75) : null,
          currency,
          area: 'Zona bem servida de transportes',
          description: 'Prioriza avaliações fortes, acesso a transportes públicos e cancelamento gratuito.',
          bookingUrl: links.hotels.booking,
          source: 'estimated',
        },
        {
          tier: 'boutique',
          name: `Base boutique em ${destination.city}`,
          type: 'Hotel boutique',
          pricePerNight: nightly || null,
          currency,
          area: recommended?.area || source.recommendedArea || 'Base central',
          description: 'Boa escolha para um roteiro Andor premium e prático.',
          bookingUrl: links.hotels.booking,
          source: 'estimated',
        },
        {
          tier: 'premium',
          name: `Alojamentos premium em ${destination.city}`,
          type: 'Hotel de luxo',
          pricePerNight: nightly ? Math.round(nightly * 1.8) : null,
          currency,
          area: recommended?.area || source.recommendedArea || 'Base pronta para cliente',
          description: 'Indicada quando conforto, serviço e apresentação ao cliente pesam mais do que o preço.',
          bookingUrl: links.hotels.googleHotels,
          source: 'estimated',
        },
      ];

  return {
    ...source,
    overview: source.overview || `Escolhe uma base que simplifique os primeiros dias, reduza deslocações e corresponda à preferência de alojamento ${profile.hotelPreference || profile.personalityContext?.hotelPreference || 'equilibrada'}.`,
    recommendedArea: source.recommendedArea || recommended?.area || hotels[1]?.area || hotels[0]?.area || 'Base central',
    whyRecommended: source.whyRecommended || recommended?.whyHere || 'Equilibra caminhadas, acesso a transportes e transferes de aeroporto simples.',
    hotels,
    externalLinks: {
      ...(source.externalLinks || {}),
      booking: source.externalLinks?.booking || links.hotels.booking,
      googleHotels: source.externalLinks?.googleHotels || links.hotels.googleHotels,
      airbnb: source.externalLinks?.airbnb || links.hotels.airbnb,
    },
    disclaimer: source.disclaimer || 'Confirma disponibilidade, impostos, taxas e regras de cancelamento no fornecedor antes da compra.',
  };
}

function normalizeAirportTransfer(itinerary, context, links) {
  if (itinerary?.airportTransfer?.options?.length) return itinerary.airportTransfer;
  const destination = destinationParts(itinerary);
  const profile = getProfile(itinerary, context);
  const city = destination.city;
  return {
    overview: `Planeia os transferes de chegada e saída antes de reservar o hotel, sobretudo se a chegada for ${profile.arrivalTime || 'tardia'} ou houver muita bagagem.`,
    options: [
      {
        tier: 'budget',
        name: 'Transfer em transporte público',
        description: `Melhor relação qualidade-preço se o hotel ficar perto de comboio ou metro em ${city}.`,
        estimatedCost: 8,
        estimatedDuration: '35-70 min',
        pros: ['Menor custo', 'Previsível em cidades com trânsito intenso'],
        cons: ['Menos confortável com bagagem', 'Pode exigir uma caminhada curta'],
        bestFor: 'Viajantes a solo, casais e orçamentos baixos',
      },
      {
        tier: 'standard',
        name: 'Táxi ou TVDE',
        description: 'Útil em chegadas tardias, com crianças ou quando o hotel tem acesso difícil por transportes.',
        estimatedCost: 35,
        estimatedDuration: '25-55 min',
        pros: ['Porta a porta', 'Simples depois de um voo longo'],
        cons: ['Risco de trânsito', 'Possíveis preços dinâmicos'],
        bestFor: 'Famílias, viagens de trabalho e chegadas tardias',
      },
      {
        tier: 'premium',
        name: 'Transfer privado pré-reservado',
        description: 'Opção pronta para cliente, com receção e instruções de encontro definidas.',
        estimatedCost: 65,
        estimatedDuration: '25-55 min',
        pros: ['Ideal para viagens de cliente', 'Condutor e ponto de encontro claros'],
        cons: ['Custo mais alto', 'É preciso confirmar o acompanhamento do voo'],
        bestFor: 'Viagens de empresa, cliente e luxo',
      },
    ],
    externalLinks: {
      local: links.places.search,
      uber: 'https://www.uber.com/global/en/airports/',
    },
    tips: [
      'Guarda a morada do hotel offline antes de aterrar.',
      'Confirma o último comboio ou metro se chegares à noite.',
      'Não marques o transfer como reservado antes da confirmação do fornecedor.',
    ],
  };
}

function normalizeLocalTransport(itinerary, context) {
  if (itinerary?.localTransport?.overview) return itinerary.localTransport;
  const destination = destinationParts(itinerary);
  const profile = getProfile(itinerary, context);
  const prefersCar = /car|rent/i.test(profile.transportPreference || '');
  return {
    overview: prefersCar
      ? `Usa rent-a-car apenas quando superar os transportes públicos nas excursões fora de ${destination.city}; mantém o centro sem carro quando estacionar for difícil.`
      : `Usa transportes públicos e caminhadas nos dias urbanos em ${destination.city}, reservando táxis para noites tardias, bagagem ou acessibilidade.`,
    passes: [
      {
        name: 'Cartão ou passe local',
        cost: 'Confirmar localmente',
        validity: '24-72h ou saldo recarregável',
        includes: ['Metro, comboio e autocarro quando disponíveis', 'Viagens por aproximação'],
        recommendation: 'Compensa com três ou mais viagens por dia.',
      },
    ],
    apps: [
      { name: 'App local de transportes', purpose: 'Horários e avisos de serviço' },
      { name: 'Citymapper', purpose: 'Útil nas grandes cidades onde está disponível' },
      { name: 'Uber/Bolt/app local de táxi', purpose: 'Alternativa à noite ou com bagagem' },
    ],
    modes: [
      { type: 'Percursos a pé', best: 'Dias concentrados por bairro', cost: 'Grátis' },
      { type: 'Transporte público', best: 'Deslocações pela cidade', cost: 'Baixo' },
      { type: 'Táxi/TVDE', best: 'Chegada tardia ou acessibilidade', cost: 'Médio' },
      { type: 'Rent-a-car', best: 'Excursões regionais', cost: 'Alto' },
    ],
    tips: [
      'Agrupa cada dia por bairro antes de reservar bilhetes com hora marcada.',
      'Deixa 15 minutos de margem entre transportes e reservas.',
      'Guarda os pins de restaurantes e hotéis antes da partida.',
    ],
  };
}

function normalizeRentalCar(itinerary, context, links) {
  if (itinerary?.rentalCar?.searchLinks) return itinerary.rentalCar;
  const destination = destinationParts(itinerary);
  const profile = getProfile(itinerary, context);
  const prefersCar = /car|rent|road/i.test(profile.transportPreference || '');
  const longTrip = numberOr(itinerary?.trip?.totalDays || itinerary?.days?.length, 0) >= 5;
  const recommended = prefersCar || /azores|bali|iceland|reykjavik|tuscany|algarve|morocco/i.test(destination.label);

  return {
    recommended,
    strategy: recommended
      ? `Considera rent-a-car para os dias regionais, sem o manter necessariamente durante todas as noites em ${destination.city}.`
      : `Não alugues carro por defeito em ${destination.city}; usa-o apenas numa excursão específica com transportes públicos fracos.`,
    pickup: 'Levantar no aeroporto é mais simples se fores conduzir de imediato; na cidade é melhor depois dos dias sem carro.',
    insuranceNote: 'Escolhe seguro completo ou confirma a cobertura do cartão. Nunca guardes dados de pagamento no Andor.',
    parkingNote: 'Confirma estacionamento do hotel e regras ZTL/baixas emissões antes de escolher o carro.',
    searchLinks: {
      rentalCars: links.rentalCars.search,
      google: links.rentalCars.google,
    },
    bookingStatus: DEFAULT_STATUS,
    usefulFor: recommended || longTrip ? ['Excursões regionais', 'Famílias com bagagem', 'Hotéis remotos'] : ['Apenas dias específicos fora da cidade'],
  };
}

function normalizeStatus(status) {
  return STATUS_ORDER.includes(status) ? status : DEFAULT_STATUS;
}

function normalizeDocumentStatus(status, fallback = 'needed') {
  return DOCUMENT_STATUS_ORDER.includes(status) ? status : fallback;
}

function normalizeDocumentImportance(importance, fallback = 'recommended') {
  if (DOCUMENT_IMPORTANCE_ORDER.includes(importance)) return importance;
  if (importance === true || importance === 'true' || importance === 'critical') return 'required';
  if (importance === false || importance === 'false' || importance === 'low') return 'optional';
  return fallback;
}

function checklistItem(item, fallbackId, overrides = {}) {
  return {
    id: text(item?.id, fallbackId),
    category: text(item?.category, overrides.category || 'general'),
    task: text(item?.task || item?.title, overrides.task || 'Review booking task'),
    description: text(item?.description || item?.note, overrides.description || ''),
    priority: text(item?.priority, overrides.priority || 'medium'),
    status: normalizeStatus(item?.status || overrides.status),
    daysBeforeDeparture: item?.daysBeforeDeparture ?? overrides.daysBeforeDeparture ?? null,
    searchUrl: item?.searchUrl || item?.url || overrides.searchUrl || '',
    reference: text(item?.reference || item?.confirmationNumber, ''),
    price: text(item?.price || item?.selectedPrice, ''),
    notes: text(item?.notes, ''),
  };
}

function normalizeBookingChecklist(itinerary, context, links, rentalCar) {
  const existingChecklist = itinerary?.bookingChecklist;
  const existingItems = Array.isArray(existingChecklist?.items)
    ? existingChecklist.items
    : Array.isArray(existingChecklist)
      ? existingChecklist
      : [];
  if (existingItems.length > 0) {
    return {
      ...(Array.isArray(existingChecklist) ? {} : existingChecklist),
      items: existingItems.map((item, index) => checklistItem(item, `task-${index + 1}`)),
      notes: existingChecklist?.notes || 'Os estados são manuais. O Andor nunca reserva nem compra sem confirmação explícita do utilizador.',
    };
  }

  const profile = getProfile(itinerary, context);
  const includeFlights = profile.budgetIncludesFlights !== 'no' || Boolean(profile.originCity);
  const items = [];

  if (includeFlights) {
    items.push(checklistItem(null, 'flights', {
      category: 'flights',
      task: 'Pesquisar e selecionar voos',
      description: 'Compara voos diretos e com escala, bagagem, horário de chegada e regras de cancelamento antes de comprar.',
      priority: 'critical',
      daysBeforeDeparture: 90,
      searchUrl: links.flights.google,
    }));
  }

  items.push(
    checklistItem(null, 'hotel', {
      category: 'hotel',
      task: 'Escolher hotel ou zona de alojamento',
      description: 'Prioriza a zona-base, regras de cancelamento, taxas, pequeno-almoço e ligação ao aeroporto.',
      priority: 'critical',
      daysBeforeDeparture: 75,
      searchUrl: links.hotels.booking,
    }),
    checklistItem(null, 'airport-transfer', {
      category: 'transfers',
      task: 'Confirmar o plano de transfer do aeroporto',
      description: 'Guarda o ponto de encontro, morada do hotel, último transporte público e alternativa de táxi ou TVDE.',
      priority: 'high',
      daysBeforeDeparture: 14,
      searchUrl: links.places.search,
    }),
    checklistItem(null, 'restaurants', {
      category: 'food',
      task: 'Reservar os restaurantes prioritários',
      description: 'Reserva apenas restaurantes concorridos, pequenos ou importantes para a entrega ao cliente.',
      priority: 'medium',
      daysBeforeDeparture: 21,
      searchUrl: links.places.search,
    }),
    checklistItem(null, 'activities', {
      category: 'activities',
      task: 'Reservar atividades com horário marcado',
      description: 'Reserva museus, espetáculos, visitas e atrações assinaladas como obrigatórias.',
      priority: 'high',
      daysBeforeDeparture: 30,
      searchUrl: links.places.search,
    }),
    checklistItem(null, 'insurance', {
      category: 'documents',
      task: 'Comprar ou verificar o seguro de viagem',
      description: 'Confirma cobertura médica, cancelamento, bagagem, franquia do rent-a-car e viagem de negócios quando aplicável.',
      priority: 'medium',
      daysBeforeDeparture: 30,
    }),
    checklistItem(null, 'documents', {
      category: 'documents',
      task: 'Verificar passaporte, visto e documentos de entrada',
      description: 'Confirma validade do passaporte, visto ou ETA, bilhetes, alojamento e contactos de emergência.',
      priority: 'critical',
      daysBeforeDeparture: 60,
    })
  );

  if (rentalCar.recommended) {
    items.splice(3, 0, checklistItem(null, 'rental-car', {
      category: 'rental_car',
      task: 'Selecionar rent-a-car apenas se for útil',
      description: 'Compara local de levantamento, franquia, idade do condutor, estacionamento e caução.',
      priority: 'medium',
      daysBeforeDeparture: 45,
      searchUrl: links.rentalCars.search,
    }));
  }

  if (isCompanyTrip(profile)) {
    items.push(checklistItem(null, 'client-approval', {
      category: 'b2b',
      task: 'Obter aprovação do cliente e do orçamento',
      description: 'Anexa o PDF e regista assunções, estado da aprovação e notas internas antes de reservar.',
      priority: 'critical',
      daysBeforeDeparture: 21,
    }));
  }

  return {
    items,
    notes: 'Os estados são manuais. O Andor fornece estrutura e links de pesquisa, mas não compra nem confirma reservas.',
  };
}

function documentItem(item, fallbackId, overrides = {}) {
  const importance = normalizeDocumentImportance(
    item?.importance ?? item?.required ?? item?.priority,
    overrides.importance || 'recommended'
  );
  const title = text(item?.title || item?.label || item?.task, overrides.title || 'Travel document');
  const description = text(item?.description, overrides.description || item?.notes || '');
  const notes = text(item?.notes, overrides.notes || '');

  return {
    id: text(item?.id, fallbackId),
    category: text(item?.category, overrides.category || 'general'),
    title,
    label: title,
    description,
    importance,
    required: importance === 'required',
    whoNeedsIt: text(item?.whoNeedsIt || item?.traveler || item?.owner, overrides.whoNeedsIt || 'All travelers'),
    timing: text(item?.timing || item?.deadline, overrides.timing || 'Before booking non-refundable travel'),
    status: normalizeDocumentStatus(item?.status || overrides.status, overrides.status || 'needed'),
    notes,
    sourceReason: text(
      item?.sourceReason || item?.reason || item?.source,
      overrides.sourceReason || 'Generated from itinerary profile. Verify final requirements with official sources.'
    ),
    audience: text(item?.audience, overrides.audience || 'client'),
  };
}

function mergeById(defaultItems, existingItems, normalizer) {
  const map = new Map();
  defaultItems.forEach((item) => map.set(item.id, item));
  existingItems.forEach((item, index) => {
    const normalized = normalizer(item, item?.id || `custom-${index + 1}`);
    map.set(normalized.id, {
      ...(map.get(normalized.id) || {}),
      ...normalized,
    });
  });
  return Array.from(map.values());
}

function normalizeDocuments(itinerary, context, rentalCar) {
  const profile = getProfile(itinerary, context);
  const destination = destinationParts(itinerary);
  const companyTrip = isCompanyTrip(profile);
  const rentalRecommended = rentalCar?.recommended === true || itinerary?.rentalCar?.recommended === true;
  const existing = Array.isArray(itinerary?.documentsChecklist?.items)
    ? itinerary.documentsChecklist.items
    : Array.isArray(itinerary?.documentsChecklist)
      ? itinerary.documentsChecklist
      : [];

  const defaultItems = [
    documentItem(null, 'passport', {
      category: 'identity',
      title: 'Passaporte ou documento de identificação válido',
      description: 'Confirma o documento aceite, prazo de validade, páginas livres e correspondência do nome com os bilhetes.',
      importance: 'required',
      whoNeedsIt: 'Todos os viajantes',
      timing: '60+ dias antes, mais cedo se houver renovação',
      status: 'needed',
      sourceReason: `Documento-base para a viagem a ${destination.label}.`,
    }),
    documentItem(null, 'visa_entry_authorization', {
      category: 'entry',
      title: 'Verificação de visto, ETA ou autorização de entrada',
      description: 'Consulta fontes oficiais ou a embaixada para regras por nacionalidade antes de comprar opções não reembolsáveis.',
      importance: 'recommended',
      whoNeedsIt: 'Todos os viajantes, conforme a nacionalidade do passaporte',
      timing: 'Antes de reservar voos ou hotéis não reembolsáveis',
      status: 'needed',
      sourceReason: 'O Andor não substitui confirmação legal; esta é uma tarefa de verificação.',
    }),
    documentItem(null, 'government_id', {
      category: 'identity',
      title: 'Segundo documento de identificação',
      description: 'Útil no check-in, controlo de idade, balcão do rent-a-car e como alternativa ao passaporte.',
      importance: 'recommended',
      whoNeedsIt: 'Adultos e viajante principal',
      timing: 'Guardar na carteira de viagem',
      status: 'not_started',
      sourceReason: 'Alternativa prática para verificações de identidade.',
    }),
    documentItem(null, 'booking_confirmations', {
      category: 'confirmations',
      title: 'Confirmações de voos, hotel, transfers e atividades',
      description: 'Junta referências, vouchers, prazos de cancelamento e instruções de check-in.',
      importance: 'required',
      whoNeedsIt: 'Viajante principal ou responsável da agência',
      timing: 'À medida que cada reserva é confirmada',
      status: 'needed',
      sourceReason: 'Gerado a partir da checklist de reservas.',
    }),
    documentItem(null, 'travel_insurance', {
      category: 'insurance',
      title: 'Apólice do seguro e número de emergência',
      description: 'Inclui cobertura médica, cancelamento, bagagem e franquia do rent-a-car quando aplicável.',
      importance: 'recommended',
      whoNeedsIt: 'Todos os viajantes',
      timing: 'Antes dos prazos de pagamento final',
      status: 'needed',
      sourceReason: 'Controlo de risco médico, cancelamento e disrupções.',
    }),
    documentItem(null, 'health_documents', {
      category: 'health',
      title: 'Documentos de saúde e receitas',
      description: 'Leva receitas, declarações de medicação, registos de vacinação ou notas de mobilidade quando forem relevantes.',
      importance: 'recommended',
      whoNeedsIt: 'Viajantes com medicação ou necessidades de saúde e acessibilidade',
      timing: '2-4 semanas antes da partida',
      status: profile.mobilityReduced ? 'needed' : 'not_started',
      sourceReason: 'Generic health-preparation reminder; verify official health guidance close to departure.',
    }),
    documentItem(null, 'emergency_contacts', {
      category: 'safety',
      title: 'Contactos de emergência e embaixada/consulado',
      description: 'Guarda números locais, seguradora, alojamento e o contacto de emergência em casa.',
      importance: 'recommended',
      whoNeedsIt: 'Viajante principal e responsável da agência',
      timing: 'Antes da partida',
      status: 'not_started',
      sourceReason: 'Client-ready dossier should include a practical emergency contact plan.',
    }),
    documentItem(null, 'payment_methods', {
      category: 'money',
      title: 'Métodos de pagamento e dinheiro local',
      description: 'Leva mais de um método de pagamento e algum dinheiro onde a aceitação de cartões variar. Não guardes dados de cartões no Andor.',
      importance: 'recommended',
      whoNeedsIt: 'Viajantes pagadores ou responsável da viagem',
      timing: 'Antes da partida',
      status: 'not_started',
      sourceReason: 'Generated from booking-ready operating checklist.',
    }),
    documentItem(null, 'sim_esim', {
      category: 'connectivity',
      title: 'SIM/eSIM, roaming e mapas offline',
      description: 'Confirma o roaming ou instala um eSIM e descarrega hotel, mapas e reservas para uso offline.',
      importance: 'optional',
      whoNeedsIt: 'Viajantes que dependem de dados móveis',
      timing: '1 semana antes da partida',
      status: 'not_started',
      sourceReason: 'Connectivity reduces arrival and disruption risk.',
    }),
    ...(profile.mobilityReduced ? [
      documentItem(null, 'accessibility_confirmations', {
        category: 'accessibility',
        title: 'Confirmações de acessibilidade',
        description: 'Confirma rotas sem degraus, elevadores, tipo de quarto, veículo de transfer e lugares diretamente com os fornecedores.',
        importance: 'required',
        whoNeedsIt: 'Viajantes com necessidades de acessibilidade',
        timing: 'Antes da reserva final e novamente 72h antes',
        status: 'needed',
        sourceReason: 'Traveler profile includes reduced mobility or accessibility needs.',
      }),
    ] : []),
    ...(rentalRecommended ? [
      documentItem(null, 'driver_license', {
        category: 'rental_car',
        title: 'Carta de condução válida para cada condutor',
        description: 'Confirma validade, correspondência do nome, regras de idade, cartão para caução e requisitos do balcão.',
        importance: 'required',
        whoNeedsIt: 'Todos os condutores indicados',
        timing: 'Antes de selecionar o veículo',
        status: 'needed',
        sourceReason: 'Rental car is recommended or selected for this itinerary.',
      }),
      documentItem(null, 'international_driving_permit', {
        category: 'rental_car',
        title: 'Verificação da licença internacional de condução',
        description: 'Alguns destinos ou balcões exigem licença internacional além da carta nacional. Confirma regras oficiais e do fornecedor.',
        importance: 'recommended',
        whoNeedsIt: 'Todos os condutores, conforme país da carta e destino',
        timing: 'Com antecedência suficiente antes do levantamento',
        status: 'needed',
        sourceReason: 'Rental car recommended. This is a compliance reminder, not legal advice.',
      }),
      documentItem(null, 'rental_car_confirmation', {
        category: 'rental_car',
        title: 'Confirmação e voucher do rent-a-car',
        description: 'Guarda morada, horário do balcão, caução, quilometragem, combustível e prazo de cancelamento.',
        importance: 'required',
        whoNeedsIt: 'Condutor principal e responsável da agência',
        timing: 'Assim que o veículo for reservado',
        status: 'needed',
        sourceReason: 'Rental car workflow needs a provider confirmation before client handoff.',
      }),
      documentItem(null, 'rental_car_insurance', {
        category: 'rental_car',
        title: 'Seguro e comprovativo de cobertura da franquia',
        description: 'Confirma danos, franquia, assistência, cobertura do cartão e exclusões antes do levantamento.',
        importance: 'recommended',
        whoNeedsIt: 'Condutor principal',
        timing: 'Antes de confirmar o aluguer',
        status: 'needed',
        sourceReason: 'Rental car itinerary requires insurance and deposit clarity.',
      }),
      documentItem(null, 'parking_tolls_low_emission', {
        category: 'rental_car',
        title: 'Estacionamento, portagens e zonas restritas',
        description: 'Confirma parque do hotel, portagens, zonas de baixas emissões, ZTL e instruções noturnas.',
        importance: 'recommended',
        whoNeedsIt: 'Condutor principal',
        timing: 'Antes de fechar hotel e veículo',
        status: 'not_started',
        sourceReason: 'Rental car can create avoidable city-center costs and fines.',
      }),
    ] : []),
    ...(companyTrip ? [
      documentItem(null, 'approval', {
        category: 'company',
        title: 'Registo de aprovação da empresa/cliente',
        description: 'Regista âmbito, orçamento, assunções visíveis e o que continua pendente antes da compra.',
        importance: 'required',
        whoNeedsIt: 'Decisor do cliente e responsável da agência',
        timing: 'Antes de reservar itens cobrados',
        status: 'needed',
        sourceReason: 'Company/client mode is enabled.',
      }),
      documentItem(null, 'company_budget_approval', {
        category: 'company',
        title: 'Aprovação do orçamento da empresa',
        description: 'Confirma intervalo aprovado, faturação, responsabilidade de pagamento e tolerância de cancelamento.',
        importance: 'required',
        whoNeedsIt: 'Aprovador da empresa ou patrocinador da viagem',
        timing: 'Antes da compra ou bloqueio do fornecedor',
        status: 'needed',
        sourceReason: 'Business travel requires budget traceability.',
      }),
      documentItem(null, 'client_itinerary_approval', {
        category: 'company',
        title: 'Aprovação do itinerário pelo cliente',
        description: 'Confirma que o cliente aceitou datas, zona do hotel, ritmo, reuniões e assunções de reserva.',
        importance: 'required',
        whoNeedsIt: 'Decisor do cliente',
        timing: 'Antes de enviar o PDF final para reservas',
        status: 'needed',
        sourceReason: 'Company/client mode is enabled.',
      }),
      documentItem(null, 'internal_review', {
        category: 'company',
        title: 'Nota de revisão interna',
        description: 'Revê margens, ressalvas de fornecedores, sensibilidades do viajante e notas privadas antes de exportar.',
        importance: 'recommended',
        whoNeedsIt: 'Apenas a equipa da agência',
        timing: 'Antes de enviar o dossier ao cliente',
        status: 'needed',
        sourceReason: 'Internal-only safeguard for company/client workflow.',
        audience: 'internal',
      }),
    ] : []),
  ];

  const items = mergeById(defaultItems, existing, documentItem);
  return {
    ...(Array.isArray(itinerary?.documentsChecklist) ? {} : itinerary?.documentsChecklist || {}),
    items,
    notes: itinerary?.documentsChecklist?.notes || 'Esta lista é um lembrete. Confirma requisitos legais, de saúde e dos fornecedores em fontes oficiais antes de comprar.',
  };
}

function normalizeWarnings(itinerary) {
  const raw = list(itinerary?.warnings || itinerary?.alerts || []);
  const normalized = raw.map((warning, index) => {
    if (typeof warning === 'string') {
      return {
        type: 'practical',
        title: `Travel note ${index + 1}`,
        description: warning,
        advice: 'Verify details close to departure.',
      };
    }
    return {
      type: warning.type || 'practical',
      title: warning.title || warning.label || 'Travel note',
      description: warning.description || warning.text || warning.note || '',
      advice: warning.advice || warning.tip || '',
    };
  });

  const hasPractical = normalized.some((warning) => warning.type === 'practical');
  if (!hasPractical) {
    normalized.push({
      type: 'practical',
      title: 'Os dados de reserva são indicativos',
      description: 'Preços, horários, disponibilidade e regras podem mudar.',
      advice: 'Confirma em páginas oficiais ou do fornecedor antes de pagar.',
    });
  }
  return normalized;
}

function backupPlanItem(item, fallbackId, overrides = {}) {
  return {
    id: text(item?.id, fallbackId),
    category: text(item?.category, overrides.category || 'general'),
    severity: text(item?.severity, overrides.severity || 'medium'),
    trigger: text(item?.trigger || item?.label || item?.title, overrides.trigger || 'Trip condition changes'),
    replacementPlan: text(item?.replacementPlan || item?.plan || item?.description || item?.notes, overrides.replacementPlan || ''),
    costImpact: text(item?.costImpact || item?.cost || item?.budgetImpact, overrides.costImpact || 'Neutral if handled early'),
    timeImpact: text(item?.timeImpact || item?.timing || item?.scheduleImpact, overrides.timeImpact || 'Keep the same half-day block where possible'),
    moveOrCancel: text(item?.moveOrCancel || item?.whatToCancel || item?.cancelMove, overrides.moveOrCancel || 'Move optional items before fixed bookings'),
    practicalNote: text(item?.practicalNote || item?.note, overrides.practicalNote || ''),
    clientFacing: text(item?.clientFacing || item?.clientFacingVersion || item?.clientCopy, overrides.clientFacing || ''),
    sourceReason: text(item?.sourceReason || item?.reason || item?.source, overrides.sourceReason || 'Generated from itinerary risk profile.'),
  };
}

function contingencyTextToBackup(id, label, textValue, overrides = {}) {
  if (!textValue) return null;
  return backupPlanItem(null, id, {
    trigger: label,
    replacementPlan: String(textValue),
    clientFacing: String(textValue),
    ...overrides,
  });
}

function collectExistingBackupPlans(itinerary) {
  const existing = Array.isArray(itinerary?.backupPlans?.items)
    ? itinerary.backupPlans.items
    : Array.isArray(itinerary?.backupPlans)
      ? itinerary.backupPlans
      : [];
  const converted = existing.map((item, index) => (
    typeof item === 'string'
      ? backupPlanItem(null, `backup-note-${index + 1}`, {
          trigger: 'Manual backup note',
          replacementPlan: item,
          clientFacing: item,
          sourceReason: 'Converted from text-only backup plan.',
        })
      : item
  ));

  const contingencies = itinerary?.contingencyPlans || {};
  [
    contingencyTextToBackup('bad_weather', 'Bad weather or exposed outdoor day', contingencies.rainyDay),
    contingencyTextToBackup('flight_delay', 'Flight/train delay or late arrival', contingencies.delayRecovery),
    contingencyTextToBackup('tired_day', 'Low-energy or tired day', contingencies.tiredDay),
    contingencyTextToBackup('lower_budget', 'Lower budget version needed', contingencies.lowerBudget),
    contingencyTextToBackup('mobility_change', 'Mobility/accessibility needs change', contingencies.accessibility, {
      category: 'accessibility',
      severity: 'medium',
      sourceReason: 'Converted from legacy accessibility contingency.',
    }),
  ].filter(Boolean).forEach((item) => converted.push(item));

  return converted;
}

function normalizeBackupPlans(itinerary, context, rentalCar) {
  const destination = destinationParts(itinerary);
  const profile = getProfile(itinerary, context);
  const companyTrip = isCompanyTrip(profile);
  const rentalRecommended = rentalCar?.recommended === true || itinerary?.rentalCar?.recommended === true;
  const city = destination.city;
  const existing = collectExistingBackupPlans(itinerary);

  const defaultItems = [
    backupPlanItem(null, 'bad_weather', {
      category: 'weather',
      severity: 'medium',
      trigger: 'Mau tempo, calor extremo ou condições exteriores inseguras',
      replacementPlan: `Troca miradouros e caminhadas longas em ${city} por museus, mercados cobertos, cafés e transferes curtos.`,
      costImpact: 'Usually neutral to +EUR 20 per person depending on museum/taxi choices',
      timeImpact: 'Keep the same morning/afternoon block',
      moveOrCancel: 'Move exposed viewpoints, long walks, beaches, or terraces; protect timed indoor tickets',
      practicalNote: 'Keep one indoor map pin per neighborhood and check opening hours the night before.',
      clientFacing: 'Se o tempo mudar, o dia passa para espaços cobertos e deslocações curtas sem perder o ritmo principal.',
      sourceReason: 'Every dossier needs a weather-safe operating version.',
    }),
    backupPlanItem(null, 'flight_delay', {
      category: 'arrival',
      severity: 'high',
      trigger: 'Atraso de voo, comboio ou transfer longo',
      replacementPlan: 'Mantém a primeira refeição perto do hotel, move a noite opcional para outro bloco e reconfirma a chegada tardia.',
      costImpact: 'Possible taxi/rideshare supplement and missed non-refundable activity if no buffer exists',
      timeImpact: 'Protect arrival night; move 1-2 optional items',
      moveOrCancel: 'Cancel optional first-evening sightseeing before restaurants or hotel check-in',
      practicalNote: 'Save hotel phone/WhatsApp and late check-in policy in the confirmation bundle.',
      clientFacing: 'Se a chegada atrasar, a primeira noite fica calma junto ao hotel e os extras passam para mais tarde.',
      sourceReason: 'Arrival disruption is the most common itinerary failure point.',
    }),
    backupPlanItem(null, 'late_hotel_check_in', {
      category: 'hotel',
      severity: 'medium',
      trigger: 'Check-in tardio, quarto indisponível ou sem depósito de bagagem',
      replacementPlan: 'Usa um serviço de bagagem ou o hotel e faz uma pausa num café ou passeio curto até o quarto estar pronto.',
      costImpact: 'Low; luggage storage or cafe spend',
      timeImpact: 'Adds 30-90 minutes of waiting time',
      moveOrCancel: 'Move the first paid activity if luggage logistics would make it stressful',
      practicalNote: 'Confirm luggage storage, check-in window, and after-hours access before finalizing accommodation.',
      clientFacing: 'Se o check-in mudar, a bagagem e a primeira paragem já têm alternativa.',
      sourceReason: 'Hotel timing affects arrival-day comfort and client confidence.',
    }),
    backupPlanItem(null, 'activity_unavailable', {
      category: 'activities',
      severity: 'medium',
      trigger: 'Atividade esgotada, fechada ou indisponível',
      replacementPlan: `Troca por um museu, miradouro, passeio de bairro ou visita guiada na mesma zona de ${city}.`,
      costImpact: 'Neutral to moderate depending on replacement ticket',
      timeImpact: 'Keep the same slot; avoid cross-city rerouting',
      moveOrCancel: 'Move the unavailable attraction; keep meals and transport sequence intact',
      practicalNote: 'Book must-see timed entries first and tag flexible stops as optional.',
      clientFacing: 'Se um local estiver indisponível, a alternativa fica perto e mantém o dia coerente.',
      sourceReason: 'Booking-ready itineraries need a same-area attraction fallback.',
    }),
    backupPlanItem(null, 'restaurant_full', {
      category: 'food',
      severity: 'low',
      trigger: 'Restaurante cheio, fechado ou em evento privado',
      replacementPlan: 'Usa a segunda escolha na mesma zona e guarda uma opção casual sem reserva a pé.',
      costImpact: 'Usually neutral; can reduce cost if switching casual',
      timeImpact: '15-30 minute adjustment',
      moveOrCancel: 'Move the restaurant only; keep evening activity and transport plan',
      practicalNote: 'For client dinners, hold one reservation and one backup before sending the dossier.',
      clientFacing: 'As alternativas de jantar ficam no mesmo bairro para a noite continuar simples.',
      sourceReason: 'Restaurant availability changes often and should not break the day plan.',
    }),
    backupPlanItem(null, 'tired_day', {
      category: 'pace',
      severity: 'low',
      trigger: 'Cansaço, jet lag, crianças a precisar de pausa ou dia sobrecarregado',
      replacementPlan: `Reduz o dia a uma atividade principal, uma refeição confortável e deslocações curtas em ${city}.`,
      costImpact: 'Usually lower spend',
      timeImpact: 'Frees 2-4 hours',
      moveOrCancel: 'Cancel optional shopping/viewpoints and preserve only the most meaningful booking',
      practicalNote: 'Keep the first morning after arrival lighter than the itinerary maximum.',
      clientFacing: 'Existe uma versão mais leve sem perder o destaque da viagem.',
      sourceReason: 'Client-ready plans should include a humane pacing fallback.',
    }),
    backupPlanItem(null, 'lower_budget', {
      category: 'budget',
      severity: 'medium',
      trigger: 'O orçamento precisa de baixar ou os preços reais excedem a estimativa',
      replacementPlan: 'Troca uma atividade paga por um passeio ou miradouro gratuito, usa transporte público e escolhe alojamento de valor.',
      costImpact: 'Can reduce daily spend by 10-25%',
      timeImpact: 'May add transfer time',
      moveOrCancel: 'Move paid optional activities and premium transfers first',
      practicalNote: 'Keep the must-see paid item and reduce comfort extras before cutting the trip identity.',
      clientFacing: 'A versão económica mantém a experiência central e corta primeiro os extras pagos.',
      sourceReason: 'Live prices can exceed planning estimates.',
    }),
    backupPlanItem(null, 'no_rental_car', {
      category: 'transport',
      severity: rentalRecommended ? 'high' : 'medium',
      trigger: 'Rent-a-car indisponível, demasiado caro ou sem condutor',
      replacementPlan: rentalRecommended
        ? 'Convert regional days to private driver, train/bus, taxi loop, or a closer day trip; remove remote stops that require self-driving.'
        : 'Keep the city plan car-free and use taxi/rideshare only for luggage, late nights, or weak transit links.',
      costImpact: rentalRecommended ? 'Can increase cost with private drivers or reduce scope with transit' : 'Usually neutral',
      timeImpact: rentalRecommended ? 'May add 30-120 minutes or require fewer remote stops' : 'Low',
      moveOrCancel: 'Move remote countryside/beach/village stops before fixed hotel nights',
      practicalNote: 'Do not promise self-drive days until license, IDP, insurance, deposit, and parking are checked.',
      clientFacing: 'Se conduzir não for a melhor opção, a rota passa para motorista ou transporte sem quebrar a viagem.',
      sourceReason: rentalRecommended ? 'Rental car is recommended or selected.' : 'City trips still need a no-car operating version.',
    }),
    backupPlanItem(null, 'public_transport_disruption', {
      category: 'transport',
      severity: 'medium',
      trigger: 'Greve, falha de transporte, último comboio perdido ou linha fechada',
      replacementPlan: 'Usa táxi ou TVDE no troço afetado, concentra o dia num bairro ou muda para uma rota a pé junto ao hotel.',
      costImpact: 'Moderate taxi/rideshare supplement',
      timeImpact: '15-60 minute adjustment',
      moveOrCancel: 'Move the farthest optional stop first',
      practicalNote: 'Keep local taxi apps, hotel address, and one walkable backup neighborhood saved offline.',
      clientFacing: 'Se o transporte falhar, o dia concentra-se localmente e usa transferes diretos apenas onde são úteis.',
      sourceReason: 'Transport disruption is a common operational risk.',
    }),
    ...(profile.mobilityReduced ? [
      backupPlanItem(null, 'mobility_change', {
        category: 'accessibility',
        severity: 'high',
        trigger: 'Accessibility or mobility needs change',
        replacementPlan: 'Reduce the day to step-free routes, pre-confirmed accessible entrances, and taxi/rideshare links.',
        costImpact: 'Possible transfer supplement',
        timeImpact: 'Adds buffers and reduces total stops',
        moveOrCancel: 'Move stairs, steep streets, long walks, and standing-room bookings',
        practicalNote: 'Confirm lifts, room access, vehicle type, and seating directly with providers.',
        clientFacing: 'If mobility needs change, the route switches to confirmed accessible stops and gentler transfers.',
        sourceReason: 'Traveler profile includes reduced mobility.',
      }),
    ] : []),
    ...(companyTrip ? [
      backupPlanItem(null, 'company_schedule_change', {
        category: 'company',
        severity: 'high',
        trigger: 'Client meeting, company agenda, approval, or executive schedule changes',
        replacementPlan: 'Protect meeting windows, move sightseeing to flexible blocks, and mark client-facing vs internal-only changes before resending the dossier.',
        costImpact: 'May affect cancellation windows and supplier holds',
        timeImpact: 'Can move half-day blocks',
        moveOrCancel: 'Move optional leisure first; preserve flights, hotel, meetings, and high-demand reservations',
        practicalNote: 'Record who approved the change and whether internal notes should remain hidden from client export.',
        clientFacing: 'If the work schedule changes, the leisure plan flexes around priority commitments.',
        sourceReason: 'Company/client mode is enabled.',
      }),
    ] : []),
  ];

  const items = mergeById(defaultItems, existing, backupPlanItem);
  return {
    ...(Array.isArray(itinerary?.backupPlans) ? {} : itinerary?.backupPlans || {}),
    items,
    notes: itinerary?.backupPlans?.notes || 'Backup plans are operational fallbacks. Confirm provider policies, opening hours, weather, and disruptions close to travel.',
  };
}

function normalizeContingencies(itinerary, context, backupPlans) {
  const byId = new Map((backupPlans?.items || []).map((item) => [item.id, item]));
  const copy = (id) => {
    const item = byId.get(id);
    return item?.clientFacing || item?.replacementPlan || '';
  };
  const existing = itinerary?.contingencyPlans || {};
  return {
    ...existing,
    rainyDay: copy('bad_weather') || existing.rainyDay || '',
    delayRecovery: copy('flight_delay') || existing.delayRecovery || '',
    tiredDay: copy('tired_day') || existing.tiredDay || '',
    lowerBudget: copy('lower_budget') || existing.lowerBudget || '',
    noRentalCar: copy('no_rental_car') || existing.noRentalCar || '',
    transportDisruption: copy('public_transport_disruption') || existing.transportDisruption || '',
    clientScheduleChange: copy('company_schedule_change') || existing.clientScheduleChange || '',
  };
}

function normalizeExportMetadata(itinerary, context) {
  const profile = getProfile(itinerary, context);
  return {
    ...(itinerary?.exportMetadata || {}),
    brand: 'Andor',
    format: profile.exportPreference || 'client_pdf',
    clientName: profile.clientName || '',
    companyName: profile.companyName || '',
    preparedBy: profile.preparedBy || '',
    budgetApprovalStatus: profile.budgetApprovalStatus || 'not_requested',
    bookingStatus: profile.bookingStatus || 'not_started',
    clientFacingNotes: profile.clientFacingNotes || '',
    internalNotes: profile.internalNotes || '',
    whiteLabelReady: isCompanyTrip(profile),
  };
}

export function ensureBookingReadyItinerary(input, context = {}) {
  const itinerary = clone(input);
  if (!itinerary || typeof itinerary !== 'object') return input;

  const links = buildBookingProviderLinks(itinerary, context);
  const flightOptions = normalizeFlightOptions(itinerary, context, links);
  const accommodation = normalizeAccommodation(itinerary, context, links);
  const airportTransfer = normalizeAirportTransfer(itinerary, context, links);
  const localTransport = normalizeLocalTransport(itinerary, context);
  const rentalCar = normalizeRentalCar(itinerary, context, links);
  const bookingChecklist = normalizeBookingChecklist(itinerary, context, links, rentalCar);
  const documentsChecklist = normalizeDocuments(itinerary, context, rentalCar);
  const warnings = normalizeWarnings(itinerary);
  const backupPlans = normalizeBackupPlans(itinerary, context, rentalCar);
  const contingencyPlans = normalizeContingencies(itinerary, context, backupPlans);
  const exportMetadata = normalizeExportMetadata(itinerary, context);

  const providerStatus = {
    flights: envValue('FLIGHTS_PROVIDER_SEARCH_URL') ? 'configured' : 'search_link_fallback',
    hotels: envValue('HOTELS_PROVIDER_SEARCH_URL') ? 'configured' : 'search_link_fallback',
    rentalCars: envValue('RENTAL_CARS_PROVIDER_SEARCH_URL') ? 'configured' : 'search_link_fallback',
    places: envValue('PLACES_PROVIDER_SEARCH_URL') ? 'configured' : 'search_link_fallback',
    pdf: envValue('PDF_EXPORT_PROVIDER') || 'browser_pdf',
  };

  return {
    ...itinerary,
    flightOptions,
    accommodation,
    airportTransfer,
    localTransport,
    rentalCar,
    bookingChecklist,
    documentsChecklist,
    warnings,
    backupPlans,
    contingencyPlans,
    exportMetadata,
    bookingReady: {
      status: 'manual_confirmation_required',
      disclaimer: 'Andor can prepare booking decisions and links, but it does not purchase or confirm anything automatically.',
      providerStatus,
      providerLinks: links,
    },
    metadata: {
      ...(itinerary.metadata || {}),
      assumptions: [
        ...list(itinerary.metadata?.assumptions),
        'Live availability, disruptions, weather, and prices must be verified before booking.',
      ].filter((item, index, array) => array.indexOf(item) === index),
    },
  };
}

export default ensureBookingReadyItinerary;
