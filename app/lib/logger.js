const IS_DEV = process.env.NODE_ENV !== 'production';
const IS_SERVER = typeof window === 'undefined';

function createErrorId(prefix = 'ANDOR') {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomPart}`;
}

function sanitizeValue(value, depth = 0) {
  if (depth > 3) return '[truncated]';
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: IS_DEV ? value.stack : undefined,
    };
  }
  if (typeof value === 'string') {
    return value
      .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [redacted]')
      .replace(/(api[_-]?key|token|secret|password)["']?\s*[:=]\s*["']?[^"',\s]+/gi, '$1=[redacted]')
      .slice(0, 700);
  }
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 8).map((item) => sanitizeValue(item, depth + 1));

  const blockedKeys = ['prompt', 'messages', 'itinerary', 'rawResponse', 'apiKey', 'token', 'password', 'secret'];
  return Object.entries(value).reduce((acc, [key, item]) => {
    if (blockedKeys.some((blocked) => key.toLowerCase().includes(blocked.toLowerCase()))) {
      acc[key] = '[redacted]';
    } else {
      acc[key] = sanitizeValue(item, depth + 1);
    }
    return acc;
  }, {});
}

function emit(level, context, error, metadata) {
  const id = createErrorId(level.toUpperCase());
  const payload = {
    id,
    context,
    error: sanitizeValue(error),
    metadata: sanitizeValue(metadata),
  };

  if (IS_DEV || IS_SERVER) {
    const method = level === 'warn' ? 'warn' : level === 'info' ? 'info' : 'error';
    console[method](`[andor:${level}]`, payload);
  }

  return id;
}

export const logger = {
  error(context, error, metadata = {}) {
    return emit('error', context, error, metadata);
  },
  warn(context, error, metadata = {}) {
    return emit('warn', context, error, metadata);
  },
  info(context, metadata = {}) {
    if (!IS_DEV) return null;
    return emit('info', context, null, metadata);
  },
};

export function reportClientError(context, error, metadata = {}) {
  return logger.error(context, error, metadata);
}

export function makeErrorResponse(code, message, status = 500, retryable = false, details = null) {
  const body = {
    error: {
      code,
      message,
      retryable,
    },
  };
  if (IS_DEV && details) {
    body.error.details = sanitizeValue(details);
  }
  return Response.json(body, { status });
}

export default logger;
