import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { clearSession } from '~/lib/auth/session.server';
import { getOIDCConfig, getLogoutUrl } from '~/lib/auth/oidc.server';

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  const cleared = await clearSession(request);

  // Build Entra logout URL
  const origin = new URL(request.url).origin;
  const config = getOIDCConfig(origin);
  const postLogoutRedirect = new URL(request.url).origin;
  const logoutUrl = getLogoutUrl(config, postLogoutRedirect);

  return new Response(null, {
    status: 302,
    headers: {
      Location: logoutUrl,
      ...(cleared.headers || {}),
    },
  });
};
