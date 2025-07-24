import { useState } from 'react';
import { useAuth } from '~/lib/auth/AuthContext';
import { Button } from '../ui';
import { db, deleteAll } from '~/lib/persistence';
import { toast } from 'react-toastify';

export const UserProfile = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!user) return null;

  const displayName = user.name || user.username || 'User';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      <Button
        variant="secondary"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
          {initials}
        </div>
        <svg 
          className={`w-4 h-4 text-bolt-elements-textSecondary transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg shadow-lg z-20">
            <div className="p-3 border-b border-bolt-elements-borderColor">
              <div className="font-medium text-bolt-elements-textPrimary text-sm truncate">
                {displayName}
              </div>
              <div className="text-xs text-bolt-elements-textSecondary truncate">
                {user.username}
              </div>
            </div>
            <div className="p-1">
              <Button
                onClick={() => {
                  if (db) {
                    deleteAll(db);
                    toast.success('All data cleared successfully');
                  }
                  logout();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 rounded transition-colors"
              >
                Sign out
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
