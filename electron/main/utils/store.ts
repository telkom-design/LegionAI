import ElectronStore from 'electron-store';

// Use SESSION_SECRET as encryption key for ElectronStore to secure tokens at rest.
// Falls back to a hardcoded string only if SESSION_SECRET is missing (not recommended).
const encryptionKey = process.env.SESSION_SECRET || 'set-SESSION_SECRET-in-env';

export const store = new ElectronStore<any>({ encryptionKey });
