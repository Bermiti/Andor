import { apiError, cleanLocale, cleanString, readJsonBody } from '../../lib/api-utils';
import { createNewsletterSubscriber } from '../../lib/supabase/db';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

  const result = await createNewsletterSubscriber({
    email,
    source: cleanString(body.source, 'newsletter_popup', 80),
    locale: cleanLocale(body.locale),
    metadata: {
      page: cleanString(body.page, '', 240),
      userAgent: cleanString(req.headers.get('user-agent'), '', 240),
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
