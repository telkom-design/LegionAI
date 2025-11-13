/// <reference types="vite/client" />
import { createRequestHandler } from '@remix-run/node';
import electron, { app, BrowserWindow, ipcMain, protocol, session, shell } from 'electron';
import log from 'electron-log';
import path from 'node:path';
import * as pkg from '../../package.json';
import { setupAutoUpdater } from './utils/auto-update';
import { isDev, DEFAULT_PORT } from './utils/constants';
import { initViteServer, viteServer } from './utils/vite-server';
import { setupMenu } from './ui/menu';
import { createWindow } from './ui/window';
import { initCookies, storeCookies } from './utils/cookie';
import { loadServerBuild, serveAsset } from './utils/serve';
import { reloadOnChange } from './utils/reload';
import { store } from './utils/store';
import {
  getConfig as getOIDCConfig,
  createPkcePair,
  generateState,
  generateNonce,
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  validateIdToken,
  extractUserClaims,
  getLogoutUrl,
} from './utils/oidc';
import http from 'node:http';

Object.assign(console, log.functions);

console.debug('main: import.meta.env:', import.meta.env);
console.log('main: isDev:', isDev);
console.log('NODE_ENV:', global.process.env.NODE_ENV);
console.log('isPackaged:', app.isPackaged);

// Log unhandled errors
process.on('uncaughtException', async (error) => {
  console.log('Uncaught Exception:', error);
});

process.on('unhandledRejection', async (error) => {
  console.log('Unhandled Rejection:', error);
});

(() => {
  const root = global.process.env.APP_PATH_ROOT ?? import.meta.env.VITE_APP_PATH_ROOT;

  if (root === undefined) {
    console.log('no given APP_PATH_ROOT or VITE_APP_PATH_ROOT. default path is used.');
    return;
  }

  if (!path.isAbsolute(root)) {
    console.log('APP_PATH_ROOT must be absolute path.');
    global.process.exit(1);
  }

  console.log(`APP_PATH_ROOT: ${root}`);

  const subdirName = pkg.name;

  for (const [key, val] of [
    ['appData', ''],
    ['userData', subdirName],
    ['sessionData', subdirName],
  ] as const) {
    app.setPath(key, path.join(root, val));
  }

  app.setAppLogsPath(path.join(root, subdirName, 'Logs'));
})();

console.log('appPath:', app.getAppPath());

const keys: Parameters<typeof app.getPath>[number][] = ['home', 'appData', 'userData', 'sessionData', 'logs', 'temp'];
keys.forEach((key) => console.log(`${key}:`, app.getPath(key)));
console.log('start whenReady');

declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/naming-convention
  var __electron__: typeof electron;
}

