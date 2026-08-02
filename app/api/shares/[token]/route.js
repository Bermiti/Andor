import { getItineraryShare } from '../../../lib/server/share-dal';
import {
  errorWithCorrelation,
  getCorrelationId,
  jsonWithCorrelation,
} from '../../../lib/server/request-context';

export const runtime = 'nodejs';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function unavailable(correlationId) {
  return errorWithCorrelation(
    'SHARE_NOT_FOUND',
    'Partilha nao encontrada.',
    404,
    correlationId,
    { headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } }
  );
}

export async function GET(req, context) {
  const correlationId = getCorrelationId(req);
  const { token } = await context.params;
  if (!TOKEN_PATTERN.test(String(token || ''))) return unavailable(correlationId);

  const result = await getItineraryShare(token);
  if (!result.ok) {
    if (['persistence_unavailable', 'storage_error'].includes(result.status)) {
      return errorWithCorrelation(
        'SHARE_UNAVAILABLE',
        'A partilha esta temporariamente indisponivel.',
        503,
        correlationId,
        {
          retryable: true,
          headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
        }
      );
    }
    return unavailable(correlationId);
  }

  return jsonWithCorrelation(
    { share: result.share, itinerary: result.payload },
    {
      headers: {
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    },
    correlationId
  );
}
