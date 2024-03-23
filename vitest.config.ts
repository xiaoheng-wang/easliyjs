import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@easily-js/shared': resolve(__dirname, 'packages/shared/index.ts'),
      '@easily-js/core': resolve(__dirname, 'packages/core/index.ts'),
    },
  },
});
