import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Ensure import.meta.hot exists with a data bag (tests run without HMR)
try {
  const im = import.meta as any;
  if (!im.hot) {
    im.hot = { data: {} };
  } else if (!im.hot.data) {
    im.hot.data = {};
  }
} catch {}

// Stub indexedDB with a minimal implementation so openDatabase resolves
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g: any = globalThis as any;
  if (!g.indexedDB) {
    g.indexedDB = {};
  }
  if (typeof g.indexedDB.open !== 'function') {
    g.indexedDB.open = vi.fn((_name: string, _version: number) => {
      const request: any = { onupgradeneeded: undefined, onsuccess: undefined, onerror: undefined };
      // Simulate async open + upgrade then success
      queueMicrotask(() => {
        const fakeDb: any = {
          objectStoreNames: { contains: vi.fn().mockReturnValue(false) },
          createObjectStore: vi.fn(() => ({ createIndex: vi.fn() })),
          transaction: vi.fn((_stores: string | string[], _mode: string) => ({
            objectStore: vi.fn((_name: string) => ({
              getAll: vi.fn(() => ({ onsuccess: undefined, onerror: undefined })),
              getAllKeys: vi.fn(() => ({ onsuccess: undefined, onerror: undefined })),
              get: vi.fn(() => ({ onsuccess: undefined, onerror: undefined })),
              clear: vi.fn(() => ({ onsuccess: undefined, onerror: undefined })),
              delete: vi.fn(() => ({ onsuccess: undefined, onerror: undefined })),
              put: vi.fn(() => ({ onsuccess: undefined, onerror: undefined })),
              index: vi.fn(() => ({ get: vi.fn(() => ({ onsuccess: undefined, onerror: undefined })) })),
              openCursor: vi.fn(() => ({ onsuccess: undefined, onerror: undefined })),
            })),
            oncomplete: undefined,
            onerror: undefined,
            error: undefined,
          })),
        };
        if (typeof request.onupgradeneeded === 'function') {
          request.onupgradeneeded({ target: { result: fakeDb }, oldVersion: 0 } as any);
        }
        if (typeof request.onsuccess === 'function') {
          request.onsuccess({ target: { result: fakeDb } } as any);
        }
      });
      return request;
    });
  }
} catch {}

// Global mocks for heavy modules to keep isolated component tests light
vi.mock('~/lib/stores/workbench', () => ({
  workbenchStore: {
    actionAlert: { set: vi.fn() },
    setReloadedMessages: vi.fn(),
  },
}));

vi.mock('~/lib/webcontainer', () => ({
  webcontainerContext: { loaded: false },
  webcontainer: Promise.resolve({
    on: vi.fn(),
    setPreviewScript: vi.fn(),
  }),
}));

// Avoid persistence side-effects during component import
vi.mock('~/lib/persistence', () => ({
  openDatabase: vi.fn().mockResolvedValue(undefined),
  // Shallow implementations to satisfy potential imports
  getMessages: vi.fn(),
  getNextId: vi.fn(),
  getUrlId: vi.fn(),
  setMessages: vi.fn(),
  duplicateChat: vi.fn(),
  createChatFromMessages: vi.fn(),
  getSnapshot: vi.fn(),
  setSnapshot: vi.fn(),
}));

// Prevent heavy Artifact module from executing top-level highlighter logic
vi.mock('~/components/chat/Artifact', () => ({
  Artifact: () => null,
  openArtifactInWorkbench: vi.fn(),
}));

// Avoid loading Messages.client which can pull in Markdown/Artifact
vi.mock('~/components/chat/Messages.client', () => ({
  Messages: () => null,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;
