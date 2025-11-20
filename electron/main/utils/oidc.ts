import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { randomBytes, createHash } from 'node:crypto';

export type OIDCConfig = {
  tenantId: string;
  clientId: string;
  redirectUri: string; // e.g. legionai://auth/callback (custom protocol) or http://127.0.0.1:PORT/auth/callback (loopback)
  clientSecret?: string; // optional for confidential client
  scopes: string[];
};

export function getConfig(): OIDCConfig {
  const tenantId = mustGetEnv('AZURE_TENANT_ID');
  const clientId = mustGetEnv('AZURE_CLIENT_ID');
  const redirectUri = mustGetEnv('AZURE_REDIRECT_URI');
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const scopes = ['openid', 'profile', 'email', 'offline_access'];
  return { tenantId, clientId, redirectUri, clientSecret, scopes };
}

function mustGetEnv(key: string): string {
  const v = process.env[key];
  if (!v || !v.trim()) throw new Error(`Missing environment variable: ${key}`);
  return v;
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

export type Pkce = { verifier: string; challenge: string };
export function createPkcePair(): Pkce {
  const verifier = toBase64Url(randomBytes(48)); // high entropy
  const challenge = toBase64Url(createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

export function generateState(): string {
  return toBase64Url(randomBytes(16));
}

export function generateNonce(): string {
  return toBase64Url(randomBytes(16));
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

export async function exchangeCodeForTokens(config: OIDCConfig, code: string, codeVerifier: string): Promise<TokenResponse> {
  const endpoints = getEndpoints(config.tenantId);
  const params = new URLSearchParams();
  params.set('grant_type', 'authorization_code');
  params.set('client_id', config.clientId);
  params.set('code', code);
  params.set('redirect_uri', config.redirectUri);
  params.set('code_verifier', codeVerifier);
  if (config.clientSecret) params.set('client_secret', config.clientSecret);

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
    maxTokenAge: '5 min',
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

export function getLogoutUrl(config: OIDCConfig, postLogoutRedirect?: string) {
  const endpoints = getEndpoints(config.tenantId);
  const url = new URL(endpoints.logout);
  url.searchParams.set('post_logout_redirect_uri', postLogoutRedirect || config.redirectUri);
  return url.toString();
}

function toBase64Url(input: Buffer): string {
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}