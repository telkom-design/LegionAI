import { type AppLoadContext } from '@remix-run/cloudflare';
import { getSession, commitSession } from '~/lib/auth/session.server';
import {
  getOIDCConfig,
  createPkcePair,
  generateState,
  generateNonce,
  buildAuthorizationUrl,
} from '~/lib/auth/oidc.server';

export const loader = async ({ request, context }: { request: Request; context: AppLoadContext }) => {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get('returnTo') || '/';

  // Prepare OIDC parameters
  const origin = new URL(request.url).origin;
  const env = (context as any)?.cloudflare?.env as Record<string, string | undefined>;
  const config = getOIDCConfig(origin, env);
  const { verifier, challenge } = await createPkcePair();
  const state = generateState();
  const nonce = generateNonce();

  // Persist transient values in httpOnly session cookie
  const cookie = request.headers.get('Cookie');
  const session = await getSession(cookie);
  session.set('pkce_verifier', verifier);
  session.set('oidc_state', state);
  session.set('oidc_nonce', nonce);
  session.set('returnTo', returnTo);

  const setCookie = await commitSession(session);

  // Redirect to Microsoft Entra authorize endpoint
  const authUrl = buildAuthorizationUrl(config, state, nonce, challenge);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl,
      'Set-Cookie': setCookie,
    },
  });
};
