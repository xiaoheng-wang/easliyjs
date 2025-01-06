import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@easily-js/utils-shared': resolve(
        __dirname,
        'packages/utils/shared/index.ts',
      ),
      '@easily-js/utils-core': resolve(
        __dirname,
        'packages/utils/score/index.ts',
      ),
    },
  },
})
