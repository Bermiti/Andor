export const GUEST_SESSION_COOKIE = 'andor_guest_session';
export const LOCAL_AUTH_COOKIE = 'andor_local_session';

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function sessionCookieOptions(secure = process.env.NODE_ENV === 'production') {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
    priority: 'high',
  };
}
