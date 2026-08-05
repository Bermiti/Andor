import { apiError, cleanLocale, cleanString, readJsonBody } from '../../lib/api-utils';
import { createNewsletterSubscriber } from '../../lib/supabase/db';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safePagePath(value) {
  const raw = cleanString(value, '', 240);
  if (!raw.startsWith('/')) return '';
  try {
    const pathname = new URL(raw, 'https://andor.invalid').pathname;
    return pathname
      .replace(/^\/invitations\/[^/]+/i, '/invitations/:token')
      .replace(/^\/itinerary\/share\/[^/]+/i, '/itinerary/share/:token')
      .replace(/^\/itinerary\/(?!share(?:\/|$)|tokyo-food(?:\/|$)|hidden-gems-lisbon(?:\/|$))[^/]+/i, '/itinerary/:id');
  } catch {
    return '';
  }
}

export async function POST(req) {
  const body = await readJsonBody(req, 'newsletter');
  if (!body || typeof body !== 'object') {
    return apiError('MALFORMED_JSON', 'Pedido invalido.', 400, false);
  }

  const email = cleanString(body.email, '', 180).toLowerCase();
  if (!email || !isValidEmail(email)) {
    return apiError('INVALID_EMAIL', 'Indica um email valido.', 400, false);
  }
  if (body.consent !== true) {
    return apiError(
      'CONSENT_REQUIRED',
      'Confirma que aceitas receber comunicações da Andor.',
      422,
      false,
    );
  }

  const result = await createNewsletterSubscriber({
    email,
    source: cleanString(body.source, 'newsletter_popup', 80),
    locale: cleanLocale(body.locale),
    metadata: {
      page: safePagePath(body.page),
      consent: 'newsletter_marketing_v1',
      consentedAt: new Date().toISOString(),
    },
  });

  if (!result.ok) {
    return apiError(
      'PERSISTENCE_UNAVAILABLE',
      'A subscrição não foi guardada. Tenta novamente mais tarde.',
      503,
      true
    );
  }

  return Response.json({
    ok: true,
    provider: result.provider,
    id: result.id || null,
  });
}
