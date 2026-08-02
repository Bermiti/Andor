import { z } from 'zod';
import { readJsonBody } from '../../../lib/api-utils';
import { getRequestIdentity } from '../../../lib/server/identity';
import { importLegacyTrip } from '../../../lib/server/trip-repository';
import {
  errorWithCorrelation,
  getCorrelationId,
  jsonWithCorrelation,
} from '../../../lib/server/request-context';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 4_000_000;
const importSchema = z.object({
  trips: z.array(z.object({
    idempotencyKey: z.string().trim().min(16).max(128),
    itinerary: z.record(z.string(), z.unknown()),
  }).strict()).min(1).max(20),
}).strict();

export async function POST(req) {
  const correlationId = getCorrelationId(req);
  const identity = await getRequestIdentity();
  if (!identity?.authenticated || !identity.userId) {
    return errorWithCorrelation('AUTH_REQUIRED', 'Inicia sessão antes de importar.', 401, correlationId);
  }
  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return errorWithCorrelation('IMPORT_TOO_LARGE', 'A importação excede o limite permitido.', 413, correlationId);
  }
  const body = await readJsonBody(req, 'import_legacy_trips');
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return errorWithCorrelation('INVALID_IMPORT', 'Revê as viagens selecionadas.', 422, correlationId);
  }
  if (Buffer.byteLength(JSON.stringify(parsed.data), 'utf8') > MAX_BODY_BYTES) {
    return errorWithCorrelation('IMPORT_TOO_LARGE', 'A importação excede o limite permitido.', 413, correlationId);
  }

  const results = [];
  for (const item of parsed.data.trips) {
    const result = await importLegacyTrip(item, identity, { correlationId });
    results.push({
      idempotencyKey: item.idempotencyKey,
      ok: result.ok,
      status: result.status,
      tripId: result.tripId || result.trip?.id || null,
      persistence: result.provider || null,
    });
  }
  const conflicts = results.some((result) => result.status === 'conflict');
  const failures = results.some((result) => !result.ok && result.status !== 'conflict');
  if (failures) {
    return jsonWithCorrelation(
      { results, error: { code: 'IMPORT_INCOMPLETE', message: 'Algumas viagens não foram importadas.', retryable: true } },
      { status: 503, headers: { 'Cache-Control': 'no-store, private' } },
      correlationId
    );
  }
  return jsonWithCorrelation(
    { results },
    { status: conflicts ? 409 : 200, headers: { 'Cache-Control': 'no-store, private' } },
    correlationId
  );
}
