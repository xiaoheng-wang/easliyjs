import antfu from '@antfu/eslint-config'

export default antfu({
  // 或者你可以更加细粒度的设置
  stylistic: {
    indent: 2, // 4, or 'tab'
    quotes: 'single', // or 'double'
  },
  // TypeScript 和 Vue 是自动检测的，你也可以显式启用它们
  typescript: true,
  vue: true,

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
})
