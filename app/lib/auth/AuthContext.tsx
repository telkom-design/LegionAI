import { createContext, useContext, type ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: unknown | null;
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
  const login = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/logout';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: false,
        user: null,
        login,
        logout,
        loading: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
