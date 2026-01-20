import { useState } from 'react';
import { useSearchParams } from '@remix-run/react';
import { Button } from '~/components/ui';

export const LoginPage = () => {
  const [isLogging, setIsLogging] = useState(false);
  const [searchParams] = useSearchParams();
  const authError = searchParams.get('auth_error');
  const authDetail = searchParams.get('auth_detail');

  const errorMessage = (() => {
    switch (authError) {
      case 'missing_params':
        return 'Missing code/state in the callback.';
      case 'state_mismatch':
        return 'State mismatch. Session may have expired or multiple tabs initiated login.';
      case 'missing_pkce':
        return 'Missing PKCE verifier/nonce. Please retry sign-in.';
      case 'redirect_uri_mismatch':
        return 'Redirect URI mismatch with Azure app registration. Ensure the exact localhost URL is registered.';
      case 'invalid_client':
        return 'Invalid client configuration. Check AZURE_CLIENT_ID and app type.';
      case 'unauthorized_client':
        return 'Unauthorized client. Verify Azure app permissions and platform settings.';
      case 'token_exchange_failed':
        return 'Token exchange failed. Check network connectivity and Azure configuration.';
      case 'invalid_nonce':
        return 'Invalid nonce detected during token validation.';
      case 'callback_failed':
        return 'Authentication callback failed.';
      default:
        return null;
    }
  })();

  const handleLogin = async () => {
    if (isLogging) {
      return;
    }

    setIsLogging(true);

    try {
      if (window.auth?.login) {
        await window.auth.login();
      } else {
        window.location.href = '/auth/login';
      }
    } finally {
      setTimeout(() => setIsLogging(false), 3000);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex">
      <div className="w-full xl:w-1/2">
        <div className="flex items-center justify-center overflow-auto bg-white dark:bg-gray-950" style={{ height: 'calc(100vh - 77px)' }}>
          <div className="w-full max-w-[464px] mx-auto px-6 py-11">
            {/* <img src="/logo-light-alpha.png" className="mb-8" alt="Logo" /> */}
            <img src="/logo-light-alpha.png" alt="logo" className="mb-8 inline-block dark:hidden" />
            <img src="/logo-dark-alpha.png" alt="logo" className="mb-8 inline-block hidden dark:block" />

            <h1 className="text-4xl font-bold mb-3 dark:text-white">Sign In</h1>
            <p className="text-base text-gray-500 mb-6 dark:text-gray-300">
              Welcome to Legion AI! Sign in to access your AI-powered development assistant
            </p>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-md border border-red-300 bg-red-50 text-red-800">
                <div className="font-semibold mb-1">Sign-in error</div>
                <div className="text-sm">{errorMessage}</div>

                {authDetail && (
                  <div className="mt-2 rounded-md bg-white/60 text-xs text-red-900 border border-red-200 p-2 overflow-auto">
                    <div className="font-mono whitespace-pre-wrap break-words">{authDetail}</div>
                  </div>
                )}

                <div className="mt-2 text-sm">
                  <button
                    onClick={handleLogin}
                    className="underline text-red-700 hover:text-red-900"
                    disabled={isLogging}
                  >
                    Try again
                  </button>
                  <span className="text-gray-500 ml-2">
                    If the issue persists, verify Azure redirect URIs and client settings.
                  </span>
                </div>
              </div>
            )}
            <div className="mt-3 mb-3">
              <div className="pt-3 w-full">
                <Button
                  onClick={handleLogin}
                  disabled={isLogging}
                  className={`
                    w-full flex items-center justify-center gap-1 px-6 py-6
                    bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg
                    font-medium transition-colors duration-200
                    ${isLogging ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}
                  `}
                >
                  {isLogging ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-2"></div>
                  ) : (
                    <img src="/icons/MsEntra.png" width="28" height="28" className="mr-1" alt="Microsoft Entra ID" />
                  )}
                  {isLogging ? 'Signing in...' : 'Sign in with Microsoft'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-t border-gray-200 dark:border-gray-800" />
        <div className="p-6 text-center bg-white dark:bg-gray-950 text-sm text-gray-900">
          <span className="text-gray-600 dark:text-gray-400">{currentYear} © AI Development Assistant by </span>
          <a
            href="https://legion.digitaltelkom.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Legion Design System
          </a>
        </div>
      </div>

      <div className="hidden xl:block xl:w-1/2">
        <div
          className="h-screen bg-cover bg-center bg-no-repeat bg-gradient-to-br from-white to-purple-700 dark:from-gray-900 dark:to-purple-900"
          // style={{
          //   backgroundImage: "url('/background-whitelabel.png')",
          // }}
        >
          <div className="h-full w-full bg-gradient-to-br from-white/20 to-purple-700/80 flex items-center justify-center">
            <div className="text-white text-center px-12">
              <h2 className="text-4xl font-bold mb-4">AI-Powered Development</h2>
              <p className="text-xl opacity-90">Build faster, code smarter with Legion AI</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
