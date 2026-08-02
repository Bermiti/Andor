import { z } from 'zod';
import { readJsonBody } from '../../../lib/api-utils';
import { getRequestIdentity } from '../../../lib/server/identity';
import {
  deleteTripRecord,
  getTripRecord,
  updateTripRecord,
} from '../../../lib/server/trip-repository';
import {
  errorWithCorrelation,
  getCorrelationId,
  jsonWithCorrelation,
} from '../../../lib/server/request-context';

export const runtime = 'nodejs';

const idSchema = z.uuid();
const updateSchema = z.object({
  itinerary: z.record(z.string(), z.unknown()),
}).strict();
const MAX_BODY_BYTES = 1_500_000;

function parseVersionHeader(request) {
  const raw = request.headers.get('if-match')?.trim();
  if (!raw) return null;
  const match = raw.match(/^(?:W\/)?"?(\d+)"?$/);
  const version = match ? Number(match[1]) : NaN;
  return Number.isInteger(version) && version > 0 ? version : null;
}

function mapRepositoryError(result, correlationId) {
  if (result.status === 'forbidden') {
    return errorWithCorrelation('TRIP_FORBIDDEN', 'Não tens permissão para esta operação.', 403, correlationId);
  }
  if (result.status === 'conflict') {
    return errorWithCorrelation(
      'TRIP_VERSION_CONFLICT',
      'A viagem foi alterada noutro local. Recarrega antes de guardar.',
      409,
      correlationId,
      { currentVersion: result.currentVersion }
    );
  }
  if (result.status === 'persistence_unavailable') {
    return errorWithCorrelation('PERSISTENCE_UNAVAILABLE', 'Persistência durável indisponível.', 503, correlationId, { retryable: true });
  }
  if (result.status === 'storage_error') {
    return errorWithCorrelation('TRIP_STORAGE_ERROR', 'Não foi possível aceder à viagem.', 500, correlationId, { retryable: true });
  }
  // A private resource is deliberately non-enumerating for outsiders.
  return errorWithCorrelation('TRIP_NOT_FOUND', 'Viagem não encontrada.', 404, correlationId);
}

async function routeIdentity(request, context) {
  const correlationId = getCorrelationId(request);
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) {
    return { error: errorWithCorrelation('TRIP_NOT_FOUND', 'Viagem não encontrada.', 404, correlationId) };
  }
  const identity = await getRequestIdentity();
  if (!identity?.authenticated || !identity.userId) {
    return { error: errorWithCorrelation('AUTH_REQUIRED', 'Sessão não autenticada.', 401, correlationId) };
  }
  return { id, identity, correlationId };
}

export async function GET(req, context) {
  const request = await routeIdentity(req, context);
  if (request.error) return request.error;
  const result = await getTripRecord(request.id, request.identity);
  if (!result.ok) return mapRepositoryError(result, request.correlationId);
  return jsonWithCorrelation(
    { trip: result.trip, itinerary: result.trip.itinerary },
    { headers: { 'Cache-Control': 'no-store, private', ETag: `"${result.trip.version}"` } },
    request.correlationId
  );
}

export async function PATCH(req, context) {
  const request = await routeIdentity(req, context);
  if (request.error) return request.error;
  const expectedVersion = parseVersionHeader(req);
  if (!expectedVersion) {
    return errorWithCorrelation(
      'PRECONDITION_REQUIRED',
      'Envia a versão atual no cabeçalho If-Match.',
      428,
      request.correlationId
    );
  }
  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return errorWithCorrelation('TRIP_TOO_LARGE', 'A viagem excede o limite permitido.', 413, request.correlationId);
  }
  const parsed = updateSchema.safeParse(await readJsonBody(req, 'update_trip'));
  if (!parsed.success) {
    return errorWithCorrelation('INVALID_TRIP', 'Revê os dados da viagem.', 422, request.correlationId);
  }
  if (Buffer.byteLength(JSON.stringify(parsed.data.itinerary), 'utf8') > MAX_BODY_BYTES) {
    return errorWithCorrelation('TRIP_TOO_LARGE', 'A viagem excede o limite permitido.', 413, request.correlationId);
  }
  const result = await updateTripRecord(
    request.id,
    parsed.data.itinerary,
    expectedVersion,
    request.identity,
    { correlationId: request.correlationId }
  );
  if (!result.ok) return mapRepositoryError(result, request.correlationId);
  return jsonWithCorrelation(
    { ok: true, trip: result.trip, persistence: result.provider },
    { headers: { 'Cache-Control': 'no-store, private', ETag: `"${result.trip.version}"` } },
    request.correlationId
  );
}

export async function DELETE(req, context) {
  const request = await routeIdentity(req, context);
  if (request.error) return request.error;
  const result = await deleteTripRecord(request.id, request.identity, { correlationId: request.correlationId });
  if (!result.ok) return mapRepositoryError(result, request.correlationId);
  return jsonWithCorrelation(
    { ok: true, deletedAt: result.deletedAt, deleteMode: 'soft' },
    { headers: { 'Cache-Control': 'no-store, private' } },
    request.correlationId
  );
}
