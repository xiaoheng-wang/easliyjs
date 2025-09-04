// 测试设置文件，用于处理未捕获的 Promise 拒绝
/* eslint-disable node/prefer-global/process, unused-imports/no-unused-vars */

// 静默处理未捕获的 Promise 拒绝
if (typeof globalThis.process !== 'undefined') {
  globalThis.process.on('unhandledRejection', (reason) => {
    // 静默处理所有未捕获的 Promise 拒绝
    // 这些通常来自表单验证失败，在测试环境中是预期的
  })
}

// 浏览器环境中的处理
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    // 阻止默认的错误处理
    event.preventDefault()
  })
}
