const DEFAULT_AUTH_DESTINATION = '/my-trips';

function validHttpOrigin(value) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.origin : null;
  } catch {
    return null;
  }
}

export function resolveAuthOrigin(requestUrl) {
  const configured = validHttpOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  if (configured) return configured;

  const vercelHost = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
  const preview = validHttpOrigin(
    vercelHost ? (vercelHost.startsWith('http') ? vercelHost : `https://${vercelHost}`) : null
  );
  if (preview) return preview;

  return validHttpOrigin(requestUrl) || 'http://localhost:3000';
}

function repeatedlyDecode(value) {
  let decoded = value;
  for (let index = 0; index < 2; index += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      return null;
    }
  }
  return decoded;
}

export function safeAuthRedirectPath(value, fallback = DEFAULT_AUTH_DESTINATION) {
  if (typeof value !== 'string') return fallback;
  const candidate = value.trim();
  const decoded = repeatedlyDecode(candidate);

  if (
    !candidate.startsWith('/')
    || candidate.startsWith('//')
    || !decoded
    || decoded.startsWith('//')
    || decoded.includes('\\')
    || /[\u0000-\u001F\u007F]/.test(decoded)
  ) {
    return fallback;
  }

  try {
    const base = new URL('https://andor.invalid');
    const parsed = new URL(candidate, base);
    if (parsed.origin !== base.origin) return fallback;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return fallback;
  }
}
