import { apiError, readJsonBody } from '../../../lib/api-utils';
import { getRequestIdentity } from '../../../lib/server/identity';
import { getItineraryRecord, updateItineraryRecord } from '../../../lib/supabase/db';

export const runtime = 'nodejs';

export async function GET(_req, context) {
  const { id } = await context.params;
  const identity = await getRequestIdentity();
  if (!identity) {
    return apiError('AUTH_REQUIRED', 'Sessao nao autenticada.', 401, false);
  }

  const record = await getItineraryRecord(id, identity);

  if (!record) {
    return apiError('ITINERARY_NOT_FOUND', 'Itinerario nao encontrado.', 404, false);
  }

  return Response.json({
    id: record.id,
    shareToken: record.shareToken,
    itinerary: record.itinerary,
  });
}

export async function PATCH(req, context) {
  const { id } = await context.params;
  const identity = await getRequestIdentity();
  if (!identity) {
    return apiError('AUTH_REQUIRED', 'Sessao nao autenticada.', 401, false);
  }

  const body = await readJsonBody(req, 'update_itinerary');

  if (!body?.itinerary || typeof body.itinerary !== 'object') {
    return apiError('INVALID_ITINERARY', 'Itinerario invalido.', 400, false);
  }

  const result = await updateItineraryRecord(id, body.itinerary, identity);
  if (!result.ok) {
    const notFound = result.reason === 'not_found';
    return apiError(
      notFound ? 'ITINERARY_NOT_FOUND' : 'ITINERARY_UPDATE_FAILED',
      notFound ? 'Itinerario nao encontrado.' : 'Nao foi possivel atualizar o itinerario.',
      notFound ? 404 : 500,
      !notFound
    );
  }

  return Response.json({ ok: true });
}
