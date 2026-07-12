import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { itineraryId, items = [], email = 'viajante@andor.travels', currency = 'EUR' } = body;

    if (!itineraryId || items.length === 0) {
      return NextResponse.json({ error: { message: 'Dados incompletos para a transação.' } }, { status: 400 });
    }

    const totalCents = items.reduce((sum, item) => sum + Number(item.amountCents || 0), 0);

    // If Stripe Secret Key is present, configure and launch real Checkout Session
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

        const lineItems = items.map((item) => ({
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: item.name,
              description: item.description || 'Reserva Andor Travels',
            },
            unit_amount: item.amountCents,
          },
          quantity: 1,
        }));

        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const host = req.headers.get('host');
        const successUrl = `${protocol}://${host}/itinerary/${itineraryId}?booking_success=true`;
        const cancelUrl = `${protocol}://${host}/itinerary/${itineraryId}?booking_cancel=true`;

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          customer_email: email,
          line_items: lineItems,
          mode: 'payment',
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: { itineraryId },
        });

        return NextResponse.json({
          url: session.url,
          sessionId: session.id,
          simulated: false,
          totalCents,
        });
      } catch (stripeError) {
        console.error('Stripe Integration Error, falling back to simulated flow:', stripeError);
      }
    }

    // Interactive simulator fallback
    return NextResponse.json({
      url: null,
      sessionId: `mock_session_${Date.now()}_${Math.round(Math.random() * 9999)}`,
      simulated: true,
      totalCents,
    });
  } catch (error) {
    return NextResponse.json({ error: { message: 'Erro ao inicializar processador de pagamentos.' } }, { status: 500 });
  }
}
