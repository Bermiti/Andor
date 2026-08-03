import { describe, it, expect } from 'vitest';
import {
  getFlightSearchLinks,
  getHotelSearchLinks,
  getCarRentalSearchLinks,
  getActivitySearchLinks,
} from '../app/lib/booking-links';

describe('booking-links', () => {
  describe('getFlightSearchLinks', () => {
    it('returns empty array if missing required parameters', () => {
      expect(getFlightSearchLinks({})).toEqual([]);
      expect(getFlightSearchLinks({ origin: 'LIS' })).toEqual([]);
    });

    it('generates valid URLs with all parameters', () => {
      const links = getFlightSearchLinks({
        origin: 'LIS',
        destination: 'JFK',
        departureDate: '2026-10-15',
        returnDate: '2026-10-25',
      });
      
      expect(links).toHaveLength(3);
      expect(links[0].provider).toBe('Skyscanner');
      expect(links[0].url).toBe('https://www.skyscanner.net/transport/flights/LIS/JFK/261015/261025/');
      
      expect(links[1].provider).toBe('Google Flights');
      expect(links[1].url).toBe('https://www.google.com/travel/flights?q=flights%20from%20LIS%20to%20JFK%20on%202026-10-15');
      
      expect(links[2].provider).toBe('Kayak');
      expect(links[2].url).toBe('https://www.kayak.com/flights/LIS-JFK/2026-10-15/2026-10-25');
    });

    it('handles special characters in city names', () => {
      const links = getFlightSearchLinks({
        origin: 'São Paulo',
        destination: 'New York',
        departureDate: '2026-10-15',
      });
      
      expect(links[0].url).toContain('S%C3%A3o%20Paulo');
      expect(links[0].url).toContain('New%20York');
    });

    it('works gracefully without dates', () => {
      const links = getFlightSearchLinks({
        origin: 'LIS',
        destination: 'JFK',
      });
      
      expect(links[0].url).toBe('https://www.skyscanner.net/transport/flights/LIS/JFK/');
      expect(links[1].url).toBe('https://www.google.com/travel/flights?q=flights%20from%20LIS%20to%20JFK');
      expect(links[2].url).toBe('https://www.kayak.com/flights/LIS-JFK');
    });
  });

  describe('getHotelSearchLinks', () => {
    it('returns empty array if missing destination', () => {
      expect(getHotelSearchLinks({})).toEqual([]);
    });

    it('generates valid URLs with all parameters', () => {
      const links = getHotelSearchLinks({
        destination: 'Lisbon',
        checkin: '2026-10-15',
        checkout: '2026-10-25',
      });

      expect(links).toHaveLength(3);
      expect(links[0].provider).toBe('Booking.com');
      expect(links[0].url).toBe('https://www.booking.com/searchresults.html?ss=Lisbon&group_adults=2&no_rooms=1&checkin=2026-10-15&checkout=2026-10-25');
      
      expect(links[1].provider).toBe('Hotels.com');
      expect(links[1].url).toBe('https://www.hotels.com/search.do?q-destination=Lisbon&q-check-in=2026-10-15&q-check-out=2026-10-25');
    });
  });

  describe('getCarRentalSearchLinks', () => {
    it('returns empty array if missing pickup city', () => {
      expect(getCarRentalSearchLinks({})).toEqual([]);
    });

    it('generates valid URLs with all parameters', () => {
      const links = getCarRentalSearchLinks({
        pickupCity: 'Lisbon',
        pickupDate: '2026-10-15',
        dropoffDate: '2026-10-25',
      });

      expect(links).toHaveLength(2);
      expect(links[0].provider).toBe('Rentalcars.com');
      expect(links[0].url).toBe('https://www.rentalcars.com/search-results?location=Lisbon&puDay=15&puMonth=10&puYear=2026&doDay=25&doMonth=10&doYear=2026');
      
      expect(links[1].provider).toBe('Kayak Cars');
      expect(links[1].url).toBe('https://www.kayak.com/cars/Lisbon/2026-10-15/2026-10-25');
    });
  });

  describe('getActivitySearchLinks', () => {
    it('returns empty array if missing destination', () => {
      expect(getActivitySearchLinks({})).toEqual([]);
    });

    it('generates valid URLs', () => {
      const links = getActivitySearchLinks({
        activityName: 'Wine Tour',
        destination: 'Porto',
      });

      expect(links).toHaveLength(2);
      expect(links[0].provider).toBe('GetYourGuide');
      expect(links[0].url).toBe('https://www.getyourguide.com/s/?q=Wine%20Tour%20Porto');
      
      expect(links[1].provider).toBe('Viator');
      expect(links[1].url).toBe('https://www.viator.com/searchResults/all?text=Wine%20Tour%20Porto');
    });
    
    it('generates valid URLs with only destination', () => {
      const links = getActivitySearchLinks({
        destination: 'Porto',
      });

      expect(links).toHaveLength(2);
      expect(links[0].provider).toBe('GetYourGuide');
      expect(links[0].url).toBe('https://www.getyourguide.com/s/?q=Porto');
    });
  });
});
