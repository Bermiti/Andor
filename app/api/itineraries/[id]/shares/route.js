import { z } from 'zod';
import { apiError, readJsonBody } from '../../../../lib/api-utils';
import { getRequestIdentity } from '../../../../lib/server/identity';
import {
  createItineraryShare,
  listItineraryShares,
} from '../../../../lib/server/share-dal';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 1_500_000;
const createShareSchema = z.object({
  audience: z.enum(['client', 'internal']).default('client'),
  expiresInDays: z.number().int().min(0).max(90).default(7),
  itinerary: z.record(z.string(), z.unknown()),
});

export async function GET(_req, context) {
  const identity = await getRequestIdentity();
  if (!identity) return apiError('AUTH_REQUIRED', 'Sessao nao autenticada.', 401, false);

  const { id } = await context.params;
  const result = await listItineraryShares(id, identity);
  return Response.json(
    { shares: result.shares },
    { headers: { 'Cache-Control': 'no-store, private' } }
  );
}

export async function POST(req, context) {
  const identity = await getRequestIdentity();
  if (!identity) return apiError('AUTH_REQUIRED', 'Sessao nao autenticada.', 401, false);

  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return apiError('SHARE_TOO_LARGE', 'O itinerario excede o limite de partilha.', 413, false);
  }

  const body = await readJsonBody(req, 'create_itinerary_share');
  const parsed = createShareSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('INVALID_SHARE', 'Revê o publico, a validade e o itinerario.', 400, false);
  }

  const serializedSize = Buffer.byteLength(JSON.stringify(parsed.data.itinerary), 'utf8');
  if (serializedSize > MAX_BODY_BYTES) {
    return apiError('SHARE_TOO_LARGE', 'O itinerario excede o limite de partilha.', 413, false);
  }

  const { id } = await context.params;
  const result = await createItineraryShare({
    sourceKey: id,
    itinerary: parsed.data.itinerary,
    audience: parsed.data.audience,
    expiresInDays: parsed.data.expiresInDays,
    identity,
  });
  if (!result.ok) {
    return apiError('SHARE_CREATE_FAILED', 'Nao foi possivel criar a partilha.', 500, true);
  }

  const url = new URL(`/itinerary/share/${result.token}`, req.url).toString();
  return Response.json(
    {
      token: result.token,
      url,
      share: result.share,
      persistence: result.provider,
    },
    { status: 201, headers: { 'Cache-Control': 'no-store, private' } }
  );
}
