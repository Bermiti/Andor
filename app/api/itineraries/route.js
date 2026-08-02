import { z } from 'zod';
import { readJsonBody } from '../../lib/api-utils';
import { getRequestIdentity } from '../../lib/server/identity';
import {
  createTripRecord,
  listTripRecords,
} from '../../lib/server/trip-repository';
import {
  errorWithCorrelation,
  getCorrelationId,
  jsonWithCorrelation,
} from '../../lib/server/request-context';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 1_500_000;
const createSchema = z.object({
  itinerary: z.record(z.string(), z.unknown()),
  source: z.enum(['manual', 'generated']).default('manual'),
}).strict();

function authenticated(identity, correlationId) {
  return identity?.authenticated && identity?.userId
    ? null
    : errorWithCorrelation('AUTH_REQUIRED', 'Sessão não autenticada.', 401, correlationId);
}

export async function GET(req) {
  const correlationId = getCorrelationId(req);
  const identity = await getRequestIdentity();
  const authError = authenticated(identity, correlationId);
  if (authError) return authError;

  const result = await listTripRecords(identity);
  if (!result.ok) {
    return errorWithCorrelation(
      'TRIP_LIST_UNAVAILABLE',
      'Não foi possível carregar as viagens.',
      result.status === 'persistence_unavailable' ? 503 : 500,
      correlationId,
      { retryable: true }
    );
  }
  return jsonWithCorrelation(
    { trips: result.trips, persistence: result.provider },
    { headers: { 'Cache-Control': 'no-store, private' } },
    correlationId
  );
}

export async function POST(req) {
  const correlationId = getCorrelationId(req);
  const identity = await getRequestIdentity();
  const authError = authenticated(identity, correlationId);
  if (authError) return authError;

  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return errorWithCorrelation('TRIP_TOO_LARGE', 'A viagem excede o limite permitido.', 413, correlationId);
  }
  const body = await readJsonBody(req, 'create_trip');
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return errorWithCorrelation('INVALID_TRIP', 'Revê os dados da viagem.', 422, correlationId);
  }
  if (Buffer.byteLength(JSON.stringify(parsed.data.itinerary), 'utf8') > MAX_BODY_BYTES) {
    return errorWithCorrelation('TRIP_TOO_LARGE', 'A viagem excede o limite permitido.', 413, correlationId);
  }

  const result = await createTripRecord(parsed.data.itinerary, {
    source: parsed.data.source,
    correlationId,
  }, identity);
  if (!result.ok) {
    const status = result.status === 'conflict' ? 409
      : result.status === 'persistence_unavailable' ? 503 : 500;
    return errorWithCorrelation(
      result.status === 'conflict' ? 'TRIP_CONFLICT' : 'TRIP_CREATE_FAILED',
      result.status === 'conflict' ? 'Já existe uma viagem com esta referência.' : 'Não foi possível guardar a viagem.',
      status,
      correlationId,
      { retryable: status >= 500 }
    );
  }
  return jsonWithCorrelation(
    { trip: result.trip, persistence: result.provider },
    { status: 201, headers: { 'Cache-Control': 'no-store, private' } },
    correlationId
  );
}

