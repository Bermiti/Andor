/**
 * PHASE 11.1: Unified Itinerary Schema Definition
 * 
 * This file defines the canonical schema for all itineraries in Andor Travels.
 * It ensures data consistency across AI generation, storage, and rendering.
 * 
 * CRITICAL: This is the single source of truth for itinerary structure.
 * All new itineraries must conform to this schema.
 * All legacy itineraries must be migrated to this schema.
 */

/**
 * Complete itinerary schema definition
 */
export const ITINERARY_SCHEMA = {
  // Basic trip info
  destination: 'string', // Required. City/destination name (e.g., "Lisbon", "Tokyo")
  origin: 'string', // Optional. Starting location for flight cost calculation
  startDate: 'string', // ISO date (YYYY-MM-DD)
  endDate: 'string', // ISO date (YYYY-MM-DD)
  days: 'number', // Trip duration
  
  // Trip classification
  travelStyle: 'string', // e.g., "cultural", "adventure", "relaxing", "luxury"
  tripPace: 'string', // e.g., "relaxed", "balanced", "intense"
  budget: 'string', // e.g., "budget", "comfortable", "luxury"
  
  // Summary & highlights
  summary: {
    title: 'string',
    description: 'string',
    highlights: ['string'], // Main attractions/experiences
  },
  
  // Travel info
  travelerProfile: {
    interests: ['string'], // Travel interests (history, food, nature, etc.)
    budget: 'string', // Budget tier
    pace: 'string', // Travel pace preference
    accommodationPreference: 'string', // Hotel type preference
    flightPreference: 'string', // Flight preference
    transportPreference: 'string', // Local transport preference
  },
  
  // Flights section
  flights: {
    overview: 'string', // Summary of flight info
    airportDeparture: 'string', // IATA code or name (e.g., "LIS", "Humberto Delgado")
    airportArrival: 'string', // IATA code or name
    estimatedDuration: 'string', // e.g., "2h 30m" or "3-5 hours"
    bestArrivalWindow: 'string', // Recommended arrival time
    bestDepartureWindow: 'string', // Recommended departure time on return
    bookingWindow: 'string', // When to book (e.g., "2-3 months in advance")
    
    // 3 tier options
    options: [
      {
        tier: 'string', // "economical", "balanced", "comfortable"
        description: 'string',
        estimatedCost: 'number', // Per person
        duration: 'string',
        stops: 'number', // Number of stops (0 = direct)
        advantages: ['string'],
        disadvantages: ['string'],
        airlinesRecommended: ['string'], // e.g., ["TAP", "Ryanair"]
        besFor: 'string', // "budget travelers", "business", etc.
      },
    ],
    
    // External links for booking verification
    externalLinks: {
      googleFlights: 'string', // URL
      skyscanner: 'string', // URL
      kayak: 'string', // URL
    },
    
    disclaimer: 'string', // Always: "Prices are estimates. Confirm availability on booking sites."
  },
  
  // Accommodation section
  accommodation: {
    overview: 'string', // Summary of hotel recommendations
    recommendedArea: 'string', // Primary area to stay (e.g., "Baixa/Downtown Lisbon")
    whyRecommended: 'string', // Reasoning for recommended area
    
    // Alternative areas
    alternativeAreas: [
      {
        name: 'string', // e.g., "Belém"
        reason: 'string', // Why this area is good
        vibe: 'string', // Area personality
        pros: ['string'],
        cons: ['string'],
        distanceToCenter: 'string', // e.g., "15 min by metro"
        averageNightlyPrice: 'number', // For comfortable tier
      },
    ],
    
    // Hotel tiers
    hotels: [
      {
        tier: 'string', // "economical", "boutique", "premium"
        description: 'string',
        estimatedNightlyPrice: 'number',
        exampleNames: ['string'], // e.g., ["Airbnb studios", "Selina"]
        amenities: ['string'],
        bestFor: 'string',
        advantages: ['string'],
        disadvantages: ['string'],
        areas: ['string'], // Recommended areas for this tier
      },
    ],
    
    // External links
    externalLinks: {
      booking: 'string', // URL
      googleHotels: 'string', // URL
      airbnb: 'string', // URL
    },
    
    disclaimer: 'string', // "Hotel examples are for reference only. Verify availability and prices."
  },
  
  // Airport transfer section
  airportTransfer: {
    overview: 'string', // Summary of options
    airport: 'string', // Airport name
    distance: 'string', // Distance to city center
    estimatedDuration: 'string', // Travel time
    
    // 3 tier options
    options: [
      {
        tier: 'string', // "economical", "comfortable", "premium"
        method: 'string', // "Bus", "Metro", "Taxi", "Shuttle", "Uber"
        description: 'string',
        estimatedCost: 'number',
        duration: 'string',
        advantages: ['string'],
        disadvantages: ['string'],
        steps: ['string'], // Practical steps to take
        apps: ['string'], // Apps to use if relevant
      },
    ],
    
    warnings: ['string'], // Common scams, unsafe practices, etc.
  },
  
  // Local transport section
  localTransport: {
    overview: 'string', // Summary of best options
    bestMethod: 'string', // Overall recommendation
    passes: [
      {
        name: 'string', // e.g., "7-Colinas Card"
        cost: 'number',
        duration: 'string', // "3 days", "7 days"
        includes: ['string'],
        worthIt: 'boolean',
      },
    ],
    
    recommendations: [
      {
        when: 'string', // "Getting to downtown", "Across city"
        method: 'string', // "Metro", "Tram", "Bus", "Walk", "Taxi/Uber"
        why: 'string',
        estimatedCost: 'number',
        tips: ['string'],
      },
    ],
    
    usefulApps: ['string'], // e.g., ["Citymapper", "Google Maps"]
    areasTowalk: ['string'], // e.g., ["Baixa district", "Belém"]
    areasToAvoidCar: ['string'], // e.g., ["Narrow streets of Alfama"]
    generalTips: ['string'],
  },
  
  // Daily plan
  dailyPlan: [
    {
      dayNumber: 'number', // 1, 2, 3...
      title: 'string', // e.g., "Day 1: Arrival & Baixa"
      objective: 'string', // Main goal for the day
      energyLevel: 'string', // "relaxed", "moderate", "intense"
      estimatedDistance: 'string', // e.g., "8 km walking"
      
      periods: {
        morning: {
          title: 'string',
          time: 'string', // e.g., "8:00-12:00"
          activities: [
            {
              name: 'string', // Activity name
              duration: 'string', // e.g., "1 hour"
              description: 'string',
              location: 'string', // Area where it is
              coords: { lat: 'number', lng: 'number' }, // Optional GPS
              cost: 'number', // Estimated cost in euros
              reservationNeeded: 'boolean',
              tips: ['string'],
            },
          ],
          lunch: {
            time: 'string', // e.g., "12:00-13:30"
            recommendation: 'string', // Area/type recommendation
            cuisineType: 'string', // Portuguese, Italian, etc.
            estimatedCost: 'number',
            alternativeOptions: ['string'],
          },
        },
        afternoon: {
          title: 'string',
          time: 'string', // e.g., "14:00-18:00"
          activities: [
            {
              name: 'string',
              duration: 'string',
              description: 'string',
              location: 'string',
              coords: { lat: 'number', lng: 'number' },
              cost: 'number',
              reservationNeeded: 'boolean',
              tips: ['string'],
            },
          ],
        },
        evening: {
          title: 'string',
          time: 'string', // e.g., "19:00-22:00"
          activities: [
            {
              name: 'string',
              duration: 'string',
              description: 'string',
              location: 'string',
              coords: { lat: 'number', lng: 'number' },
              cost: 'number',
              tips: ['string'],
            },
          ],
          dinner: {
            time: 'string', // e.g., "20:00+"
            recommendation: 'string',
            cuisineType: 'string',
            estimatedCost: 'number',
            alternativeOptions: ['string'],
          },
        },
      },
      
      transport: [
        {
          from: 'string',
          to: 'string',
          method: 'string', // "walk", "metro", "bus", "tram", "taxi"
          estimatedDuration: 'string',
          cost: 'number',
        },
      ],
      
      totalCost: 'number', // Sum of activities + meals + transport
      
      // Alternative plans for same day
      alternativePlans: {
        relaxed: 'string', // Description of relaxed version
        intense: 'string', // Description of intense version
        rainy: 'string', // Indoor activities if weather is bad
      },
      
      notes: 'string', // General notes for the day
    },
  ],
  
  // Budget breakdown
  budget: {
    totalEstimated: 'number', // Total for entire trip
    perDayAverage: 'number',
    
    // 3 tier scenarios
    scenarios: [
      {
        tier: 'string', // "economical", "balanced", "premium"
        total: 'number',
        breakdown: {
          flights: 'number',
          accommodation: 'number',
          food: 'number',
          activities: 'number',
          transport: 'number',
          airportTransfer: 'number',
          contingency: 'number', // Buffer for unexpected
        },
        perDay: 'number',
        notes: 'string',
      },
    ],
  },
  
  // Food recommendations
  foodRecommendations: [
    {
      area: 'string', // Which area of the city
      cuisineType: 'string', // Portuguese, Italian, etc.
      specialties: ['string'], // What to try
      estimatedCost: 'number', // Typical meal cost
      tips: ['string'],
    },
  ],
  
  // Booking checklist
  bookingChecklist: [
    {
      item: 'string', // e.g., "Book return flights"
      daysInAdvance: 'number', // When to book relative to trip start
      why: 'string', // Why this timing matters
      howToDo: 'string', // Brief instructions
    },
  ],
  
  // Warnings & alerts
  warnings: [
    {
      category: 'string', // "scams", "safety", "cultural", "practical"
      warning: 'string', // The actual warning
      areas: ['string'], // Where this applies (optional)
      mitigation: 'string', // How to avoid/handle it
    },
  ],
  
  // Additional practical info
  essentialInfo: {
    localCurrency: 'string', // e.g., "EUR"
    timeZone: 'string', // e.g., "WET/WEST"
    language: 'string', // Primary language
    voltage: 'string', // e.g., "230V, 50Hz"
    simCard: 'string', // Recommendation for mobile
    vaccinations: 'string', // If any needed
    visaInfo: 'string', // Visa requirements
    emergencyNumber: 'string', // Police/ambulance
  },
  
  // Metadata
  metadata: {
    createdAt: 'string', // ISO timestamp
    generatedBy: 'string', // "gemini-v1", "gpt-4", etc.
    version: 'number', // Schema version for migrations
    userId: 'string', // Optional: who created it
    isShared: 'boolean',
    shareToken: 'string', // Optional: for sharing
  },
};

