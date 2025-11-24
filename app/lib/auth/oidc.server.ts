import { jwtVerify, createRemoteJWKSet, type JWTPayload } from 'jose';

type OIDCConfig = {
  tenantId: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
};

const getEnv = (
  key: string,
  fallback?: string,
  env?: Record<string, string | undefined>,
) => {
  const fromContext = env ? (env[key] as string | undefined) : undefined;
  const fromProcess = typeof process !== 'undefined' ? process.env?.[key] : undefined;
  const v = fromContext ?? fromProcess ?? fallback;

  if (!v) {
    throw new Error(`Missing env: ${key}`);
  }

  return v;
};

export function getOIDCConfig(
  origin?: string,
  env?: Record<string, string | undefined>,
): OIDCConfig {
  const tenantId = getEnv('VITE_AZURE_TENANT_ID', undefined, env);
  const clientId = getEnv('VITE_AZURE_CLIENT_ID', undefined, env);

  const resolvedOrigin = origin || getOrigin();
  const redirectUri =
    (env?.VITE_AZURE_REDIRECT_URI as string | undefined) || `${resolvedOrigin}/auth/callback`;

  const clientSecret = env?.VITE_AZURE_CLIENT_SECRET as string | undefined;
  const scopes = ['openid', 'profile', 'email', 'offline_access'];

  return { tenantId, clientId, clientSecret, redirectUri, scopes };
}

function getOrigin() {
  return 'http://localhost:5173';
}

export function getEndpoints(tenantId: string) {
  const base = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0`;
  return {
    authorize: `${base}/authorize`,
    token: `${base}/token`,
    logout: `${base}/logout`,
    jwks: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
    issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
  };
}

function randomString(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);

  return base64url(arr);
}

function base64url(input: Uint8Array | ArrayBuffer): string {
  const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
  let str = '';

  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }

  const b64 = btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

  return b64;
}

async function sha256(input: string): Promise<ArrayBuffer> {
  if ((crypto as any).subtle?.digest) {
    const enc = new TextEncoder();
    return crypto.subtle.digest('SHA-256', enc.encode(input));
  } else {
    const { createHash } = await import('crypto');
    const hash = createHash('sha256').update(input).digest();

    return new Uint8Array(hash).buffer;
  }
}

export async function createPkcePair() {
  const verifier = randomString(64);
  const challengeBuf = await sha256(verifier);
  const challenge = base64url(challengeBuf);

  return { verifier, challenge };
}

export function buildAuthorizationUrl(config: OIDCConfig, state: string, nonce: string, codeChallenge: string) {
  const endpoints = getEndpoints(config.tenantId);
  const url = new URL(endpoints.authorize);
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('response_mode', 'query');
  url.searchParams.set('scope', config.scopes.join(' '));
  url.searchParams.set('state', state);
  url.searchParams.set('nonce', nonce);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');

  return url.toString();
}

export type TokenResponse = {
  token_type: string;
  expires_in: number;
  ext_expires_in?: number;
  access_token: string;
  id_token: string;
  refresh_token?: string;
  scope?: string;
};

export async function exchangeCodeForTokens(
  config: OIDCConfig,
  code: string,
  codeVerifier: string,
): Promise<TokenResponse> {
  const endpoints = getEndpoints(config.tenantId);
  const params = new URLSearchParams();
  params.set('grant_type', 'authorization_code');
  params.set('client_id', config.clientId);
  params.set('code', code);
  params.set('redirect_uri', config.redirectUri);
  params.set('code_verifier', codeVerifier);
  params.set('scope', config.scopes.join(' '));

  if (config.clientSecret) {
    params.set('client_secret', config.clientSecret);
  }

  const res = await fetch(endpoints.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  return (await res.json()) as TokenResponse;
}

export async function validateIdToken(config: OIDCConfig, idToken: string, expectedNonce: string) {
  const endpoints = getEndpoints(config.tenantId);
  const JWKS = createRemoteJWKSet(new URL(endpoints.jwks));
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: endpoints.issuer,
    audience: config.clientId,
    maxTokenAge: '10 min',
    clockTolerance: '5 min',
  });

  const nonce = (payload as any).nonce as string | undefined;

  if (!nonce || nonce !== expectedNonce) {
    throw new Error('Invalid or missing nonce in id_token');
  }

  return payload;
}
export type MinimalUserClaims = {
  sub: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  tid?: string;
  roles?: string[];
};

export function extractUserClaims(payload: JWTPayload): MinimalUserClaims {
  return {
    sub: payload.sub!,
    name: (payload as any).name as string | undefined,
    preferred_username: (payload as any).preferred_username as string | undefined,
    email: (payload as any).email as string | undefined,
    tid: (payload as any).tid as string | undefined,
    roles: (payload as any).roles as string[] | undefined,
  };
}

export function generateState(): string {
  return randomString(16);
}

export function generateNonce(): string {
  return randomString(16);
}

export async function refreshAccessToken(config: OIDCConfig, refreshToken: string): Promise<TokenResponse> {
  const endpoints = getEndpoints(config.tenantId);
  const params = new URLSearchParams();
  params.set('grant_type', 'refresh_token');
  params.set('client_id', config.clientId);
  params.set('refresh_token', refreshToken);

  if (config.clientSecret) {
    params.set('client_secret', config.clientSecret);
  }

  const res = await fetch(endpoints.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Refresh token exchange failed: ${res.status} ${text}`);
  }

  return (await res.json()) as TokenResponse;
}

export function getLogoutUrl(config: OIDCConfig, postLogoutRedirect?: string) {
  const endpoints = getEndpoints(config.tenantId);
  const url = new URL(endpoints.logout);
  url.searchParams.set('post_logout_redirect_uri', postLogoutRedirect || config.redirectUri);

  return url.toString();
}
