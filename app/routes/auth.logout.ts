import { type AppLoadContext } from '@remix-run/cloudflare';
import { clearSession } from '~/lib/auth/session.server';
import { getOIDCConfig, getLogoutUrl } from '~/lib/auth/oidc.server';

export const loader = async ({ request, context }: { request: Request; context: AppLoadContext }) => {
  const cleared = await clearSession(request);

  // Build Entra logout URL
  const origin = new URL(request.url).origin;
  const env = (context as any)?.cloudflare?.env as Record<string, string | undefined>;
  const config = getOIDCConfig(origin, env);
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
