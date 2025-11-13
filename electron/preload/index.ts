import { ipcRenderer, contextBridge, type IpcRendererEvent } from 'electron';

console.debug('start preload.', ipcRenderer);

const ipc = {
  invoke(...args: any[]) {
    return ipcRenderer.invoke('ipcTest', ...args);
  },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  on(channel: string, func: Function) {
    const f = (event: IpcRendererEvent, ...args: any[]) => func(...[event, ...args]);
    console.debug('register listener', channel, f);
    ipcRenderer.on(channel, f);

    return () => {
      console.debug('remove listener', channel, f);
      ipcRenderer.removeListener(channel, f);
    };
  },
};

contextBridge.exposeInMainWorld('ipc', ipc);

// Expose secure auth bridge: initiate login/logout via system browser handled in main,
// and subscribe to auth state events.
const auth = {
  login(): Promise<void> {
    return ipcRenderer.invoke('auth:login');
  },
  logout(): Promise<void> {
    return ipcRenderer.invoke('auth:logout');
  },
  // Subscribe to signed-in event with minimal user claims payload
  onSignedIn(callback: (claims: any) => void) {
    const handler = (_event: IpcRendererEvent, claims: any) => callback(claims);
    ipcRenderer.on('auth:signed-in', handler);
    return () => ipcRenderer.removeListener('auth:signed-in', handler);
  },
  onSignedOut(callback: () => void) {
    const handler = (_event: IpcRendererEvent) => callback();
    ipcRenderer.on('auth:signed-out', handler);
    return () => ipcRenderer.removeListener('auth:signed-out', handler);
  },
};

contextBridge.exposeInMainWorld('auth', auth);
