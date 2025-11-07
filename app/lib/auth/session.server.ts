import { createCookieSessionStorage } from '@remix-run/cloudflare';

type UserClaims = {
  sub: string;
  name?: string;
  email?: string;
  preferred_username?: string;
  tid?: string;
  roles?: string[];
};

type SessionData = {
  user?: UserClaims;
  refreshToken?: string;
  returnTo?: string;

  // Transient OIDC values (Authorization Code + PKCE)
  pkce_verifier?: string;
  oidc_state?: string;
  oidc_nonce?: string;
};

const isProd = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET || 'change-me-in-env';

/*
 * Cookie configuration:
 * - SameSite=Lax allows cross-site redirect back to callback without breaking CSRF protections.
 * - Secure=true in production to enforce HTTPS.
 * - httpOnly=true ensures JS cannot read the cookie.
 */
export const sessionStorage = createCookieSessionStorage<SessionData>({
  cookie: {
    name: '__session',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours sliding session
    secrets: [sessionSecret],
    secure: isProd,
  },
});

// Retrieve a session from the incoming request cookie header.
export async function getSession(cookieHeader: string | null) {
  return sessionStorage.getSession(cookieHeader || undefined);
}

// Commit session and return Set-Cookie header value.
export async function commitSession(session: Awaited<ReturnType<typeof getSession>>) {
  return sessionStorage.commitSession(session);
}

// Destroy session and return Set-Cookie header value to clear cookie.
export async function destroySession(session: Awaited<ReturnType<typeof getSession>>) {
  return sessionStorage.destroySession(session);
}

// Helper: establish authenticated session after successful callback.
export async function setUserSession(
  request: Request,
  user: UserClaims,
  options?: { refreshToken?: string; returnTo?: string },
) {
  const cookie = request.headers.get('Cookie');
  const session = await getSession(cookie);

  session.set('user', user);

  if (options?.refreshToken) {
    // Store refresh token server-side only via HttpOnly cookie.
    session.set('refreshToken', options.refreshToken);
  }

  if (options?.returnTo) {
    session.set('returnTo', options.returnTo);
  }

  const setCookie = await commitSession(session);

  return { headers: { 'Set-Cookie': setCookie } };
}

// Helper: read current authenticated user (for loaders).
export async function getUserFromRequest(request: Request) {
  const cookie = request.headers.get('Cookie');
  const session = await getSession(cookie);
  const user = session.get('user') as UserClaims | undefined;

  return {
    isAuthenticated: !!user,
    user,
    session,
  };
}

// Helper: clear session and return headers to clear cookie.
export async function clearSession(request: Request) {
  const cookie = request.headers.get('Cookie');
  const session = await getSession(cookie);
  const setCookie = await destroySession(session);

  return { headers: { 'Set-Cookie': setCookie } };
}

// Capture a returnTo URL before redirecting to login.
export async function setReturnTo(request: Request, url: string) {
  const cookie = request.headers.get('Cookie');
  const session = await getSession(cookie);
  session.set('returnTo', url);

  const setCookie = await commitSession(session);

  return { headers: { 'Set-Cookie': setCookie } };
}

// Consume and clear returnTo once used.
export function consumeReturnTo(session: Awaited<ReturnType<typeof getSession>>) {
  const value = session.get('returnTo') as string | undefined;

  if (value) {
    session.unset('returnTo');
  }

  return value;
}
