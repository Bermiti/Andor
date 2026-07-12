import { z } from 'zod';
import { apiError, readJsonBody } from '../../../../lib/api-utils';
import { getRequestIdentity } from '../../../../lib/server/identity';
import { getTripLedger, saveTripLedger } from '../../../../lib/server/ledger-dal';

export const runtime = 'nodejs';

const participantSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().trim().min(1).max(80),
});

const expenseSchema = z.object({
  id: z.string().min(1).max(80),
  description: z.string().trim().min(1).max(120),
  amountCents: z.number().int().positive().max(100_000_000),
  paidBy: z.string().min(1).max(80),
  splitBetween: z.array(z.string().min(1).max(80)).min(1).max(40),
  category: z.string().max(40).default('other'),
  date: z.string().max(10),
  notes: z.string().max(240).default(''),
});

const ledgerSchema = z.object({
  version: z.number().int().optional(),
  currency: z.enum(['EUR', 'USD', 'GBP', 'JPY']).default('EUR'),
  participants: z.array(participantSchema).max(40),
  expenses: z.array(expenseSchema).max(500),
});

export async function GET(_req, context) {
  const identity = await getRequestIdentity();
  if (!identity) return apiError('AUTH_REQUIRED', 'Sessao nao autenticada.', 401, false);
  const { id } = await context.params;
  if (!id || id.length > 200) return apiError('INVALID_TRIP', 'Viagem invalida.', 400, false);

  const result = await getTripLedger(id, identity);
  return Response.json(
    { ledger: result.ledger, updatedAt: result.updatedAt, persistence: result.provider },
    { headers: { 'Cache-Control': 'no-store, private' } }
  );
}

export async function PUT(req, context) {
  const identity = await getRequestIdentity();
  if (!identity) return apiError('AUTH_REQUIRED', 'Sessao nao autenticada.', 401, false);
  const { id } = await context.params;
  if (!id || id.length > 200) return apiError('INVALID_TRIP', 'Viagem invalida.', 400, false);

  const parsed = ledgerSchema.safeParse(await readJsonBody(req, 'save_trip_ledger'));
  if (!parsed.success) return apiError('INVALID_LEDGER', 'Revê os participantes e as despesas.', 400, false);
  const result = await saveTripLedger(id, parsed.data, identity);
  if (!result.ok) return apiError('LEDGER_SAVE_FAILED', 'Nao foi possivel guardar as despesas.', 500, true);

  return Response.json(
    { ledger: result.ledger, updatedAt: result.updatedAt, persistence: result.provider },
    { headers: { 'Cache-Control': 'no-store, private' } }
  );
}
