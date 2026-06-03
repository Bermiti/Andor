import { apiError, readJsonBody } from '../../../lib/api-utils';
import { getItineraryRecord, updateItineraryRecord } from '../../../lib/supabase/db';

export async function GET(_req, context) {
  const { id } = await context.params;
  const record = await getItineraryRecord(id);

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
  const body = await readJsonBody(req, 'update_itinerary');

  if (!body?.itinerary || typeof body.itinerary !== 'object') {
    return apiError('INVALID_ITINERARY', 'Itinerario invalido.', 400, false);
  }

  const result = await updateItineraryRecord(id, body.itinerary);
  if (!result.ok) {
    return apiError('ITINERARY_UPDATE_FAILED', 'Nao foi possivel atualizar o itinerario.', 500, true);
  }

  return Response.json({ ok: true });
}
