import { defineConfig } from 'tsup'

const baseConfig = {
  dts: true, // 启用 .d.ts 文件生成
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
    format: ['cjs', 'esm'], // 对于有依赖的包，暂时只构建 cjs 和 esm
    outDir: 'packages/utils/core/dist',
    external: ['@easily-js/utils-shared'], // 将内部依赖标记为外部依赖
    ...baseConfig,
  },
  {
    entry: ['packages/uesFormValidator/index.ts'],
    format: ['cjs', 'esm'], // Vue 组件通常用 cjs 和 esm
    outDir: 'packages/uesFormValidator/dist',
    external: ['vue', 'async-validator'], // Vue 相关的外部依赖
    tsconfig: './tsconfig.build-vue-form.json', // 使用专用的 tsconfig
    ...baseConfig,
  },
  {
    entry: ['packages/components/index.ts'],
    format: ['cjs', 'esm'], // Vue 组件通常用 cjs 和 esm
    outDir: 'packages/components/dist',
    external: ['vue'], // Vue 相关的外部依赖
    dts: false, // 暂时禁用组件的类型生成，因为有 .vue 文件
    metafile: true,
    minify: true,
    splitting: false,
    sourcemap: true,
    clean: true,
  },
])
