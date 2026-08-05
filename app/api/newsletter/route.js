import { createHash, randomUUID } from 'node:crypto';
import { apiError, cleanLocale, cleanString, readJsonBody } from '../../lib/api-utils';
import { createNewsletterSubscriber } from '../../lib/supabase/db';
import { checkRateLimit, getRateLimitHeaders } from '../../lib/server/rate-limit';
import { logger } from '../../lib/logger';

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

/**
 * Generates a verification token and its hash for double opt-in.
 * The raw token is sent to the subscriber; the hash is stored.
 */
function generateVerificationToken() {
  const raw = randomUUID();
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
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

  // Rate limiting
  const rateResult = await checkRateLimit('newsletter', null, req);
  if (!rateResult.allowed) {
    return new Response(
      JSON.stringify({ ok: false, code: 'RATE_LIMIT_EXCEEDED', message: 'Demasiados pedidos. Tenta mais tarde.' }),
      { status: 429, headers: { 'Content-Type': 'application/json', ...getRateLimitHeaders(rateResult) } },
    );
  }

  const verification = generateVerificationToken();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48h

  const result = await createNewsletterSubscriber({
    email,
    source: cleanString(body.source, 'newsletter_popup', 80),
    locale: cleanLocale(body.locale),
    status: 'pending_verification',
    verificationTokenHash: verification.hash,
    verificationExpiresAt: expiresAt,
    metadata: {
      page: safePagePath(body.page),
      consent: 'newsletter_marketing_v1',
      consentedAt: new Date().toISOString(),
      doubleOptIn: true,
    },
  });

  if (!result.ok) {
    return apiError(
      'PERSISTENCE_UNAVAILABLE',
      'A subscrição não foi guardada. Tenta novamente mais tarde.',
      503,
      true,
    );
  }

  // In production, the verification token would be sent via email.
  // For now, we log it in development and return only the subscription status.
  if (process.env.NODE_ENV === 'development') {
    logger.info('newsletter_verification_token', {
      email: email.slice(0, 3) + '***',
      token: verification.raw,
      expiresAt,
    });
  }

  return Response.json({
    ok: true,
    status: 'pending_verification',
    provider: result.provider,
    id: result.id || null,
    // Include verification token only in development for testing
    ...(process.env.NODE_ENV === 'development' ? { _devVerificationToken: verification.raw } : {}),
  }, {
    headers: { ...getRateLimitHeaders(rateResult) },
  });
}
