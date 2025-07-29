import { PublicClientApplication } from '@azure/msal-browser';
import type { Configuration } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || (typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:5173'),
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
    secureCookies: true, // Set to true in production with HTTPS
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0: // Error
            console.error(`MSAL Error: ${message}`);
            break;
          case 1: // Warning
            console.warn(`MSAL Warning: ${message}`);
            break;
          case 2: // Info
            console.info(`MSAL Info: ${message}`);
            break;
          case 3: // Verbose
            console.debug(`MSAL Debug: ${message}`);
            break;
        }
      },
      piiLoggingEnabled: false,
    },
    windowHashTimeout: 60000,
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
    asyncPopups: false,
  },
};

export const loginRequest = {
  scopes: ['User.Read'],
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL instance
msalInstance.initialize();
