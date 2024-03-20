import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@easily/shared': resolve(__dirname, 'packages/shared/index.ts'),
      '@easily/core': resolve(__dirname, 'packages/core/index.ts'),
    },
  },
});
