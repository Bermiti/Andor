import { apiError, cleanString, readJsonBody } from '../../lib/api-utils';
import { createCustomRequestRecord } from '../../lib/supabase/db';

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function POST(req) {
  const body = await readJsonBody(req, 'custom_request');
  if (!body || typeof body !== 'object') {
    return apiError('MALFORMED_JSON', 'Pedido invalido.', 400, false);
  }

  const payload = {
    destination: cleanString(body.destination, '', 120),
    startDate: cleanString(body.startDate, '', 20),
    endDate: cleanString(body.endDate, '', 20),
    budget: cleanString(body.budget, '', 30),
    travelers: cleanString(body.travelers, '2', 30),
    notes: cleanString(body.notes, '', 1200),
  };

  if (!payload.destination || !isIsoDate(payload.startDate) || !isIsoDate(payload.endDate) || !payload.budget) {
    return apiError('REQUEST_INCOMPLETE', 'Preenche destino, datas e orcamento.', 400, false);
  }

  const result = await createCustomRequestRecord(payload);
  if (!result.ok) {
    return apiError(
      'PERSISTENCE_UNAVAILABLE',
      'O pedido não foi guardado. Tenta novamente mais tarde.',
      503,
      true
    );
  }

  return Response.json({
    ok: true,
    provider: result.provider,
    request: result.request,
  });
}
