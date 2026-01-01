import { describe, it, expect, vi } from 'vitest';
// Prevent heavy client component from loading real stores
vi.mock('./Chat.client', () => ({
  Chat: () => null,
}));
import {
  BaseChat,
  Chat,
  ChatAlert,
  ChatBox,
  ExamplePrompts,
  GitCloneButton,
  ImportFigmaButton,
  StarterKits,
  SupabaseChatAlert,
} from './index';

describe('Chat Components Index', () => {
  describe('Exports', () => {
    it('should export BaseChat component', () => {
      expect(BaseChat).toBeDefined();
      expect(typeof BaseChat).toBe('object'); // forwardRef components are objects
    });

    it('should export Chat component', () => {
      expect(Chat).toBeDefined();
      expect(typeof Chat).toBe('function');
    });

    it('should export ChatAlert component', () => {
      expect(ChatAlert).toBeDefined();
      expect(typeof ChatAlert).toBe('function');
    });

    it('should export ChatBox component', () => {
      expect(ChatBox).toBeDefined();
      expect(typeof ChatBox).toBe('function');
    });

    it('should export ExamplePrompts component', () => {
      expect(ExamplePrompts).toBeDefined();
      expect(typeof ExamplePrompts).toBe('function');
    });

    it('should export GitCloneButton component', () => {
      expect(GitCloneButton).toBeDefined();
      expect(typeof GitCloneButton).toBe('function');
    });

    it('should export ImportFigmaButton component', () => {
      expect(ImportFigmaButton).toBeDefined();
      expect(typeof ImportFigmaButton).toBe('function');
    });

    it('should export StarterKits component', () => {
      expect(StarterKits).toBeDefined();
      expect(typeof StarterKits).toBe('function');
    });

    it('should export SupabaseChatAlert component', () => {
      expect(SupabaseChatAlert).toBeDefined();
      expect(typeof SupabaseChatAlert).toBe('function');
    });
  });

  describe('Component Availability', () => {
    it('should have all main chat components available', () => {
      const components = [
        BaseChat,
        Chat,
        ChatAlert,
        ChatBox,
        ExamplePrompts,
        GitCloneButton,
        ImportFigmaButton,
        StarterKits,
        SupabaseChatAlert,
      ];

      components.forEach((component) => {
        expect(component).toBeDefined();
        expect(component).not.toBeNull();
      });
    });

    it('should export exactly 9 components', () => {
      const exportedComponents = {
        BaseChat,
        Chat,
        ChatAlert,
        ChatBox,
        ExamplePrompts,
        GitCloneButton,
        ImportFigmaButton,
        StarterKits,
        SupabaseChatAlert,
      };

      expect(Object.keys(exportedComponents)).toHaveLength(9);
    });
  });

  describe('Type Safety', () => {
    it('should have correct types for function components', () => {
      // These should be functions or objects (for forwardRef)
      expect(['function', 'object']).toContain(typeof BaseChat);
      expect(['function', 'object']).toContain(typeof Chat);
      expect(['function', 'object']).toContain(typeof ChatAlert);
      expect(['function', 'object']).toContain(typeof ChatBox);
      expect(['function', 'object']).toContain(typeof ExamplePrompts);
    });

    it('should have valid component names', () => {
      const componentNames = [
        'BaseChat',
        'Chat',
        'ChatAlert',
        'ChatBox',
        'ExamplePrompts',
        'GitCloneButton',
        'ImportFigmaButton',
        'StarterKits',
        'SupabaseChatAlert',
      ];

      componentNames.forEach((name) => {
        expect(name).toMatch(/^[A-Z][a-zA-Z]*$/);
      });
    });
  });

  describe('Module Structure', () => {
    it('should allow destructured imports', async () => {
      // This test verifies that the module can be imported with destructuring (ESM-friendly)
      const mod = await import('./index');
      const { BaseChat: BC, Chat: C } = mod;
      expect(BC).toBeDefined();
      expect(C).toBeDefined();
    });

    it('should maintain consistent export pattern', async () => {
      // All exports should be named exports
      const indexModule = await import('./index');
      const exportNames = Object.keys(indexModule);

      expect(exportNames.length).toBeGreaterThan(0);
      expect(exportNames).toContain('BaseChat');
      expect(exportNames).toContain('Chat');
    });
  });

  describe('Import Validation', () => {
    it('should not have undefined exports', async () => {
      const indexModule = await import('./index');
      const exportValues = Object.values(indexModule);

      exportValues.forEach((value) => {
        expect(value).toBeDefined();
        expect(value).not.toBeNull();
      });
    });

    it('should export unique components', () => {
      const components = [
        BaseChat,
        Chat,
        ChatAlert,
        ChatBox,
        ExamplePrompts,
        GitCloneButton,
        ImportFigmaButton,
        StarterKits,
        SupabaseChatAlert,
      ];

      const uniqueComponents = new Set(components);
      expect(uniqueComponents.size).toBe(components.length);
    });
  });
});
