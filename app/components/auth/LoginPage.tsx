import { useState } from 'react';
import { useAuth } from '~/lib/auth/AuthContext';
import { Button } from '~/components/ui';

export const LoginPage = () => {
  const { login } = useAuth();
  const [isLogging, setIsLogging] = useState(false);

  const handleLogin = async () => {
    if (isLogging) {
      return;
    }

    setIsLogging(true);

    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      // Reset loading state after a timeout since redirect might not happen immediately
      setTimeout(() => setIsLogging(false), 3000);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex">
      {/* Left side - Login Form */}
      <div className="w-full xl:w-1/2">
        <div className="flex items-center justify-center overflow-auto" style={{ height: 'calc(100vh - 77px)' }}>
          <div className="w-full max-w-[464px] mx-auto px-6 py-11">
            {/* Logo placeholder - uncomment when logo is available */}
            <img src="/logo-light.png" className="mb-8" alt="Logo" />

            <h1 className="text-4xl font-bold mb-3">Sign In</h1>
            <p className="text-base text-gray-500 mb-6">
              Welcome to Legion AI! Sign in to access your AI-powered development assistant
            </p>

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

        {/* Footer */}
        <hr className="border-t border-gray-200" />
        <div className="p-6 text-center bg-white">
          <span className="text-gray-600">{currentYear} © AI Development Assistant by </span>
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

      {/* Right side - Background Image */}
      <div className="hidden xl:block xl:w-1/2">
        <div
          className="h-screen bg-cover bg-center bg-no-repeat bg-gradient-to-br from-blue-600 to-purple-700"
          style={{
            backgroundImage: "url('/background-whitelabel.png')", // Add your background image here
          }}
        >
          {/* Fallback gradient background if image doesn't load */}
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
