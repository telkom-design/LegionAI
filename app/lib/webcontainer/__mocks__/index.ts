import { vi } from 'vitest';

// Mock webcontainer context for tests
export const webcontainerContext = {
  loaded: false,
};

export const webcontainer = Promise.resolve({
  mount: vi.fn(),
  spawn: vi.fn(() => ({
    output: {
      pipeTo: vi.fn(),
    },
    exit: Promise.resolve(0),
  })),
  on: vi.fn(),
  fs: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readdir: vi.fn(),
    mkdir: vi.fn(),
  },
});

export const newShellProcess = vi.fn();
export const newBoltShellProcess = vi.fn();
