import { logger, makeErrorResponse } from './logger';

export async function readJsonBody(req, context = 'api') {
  try {
    return await req.json();
  } catch (error) {
    logger.warn(`${context}:malformed_json`, error);
    return null;
  }
}

export function apiError(code, message, status = 500, retryable = false, details = null) {
  return makeErrorResponse(code, message, status, retryable, details);
}

export function cleanString(value, fallback = '', maxLength = 120) {
  const text = typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
  return (text || fallback).slice(0, maxLength);
}

export function cleanInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function cleanLocale(value) {
  const allowed = new Set(['pt', 'pt-PT', 'pt-BR', 'en', 'es', 'fr']);
  const locale = cleanString(value, 'pt', 12);
  return allowed.has(locale) ? locale : 'pt';
}

export function cleanList(value, maxItems = 8, maxLength = 60) {
  if (Array.isArray(value)) {
    return value.slice(0, maxItems).map((item) => cleanString(item, '', maxLength)).filter(Boolean);
  }
  const text = cleanString(value, '', maxLength * 2);
  return text ? [text] : [];
}

export function hasProviderKey(...keys) {
  return keys.some((key) => key && !String(key).startsWith('cola_aqui'));
}
