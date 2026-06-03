/**
 * Services for fetching real data to enrich itineraries.
 * Gracefully falls back to mock/structured data if API keys are missing.
 */

// Helper to fetch JSON with timeout
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Enriches a single activity using Wikipedia Summary API and OpenTripMap
 */
export async function enrichActivityData(activityName, destinationCity, country = '') {
  const result = {
    name: activityName,
    description: '',
    thumbnail: null,
    wikipediaUrl: null,
    source: 'estimated',
    rating: 4.5,
    hours: '09:00 - 18:00',
    fee: 'Grátis'
  };

  // 1. Query Wikipedia (free, no key needed)
  // Try Portuguese Wikipedia first, fallback to English
  const wikiTitles = [activityName, `${activityName} (${destinationCity})`, activityName.replace(/\s+/g, '_')];
  
  for (const lang of ['pt', 'en']) {
    for (const title of wikiTitles) {
      try {
        const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        const res = await fetchWithTimeout(url, {
          headers: { 'User-Agent': 'Andor-Travel-App/1.0 (contact@andor.travel)' }
        }, 3000);

        if (res.ok) {
          const data = await res.json();
          if (data.extract) {
            result.description = data.extract;
            result.thumbnail = data.thumbnail?.source || null;
            result.wikipediaUrl = data.content_urls?.desktop?.page || null;
            result.source = 'wikipedia';
            break;
          }
        }
      } catch (e) {
        // ignore and try next
      }
    }
    if (result.description) break;
  }

  // 2. OpenTripMap Enrichment (if key is set)
  const otmKey = process.env.OPENTRIPMAP_API_KEY;
  if (otmKey && otmKey !== '5ae2e3...' && !otmKey.startsWith('cola_aqui')) {
    try {
      // Find OTM details if possible
      // We can do a name search:
      const searchUrl = `https://api.opentripmap.com/0.1/en/places/geoname?name=${encodeURIComponent(destinationCity)}&apikey=${otmKey}`;
      const searchRes = await fetchWithTimeout(searchUrl);
      if (searchRes.ok) {
        const cityData = await searchRes.json();
        if (cityData.lat && cityData.lon) {
          const placesUrl = `https://api.opentripmap.com/0.1/en/places/radius?radius=5000&lon=${cityData.lon}&lat=${cityData.lat}&name=${encodeURIComponent(activityName)}&limit=1&apikey=${otmKey}`;
          const placesRes = await fetchWithTimeout(placesUrl);
          if (placesRes.ok) {
            const places = await placesRes.json();
            if (places.features && places.features.length > 0) {
              const xid = places.features[0].properties.xid;
              const detailsUrl = `https://api.opentripmap.com/0.1/en/places/xid/${xid}?apikey=${otmKey}`;
              const detailsRes = await fetchWithTimeout(detailsUrl);
              if (detailsRes.ok) {
                const details = await detailsRes.json();
                if (details.info) {
                  result.fee = details.admission || result.fee;
                  result.hours = details.opening_hours || result.hours;
                  if (!result.description && details.wikipedia_extracts?.text) {
                    result.description = details.wikipedia_extracts.text;
                    result.source = 'opentripmap';
                  }
                  if (!result.thumbnail && details.preview?.source) {
                    result.thumbnail = details.preview.source;
                  }
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('OTM activity enrichment failed:', err);
    }
  }

  // 3. Fallback mock generation if description is still empty
  if (!result.description) {
    const templates = [
      `Um ponto turístico icônico em ${destinationCity}, imperdível para quem quer conhecer a história e a cultura local.`,
      `Local de grande interesse histórico e arquitetônico em ${destinationCity}, oferecendo uma atmosfera única e ótimas oportunidades para fotos.`,
      `Uma das atrações mais recomendadas de ${destinationCity}, ideal para visitar com calma e apreciar os detalhes locais.`,
    ];
    result.description = templates[Math.floor(Math.random() * templates.length)];
    result.fee = Math.random() > 0.5 ? '€5 – €12' : 'Grátis';
  }

  return result;
}

/**
 * Enriches nearby restaurants around specific coordinates
 */
export async function enrichRestaurantsData(lat, lng, destinationCity) {
  const fallbackRestaurants = [
    {
      name: 'Tasca do Bairro',
      cuisine: 'Tradicional / Local',
      rating: 4.6,
      priceLevel: '€€',
      address: 'Centro Histórico',
      hours: '12:00 - 23:00',
      mustTry: 'Especialidade da casa',
      source: 'estimated'
    },
    {
      name: 'O Bistrô da Esquina',
      cuisine: 'Moderna / Fusão',
      rating: 4.4,
      priceLevel: '€€€',
      address: 'Rua Principal',
      hours: '19:00 - 23:30',
      mustTry: 'Menu de degustação',
      source: 'estimated'
    },
    {
      name: 'Cantinho Verde',
      cuisine: 'Vegetariana / Saudável',
      rating: 4.5,
      priceLevel: '€',
      address: 'Próximo ao Parque',
      hours: '11:30 - 20:00',
      mustTry: 'Salada da época e sumos naturais',
      source: 'estimated'
    }
  ];

  const otmKey = process.env.OPENTRIPMAP_API_KEY;
  const fsqKey = process.env.FOURSQUARE_API_KEY;

  // 1. Try Foursquare Places API first (if key is set)
  if (fsqKey && fsqKey !== 'fsq3...' && !fsqKey.startsWith('cola_aqui')) {
    try {
      const url = `https://api.foursquare.com/v3/places/search?query=restaurant&ll=${lat},${lng}&radius=1000&categories=13000&sort=RATING&limit=3`;
      const res = await fetchWithTimeout(url, {
        headers: {
          'Authorization': fsqKey,
          'Accept': 'application/json'
        }
      }, 3000);

      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          return data.results.map((r, i) => {
            let priceSymbol = '€';
            if (r.price === 1) priceSymbol = '€';
            else if (r.price === 2) priceSymbol = '€€';
            else if (r.price === 3) priceSymbol = '€€€';
            else if (r.price === 4) priceSymbol = '€€€€';

            return {
              name: r.name,
              cuisine: r.categories?.[0]?.name || 'Restaurante',
              rating: r.rating ? (r.rating / 2).toFixed(1) : (4.0 + (i * 0.2)).toFixed(1),
              priceLevel: priceSymbol,
              address: r.location?.address || 'Nas proximidades',
              hours: '12:00 - 22:30',
              mustTry: 'Prato principal recomendado pelos clientes',
              source: 'foursquare'
            };
          });
        }
      }
    } catch (e) {
      console.error('Foursquare restaurant enrichment failed:', e);
    }
  }

  // 2. Try OpenTripMap foods search
  if (otmKey && otmKey !== '5ae2e3...' && !otmKey.startsWith('cola_aqui')) {
    try {
      const radiusUrl = `https://api.opentripmap.com/0.1/en/places/radius?radius=1000&lon=${lng}&lat=${lat}&kinds=foods&rate=2&limit=3&apikey=${otmKey}`;
      const radiusRes = await fetchWithTimeout(radiusUrl);
      if (radiusRes.ok) {
        const data = await radiusRes.json();
        if (data.features && data.features.length > 0) {
          const results = [];
          for (const feature of data.features.slice(0, 3)) {
            const xid = feature.properties.xid;
            const detailsRes = await fetchWithTimeout(`https://api.opentripmap.com/0.1/en/places/xid/${xid}?apikey=${otmKey}`);
            if (detailsRes.ok) {
              const details = await detailsRes.json();
              results.push({
                name: details.name || 'Restaurante Local',
                cuisine: details.kinds?.split(',').find(k => k !== 'foods' && k !== 'restaurants') || 'Culinária Local',
                rating: (4.0 + Math.random() * 0.9).toFixed(1),
                priceLevel: Math.random() > 0.6 ? '€€€' : '€€',
                address: details.address?.road || 'Nas proximidades',
                hours: details.opening_hours || '12:00 - 22:30',
                mustTry: 'Especialidade local recomendada',
                source: 'opentripmap'
              });
            }
          }
          if (results.length > 0) return results;
        }
      }
    } catch (e) {
      console.error('OTM restaurant enrichment failed:', e);
    }
  }

  // City-specific premium customization for mock data
  const city = destinationCity.toLowerCase();
  if (city.includes('tokyo') || city.includes('tóquio') || city.includes('japan')) {
    return [
      { name: 'Sushi-zanmai Asakusa', cuisine: 'Sushi / Sashimi', rating: 4.6, priceLevel: '€€', address: 'Asakusa, Tokyo', hours: '11:00 - 22:00', mustTry: 'Sashimi de Atum Gordo (Otoro)', source: 'estimated' },
      { name: 'Ramen Ichiran Shibuya', cuisine: 'Tonkotsu Ramen', rating: 4.5, priceLevel: '€', address: 'Shibuya, Tokyo', hours: '24h', mustTry: 'Ramen Tonkotsu Clássico', source: 'estimated' },
      { name: 'Gonpachi Nishi-Azabu', cuisine: 'Izakaya / Grelhados', rating: 4.4, priceLevel: '€€€', address: 'Roppongi, Tokyo', hours: '17:00 - 02:00', mustTry: 'Espetadas de Yakitori e Tempura', source: 'estimated' }
    ];
  } else if (city.includes('lisbon') || city.includes('lisboa')) {
    return [
      { name: 'Cervejaria Ramiro', cuisine: 'Marisco Tradicional', rating: 4.7, priceLevel: '€€€', address: 'Intendente, Lisboa', hours: '12:00 - 00:00', mustTry: 'Amêijoas à Bulhão Pato e Prego no Pão', source: 'estimated' },
      { name: 'Tasca do Chico', cuisine: 'Petiscos & Fado', rating: 4.3, priceLevel: '€', address: 'Bairro Alto, Lisboa', hours: '19:00 - 02:00', mustTry: 'Chouriço Assado e Caldo Verde', source: 'estimated' },
      { name: 'Taberna da Rua das Flores', cuisine: 'Petiscos Portugueses Modernos', rating: 4.5, priceLevel: '€€', address: 'Chiado, Lisboa', hours: '12:00 - 23:00', mustTry: 'Iscas de cebolada ou peixe do dia grelhado', source: 'estimated' }
    ];
  } else if (city.includes('paris')) {
    return [
      { name: 'Le Relais de l\'Entrecôte', cuisine: 'Bife com Batata Frita', rating: 4.5, priceLevel: '€€€', address: 'St-Germain-des-Prés, Paris', hours: '12:00 - 23:00', mustTry: 'Bife com molho secreto e batatas fritas', source: 'estimated' },
      { name: 'Bouillon Chartier', cuisine: 'Clássica Francesa de Taberna', rating: 4.2, priceLevel: '€', address: 'Grands Boulevards, Paris', hours: '11:30 - 00:00', mustTry: 'Confit de Canard (Pato) e Escargots', source: 'estimated' },
      { name: 'L\'As du Fallafel', cuisine: 'Médio Oriente / Falafel', rating: 4.6, priceLevel: '€', address: 'Le Marais, Paris', hours: '11:00 - 23:00', mustTry: 'Falafel Especial no Pão Pita', source: 'estimated' }
    ];
  }

  return fallbackRestaurants;
}

/**
 * Enriches transport using Skyscanner/Google Flights search templates and optional Amadeus API.
 */
export async function enrichTransportData(fromCity, toCity, date) {
  const formattedDate = date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const result = {
    overview: `Pesquisa de voos de ${fromCity} para ${toCity} para a data ${formattedDate}`,
    skyscannerUrl: `https://www.skyscanner.pt/transport/flights/${encodeURIComponent(fromCity.slice(0,3).toLowerCase())}/${encodeURIComponent(toCity.slice(0,3).toLowerCase())}/${formattedDate.replace(/-/g, '')}/`,
    googleFlightsUrl: `https://www.google.com/travel/flights?q=Voos%20de%20${encodeURIComponent(fromCity)}%20para%20${encodeURIComponent(toCity)}%20em%20${formattedDate}`,
    options: [
      {
        operator: 'Companhia Principal (Direto)',
        type: 'flight',
        timing: '09:15 → 12:45',
        duration: '3h 30m',
        stops: 'Direto',
        estimatedPrice: '€120 – €180',
        bookingUrl: `https://www.google.com/travel/flights?q=Voos%20de%20${encodeURIComponent(fromCity)}%20para%20${encodeURIComponent(toCity)}%20em%20${formattedDate}`,
        source: 'estimated'
      },
      {
        operator: 'Companhia Low-Cost (Escala / Económico)',
        type: 'flight',
        timing: '06:00 → 13:20',
        duration: '7h 20m',
        stops: '1 escala (MAD)',
        estimatedPrice: '€65 – €90',
        bookingUrl: `https://www.skyscanner.pt/transport/flights/${encodeURIComponent(fromCity.slice(0,3).toLowerCase())}/${encodeURIComponent(toCity.slice(0,3).toLowerCase())}/${formattedDate.replace(/-/g, '')}/`,
        source: 'estimated'
      }
    ]
  };

  const amadeusKey = process.env.AMADEUS_API_KEY;
  const amadeusSecret = process.env.AMADEUS_API_SECRET;
  
  if (amadeusKey && amadeusSecret && amadeusKey !== '' && !amadeusKey.startsWith('cola_aqui')) {
    try {
      // 1. Fetch Amadeus Auth Token
      const tokenUrl = 'https://test.api.amadeus.com/v1/security/oauth2/token';
      const tokenParams = new URLSearchParams();
      tokenParams.append('grant_type', 'client_credentials');
      tokenParams.append('client_id', amadeusKey);
      tokenParams.append('client_secret', amadeusSecret);

      const tokenRes = await fetchWithTimeout(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams
      }, 3000);

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        // 2. Fetch Flight Offers
        // We need 3-letter IATA codes. Let's make a basic lookup or guess the first 3 letters.
        const originIata = fromCity.slice(0,3).toUpperCase();
        const destIata = toCity.slice(0,3).toUpperCase();

        const flightsUrl = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${originIata}&destinationLocationCode=${destIata}&departureDate=${formattedDate}&adults=1&max=2`;
        const flightsRes = await fetchWithTimeout(flightsUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }, 3000);

        if (flightsRes.ok) {
          const flightsData = await flightsRes.json();
          if (flightsData.data && flightsData.data.length > 0) {
            result.options = flightsData.data.map(offer => {
              const itinerary = offer.itineraries[0];
              const segment = itinerary.segments[0];
              const carrierCode = segment.carrierCode;
              const price = offer.price.total;

              return {
                operator: `${carrierCode} Airlines`,
                type: 'flight',
                timing: `${segment.departure.at.split('T')[1].slice(0,5)} → ${itinerary.segments[itinerary.segments.length - 1].arrival.at.split('T')[1].slice(0,5)}`,
                duration: itinerary.duration.replace('PT', '').toLowerCase(),
                stops: itinerary.segments.length === 1 ? 'Direto' : `${itinerary.segments.length - 1} escala(s)`,
                estimatedPrice: `€${Math.round(price)}`,
                bookingUrl: result.googleFlightsUrl,
                source: 'amadeus'
              };
            });
          }
        }
      }
    } catch (e) {
      console.error('Amadeus flight enrichment failed:', e);
    }
  }

  return result;
}
