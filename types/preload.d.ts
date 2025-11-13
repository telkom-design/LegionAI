// Global typings for preload-exposed APIs

declare global {
  interface Window {
    ipc: {
      invoke: (...args: any[]) => Promise<any>;
      // eslint-disable-next-line @typescript-eslint/ban-types
      on: (channel: string, func: Function) => () => void;
    };

    auth: {
      login: () => Promise<void>;
      logout: () => Promise<void>;
      onSignedIn: (callback: (claims: any) => void) => () => void;
      onSignedOut: (callback: () => void) => () => void;
    };
  }
}

export {};