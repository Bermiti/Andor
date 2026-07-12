import { buildBookingProviderLinks } from './booking-ready';

export function generateSearchLinks(itinerary) {
  // We reuse buildBookingProviderLinks which already handles the complex extraction
  // of origin, destination, dates, and travelers. We just wrap it to ensure a consistent API.
  
  if (!itinerary) return {};
  
  const links = buildBookingProviderLinks(itinerary, { profile: itinerary?.trip?.travelerProfile });
  
  const destinationStr = typeof itinerary.destination === 'string' 
    ? itinerary.destination 
    : (itinerary.destination?.city || itinerary.destination?.name || 'Destination');
    
  // Add some fallback links for activities and restaurants
  return {
    ...links,
    activities: {
      tripAdvisor: `https://www.tripadvisor.com/Search?q=things+to+do+in+${encodeURIComponent(destinationStr)}`,
      getYourGuide: `https://www.getyourguide.com/s?q=${encodeURIComponent(destinationStr)}`
    },
    restaurants: {
      googleSearch: `https://www.google.com/search?q=restaurants+in+${encodeURIComponent(destinationStr)}`,
      tripAdvisor: `https://www.tripadvisor.com/Search?q=restaurants+in+${encodeURIComponent(destinationStr)}`
    }
  };
}
