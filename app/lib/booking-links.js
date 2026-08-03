/**
 * @typedef {Object} BookingLink
 * @property {string} provider
 * @property {string} url
 * @property {string} icon
 */

/**
 * Formats a date object to YYMMDD
 * @param {Date|string} date
 * @returns {string}
 */
const toYYMMDD = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear().toString().slice(-2);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
};

/**
 * Formats a date object to YYYY-MM-DD
 * @param {Date|string} date
 * @returns {string}
 */
const toYYYYMMDD = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Generates flight search links for various providers
 * @param {Object} params
 * @param {string} params.origin
 * @param {string} params.destination
 * @param {Date|string} [params.departureDate]
 * @param {Date|string} [params.returnDate]
 * @param {number} [params.adults=1]
 * @param {number} [params.children=0]
 * @returns {BookingLink[]}
 */
export function getFlightSearchLinks({ origin, destination, departureDate, returnDate, adults = 1, children = 0 }) {
  if (!origin || !destination) return [];
  
  const originEnc = encodeURIComponent(origin);
  const destEnc = encodeURIComponent(destination);
  
  const depYYMMDD = toYYMMDD(departureDate);
  const retYYMMDD = toYYMMDD(returnDate);
  const depYYYYMMDD = toYYYYMMDD(departureDate);
  const retYYYYMMDD = toYYYYMMDD(returnDate);

  const links = [];

  // Skyscanner
  let skyscannerUrl = `https://www.skyscanner.net/transport/flights/${originEnc}/${destEnc}/`;
  if (depYYMMDD) {
    skyscannerUrl += `${depYYMMDD}/`;
    if (retYYMMDD) {
      skyscannerUrl += `${retYYMMDD}/`;
    }
  }
  links.push({
    provider: 'Skyscanner',
    url: skyscannerUrl,
    icon: '✈️'
  });

  // Google Flights
  let googleQuery = `flights from ${origin} to ${destination}`;
  if (depYYYYMMDD) {
    googleQuery += ` on ${depYYYYMMDD}`;
  }
  links.push({
    provider: 'Google Flights',
    url: `https://www.google.com/travel/flights?q=${encodeURIComponent(googleQuery)}`,
    icon: '✈️'
  });

  // Kayak
  let kayakUrl = `https://www.kayak.com/flights/${originEnc}-${destEnc}/`;
  if (depYYYYMMDD) {
    kayakUrl += `${depYYYYMMDD}/`;
    if (retYYYYMMDD) {
      kayakUrl += `${retYYYYMMDD}`;
    }
  }
  links.push({
    provider: 'Kayak',
    url: kayakUrl.endsWith('/') ? kayakUrl.slice(0, -1) : kayakUrl,
    icon: '✈️'
  });

  return links;
}

/**
 * Generates hotel search links for various providers
 * @param {Object} params
 * @param {string} params.destination
 * @param {Date|string} [params.checkin]
 * @param {Date|string} [params.checkout]
 * @param {number} [params.adults=2]
 * @param {number} [params.rooms=1]
 * @returns {BookingLink[]}
 */
export function getHotelSearchLinks({ destination, checkin, checkout, adults = 2, rooms = 1 }) {
  if (!destination) return [];

  const destEnc = encodeURIComponent(destination);
  const checkinStr = toYYYYMMDD(checkin);
  const checkoutStr = toYYYYMMDD(checkout);

  const links = [];

  // Booking.com
  let bookingUrl = `https://www.booking.com/searchresults.html?ss=${destEnc}&group_adults=${adults}&no_rooms=${rooms}`;
  if (checkinStr) bookingUrl += `&checkin=${checkinStr}`;
  if (checkoutStr) bookingUrl += `&checkout=${checkoutStr}`;
  links.push({
    provider: 'Booking.com',
    url: bookingUrl,
    icon: '🏨'
  });

  // Hotels.com
  let hotelsUrl = `https://www.hotels.com/search.do?q-destination=${destEnc}`;
  if (checkinStr) hotelsUrl += `&q-check-in=${checkinStr}`;
  if (checkoutStr) hotelsUrl += `&q-check-out=${checkoutStr}`;
  links.push({
    provider: 'Hotels.com',
    url: hotelsUrl,
    icon: '🏨'
  });

  // Hostelworld
  let hostelUrl = `https://www.hostelworld.com/s?q=${destEnc}`;
  if (checkinStr) hostelUrl += `&dateFrom=${checkinStr}`;
  if (checkoutStr) hostelUrl += `&dateTo=${checkoutStr}`;
  links.push({
    provider: 'Hostelworld',
    url: hostelUrl,
    icon: '🏨'
  });

  return links;
}

/**
 * Generates car rental search links for various providers
 * @param {Object} params
 * @param {string} params.pickupCity
 * @param {Date|string} [params.pickupDate]
 * @param {Date|string} [params.dropoffDate]
 * @returns {BookingLink[]}
 */
export function getCarRentalSearchLinks({ pickupCity, pickupDate, dropoffDate }) {
  if (!pickupCity) return [];

  const cityEnc = encodeURIComponent(pickupCity);
  const puStr = toYYYYMMDD(pickupDate);
  const doStr = toYYYYMMDD(dropoffDate);

  const links = [];

  // Rentalcars.com
  let rentalCarsUrl = `https://www.rentalcars.com/search-results?location=${cityEnc}`;
  if (pickupDate) {
    const d = new Date(pickupDate);
    if (!isNaN(d.getTime())) {
      rentalCarsUrl += `&puDay=${d.getDate().toString().padStart(2, '0')}&puMonth=${(d.getMonth() + 1).toString().padStart(2, '0')}&puYear=${d.getFullYear()}`;
    }
  }
  if (dropoffDate) {
    const d = new Date(dropoffDate);
    if (!isNaN(d.getTime())) {
      rentalCarsUrl += `&doDay=${d.getDate().toString().padStart(2, '0')}&doMonth=${(d.getMonth() + 1).toString().padStart(2, '0')}&doYear=${d.getFullYear()}`;
    }
  }
  links.push({
    provider: 'Rentalcars.com',
    url: rentalCarsUrl,
    icon: '🚗'
  });

  // Kayak Cars
  let kayakUrl = `https://www.kayak.com/cars/${cityEnc}/`;
  if (puStr) {
    kayakUrl += `${puStr}/`;
    if (doStr) {
      kayakUrl += `${doStr}`;
    }
  }
  links.push({
    provider: 'Kayak Cars',
    url: kayakUrl.endsWith('/') ? kayakUrl.slice(0, -1) : kayakUrl,
    icon: '🚗'
  });

  return links;
}

/**
 * Generates activity search links for various providers
 * @param {Object} params
 * @param {string} params.activityName
 * @param {string} params.destination
 * @returns {BookingLink[]}
 */
export function getActivitySearchLinks({ activityName, destination }) {
  if (!destination) return [];
  
  const query = activityName ? `${activityName} ${destination}` : destination;
  const qEnc = encodeURIComponent(query);
  
  return [
    {
      provider: 'GetYourGuide',
      url: `https://www.getyourguide.com/s/?q=${qEnc}`,
      icon: '🎫'
    },
    {
      provider: 'Viator',
      url: `https://www.viator.com/searchResults/all?text=${qEnc}`,
      icon: '🎫'
    }
  ];
}
