import type { ServerBuild } from '@remix-run/cloudflare';
import { createPagesFunctionHandler } from '@remix-run/cloudflare-pages';

export const onRequest: PagesFunction = async (context) => {
  try {
    const serverBuild = (await import('../build/server')) as unknown as ServerBuild;

    const handler = createPagesFunctionHandler({
      build: serverBuild,
    });

    return await handler(context);
  } catch (err) {
    console.error('[functions/[[path]].ts] Uncaught error:', err);
    const message = err instanceof Error ? err.message : String(err);

    const headers = new Headers({
      'content-type': 'application/json; charset=utf-8',
      'x-error-source': 'pages-function',
    });

    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        detail: message,
      }),
      { status: 500, headers },
    );
  }
};
