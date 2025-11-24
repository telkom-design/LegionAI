import { type AppLoadContext } from '@remix-run/cloudflare';
import { getSession, commitSession } from '~/lib/auth/session.server';
import { getOIDCConfig, exchangeCodeForTokens, validateIdToken, extractUserClaims } from '~/lib/auth/oidc.server';

export const loader = async ({ request, context }: { request: Request; context: AppLoadContext }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');

  if (!code || !stateParam) {
    return new Response(null, { status: 302, headers: { Location: '/?auth_error=missing_params' } });
  }

  const cookie = request.headers.get('Cookie');
  const session = await getSession(cookie);
  const storedState = session.get('oidc_state') as string | undefined;
  const verifier = session.get('pkce_verifier') as string | undefined;
  const nonce = session.get('oidc_nonce') as string | undefined;
  const returnTo = (session.get('returnTo') as string | undefined) || '/';

  if (!storedState || storedState !== stateParam) {
    session.unset('oidc_state');
    session.unset('pkce_verifier');
    session.unset('oidc_nonce');

    const setCookie = await commitSession(session);

    return new Response(null, {
      status: 302,
      headers: { Location: '/?auth_error=state_mismatch', 'Set-Cookie': setCookie },
    });
  }

  if (!verifier || !nonce) {
    session.unset('oidc_state');
    session.unset('pkce_verifier');
    session.unset('oidc_nonce');

    const setCookie = await commitSession(session);

    return new Response(null, {
      status: 302,
      headers: { Location: '/?auth_error=missing_pkce', 'Set-Cookie': setCookie },
    });
  }

  try {
    const origin = new URL(request.url).origin;
    const env = (context as any)?.cloudflare?.env as Record<string, string | undefined>;
    const config = getOIDCConfig(origin, env);
    const tokens = await exchangeCodeForTokens(config, code, verifier);
    const payload = await validateIdToken(config, tokens.id_token, nonce);
    const user = extractUserClaims(payload);

    // Establish authenticated session; store refresh token server-side only
    session.set('user', user);

    if (tokens.refresh_token) {
      session.set('refreshToken', tokens.refresh_token);
    }

    // Clear transient values
    session.unset('oidc_state');
    session.unset('pkce_verifier');
    session.unset('oidc_nonce');

    const setCookie = await commitSession(session);

    return new Response(null, {
      status: 302,
      headers: { Location: returnTo || '/', 'Set-Cookie': setCookie },
    });
  } catch (err) {
    console.error('Auth callback error:', err);

    // On failure, clear transient values and provide specific error code with detail
    session.unset('oidc_state');
    session.unset('pkce_verifier');
    session.unset('oidc_nonce');

    const errMsg = err instanceof Error ? err.message : String(err);
    const errText = errMsg.toLowerCase();

    let errorCode = 'callback_failed';

    if (errText.includes('aadsts50011') || errText.includes('redirect uri')) {
      errorCode = 'redirect_uri_mismatch';
    } else if (errText.includes('invalid_client')) {
      errorCode = 'invalid_client';
    } else if (errText.includes('unauthorized_client')) {
      errorCode = 'unauthorized_client';
    } else if (errText.includes('token exchange failed')) {
      errorCode = 'token_exchange_failed';
    } else if (errText.includes('invalid or missing nonce') || errText.includes('nonce')) {
      errorCode = 'invalid_nonce';
    }

    const detailParam = encodeURIComponent((errMsg || '').slice(0, 300));

    const setCookie = await commitSession(session);

    return new Response(null, {
      status: 302,
      headers: { Location: `/?auth_error=${errorCode}&auth_detail=${detailParam}`, 'Set-Cookie': setCookie },
    });
  }
};
