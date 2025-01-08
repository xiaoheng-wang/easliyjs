import antfu from '@antfu/eslint-config'

export default antfu({
  // 或者你可以更加细粒度的设置
  stylistic: {
    indent: 2, // 4, or 'tab'
    quotes: 'single', // or 'double'
  },

  // 规则覆盖
  vue: {
    overrides: {
      'vue/operator-linebreak': ['error', 'before'],
    },
  },

  formatters: {
    css: true,
    html: true,
  },
  // 关闭对 JSON 和 YAML 的支持
  jsonc: false,
  yaml: false,

  ignores: ['pnpm-lock.yaml', 'docs/**'],
})
