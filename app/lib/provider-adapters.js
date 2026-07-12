const MOCK_FLIGHT_ADAPTER = {
  name: 'Mock Flight Provider',
  type: 'flights',
  isConfigured: () => false, // Set to true when we have real API keys
  search: async (params) => {
    return {
      provider: 'mock_flights',
      source: 'fallback',
      confidence: 'low',
      data: []
    };
  },
  getDetails: async (id) => null,
  formatResult: (raw) => raw
};

const MOCK_HOTEL_ADAPTER = {
  name: 'Mock Hotel Provider',
  type: 'hotels',
  isConfigured: () => false,
  search: async (params) => {
    return {
      provider: 'mock_hotels',
      source: 'fallback',
      confidence: 'low',
      data: []
    };
  },
  getDetails: async (id) => null,
  formatResult: (raw) => raw
};

const MOCK_RENTAL_ADAPTER = {
  name: 'Mock Rental Provider',
  type: 'rentals',
  isConfigured: () => false,
  search: async (params) => {
    return {
      provider: 'mock_rentals',
      source: 'fallback',
      confidence: 'low',
      data: []
    };
  },
  getDetails: async (id) => null,
  formatResult: (raw) => raw
};

const MOCK_PLACES_ADAPTER = {
  name: 'Mock Places Provider',
  type: 'places',
  isConfigured: () => false,
  search: async (params) => {
    return {
      provider: 'mock_places',
      source: 'fallback',
      confidence: 'low',
      data: []
    };
  },
  getDetails: async (id) => null,
  formatResult: (raw) => raw
};

const MOCK_WEATHER_ADAPTER = {
  name: 'Mock Weather Provider',
  type: 'weather',
  isConfigured: () => false,
  search: async (params) => {
    return {
      provider: 'mock_weather',
      source: 'fallback',
      confidence: 'low',
      data: null
    };
  },
  getDetails: async (id) => null,
  formatResult: (raw) => raw
};

export function getAdapter(type) {
  switch (type) {
    case 'flights':
      return MOCK_FLIGHT_ADAPTER;
    case 'hotels':
      return MOCK_HOTEL_ADAPTER;
    case 'rentals':
      return MOCK_RENTAL_ADAPTER;
    case 'places':
      return MOCK_PLACES_ADAPTER;
    case 'weather':
      return MOCK_WEATHER_ADAPTER;
    default:
      return null;
  }
}

export function getProviderStatus() {
  return {
    flights: getAdapter('flights').isConfigured() ? 'configured' : 'mock',
    hotels: getAdapter('hotels').isConfigured() ? 'configured' : 'mock',
    rentals: getAdapter('rentals').isConfigured() ? 'configured' : 'mock',
    places: getAdapter('places').isConfigured() ? 'configured' : 'mock',
    weather: getAdapter('weather').isConfigured() ? 'configured' : 'mock',
  };
}
