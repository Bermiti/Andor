import { z } from 'zod';
import { readJsonBody } from '../../../../../lib/api-utils';
import { getRequestIdentity } from '../../../../../lib/server/identity';
import {
  revokeTripMember,
  updateTripMember,
} from '../../../../../lib/server/membership-repository';
import {
  errorWithCorrelation,
  getCorrelationId,
  jsonWithCorrelation,
} from '../../../../../lib/server/request-context';

export const runtime = 'nodejs';

const idSchema = z.uuid();
const updateSchema = z.object({ role: z.enum(['editor', 'viewer']) }).strict();
const MAX_BODY_BYTES = 4_096;

function repositoryError(result, correlationId) {
  if (result.status === 'forbidden') {
    return errorWithCorrelation('MEMBERS_FORBIDDEN', 'Nao tens permissao para gerir membros.', 403, correlationId);
  }
  if (result.status === 'owner_immutable') {
    return errorWithCorrelation('OWNER_IMMUTABLE', 'O proprietario da viagem nao pode ser alterado ou removido.', 409, correlationId);
  }
  if (result.status === 'persistence_unavailable') {
    return errorWithCorrelation('PERSISTENCE_UNAVAILABLE', 'Persistencia duravel indisponivel.', 503, correlationId, { retryable: true });
  }
  if (result.status === 'storage_error') {
    return errorWithCorrelation('MEMBERS_STORAGE_ERROR', 'Nao foi possivel gerir o membro.', 500, correlationId, { retryable: true });
  }
  return errorWithCorrelation('MEMBER_NOT_FOUND', 'Membro nao encontrado.', 404, correlationId);
}

async function routeContext(req, context) {
  const correlationId = getCorrelationId(req);
  const { id, userId } = await context.params;
  if (!idSchema.safeParse(id).success || !idSchema.safeParse(userId).success) {
    return { error: errorWithCorrelation('MEMBER_NOT_FOUND', 'Membro nao encontrado.', 404, correlationId) };
  }
  const identity = await getRequestIdentity();
  if (!identity?.authenticated || !identity.userId) {
    return { error: errorWithCorrelation('AUTH_REQUIRED', 'Sessao nao autenticada.', 401, correlationId) };
  }
  return { id, memberUserId: userId, identity, correlationId };
}

export async function PATCH(req, context) {
  const request = await routeContext(req, context);
  if (request.error) return request.error;
  if (Number(req.headers.get('content-length') || 0) > MAX_BODY_BYTES) {
    return errorWithCorrelation('MEMBER_UPDATE_TOO_LARGE', 'A alteracao excede o limite permitido.', 413, request.correlationId);
  }
  const parsed = updateSchema.safeParse(await readJsonBody(req, 'update_trip_member'));
  if (!parsed.success) {
    return errorWithCorrelation('INVALID_MEMBER_ROLE', 'Escolhe o papel editor ou viewer.', 422, request.correlationId);
  }
  const result = await updateTripMember({
    tripId: request.id,
    memberUserId: request.memberUserId,
    role: parsed.data.role,
  }, request.identity);
  if (!result.ok) return repositoryError(result, request.correlationId);
  return jsonWithCorrelation(
    { ok: true, role: result.role, persistence: result.provider },
    { headers: { 'Cache-Control': 'no-store, private' } },
    request.correlationId
  );
}

export async function DELETE(req, context) {
  const request = await routeContext(req, context);
  if (request.error) return request.error;
  const result = await revokeTripMember({
    tripId: request.id,
    memberUserId: request.memberUserId,
  }, request.identity);
  if (!result.ok) return repositoryError(result, request.correlationId);
  return jsonWithCorrelation(
    { ok: true, revokedAt: result.revokedAt, persistence: result.provider },
    { headers: { 'Cache-Control': 'no-store, private' } },
    request.correlationId
  );
}
