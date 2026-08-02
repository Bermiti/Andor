import { z } from 'zod';
import { getRequestIdentity } from '../../../../lib/server/identity';
import { getTripLedger, saveTripLedger } from '../../../../lib/server/ledger-dal';
import {
  errorWithCorrelation,
  getCorrelationId,
  jsonWithCorrelation,
} from '../../../../lib/server/request-context';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 500_000;
const idSchema = z.uuid();
const entityIdSchema = z.string().trim().min(1).max(80)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);

const participantSchema = z.object({
  id: entityIdSchema,
  name: z.string().trim().min(1).max(80),
}).strict();

const expenseSchema = z.object({
  id: entityIdSchema,
  description: z.string().trim().min(1).max(120),
  amountCents: z.number().int().positive().max(100_000_000),
  paidBy: entityIdSchema,
  splitBetween: z.array(entityIdSchema).min(1).max(40),
  category: z.string().trim().min(1).max(40).default('other'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(240).default(''),
}).strict();

const ledgerSchema = z.object({
  version: z.literal(1).default(1),
  currency: z.enum(['EUR', 'USD', 'GBP', 'JPY']).default('EUR'),
  participants: z.array(participantSchema).max(40),
  expenses: z.array(expenseSchema).max(500),
}).strict().superRefine((ledger, context) => {
  const participantIds = new Set();
  ledger.participants.forEach((participant, index) => {
    if (participantIds.has(participant.id)) {
      context.addIssue({
        code: 'custom',
        path: ['participants', index, 'id'],
        message: 'Participant IDs must be unique.',
      });
    }
    participantIds.add(participant.id);
  });

  const expenseIds = new Set();
  ledger.expenses.forEach((expense, index) => {
    if (expenseIds.has(expense.id)) {
      context.addIssue({
        code: 'custom',
        path: ['expenses', index, 'id'],
        message: 'Expense IDs must be unique.',
      });
    }
    expenseIds.add(expense.id);

    if (!participantIds.has(expense.paidBy)) {
      context.addIssue({
        code: 'custom',
        path: ['expenses', index, 'paidBy'],
        message: 'The payer must be a ledger participant.',
      });
    }

    const splitIds = new Set();
    expense.splitBetween.forEach((participantId, splitIndex) => {
      if (!participantIds.has(participantId) || splitIds.has(participantId)) {
        context.addIssue({
          code: 'custom',
          path: ['expenses', index, 'splitBetween', splitIndex],
          message: 'Split participants must exist and be unique.',
        });
      }
      splitIds.add(participantId);
    });
  });
});

function parseVersionHeader(request) {
  const raw = request.headers.get('if-match')?.trim();
  if (!raw) return { ok: false, missing: true };
  const match = raw.match(/^(?:W\/)?"?(\d+)"?$/);
  const version = match ? Number(match[1]) : NaN;
  return Number.isSafeInteger(version) && version >= 0
    ? { ok: true, version }
    : { ok: false, missing: false };
}

async function readLimitedJson(request) {
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return { ok: false, tooLarge: true };
  }
  if (!request.body) return { ok: false, malformed: true };

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return { ok: false, tooLarge: true };
      }
      chunks.push(Buffer.from(value));
    }
    return { ok: true, value: JSON.parse(Buffer.concat(chunks).toString('utf8')) };
  } catch (error) {
    return { ok: false, malformed: true };
  }
}

function mapLedgerError(result, correlationId) {
  if (result.status === 'auth_required') {
    return errorWithCorrelation('AUTH_REQUIRED', 'Sessão não autenticada.', 401, correlationId);
  }
  if (result.status === 'conflict') {
    return errorWithCorrelation(
      'LEDGER_VERSION_CONFLICT',
      'As despesas foram alteradas noutro local. Recarrega antes de guardar.',
      409,
      correlationId,
      { currentVersion: result.currentVersion }
    );
  }
  if (result.status === 'persistence_unavailable') {
    return errorWithCorrelation(
      'PERSISTENCE_UNAVAILABLE',
      'Persistência durável indisponível.',
      503,
      correlationId,
      { retryable: true }
    );
  }
  if (result.status === 'storage_error') {
    return errorWithCorrelation(
      'LEDGER_STORAGE_ERROR',
      'Não foi possível aceder às despesas.',
      500,
      correlationId,
      { retryable: true }
    );
  }
  if (result.status === 'invalid') {
    return errorWithCorrelation('INVALID_LEDGER', 'Revê os participantes e as despesas.', 422, correlationId);
  }
  // Missing trips and denied trips deliberately have the same outward shape.
  return errorWithCorrelation('LEDGER_NOT_FOUND', 'Despesas não encontradas.', 404, correlationId);
}

async function routeIdentity(request, context) {
  const correlationId = getCorrelationId(request);
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) {
    return {
      error: errorWithCorrelation('LEDGER_NOT_FOUND', 'Despesas não encontradas.', 404, correlationId),
    };
  }
  const identity = await getRequestIdentity();
  if (!identity?.authenticated || !identity.userId) {
    return {
      error: errorWithCorrelation('AUTH_REQUIRED', 'Sessão não autenticada.', 401, correlationId),
    };
  }
  return { id, identity, correlationId };
}

function successResponse(result, correlationId) {
  return jsonWithCorrelation({
    ledger: result.ledger,
    version: result.version,
    updatedAt: result.updatedAt,
    persistence: result.provider,
  }, {
    headers: {
      'Cache-Control': 'no-store, private',
      ETag: `"${result.version}"`,
    },
  }, correlationId);
}

export async function GET(req, context) {
  const request = await routeIdentity(req, context);
  if (request.error) return request.error;

  const result = await getTripLedger(request.id, request.identity, {
    correlationId: request.correlationId,
  });
  if (!result.ok) return mapLedgerError(result, request.correlationId);
  return successResponse(result, request.correlationId);
}

export async function PUT(req, context) {
  const request = await routeIdentity(req, context);
  if (request.error) return request.error;

  const precondition = parseVersionHeader(req);
  if (!precondition.ok) {
    return errorWithCorrelation(
      precondition.missing ? 'PRECONDITION_REQUIRED' : 'INVALID_PRECONDITION',
      precondition.missing
        ? 'Envia a versão atual no cabeçalho If-Match.'
        : 'O cabeçalho If-Match não contém uma versão válida.',
      precondition.missing ? 428 : 400,
      request.correlationId
    );
  }

  const body = await readLimitedJson(req);
  if (body.tooLarge) {
    return errorWithCorrelation(
      'LEDGER_TOO_LARGE',
      'As despesas excedem o limite permitido.',
      413,
      request.correlationId
    );
  }
  const parsed = body.ok ? ledgerSchema.safeParse(body.value) : { success: false };
  if (!parsed.success) {
    return errorWithCorrelation(
      'INVALID_LEDGER',
      'Revê os participantes e as despesas.',
      422,
      request.correlationId
    );
  }

  const result = await saveTripLedger(
    request.id,
    parsed.data,
    precondition.version,
    request.identity,
    { correlationId: request.correlationId }
  );
  if (!result.ok) return mapLedgerError(result, request.correlationId);
  return successResponse(result, request.correlationId);
}