/**
 * Create a minimal valid itinerary (for testing/fallback)
 */
export function createMinimalItinerary(destination, days = 3) {
  const today = new Date();
  const start = today.toISOString().split('T')[0];
  const end = new Date(today.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  return {
    destination,
    startDate: start,
    endDate: end,
    days,
    travelStyle: 'balanced',
    tripPace: 'balanced',
    budget: 'comfortable',
    summary: {
      title: `${destination} Trip`,
      description: `${days}-day trip to ${destination}`,
      highlights: [],
    },
    travelerProfile: {
      interests: [],
      budget: 'comfortable',
      pace: 'balanced',
    },
    flights: {
      overview: 'Flights info coming soon',
      options: [],
      externalLinks: {},
      disclaimer: 'Prices are estimates. Confirm on booking sites.',
    },
    accommodation: {
      overview: 'Accommodation options coming soon',
      recommendedArea: destination,
      alternativeAreas: [],
      hotels: [],
      externalLinks: {},
      disclaimer: 'Verify prices and availability on booking sites.',
    },
    airportTransfer: {
      overview: 'Transfer options coming soon',
      options: [],
      warnings: [],
    },
    localTransport: {
      overview: 'Transport options coming soon',
      recommendations: [],
      usefulApps: [],
    },
    dailyPlan: Array.from({ length: days }, (_, i) => ({
      dayNumber: i + 1,
      title: `Day ${i + 1}`,
      objective: `Explore ${destination}`,
      energyLevel: 'moderate',
      periods: {
        morning: { title: 'Morning', activities: [] },
        afternoon: { title: 'Afternoon', activities: [] },
        evening: { title: 'Evening', activities: [] },
      },
      transport: [],
      totalCost: 0,
      notes: '',
    })),
    budget: {
      totalEstimated: 0,
      perDayAverage: 0,
      scenarios: [],
    },
    foodRecommendations: [],
    bookingChecklist: [],
    warnings: [],
    essentialInfo: {},
    metadata: {
      createdAt: new Date().toISOString(),
      generatedBy: 'minimal',
      version: 1,
    },
  };
}

/**
 * Validate itinerary against schema
 * Returns { valid: boolean, errors: string[], warnings: string[] }
 */
export function validateItinerary(itinerary) {
  const errors = [];
  const warnings = [];
  
  if (!itinerary || typeof itinerary !== 'object') {
    return { valid: false, errors: ['Itinerary must be an object'], warnings };
  }
  
  // Required fields
  if (!itinerary.destination) errors.push('Missing required field: destination');
  if (!itinerary.startDate) errors.push('Missing required field: startDate');
  if (!itinerary.endDate) errors.push('Missing required field: endDate');
  if (!itinerary.days || typeof itinerary.days !== 'number') {
    errors.push('Missing or invalid required field: days (must be a number)');
  }
  
  // Validate date format
  if (itinerary.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(itinerary.startDate)) {
    errors.push('startDate must be in ISO format (YYYY-MM-DD)');
  }
  if (itinerary.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(itinerary.endDate)) {
    errors.push('endDate must be in ISO format (YYYY-MM-DD)');
  }
  
  // Validate daily plan
  if (!Array.isArray(itinerary.dailyPlan)) {
    warnings.push('dailyPlan should be an array');
  } else if (itinerary.dailyPlan.length !== itinerary.days) {
    warnings.push(`dailyPlan has ${itinerary.dailyPlan.length} days but duration is ${itinerary.days}`);
  }
  
  // Check for undefined/null values that would break UI
  const checkForUndefined = (obj, path = '') => {
    for (const [key, value] of Object.entries(obj || {})) {
      const fullPath = path ? `${path}.${key}` : key;
      if (value === undefined) {
        warnings.push(`Found undefined value at ${fullPath}`);
      } else if (value === null && ['title', 'name', 'description'].includes(key)) {
        warnings.push(`Null text field at ${fullPath}`);
      }
    }
  };
  
  checkForUndefined(itinerary);
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
