import { apiError } from '../../../lib/api-utils';
import { getRequestIdentity } from '../../../lib/server/identity';
import {
  getItineraryShare,
  revokeItineraryShare,
} from '../../../lib/server/share-dal';

export const runtime = 'nodejs';

function shareError(status) {
  if (status === 'forbidden') {
    return apiError('SHARE_FORBIDDEN', 'Esta partilha e exclusiva da equipa proprietaria.', 403, false);
  }
  if (status === 'expired') {
    return apiError('SHARE_EXPIRED', 'Esta partilha expirou.', 410, false);
  }
  if (status === 'revoked') {
    return apiError('SHARE_REVOKED', 'Esta partilha foi revogada.', 410, false);
  }
  return apiError('SHARE_NOT_FOUND', 'Partilha nao encontrada.', 404, false);
}

export async function GET(_req, context) {
  const { token } = await context.params;
  const identity = await getRequestIdentity();
  const result = await getItineraryShare(token, identity);
  if (!result.ok) return shareError(result.status);

  return Response.json(
    { share: result.share, itinerary: result.payload },
    { headers: { 'Cache-Control': 'no-store, private' } }
  );
}

export async function DELETE(_req, context) {
  const identity = await getRequestIdentity();
  if (!identity) return apiError('AUTH_REQUIRED', 'Sessao nao autenticada.', 401, false);

  const { token } = await context.params;
  const result = await revokeItineraryShare(token, identity);
  if (!result.ok) {
    if (result.status === 'forbidden') return shareError('forbidden');
    if (result.status === 'not_found') return shareError('not_found');
    return apiError('SHARE_REVOKE_FAILED', 'Nao foi possivel revogar a partilha.', 500, true);
  }

  return Response.json(
    { ok: true, share: result.share },
    { headers: { 'Cache-Control': 'no-store, private' } }
  );
}
