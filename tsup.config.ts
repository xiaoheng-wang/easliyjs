import { defineConfig } from 'tsup'

const baseConfig = {
  dts: true, // 添加 .d.ts 文件
  metafile: true, // 添加 meta 文件
  minify: true, // 压缩
  splitting: false,
  // legacyOutput: true,
  sourcemap: true, // 添加 sourcemap 文件
  clean: true, // 是否先清除打包的目录，例如 dist
}

export default defineConfig([
  {
    entry: ['packages/utils/shared/index.ts'],
    format: ['cjs', 'esm', 'iife'],
    outDir: 'packages/utils/shared/dist',
    ...baseConfig,
  },
  {
    entry: ['packages/utils/core/index.ts'],
    format: ['cjs', 'esm', 'iife'],
    outDir: 'packages/utils/core/dist',
    ...baseConfig,
  },
])
