const BOOKING_STATUSES = new Set(['not_started', 'searching', 'selected', 'booked', 'confirmed']);
const DOCUMENT_STATUSES = new Set(['not_started', 'needed', 'ready', 'uploaded_confirmed', 'not_applicable']);

function clone(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function text(value, fallback = '') {
  const normalized = value == null ? '' : String(value).trim();
  return normalized || fallback;
}

function list(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function destinationParts(itinerary) {
  const destination = itinerary?.destination;
  if (typeof destination === 'string') {
    const [city = '', ...countryParts] = destination.split(',').map((part) => part.trim());
    return { city, country: countryParts.join(', '), label: destination };
  }
  const city = text(destination?.city || destination?.name || itinerary?.city, '');
  const country = text(destination?.country, '');
  return { city, country, label: [city, country].filter(Boolean).join(', ') };
}

function profileFor(itinerary, context = {}) {
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
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, encodeURIComponent(text(value))),
    template
  );
}

function configuredOr(envName, params, fallback) {
  const configured = envValue(envName);
  return configured ? replaceTemplate(configured, params) : fallback;
}

function googleSearch(base, query) {
  return `${base}${encodeURIComponent(query)}`;
}

export function buildBookingProviderLinks(itinerary, context = {}) {
  const destination = destinationParts(itinerary);
  const profile = profileFor(itinerary, context);
  const startDate = text(itinerary?.trip?.startDate || profile.startDate, '');
  const endDate = text(itinerary?.trip?.endDate || profile.endDate, '');
  const origin = text(profile.originCity || profile.departureCity || profile.origin, '');
  const travelers = Number(profile.travelers) > 0 ? Number(profile.travelers) : '';
  const queryParts = [destination.label, startDate, endDate].filter(Boolean);
  const params = {
    origin,
    destination: destination.label,
    city: destination.city,
    country: destination.country,
    startDate,
    endDate,
    travelers,
  };
  const flightQuery = [origin && `voos de ${origin} para`, ...queryParts].filter(Boolean).join(' ');
  const hotelQuery = [...queryParts, 'alojamento'].join(' ');

  return {
    flights: {
      google: configuredOr(
        'FLIGHTS_PROVIDER_SEARCH_URL',
        params,
        googleSearch('https://www.google.com/travel/flights?q=', flightQuery || `voos ${destination.label}`)
      ),
      skyscanner: 'https://www.skyscanner.pt/transport/flights/',
    },
    hotels: {
      booking: configuredOr(
        'HOTELS_PROVIDER_SEARCH_URL',
        params,
        `https://www.booking.com/searchresults.pt-pt.html?ss=${encodeURIComponent(destination.label)}`
      ),
      googleHotels: googleSearch('https://www.google.com/travel/hotels?q=', hotelQuery),
      airbnb: `https://www.airbnb.com/s/${encodeURIComponent(destination.label)}/homes`,
    },
    rentalCars: {
      search: configuredOr(
        'RENTAL_CARS_PROVIDER_SEARCH_URL',
        params,
        googleSearch('https://www.google.com/search?q=', `rent-a-car ${destination.label}`)
      ),
      google: googleSearch('https://www.google.com/search?q=', `aluguer de automóvel ${destination.label}`),
    },
    places: {
      search: configuredOr(
        'PLACES_PROVIDER_SEARCH_URL',
        params,
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination.label)}`
      ),
    },
  };
}

function normalizeAccommodation(itinerary, links) {
  const source = itinerary?.accommodation && typeof itinerary.accommodation === 'object'
    ? itinerary.accommodation
    : {};

  return {
    overview: text(source.overview, ''),
    recommendedArea: text(source.recommendedArea || source.recommended?.area, ''),
    whyRecommended: text(source.whyRecommended || source.recommended?.whyHere, ''),
    alternativeAreas: Array.isArray(source.alternativeAreas) ? source.alternativeAreas : [],
    // Inventory-shaped model/client fields are never proof of provider provenance.
    // A future provider sprint must inject verified inventory at its server adapter boundary.
    hotels: [],
    externalLinks: {
      booking: source.externalLinks?.booking || links.hotels.booking,
      googleHotels: source.externalLinks?.googleHotels || links.hotels.googleHotels,
      airbnb: source.externalLinks?.airbnb || links.hotels.airbnb,
    },
    disclaimer: 'Sugestões de zona são planeamento. Preço, classificação, disponibilidade e condições só são mostrados quando chegam de um fornecedor identificado.',
  };
}

function normalizeRentalCar(itinerary, context, links) {
  const source = itinerary?.rentalCar && typeof itinerary.rentalCar === 'object' ? itinerary.rentalCar : {};
  const profile = profileFor(itinerary, context);
  const explicitlyPreferred = /car|rent|road/i.test(text(profile.transportPreference, ''));
  const recommended = typeof source.recommended === 'boolean' ? source.recommended : explicitlyPreferred ? true : null;

  return {
    ...source,
    recommended,
    strategy: text(source.strategy || source.reason, explicitlyPreferred
      ? 'O viajante indicou preferência por automóvel. Confirma se melhora realmente os dias regionais.'
      : ''),
    pickup: text(source.pickup || source.pickupLocation, ''),
    dropoff: text(source.dropoff || source.dropoffLocation, ''),
    estimatedCost: source.estimatedCost ?? source.priceRange ?? null,
    insuranceNote: text(source.insuranceNote, 'Confirma franquia, caução, quilometragem e requisitos do cartão diretamente no fornecedor.'),
    parkingNote: text(source.parkingNote, 'Confirma estacionamento, portagens e zonas restritas em fontes oficiais.'),
    usefulFor: Array.isArray(source.usefulFor) ? source.usefulFor : [],
    searchLinks: {
      ...(source.searchLinks || {}),
      rentalCars: source.searchLinks?.rentalCars || links.rentalCars.search,
      google: source.searchLinks?.google || links.rentalCars.google,
    },
    bookingStatus: BOOKING_STATUSES.has(source.bookingStatus) ? source.bookingStatus : 'not_started',
    reference: text(source.reference || source.confirmationNumber, ''),
    price: text(source.price || source.selectedPrice, ''),
    notes: text(source.notes, ''),
  };
}

function bookingItem(item, fallbackId, overrides = {}) {
  return {
    id: text(item?.id, fallbackId),
    category: text(item?.category, overrides.category || 'general'),
    task: text(item?.task || item?.title, overrides.task || 'Rever tarefa'),
    description: text(item?.description || item?.note, overrides.description || ''),
    priority: text(item?.priority, overrides.priority || 'medium'),
    status: BOOKING_STATUSES.has(item?.status) ? item.status : 'not_started',
    daysBeforeDeparture: item?.daysBeforeDeparture ?? null,
    searchUrl: item?.searchUrl || item?.url || overrides.searchUrl || '',
    reference: text(item?.reference || item?.confirmationNumber, ''),
    price: text(item?.price || item?.selectedPrice, ''),
    notes: text(item?.notes, ''),
  };
}

function normalizeBookingChecklist(itinerary, context, links, rentalCar) {
  const existing = Array.isArray(itinerary?.bookingChecklist?.items)
    ? itinerary.bookingChecklist.items
    : Array.isArray(itinerary?.bookingChecklist) ? itinerary.bookingChecklist : [];
  if (existing.length) {
    return {
      items: existing.map((item, index) => bookingItem(item, `task-${index + 1}`)),
      notes: itinerary.bookingChecklist?.notes || 'Estados, referências e preços são registados manualmente pelo utilizador; o Andor não confirma reservas.',
    };
  }

  const profile = profileFor(itinerary, context);
  const definitions = [
    ['flights', 'flights', 'Pesquisar e selecionar transporte até ao destino', 'Compara horários, bagagem, ligações e cancelamento no fornecedor.', 'critical', links.flights.google],
    ['hotel', 'hotel', 'Escolher alojamento', 'Confirma zona, taxas, cancelamento e disponibilidade no fornecedor.', 'critical', links.hotels.booking],
    ['airport-transfer', 'transfers', 'Definir o transfer de chegada', 'Confirma o último transporte público e uma alternativa adequada à hora de chegada.', 'high', links.places.search],
    ['restaurants', 'food', 'Rever refeições prioritárias', 'Só marca uma reserva como confirmada depois de receber referência do restaurante.', 'medium', links.places.search],
    ['activities', 'activities', 'Rever atividades com entrada', 'Confirma horário, acessibilidade e bilhete em fonte oficial.', 'high', links.places.search],
    ['documents', 'documents', 'Verificar requisitos oficiais de viagem', 'Valida identificação, entrada, saúde e seguro para a nacionalidade de cada viajante.', 'critical', ''],
  ];
  if (rentalCar.recommended === true) {
    definitions.splice(3, 0, ['rental-car', 'rental_car', 'Avaliar rent-a-car', 'Compara caução, franquia, estacionamento e regras locais.', 'medium', links.rentalCars.search]);
  }
  if (isCompanyTrip(profile)) {
    definitions.push(['client-approval', 'b2b', 'Registar aprovação do cliente', 'Guarda a decisão e as condições aprovadas antes de qualquer compra.', 'critical', '']);
  }

  return {
    items: definitions.map(([id, category, task, description, priority, searchUrl]) => bookingItem(null, id, {
      category, task, description, priority, searchUrl,
    })),
    notes: 'Checklist de pesquisa e registo manual. O Andor não compra nem confirma reservas.',
  };
}

function documentItem(item, fallbackId, overrides = {}) {
  const importance = ['required', 'recommended', 'optional'].includes(item?.importance)
    ? item.importance
    : overrides.importance || 'recommended';
  const title = text(item?.title || item?.label || item?.task, overrides.title || 'Verificação de viagem');
  return {
    id: text(item?.id, fallbackId),
    category: text(item?.category, overrides.category || 'general'),
    title,
    label: title,
    description: text(item?.description || item?.notes, overrides.description || ''),
    importance,
    required: importance === 'required',
    whoNeedsIt: text(item?.whoNeedsIt || item?.traveler || item?.owner, overrides.whoNeedsIt || 'Viajantes aplicáveis'),
    timing: text(item?.timing || item?.deadline, overrides.timing || 'Antes de comprar opções não reembolsáveis'),
    status: DOCUMENT_STATUSES.has(item?.status) ? item.status : overrides.status || 'needed',
    notes: text(item?.notes, ''),
    sourceReason: text(item?.sourceReason || item?.reason, overrides.sourceReason || 'Tarefa de verificação; confirmar em fonte oficial.'),
    audience: text(item?.audience, overrides.audience || 'client'),
  };
}

function normalizeDocuments(itinerary, context, rentalCar) {
  const existing = Array.isArray(itinerary?.documentsChecklist?.items)
    ? itinerary.documentsChecklist.items
    : Array.isArray(itinerary?.documentsChecklist) ? itinerary.documentsChecklist : [];
  const profile = profileFor(itinerary, context);
  const items = existing.map((item, index) => documentItem(item, `document-${index + 1}`));
  const add = (id, overrides) => {
    if (!items.some((item) => item.id === id)) items.push(documentItem(null, id, overrides));
  };

  add('identity', {
    category: 'identity',
    title: 'Verificar documento de identificação aceite',
    description: 'Confirma tipo e validade exigidos para a rota e para a nacionalidade do viajante.',
  });
  add('entry-requirements', {
    category: 'entry',
    title: 'Verificar visto, ETA e regras de entrada',
    description: 'Consulta governo, consulado ou embaixada antes de compras não reembolsáveis.',
  });
  add('provider-confirmations', {
    category: 'confirmations',
    title: 'Guardar confirmações recebidas dos fornecedores',
    description: 'Regista referências, vouchers, cancelamento e contactos apenas depois da confirmação real.',
  });
  add('insurance-review', {
    category: 'insurance',
    title: 'Avaliar seguro de viagem',
    description: 'Compara coberturas, exclusões, franquia e contacto de emergência no documento da seguradora.',
  });
  if (rentalCar.recommended === true) {
    add('driver_license', { category: 'rental_car', title: 'Verificar carta de condução aceite', importance: 'required' });
    add('international_driving_permit', { category: 'rental_car', title: 'Verificar necessidade de licença internacional' });
    add('rental_car_confirmation', { category: 'rental_car', title: 'Guardar confirmação do rent-a-car' });
    add('rental_car_insurance', { category: 'rental_car', title: 'Rever seguro e franquia do rent-a-car' });
    add('parking_tolls_low_emission', { category: 'rental_car', title: 'Verificar estacionamento, portagens e zonas restritas' });
  }
  if (isCompanyTrip(profile)) {
    add('approval', { category: 'company', title: 'Registar aprovação do cliente', importance: 'required' });
    add('company_budget_approval', { category: 'company', title: 'Registar aprovação do orçamento', importance: 'required' });
    add('client_itinerary_approval', { category: 'company', title: 'Registar aprovação do itinerário', importance: 'required' });
    add('internal_review', { category: 'company', title: 'Revisão interna antes da entrega', audience: 'internal' });
  }

  return {
    items,
    notes: itinerary?.documentsChecklist?.notes || 'É uma lista de verificação, não aconselhamento legal. Confirma requisitos em fontes oficiais.',
  };
}

function normalizeBackupPlans(itinerary) {
  const source = Array.isArray(itinerary?.backupPlans?.items)
    ? itinerary.backupPlans.items
    : Array.isArray(itinerary?.backupPlans) ? itinerary.backupPlans : [];
  const items = source.map((item, index) => {
    const value = typeof item === 'string' ? { replacementPlan: item } : item || {};
    return {
      ...value,
      id: text(value.id, `backup-${index + 1}`),
      trigger: text(value.trigger || value.title || value.label, 'Alteração da viagem'),
      replacementPlan: text(value.replacementPlan || value.plan || value.description, ''),
      costImpact: text(value.costImpact || value.cost, ''),
      timeImpact: text(value.timeImpact || value.timing, ''),
      moveOrCancel: text(value.moveOrCancel || value.whatToCancel, ''),
      clientFacing: text(value.clientFacing || value.clientFacingVersion, ''),
    };
  });
  const contingencyDefinitions = [
    ['bad_weather', 'Mau tempo', itinerary?.contingencyPlans?.rainyDay],
    ['flight_delay', 'Atraso na chegada', itinerary?.contingencyPlans?.delayRecovery],
    ['tired_day', 'Dia de menor energia', itinerary?.contingencyPlans?.tiredDay],
    ['lower_budget', 'Orçamento reduzido', itinerary?.contingencyPlans?.lowerBudget],
  ];
  contingencyDefinitions.forEach(([id, trigger, replacementPlan]) => {
    if (replacementPlan && !items.some((item) => item.id === id)) {
      items.push({ id, trigger, replacementPlan, costImpact: '', timeImpact: '', moveOrCancel: '', clientFacing: replacementPlan });
    }
  });
  return {
    items,
    notes: itinerary?.backupPlans?.notes || 'Planos alternativos são propostas; confirma custos, horários e políticas quando forem usados.',
  };
}

function normalizeWarnings(itinerary) {
  const warnings = list(itinerary?.warnings || itinerary?.alerts).map((warning, index) => (
    typeof warning === 'string'
      ? { type: 'practical', title: `Nota ${index + 1}`, description: warning, advice: 'Confirmar perto da partida.' }
      : warning
  ));
  if (!warnings.some((warning) => warning?.type === 'data-provenance')) {
    warnings.push({
      type: 'data-provenance',
      title: 'Detalhes sujeitos a confirmação',
      description: 'Conteúdo gerado é uma proposta de planeamento; preços, horários, disponibilidade e requisitos podem mudar.',
      advice: 'Confirma em fontes oficiais e nos fornecedores antes de pagar.',
    });
  }
  return warnings;
}

function normalizeExportMetadata(itinerary, context) {
  const profile = profileFor(itinerary, context);
  return {
    ...(itinerary?.exportMetadata || {}),
    brand: 'Andor',
    format: profile.exportPreference || itinerary?.exportMetadata?.format || 'client_pdf',
    clientName: profile.clientName || itinerary?.exportMetadata?.clientName || '',
    companyName: profile.companyName || itinerary?.exportMetadata?.companyName || '',
    preparedBy: profile.preparedBy || itinerary?.exportMetadata?.preparedBy || '',
    clientFacingNotes: profile.clientFacingNotes || itinerary?.exportMetadata?.clientFacingNotes || '',
    internalNotes: profile.internalNotes || itinerary?.exportMetadata?.internalNotes || '',
    whiteLabelReady: isCompanyTrip(profile),
  };
}

export function ensureBookingReadyItinerary(input, context = {}) {
  const itinerary = clone(input);
  if (!itinerary || typeof itinerary !== 'object') return input;

  const links = buildBookingProviderLinks(itinerary, context);
  // Generated, imported, or browser-provided source labels are untrusted. Until a
  // provider adapter stamps data server-side, fail closed and expose search links only.
  const flightOptions = [];
  const accommodation = normalizeAccommodation(itinerary, links);
  const rentalCar = normalizeRentalCar(itinerary, context, links);
  const bookingChecklist = normalizeBookingChecklist(itinerary, context, links, rentalCar);

  return {
    ...itinerary,
    flightOptions,
    accommodation,
    airportTransfer: null,
    localTransport: null,
    rentalCar,
    bookingChecklist,
    documentsChecklist: normalizeDocuments(itinerary, context, rentalCar),
    backupPlans: normalizeBackupPlans(itinerary),
    warnings: normalizeWarnings(itinerary),
    exportMetadata: normalizeExportMetadata(itinerary, context),
    bookingReady: {
      status: 'manual_confirmation_required',
      disclaimer: 'O Andor prepara pesquisa e registo manual; não compra nem confirma reservas.',
      providerStatus: {
        flights: envValue('FLIGHTS_PROVIDER_SEARCH_URL') ? 'configured_search' : 'public_search_link',
        hotels: envValue('HOTELS_PROVIDER_SEARCH_URL') ? 'configured_search' : 'public_search_link',
        rentalCars: envValue('RENTAL_CARS_PROVIDER_SEARCH_URL') ? 'configured_search' : 'public_search_link',
        places: envValue('PLACES_PROVIDER_SEARCH_URL') ? 'configured_search' : 'public_search_link',
        pdf: envValue('PDF_EXPORT_PROVIDER') || 'browser_pdf',
      },
      providerLinks: links,
    },
    metadata: {
      ...(itinerary.metadata || {}),
      assumptions: [...new Set([
        ...list(itinerary.metadata?.assumptions),
        'Preços, horários, disponibilidade e requisitos devem ser confirmados antes de qualquer compra.',
      ])],
    },
  };
}

export default ensureBookingReadyItinerary;
