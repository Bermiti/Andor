import { getRequestIdentity } from '../../../lib/server/identity';
import { acceptTripInvitation } from '../../../lib/server/membership-repository';
import {
  errorWithCorrelation,
  getCorrelationId,
  jsonWithCorrelation,
} from '../../../lib/server/request-context';

export const runtime = 'nodejs';

function invitationError(result, correlationId) {
  if (result.status === 'expired') {
    return errorWithCorrelation('INVITATION_EXPIRED', 'Este convite expirou.', 410, correlationId);
  }
  if (result.status === 'revoked') {
    return errorWithCorrelation('INVITATION_REVOKED', 'Este convite foi revogado.', 410, correlationId);
  }
  if (result.status === 'forbidden') {
    return errorWithCorrelation('INVITATION_FORBIDDEN', 'Este convite pertence a outra conta.', 403, correlationId);
  }
  if (result.status === 'configuration_error' || result.status === 'persistence_unavailable') {
    return errorWithCorrelation('INVITATION_UNAVAILABLE', 'Os convites estao temporariamente indisponiveis.', 503, correlationId, { retryable: true });
  }
  if (result.status === 'storage_error') {
    return errorWithCorrelation('INVITATION_STORAGE_ERROR', 'Nao foi possivel aceitar o convite.', 500, correlationId, { retryable: true });
  }
  if (result.status === 'invalid_state') {
    return errorWithCorrelation('INVITATION_INVALID_STATE', 'O convite esta inconsistente e requer revisao do proprietario.', 409, correlationId);
  }
  return errorWithCorrelation('INVITATION_NOT_FOUND', 'Convite nao encontrado.', 404, correlationId);
}

export async function POST(req, context) {
  const correlationId = getCorrelationId(req);
  const identity = await getRequestIdentity();
  if (!identity?.authenticated || !identity.userId) {
    return errorWithCorrelation('AUTH_REQUIRED', 'Inicia sessao para aceitar o convite.', 401, correlationId);
  }
  const { token } = await context.params;
  const result = await acceptTripInvitation(token, identity);
  if (!result.ok) return invitationError(result, correlationId);
  return jsonWithCorrelation(
    {
      ok: true,
      status: result.status || 'accepted',
      tripId: result.tripId,
      role: result.role,
      persistence: result.provider,
    },
    { headers: { 'Cache-Control': 'no-store, private' } },
    correlationId
  );
}
