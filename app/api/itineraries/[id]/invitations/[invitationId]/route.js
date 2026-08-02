import { z } from 'zod';
import { getRequestIdentity } from '../../../../../lib/server/identity';
import { revokeTripInvitation } from '../../../../../lib/server/membership-repository';
import {
  errorWithCorrelation,
  getCorrelationId,
  jsonWithCorrelation,
} from '../../../../../lib/server/request-context';

export const runtime = 'nodejs';

const idSchema = z.uuid();

function repositoryError(result, correlationId) {
  if (result.status === 'forbidden') {
    return errorWithCorrelation('MEMBERS_FORBIDDEN', 'Nao tens permissao para gerir convites.', 403, correlationId);
  }
  if (result.status === 'persistence_unavailable') {
    return errorWithCorrelation('PERSISTENCE_UNAVAILABLE', 'Persistencia duravel indisponivel.', 503, correlationId, { retryable: true });
  }
  if (result.status === 'storage_error') {
    return errorWithCorrelation('INVITATION_STORAGE_ERROR', 'Nao foi possivel revogar o convite.', 500, correlationId, { retryable: true });
  }
  return errorWithCorrelation('INVITATION_NOT_FOUND', 'Convite nao encontrado.', 404, correlationId);
}

export async function DELETE(req, context) {
  const correlationId = getCorrelationId(req);
  const { id, invitationId } = await context.params;
  if (!idSchema.safeParse(id).success || !idSchema.safeParse(invitationId).success) {
    return errorWithCorrelation('INVITATION_NOT_FOUND', 'Convite nao encontrado.', 404, correlationId);
  }
  const identity = await getRequestIdentity();
  if (!identity?.authenticated || !identity.userId) {
    return errorWithCorrelation('AUTH_REQUIRED', 'Sessao nao autenticada.', 401, correlationId);
  }
  const result = await revokeTripInvitation({ tripId: id, invitationId }, identity);
  if (!result.ok) return repositoryError(result, correlationId);
  return jsonWithCorrelation(
    { ok: true, revokedAt: result.revokedAt, persistence: result.provider },
    { headers: { 'Cache-Control': 'no-store, private' } },
    correlationId
  );
}
