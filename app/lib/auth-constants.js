// Kept only so the proxy can expire cookies issued before Sprint 1.
// This cookie must never be accepted as an authenticated identity.
export const GUEST_SESSION_COOKIE = 'andor_guest_session';
export const LOCAL_AUTH_COOKIE = 'andor_local_session';

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function isE2ELocalAuthEnabled() {
  return process.env.ANDOR_E2E_LOCAL_AUTH === '1';
}

export function shouldUseSecureCookies() {
  // The explicit E2E backend is served over localhost HTTP even when it exercises
  // a production build. It is not a valid production authentication mode.
  return process.env.NODE_ENV === 'production' && !isE2ELocalAuthEnabled();
}

export function authCookieOptions(options = {}) {
  const secure = shouldUseSecureCookies() || options.secure === true;
  return {
    ...options,
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    priority: 'high',
  };
}

export function sessionCookieOptions(secure = shouldUseSecureCookies()) {
  return {
    ...authCookieOptions({ secure }),
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function expiredSessionCookieOptions(secure = shouldUseSecureCookies()) {
  return {
    ...sessionCookieOptions(secure),
    maxAge: 0,
    expires: new Date(0),
  };
}
