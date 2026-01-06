import { WebContainer } from '@webcontainer/api';
import { WORK_DIR_NAME } from '~/utils/constants';
import { cleanStackTrace } from '~/utils/stacktrace';

interface WebContainerContext {
  loaded: boolean;
}

// Handle both test and production environments
const getWebContainerContext = (): WebContainerContext => {
  if (typeof import.meta.hot === 'undefined') {
    return { loaded: false };
  }
  return import.meta.hot?.data?.webcontainerContext ?? { loaded: false };
};

export const webcontainerContext: WebContainerContext = getWebContainerContext();

if (typeof import.meta.hot !== 'undefined' && import.meta.hot && import.meta.hot.data) {
  import.meta.hot.data.webcontainerContext = webcontainerContext;
}

export let webcontainer: Promise<WebContainer> = new Promise(() => {
  // noop for ssr
});

if (typeof import.meta.env !== 'undefined' && !import.meta.env.SSR) {
  const getWebcontainer = () => {
    if (typeof import.meta.hot !== 'undefined' && import.meta.hot && import.meta.hot.data) {
      return import.meta.hot.data.webcontainer;
    }
    return undefined;
  };

  webcontainer =
    getWebcontainer() ??
    Promise.resolve()
      .then(() => {
        return WebContainer.boot({
          coep: 'credentialless',
          workdirName: WORK_DIR_NAME,
          forwardPreviewErrors: true, // Enable error forwarding from iframes
        });
      })
      .then(async (webcontainer) => {
        webcontainerContext.loaded = true;

        const { workbenchStore } = await import('~/lib/stores/workbench');

        const response = await fetch('/inspector-script.js');
        const inspectorScript = await response.text();
        await webcontainer.setPreviewScript(inspectorScript);

        // Listen for preview errors
        webcontainer.on('preview-message', (message) => {
          console.log('WebContainer preview message:', message);

          // Handle both uncaught exceptions and unhandled promise rejections
          if (message.type === 'PREVIEW_UNCAUGHT_EXCEPTION' || message.type === 'PREVIEW_UNHANDLED_REJECTION') {
            const isPromise = message.type === 'PREVIEW_UNHANDLED_REJECTION';
            const title = isPromise ? 'Unhandled Promise Rejection' : 'Uncaught Exception';
            workbenchStore.actionAlert.set({
              type: 'preview',
              title,
              description: 'message' in message ? message.message : 'Unknown error',
              content: `Error occurred at ${message.pathname}${message.search}${message.hash}\nPort: ${message.port}\n\nStack trace:\n${cleanStackTrace(message.stack || '')}`,
              source: 'preview',
            });
          }
        });

        return webcontainer;
      });

  if (typeof import.meta.hot !== 'undefined' && import.meta.hot && import.meta.hot.data) {
    import.meta.hot.data.webcontainer = webcontainer;
  }
}