(async () => {
  await app.whenReady();
  console.log('App is ready');

  // Load any existing cookies from ElectronStore, set as cookie
  await initCookies();

  const serverBuild = await loadServerBuild();

  protocol.handle('http', async (req) => {
    console.log('Handling request for:', req.url);

    if (isDev) {
      console.log('Dev mode: forwarding to vite server');
      return await fetch(req);
    }

    req.headers.append('Referer', req.referrer);

    try {
      const url = new URL(req.url);

      // Forward requests to specific local server ports
      if (url.port !== `${DEFAULT_PORT}`) {
        console.log('Forwarding request to local server:', req.url);
        return await fetch(req);
      }

      // Always try to serve asset first
      const assetPath = path.join(app.getAppPath(), 'build', 'client');
      const res = await serveAsset(req, assetPath);

      if (res) {
        console.log('Served asset:', req.url);
        return res;
      }

      // Forward all cookies to remix server
      const cookies = await session.defaultSession.cookies.get({});

      if (cookies.length > 0) {
        req.headers.set('Cookie', cookies.map((c) => `${c.name}=${c.value}`).join('; '));

        // Store all cookies
        await storeCookies(cookies);
      }

      // Create request handler with the server build
      const handler = createRequestHandler(serverBuild, 'production');
      console.log('Handling request with server build:', req.url);

      const result = await handler(req, {
        /*
         * Remix app access cloudflare.env
         * Need to pass an empty object to prevent undefined
         */
        // @ts-ignore:next-line
        cloudflare: {},
      });

      return result;
    } catch (err) {
      console.log('Error handling request:', {
        url: req.url,
        error:
          err instanceof Error
            ? {
                message: err.message,
                stack: err.stack,
                cause: err.cause,
              }
            : err,
      });

      const error = err instanceof Error ? err : new Error(String(err));

      return new Response(`Error handling request to ${req.url}: ${error.stack ?? error.message}`, {
        status: 500,
        headers: { 'content-type': 'text/plain' },
      });
    }
  });

  const rendererURL = await (isDev
    ? (async () => {
        await initViteServer();

        if (!viteServer) {
          throw new Error('Vite server is not initialized');
        }

        const listen = await viteServer.listen();
        global.__electron__ = electron;
        viteServer.printUrls();

        return `http://localhost:${listen.config.server.port}`;
      })()
    : `http://localhost:${DEFAULT_PORT}`);

  console.log('Using renderer URL:', rendererURL);

  const win = await createWindow(rendererURL);

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow(rendererURL);
    }
  });

  console.log('end whenReady');

  return win;
})()
  .then((win) => {
    // IPC samples : send and recieve.
    let count = 0;
    setInterval(() => win.webContents.send('ping', `hello from main! ${count++}`), 60 * 1000);
    ipcMain.handle('ipcTest', (event, ...args) => console.log('ipc: renderer -> main', { event, ...args }));

    // Secure auth via system browser + loopback (or custom protocol via env)
    let authServer: http.Server | null = null;

    function startLoopbackServer(redirectUri: string) {
      try {
        const cbUrl = new URL(redirectUri);
        const hostname = cbUrl.hostname || '127.0.0.1';
        const port = Number(cbUrl.port || '0');
        const pathname = cbUrl.pathname || '/auth/callback';

        if (!port) {
          console.log('OIDC loopback requires explicit port in AZURE_REDIRECT_URI:', redirectUri);
          return;
        }

        if (authServer) {
          try { authServer.close(); } catch { /* noop */ }
          authServer = null;
        }

        authServer = http.createServer(async (req, res) => {
          try {
            const reqUrl = new URL(req.url ?? '/', `http://${hostname}:${port}`);
            if (req.method !== 'GET' || reqUrl.pathname !== pathname) {
              res.statusCode = 404;
              res.end('Not Found');
              return;
            }

            const code = reqUrl.searchParams.get('code');
            const stateParam = reqUrl.searchParams.get('state');

            if (!code || !stateParam) {
              res.statusCode = 400;
              res.end('Missing code/state');
              return;
            }

            // Retrieve transient values
            const verifier: string | undefined = store.get('oidc.pkce_verifier');
            const storedState: string | undefined = store.get('oidc.state');
            const nonce: string | undefined = store.get('oidc.nonce');

            if (!verifier || !storedState || !nonce) {
              res.statusCode = 400;
              res.end('Missing verifier/state/nonce');
              return;
            }

            if (storedState !== stateParam) {
              res.statusCode = 400;
              res.end('State mismatch');
              return;
            }

            const config = getOIDCConfig();

            // Exchange code for tokens
            const tokens = await exchangeCodeForTokens(config, code, verifier);

            // Validate ID token
            const payload = await validateIdToken(config, tokens.id_token, nonce);

            const claims = extractUserClaims(payload);

            // Persist tokens securely in ElectronStore (never expose to renderer)
            store.set('auth.tokens', {
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              expires_in: tokens.expires_in,
              obtained_at: Date.now(),
            });

            // Clear transient values
            store.delete('oidc.pkce_verifier');
            store.delete('oidc.state');
            store.delete('oidc.nonce');

            // Notify renderer with minimal claims
            win.webContents.send('auth:signed-in', claims);

            // HTML response to close the browser tab
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(`
              <!doctype html>
              <html><head><title>Signed In</title></head>
              <body style="font-family: system-ui; padding: 24px;">
                <h2>Signed in successfully</h2>
                <p>You may return to the app. This window can be closed.</p>
                <script>setTimeout(() => window.close(), 1000);</script>
              </body></html>
            `);

            // Shutdown loopback server after success
            try { authServer?.close(); } catch { /* noop */ }
            authServer = null;
          } catch (err) {
            console.log('Auth callback error:', err);
            res.statusCode = 500;
            res.end('Internal error');
          }
        });

        authServer.listen(port, hostname, () => {
          console.log(`OIDC loopback listening on http://${hostname}:${port}${pathname}`);
        });
      } catch (err) {
        console.log('Failed to start loopback server:', err);
      }
    }

    ipcMain.handle('auth:login', async () => {
      try {
        const config = getOIDCConfig();
        const { verifier, challenge } = createPkcePair();
        const state = generateState();
        const nonce = generateNonce();

        // Store transient values in encrypted ElectronStore
        store.set('oidc.pkce_verifier', verifier);
        store.set('oidc.state', state);
        store.set('oidc.nonce', nonce);

        const authUrl = buildAuthorizationUrl(config, state, nonce, challenge);

        // If using loopback redirect, start listener
        if (config.redirectUri.startsWith('http://127.0.0.1') || config.redirectUri.startsWith('http://localhost')) {
          startLoopbackServer(config.redirectUri);
        }

        await shell.openExternal(authUrl);
      } catch (err) {
        console.log('auth:login error', err);
        throw err;
      }
    });

    ipcMain.handle('auth:logout', async () => {
      try {
        const config = getOIDCConfig();

        // Clear tokens
        store.delete('auth.tokens');

        // Notify renderer
        win.webContents.send('auth:signed-out');

        // Open system browser to logout
        const logoutUrl = getLogoutUrl(config, new URL(win.webContents.getURL()).origin);
        await shell.openExternal(logoutUrl);
      } catch (err) {
        console.log('auth:logout error', err);
        throw err;
      }
    });

    return win;
  })
  .then((win) => setupMenu(win));

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

reloadOnChange();
setupAutoUpdater();
