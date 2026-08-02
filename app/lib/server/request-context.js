import 'server-only';

import { randomUUID } from 'node:crypto';

const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{8,100}$/;

export function getCorrelationId(request) {
  const incoming = request?.headers?.get?.('x-request-id') || '';
  return SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
}

export function jsonWithCorrelation(body, init = {}, correlationId) {
  const headers = new Headers(init.headers || {});
  headers.set('X-Correlation-ID', correlationId);
  return Response.json(body, { ...init, headers });
}

export function errorWithCorrelation(code, message, status, correlationId, options = {}) {
  return jsonWithCorrelation({
    error: {
      code,
      message,
      retryable: Boolean(options.retryable),
      ...(options.currentVersion ? { currentVersion: options.currentVersion } : {}),
    },
  }, { status, headers: options.headers }, correlationId);
}

