import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const destination = body.destination || 'Lisboa, Portugal';
    const checkIn = body.checkIn || new Date().toISOString().slice(0, 10);
    const checkOut = body.checkOut || new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10);
    const guests = Number(body.guests || 2);

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.max(1, Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));

    const hash = String(destination + checkIn).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseRate = 80 + (hash % 180);

    const mockHotels = [
      {
        id: `ht-grand-${hash % 900}`,
        name: `Grand Palace Hotel ${destination.split(',')[0]}`,
        rating: 4.8,
        stars: 5,
        photo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80',
        roomType: 'Quarto Deluxe King',
        amenities: ['Wi-Fi Grátis', 'Piscina Interior', 'Pequeno-almoço incluído', 'Spa'],
        ratePerNightCents: Math.round(baseRate * 1.4 * 100),
        totalPriceCents: Math.round(baseRate * 1.4 * 100 * nights),
        nights,
        guests,
      },
      {
        id: `ht-boutique-${hash % 900}`,
        name: `Boutique Art Deco Residency`,
        rating: 4.5,
        stars: 4,
        photo: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=400&q=80',
        roomType: 'Quarto Superior Queen',
        amenities: ['Wi-Fi Grátis', 'AC', 'Varanda Privada'],
        ratePerNightCents: Math.round(baseRate * 100),
        totalPriceCents: Math.round(baseRate * 100 * nights),
        nights,
        guests,
      },
      {
        id: `ht-comfort-${hash % 900}`,
        name: `Comfort Suite Central`,
        rating: 4.1,
        stars: 3,
        photo: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=400&q=80',
        roomType: 'Quarto Standard Duplo',
        amenities: ['Wi-Fi Grátis', 'Estacionamento', 'Animais permitidos'],
        ratePerNightCents: Math.round(baseRate * 0.75 * 100),
        totalPriceCents: Math.round(baseRate * 0.75 * 100 * nights),
        nights,
        guests,
      },
    ];

    return NextResponse.json({
      source: 'simulator',
      search: { destination, checkIn, checkOut, guests, nights },
      hotels: mockHotels,
    });
  } catch (error) {
    return NextResponse.json({ error: { message: 'Erro ao pesquisar tarifas de alojamento.' } }, { status: 500 });
  }
}
