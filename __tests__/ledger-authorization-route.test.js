// @vitest-environment node

const routeState = vi.hoisted(() => ({
  identity: {
    authenticated: true,
    provider: 'local',
    userId: '11111111-1111-4111-8111-111111111111',
  },
  readResult: null,
  writeResult: null,
}));

vi.mock('server-only', () => ({}));
vi.mock('../app/lib/server/identity', () => ({
  getRequestIdentity: vi.fn(async () => routeState.identity),
}));
vi.mock('../app/lib/server/ledger-dal', () => ({
  getTripLedger: vi.fn(async () => routeState.readResult),
  saveTripLedger: vi.fn(async () => routeState.writeResult),
}));

import { GET, PUT } from '../app/api/itineraries/[id]/ledger/route';
import { getTripLedger, saveTripLedger } from '../app/lib/server/ledger-dal';

const tripId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const context = { params: Promise.resolve({ id: tripId }) };
const correlationId = 'ledger-request-1234';
const ledger = {
  version: 1,
  currency: 'EUR',
  participants: [{ id: 'person-1', name: 'Ana' }],
  expenses: [{
    id: 'expense-1',
    description: 'Almoço',
    amountCents: 1800,
    paidBy: 'person-1',
    splitBetween: ['person-1'],
    category: 'food',
    date: '2026-08-02',
    notes: '',
  }],
};

function request(method = 'GET', options = {}) {
  return new Request(`http://localhost/api/itineraries/${tripId}/ledger`, {
    method,
    headers: {
      'X-Request-ID': correlationId,
      ...(options.headers || {}),
    },
    ...(options.body === undefined ? {} : { body: options.body }),
  });
}

describe('ledger HTTP authorization boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeState.identity = {
      authenticated: true,
      provider: 'local',
      userId: '11111111-1111-4111-8111-111111111111',
    };
    routeState.readResult = {
      ok: true,
      provider: 'sqlite',
      ledger,
      version: 2,
      updatedAt: '2026-08-02T12:00:00.000Z',
    };
    routeState.writeResult = {
      ok: true,
      provider: 'sqlite',
      ledger,
      version: 3,
      updatedAt: '2026-08-02T12:01:00.000Z',
    };
  });

  it('requires authentication and always emits a correlation ID', async () => {
    routeState.identity = null;
    const response = await GET(request(), context);

    expect(response.status).toBe(401);
    expect(response.headers.get('x-correlation-id')).toBe(correlationId);
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'AUTH_REQUIRED' } });
    expect(getTripLedger).not.toHaveBeenCalled();
  });

  it('returns the same non-enumerating response for missing and forbidden trips', async () => {
    const responses = [];
    for (const status of ['not_found', 'forbidden']) {
      routeState.readResult = { ok: false, status };
      const response = await GET(request(), context);
      responses.push({ status: response.status, body: await response.json() });
    }

    expect(responses[0]).toEqual(responses[1]);
    expect(responses[0]).toMatchObject({
      status: 404,
      body: { error: { code: 'LEDGER_NOT_FOUND' } },
    });
  });

  it('returns an ETag revision on successful reads', async () => {
    const response = await GET(request(), context);

    expect(response.status).toBe(200);
    expect(response.headers.get('etag')).toBe('"2"');
    expect(response.headers.get('cache-control')).toBe('no-store, private');
    await expect(response.json()).resolves.toMatchObject({
      ledger,
      version: 2,
      persistence: 'sqlite',
    });
    expect(getTripLedger).toHaveBeenCalledWith(
      tripId,
      routeState.identity,
      { correlationId }
    );
  });

  it('requires If-Match for every mutation', async () => {
    const response = await PUT(request('PUT', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ledger),
    }), context);

    expect(response.status).toBe(428);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'PRECONDITION_REQUIRED' },
    });
    expect(saveTripLedger).not.toHaveBeenCalled();
  });

  it('enforces the body limit and strict cross-reference validation', async () => {
    const tooLarge = await PUT(request('PUT', {
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': '500001',
        'If-Match': '"2"',
      },
      body: '{}',
    }), context);
    expect(tooLarge.status).toBe(413);

    const invalidLedger = {
      ...ledger,
      participants: [{ ...ledger.participants[0], callerControlledRole: 'owner' }],
      expenses: [{ ...ledger.expenses[0], paidBy: 'missing-person' }],
    };
    const invalid = await PUT(request('PUT', {
      headers: { 'Content-Type': 'application/json', 'If-Match': '"2"' },
      body: JSON.stringify(invalidLedger),
    }), context);
    expect(invalid.status).toBe(422);
    await expect(invalid.json()).resolves.toMatchObject({ error: { code: 'INVALID_LEDGER' } });
    expect(saveTripLedger).not.toHaveBeenCalled();
  });

  it('passes the conditional version to the DAL and returns a new ETag', async () => {
    const response = await PUT(request('PUT', {
      headers: { 'Content-Type': 'application/json', 'If-Match': '"2"' },
      body: JSON.stringify(ledger),
    }), context);

    expect(response.status).toBe(200);
    expect(response.headers.get('etag')).toBe('"3"');
    expect(saveTripLedger).toHaveBeenCalledWith(
      tripId,
      ledger,
      2,
      routeState.identity,
      { correlationId }
    );
  });

  it('maps a stale write to 409 with the current revision', async () => {
    routeState.writeResult = { ok: false, status: 'conflict', currentVersion: 4 };
    const response = await PUT(request('PUT', {
      headers: { 'Content-Type': 'application/json', 'If-Match': '"2"' },
      body: JSON.stringify(ledger),
    }), context);

    expect(response.status).toBe(409);
    expect(response.headers.get('x-correlation-id')).toBe(correlationId);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'LEDGER_VERSION_CONFLICT', currentVersion: 4 },
    });
  });
});
