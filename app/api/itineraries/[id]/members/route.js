import { z } from 'zod';
import { readJsonBody } from '../../../../lib/api-utils';
import { getRequestIdentity } from '../../../../lib/server/identity';
import {
  createTripInvitation,
  listTripAccess,
} from '../../../../lib/server/membership-repository';
import {
  errorWithCorrelation,
  getCorrelationId,
  jsonWithCorrelation,
} from '../../../../lib/server/request-context';

export const runtime = 'nodejs';

const idSchema = z.uuid();
const invitationSchema = z.object({
  email: z.email().max(254),
  role: z.enum(['editor', 'viewer']),
}).strict();
const MAX_BODY_BYTES = 8_192;

function repositoryError(result, correlationId) {
  if (result.status === 'forbidden') {
    return errorWithCorrelation('MEMBERS_FORBIDDEN', 'Nao tens permissao para gerir membros.', 403, correlationId);
  }
  if (result.status === 'conflict') {
    return errorWithCorrelation('INVITATION_CONFLICT', 'Ja existe um convite equivalente.', 409, correlationId);
  }
  if (result.status === 'configuration_error') {
    return errorWithCorrelation('INVITATION_UNAVAILABLE', 'Os convites nao estao configurados.', 503, correlationId);
  }
  if (result.status === 'persistence_unavailable') {
    return errorWithCorrelation('PERSISTENCE_UNAVAILABLE', 'Persistencia duravel indisponivel.', 503, correlationId, { retryable: true });
  }
  if (result.status === 'storage_error') {
    return errorWithCorrelation('MEMBERS_STORAGE_ERROR', 'Nao foi possivel gerir os membros.', 500, correlationId, { retryable: true });
  }
  return errorWithCorrelation('TRIP_NOT_FOUND', 'Viagem nao encontrada.', 404, correlationId);
}

async function routeContext(req, context) {
  const correlationId = getCorrelationId(req);
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) {
    return { error: errorWithCorrelation('TRIP_NOT_FOUND', 'Viagem nao encontrada.', 404, correlationId) };
  }
  const identity = await getRequestIdentity();
  if (!identity?.authenticated || !identity.userId) {
    return { error: errorWithCorrelation('AUTH_REQUIRED', 'Sessao nao autenticada.', 401, correlationId) };
  }
  return { id, identity, correlationId };
}

export async function GET(req, context) {
  const request = await routeContext(req, context);
  if (request.error) return request.error;
  const result = await listTripAccess(request.id, request.identity);
  if (!result.ok) return repositoryError(result, request.correlationId);
  return jsonWithCorrelation(
    { members: result.members, invitations: result.invitations, persistence: result.provider },
    { headers: { 'Cache-Control': 'no-store, private' } },
    request.correlationId
  );
}

export async function POST(req, context) {
  const request = await routeContext(req, context);
  if (request.error) return request.error;
  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return errorWithCorrelation('INVITATION_TOO_LARGE', 'O convite excede o limite permitido.', 413, request.correlationId);
  }
  const parsed = invitationSchema.safeParse(await readJsonBody(req, 'create_trip_invitation'));
  if (!parsed.success) {
    return errorWithCorrelation('INVALID_INVITATION', 'Indica um email valido e o papel editor ou viewer.', 422, request.correlationId);
  }
  const result = await createTripInvitation({ tripId: request.id, ...parsed.data }, request.identity);
  if (!result.ok) return repositoryError(result, request.correlationId);
  const acceptUrl = new URL(`/invitations/${result.token}`, req.url).toString();
  return jsonWithCorrelation(
    {
      invitation: result.invitation,
      acceptUrl,
      persistence: result.provider,
    },
    { status: 201, headers: { 'Cache-Control': 'no-store, private' } },
    request.correlationId
  );
}
