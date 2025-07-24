import { BrowserAuthError, InteractionRequiredAuthError, ServerError } from '@azure/msal-browser';

// Lazy import of msalInstance to avoid SSR issues
let msalInstance: any = null;

const getMsalInstance = async () => {
  if (!msalInstance && typeof window !== 'undefined') {
    const { msalInstance: instance } = await import('./msalConfig');
    msalInstance = instance;
  }
  return msalInstance;
};

/**
 * Utility to safely handle MSAL authentication without interaction conflicts
 */
export class MSALAuthHelper {
  private static isInteractionInProgress = false;
  private static interactionStartTime = 0;
  private static readonly INTERACTION_TIMEOUT = 30000; // 30 seconds timeout

  /**
   * Check if we're in a browser environment
   */
  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  /**
   * Check if an interaction is currently in progress
   */
  static isInteracting(): boolean {
    if (!this.isBrowser()) return false;

    // Check if interaction has timed out
    if (this.isInteractionInProgress && 
        Date.now() - this.interactionStartTime > this.INTERACTION_TIMEOUT) {
      console.log('Interaction timeout detected, resetting state');
      this.resetInteractionState();
      return false;
    }
    return this.isInteractionInProgress;
  }

  /**
   * Safely attempt login with interaction conflict prevention
   */
  static async safeLogin(loginRequest: any): Promise<void> {
    const instance = await getMsalInstance();
    if (!instance) {
      console.error('MSAL instance not available');
      return;
    }

    // Check for stuck interactions
    if (this.isInteracting()) {
      console.log('Authentication interaction already in progress, checking if stuck...');
      
      // Try to determine if we're actually stuck
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        console.log('User already authenticated, resetting interaction state');
        this.resetInteractionState();
        return;
      }
      
      // If interaction has been going for too long, reset and continue
      if (Date.now() - this.interactionStartTime > this.INTERACTION_TIMEOUT) {
        console.log('Interaction appears stuck, resetting and retrying');
        this.resetInteractionState();
      } else {
        // Wait a bit and try again
        console.log('Waiting for current interaction to complete...');
        setTimeout(() => this.safeLogin(loginRequest), 1000);
        return;
      }
    }

    try {
      this.isInteractionInProgress = true;
      this.interactionStartTime = Date.now();
      
      // Check if user is already authenticated
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        console.log('User already authenticated');
        this.resetInteractionState();
        return;
      }

      console.log('Starting login redirect...');
      await instance.loginRedirect(loginRequest);
    } catch (error: any) {
      if (error instanceof BrowserAuthError) {
        if (error.errorCode === 'interaction_in_progress') {
          console.log('MSAL reports interaction in progress, this might be expected');
          // Don't reset here, let the timeout handle it
          return;
        }
      }
      
      console.error('Login error:', error);
      this.resetInteractionState();
      throw error;
    }
    // Note: Don't reset here as redirect will reload the page
  }

  /**
   * Safely attempt logout
   */
  static async safeLogout(logoutRequest: any): Promise<void> {
    const instance = await getMsalInstance();
    if (!instance) {
      console.error('MSAL instance not available');
      return;
    }

    try {
      this.isInteractionInProgress = true;
      this.interactionStartTime = Date.now();
      
      await instance.logoutRedirect(logoutRequest);
    } catch (error: any) {
      if (error instanceof BrowserAuthError && error.errorCode === 'interaction_in_progress') {
        console.log('Interaction in progress during logout, clearing and reloading');
        this.clearAndReload();
        return;
      }
      
      console.error('Logout error:', error);
      this.resetInteractionState();
      throw error;
    }
  }

  /**
   * Force clear any stuck authentication state
   */
  static forceClearState(): void {
    if (!this.isBrowser()) return;

    console.log('Force clearing authentication state...');
    this.resetInteractionState();
    
    // Clear MSAL cache by clearing storage (accounts are stored there)
    try {
      // Clear specific MSAL keys from storage
      const msalKeys = Object.keys(localStorage).filter(key => key.includes('msal'));
      msalKeys.forEach(key => localStorage.removeItem(key));
      
      const sessionMsalKeys = Object.keys(sessionStorage).filter(key => key.includes('msal'));
      sessionMsalKeys.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing MSAL storage:', error);
      // Fallback: clear all storage
      localStorage.clear();
      sessionStorage.clear();
    }
  }

  /**
   * Clear storage and reload page as last resort
   */
  static clearAndReload(): void {
    if (!this.isBrowser()) return;

    console.log('Clearing storage and reloading page...');
    this.forceClearState();
    window.location.href = window.location.origin;
  }

  /**
   * Reset interaction state (call after successful redirect handling)
   */
  static resetInteractionState(): void {
    this.isInteractionInProgress = false;
    this.interactionStartTime = 0;
  }

  /**
   * Handle redirect promise with proper error handling
   */
  static async handleRedirectPromise(): Promise<any> {
    if (!this.isBrowser()) {
      console.warn('Redirect promise handling attempted on server side, skipping');
      return null;
    }

    const instance = await getMsalInstance();
    if (!instance) {
      console.error('MSAL instance not available for redirect promise handling');
      return null;
    }

    try {
      const result = await instance.handleRedirectPromise();
      this.resetInteractionState();
      return result;
    } catch (error: any) {
      console.error('Redirect promise error:', error);
      this.resetInteractionState();
      throw error;
    }
  }
}