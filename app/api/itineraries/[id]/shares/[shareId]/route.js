import { z } from 'zod';
import { getRequestIdentity } from '../../../../../lib/server/identity';
import { revokeItineraryShare } from '../../../../../lib/server/share-dal';
import {
  errorWithCorrelation,
  getCorrelationId,
  jsonWithCorrelation,
} from '../../../../../lib/server/request-context';

export const runtime = 'nodejs';

const idSchema = z.uuid();

function resultError(result, correlationId) {
  if (result.status === 'forbidden') {
    return errorWithCorrelation(
      'SHARE_FORBIDDEN',
      'Nao tens permissao para gerir links desta viagem.',
      403,
      correlationId
    );
  }
  if (result.status === 'persistence_unavailable') {
    return errorWithCorrelation(
      'PERSISTENCE_UNAVAILABLE',
      'Persistencia duravel indisponivel.',
      503,
      correlationId,
      { retryable: true }
    );
  }
  if (result.status === 'storage_error') {
    return errorWithCorrelation(
      'SHARE_STORAGE_ERROR',
      'Nao foi possivel revogar o link.',
      500,
      correlationId,
      { retryable: true }
    );
  }
  return errorWithCorrelation('SHARE_NOT_FOUND', 'Link nao encontrado.', 404, correlationId);
}

export async function DELETE(req, context) {
  const correlationId = getCorrelationId(req);
  const { id, shareId } = await context.params;
  if (!idSchema.safeParse(id).success || !idSchema.safeParse(shareId).success) {
    return errorWithCorrelation('SHARE_NOT_FOUND', 'Link nao encontrado.', 404, correlationId);
  }

  const identity = await getRequestIdentity();
  if (!identity?.authenticated || !identity.userId) {
    return errorWithCorrelation('AUTH_REQUIRED', 'Sessao nao autenticada.', 401, correlationId);
  }

  const result = await revokeItineraryShare({ tripId: id, shareId, identity });
  if (!result.ok) return resultError(result, correlationId);
  return jsonWithCorrelation(
    { ok: true, share: result.share },
    { headers: { 'Cache-Control': 'no-store, private' } },
    correlationId
  );
}
