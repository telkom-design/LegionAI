import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { MSALAuthHelper } from './MSALAuthHelper';
import { loginRequest } from './msalConfig';
import type { AccountInfo } from '@azure/msal-browser';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AccountInfo | null;
  login: () => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're only running on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run authentication logic on the client side
    if (!isClient) {
      return;
    }

    // Use the helper to handle redirect promise
    MSALAuthHelper.handleRedirectPromise()
      .then(() => {
        setLoading(false);
      })
      .catch((error) => {
        console.error('MSAL redirect promise error:', error);
        setLoading(false);
      });
  }, [instance, isClient]);

  const login = async () => {
    if (!isClient) {
      return;
    }

    try {
      await MSALAuthHelper.safeLogin(loginRequest);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    if (!isClient) {
      return;
    }

    try {
      const logoutRequest = {
        postLogoutRedirectUri: window.location.origin,
        mainWindowRedirectUri: window.location.origin,
      };

      await MSALAuthHelper.safeLogout(logoutRequest);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading state until client-side hydration is complete
  if (!isClient) {
    return (
      <AuthContext.Provider
        value={{
          isAuthenticated: false,
          user: null,
          login,
          logout,
          loading: true,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user: accounts[0] || null,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
