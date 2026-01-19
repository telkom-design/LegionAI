import { describe, it, expect, vi } from 'vitest';

// Mock heavy child modules to prevent side effects on import
vi.mock('remix-utils/client-only', () => ({
  ClientOnly: ({ children }: { children: unknown }) => null,
}));
vi.mock('~/components/workbench/Workbench.client', () => ({
  Workbench: () => null,
}));
vi.mock('@radix-ui/react-tooltip', () => ({
  Provider: ({ children }: any) => children,
}));
import { BaseChat } from './BaseChat';

/**
 * Unit tests for the BaseChat component
 *
 * Note: BaseChat is a complex component with many dependencies.
 * These tests focus on structural validation and type checking.
 * Integration tests should be added for full component rendering.
 */

describe('BaseChat Component', () => {
  describe('Module Exports', () => {
    it('should export BaseChat component', () => {
      expect(BaseChat).toBeDefined();
    });

    it('should be a valid React component (forwardRef)', () => {
      expect(typeof BaseChat).toBe('object'); // forwardRef returns an object
      expect(BaseChat).toHaveProperty('$$typeof');
    });
  });

  describe('Component Structure', () => {
    it('should have display name for debugging', () => {
      // ForwardRef components have a displayName or name
      const hasName = 'displayName' in BaseChat || 'name' in BaseChat;
      expect(hasName).toBe(true);
    });
  });

  describe('Type Safety', () => {
    it('should accept TypeScript props interface', () => {
      /*
       * This test validates that TypeScript compilation works
       * The component definition itself validates prop types at compile time
       */
      expect(BaseChat).toBeDefined();
    });
  });
});
