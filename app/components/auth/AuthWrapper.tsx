import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from '~/lib/auth/msalConfig';
import { AuthProvider, useAuth } from '~/lib/auth/AuthContext';
import { LoginPage } from './LoginPage';
import { type ReactNode, useEffect, useState } from 'react';

const AuthenticatedApp = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bolt-elements-background-depth-1">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-bolt-elements-textSecondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
};

export const AuthWrapper = ({ children }: { children: ReactNode }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR, show a loading state
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bolt-elements-background-depth-1">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-bolt-elements-textSecondary">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        <AuthenticatedApp>{children}</AuthenticatedApp>
      </AuthProvider>
    </MsalProvider>
  );
};