import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const destination = body.destination || 'Lisboa, Portugal';
    const departureDate = body.departureDate || new Date().toISOString().slice(0, 10);
    const passengers = Number(body.passengers || 1);

    // Duffel integration if API key is provided
    if (process.env.DUFFEL_API_KEY) {
      try {
        const response = await fetch('https://api.duffel.com/air/offer_requests', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.DUFFEL_API_KEY}`,
            'Duffel-Version': 'v1',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: {
              slices: [
                {
                  origin: 'LIS', // default origin
                  destination: destination.slice(0, 3).toUpperCase(),
                  departure_date: departureDate,
                },
              ],
              passengers: Array.from({ length: passengers }, () => ({ type: 'adult' })),
              cabin_class: 'economy',
            },
          }),
        });
        if (response.ok) {
          const payload = await response.json();
          return NextResponse.json({ source: 'duffel', offers: payload.data.offers });
        }
      } catch (apiError) {
        console.error('Duffel API error, falling back to simulator:', apiError);
      }
    }

    // Dynamic Live Simulator based on input date/destination
    const hash = String(destination + departureDate).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const basePrice = 120 + (hash % 280);

    const mockFlights = [
      {
        id: `fl-tap-${hash % 900}`,
        airline: 'TAP Air Portugal',
        logo: '🇵🇹',
        flightNumber: `TP-${100 + (hash % 899)}`,
        departureTime: '08:15',
        arrivalTime: '11:30',
        duration: '3h 15m',
        stops: 0,
        priceCents: Math.round(basePrice * 100 * passengers),
        cabinClass: 'Económica',
        seatsAvailable: 7,
      },
      {
        id: `fl-lh-${hash % 900}`,
        airline: 'Lufthansa',
        logo: '🇩🇪',
        flightNumber: `LH-${1200 + (hash % 800)}`,
        departureTime: '12:40',
        arrivalTime: '18:10',
        duration: '5h 30m',
        stops: 1,
        priceCents: Math.round((basePrice * 0.9) * 100 * passengers),
        cabinClass: 'Económica',
        seatsAvailable: 4,
      },
      {
        id: `fl-af-${hash % 900}`,
        airline: 'Air France',
        logo: '🇫🇷',
        flightNumber: `AF-${1400 + (hash % 600)}`,
        departureTime: '15:20',
        arrivalTime: '18:45',
        duration: '3h 25m',
        stops: 0,
        priceCents: Math.round((basePrice * 1.15) * 100 * passengers),
        cabinClass: 'Executiva',
        seatsAvailable: 3,
      },
    ];

    return NextResponse.json({
      source: 'simulator',
      search: { destination, departureDate, passengers },
      offers: mockFlights,
    });
  } catch (error) {
    return NextResponse.json({ error: { message: 'Erro ao pesquisar tarifas de voos.' } }, { status: 500 });
  }
}
