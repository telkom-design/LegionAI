import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./app/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'app/test/', '**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts', '**/*.test.tsx'],
    },
    server: {
      deps: {
        inline: ['@remix-run/react'],
      },
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './app'),
      '~/lib/webcontainer': path.resolve(__dirname, './app/lib/webcontainer/__mocks__/index.ts'),
    },
  },
  define: {
    /*
     * Provide a minimal HMR stub so optional chains like `import.meta.hot?.data.shellHighlighter`
     * don't crash in tests. The real HMR behavior isn't needed here.
     */
    'import.meta.hot': '({ data: {} })',
  },
});
