import { z } from 'zod';
import { readJsonBody } from '../../../../lib/api-utils';
import { getRequestIdentity } from '../../../../lib/server/identity';
import {
  createItineraryShare,
  listItineraryShares,
} from '../../../../lib/server/share-dal';
import {
  errorWithCorrelation,
  getCorrelationId,
  jsonWithCorrelation,
} from '../../../../lib/server/request-context';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 1_024;
const idSchema = z.uuid();
const createShareSchema = z.object({
  expiresInDays: z.number().int().min(1).max(90).default(7),
}).strict();

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
      'Nao foi possivel aceder aos links desta viagem.',
      500,
      correlationId,
      { retryable: true }
    );
  }
  return errorWithCorrelation('TRIP_NOT_FOUND', 'Viagem nao encontrada.', 404, correlationId);
}

async function routeIdentity(req, context) {
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
  const request = await routeIdentity(req, context);
  if (request.error) return request.error;

  const result = await listItineraryShares(request.id, request.identity);
  if (!result.ok) return resultError(result, request.correlationId);
  return jsonWithCorrelation(
    { shares: result.shares, persistence: result.provider },
    { headers: { 'Cache-Control': 'no-store, private' } },
    request.correlationId
  );
}

export async function POST(req, context) {
  const request = await routeIdentity(req, context);
  if (request.error) return request.error;

  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return errorWithCorrelation('SHARE_REQUEST_TOO_LARGE', 'Pedido de partilha invalido.', 413, request.correlationId);
  }
  const body = await readJsonBody(req, 'create_itinerary_share');
  const parsed = createShareSchema.safeParse(body);
  if (!parsed.success || Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BODY_BYTES) {
    return errorWithCorrelation(
      'INVALID_SHARE',
      'Indica uma validade entre 1 e 90 dias.',
      422,
      request.correlationId
    );
  }

  const result = await createItineraryShare({
    tripId: request.id,
    expiresInDays: parsed.data.expiresInDays,
    identity: request.identity,
  });
  if (!result.ok) {
    if (result.status === 'invalid') {
      return errorWithCorrelation('INVALID_SHARE', 'Indica uma validade entre 1 e 90 dias.', 422, request.correlationId);
    }
    return resultError(result, request.correlationId);
  }

  const path = `/itinerary/share/${result.token}`;
  return jsonWithCorrelation(
    {
      token: result.token,
      path,
      url: new URL(path, req.url).toString(),
      share: result.share,
      persistence: result.provider,
    },
    { status: 201, headers: { 'Cache-Control': 'no-store, private' } },
    request.correlationId
  );
}
