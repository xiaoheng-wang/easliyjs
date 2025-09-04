/**
 * @fileoverview Vue Form Validator 开发者工具
 *
 * 提供开发和调试阶段的辅助工具，包括：
 * - 性能监控和分析
 * - 验证过程追踪
 * - 性能瓶颈警告
 */

/**
 * 性能监控器接口
 */
interface PerformanceMetric {
  /** 操作名称 */
  name: string
  /** 调用次数 */
  count: number
  /** 总耗时（毫秒） */
  totalTime: number
  /** 平均耗时（毫秒） */
  averageTime: number
  /** 最近一次耗时（毫秒） */
  lastTime: number
}

/**
 * 创建性能监控器
 *
 * 提供表单验证性能监控功能，帮助开发者识别性能瓶颈
 * 在开发环境下自动警告耗时较长的操作
 *
 * @returns 性能监控器实例，包含追踪、查看和重置功能
 *
 * @example
 * ```typescript
 * // 创建监控器
 * const monitor = createPerformanceMonitor()
 *
 * // 追踪函数执行性能
 * const result = monitor.track('fieldValidation', () => {
 *   return validateField('email')
 * })
 *
 * // 查看性能指标
 * const metrics = monitor.getMetrics()
 * console.table(metrics)
 *
 * // 重置指标
 * monitor.reset()
 * ```
 */
export function createPerformanceMonitor() {
  /** 性能指标存储 */
  const metrics: Record<string, { count: number, totalTime: number, lastTime: number }> = {}

  return {
    /**
     * 追踪函数执行性能
     *
     * 包装目标函数并测量其执行时间，自动记录性能指标
     *
     * @template T - 函数返回值类型
     * @param name - 操作名称，用于标识和分组性能指标
     * @param fn - 要监控的函数
     * @returns 函数执行结果
     *
     * @example
     * ```typescript
     * // 追踪验证函数性能
     * const validationResult = monitor.track('emailValidation', () => {
     *   return validator.validate({ email: 'test@example.com' })
     * })
     *
     * // 追踪异步函数性能
     * const asyncResult = monitor.track('asyncValidation', () => {
     *   return fetch('/api/validate').then(r => r.json())
     * })
     * ```
     */
    track<T>(name: string, fn: () => T): T {
      const start = performance.now()
      const result = fn()
      const end = performance.now()
      const duration = end - start

      // 初始化或更新指标
      if (!metrics[name]) {
        metrics[name] = { count: 0, totalTime: 0, lastTime: 0 }
      }

      metrics[name].count++
      metrics[name].totalTime += duration
      metrics[name].lastTime = duration

      // 性能警告（仅在开发模式下且有浏览器环境）
      if (typeof window !== 'undefined' && duration > 10) {
        console.warn(`⚠️ 表单验证性能警告: ${name} 耗时 ${duration.toFixed(2)}ms`)
      }

      return result
    },

    /**
     * 获取性能指标
     *
     * 返回所有已追踪操作的详细性能数据
     *
     * @returns 性能指标数组，包含每个操作的统计信息
     *
     * @example
     * ```typescript
     * const metrics = monitor.getMetrics()
     *
     * // 输出性能报告
     * metrics.forEach(metric => {
     *   console.log(`${metric.name}: 平均 ${metric.averageTime.toFixed(2)}ms, 调用 ${metric.count} 次`)
     * })
     *
     * // 或使用表格形式查看
     * console.table(metrics)
     * ```
     */
    getMetrics(): PerformanceMetric[] {
      return Object.entries(metrics).map(([name, data]) => ({
        name,
        count: data.count,
        totalTime: data.totalTime,
        averageTime: data.totalTime / data.count,
        lastTime: data.lastTime,
      }))
    },

    /**
     * 重置性能指标
     *
     * 清除所有已记录的性能数据，重新开始统计
     *
     * @example
     * ```typescript
     * // 清除历史数据
     * monitor.reset()
     *
     * // 开始新的性能测试周期
     * monitor.track('newTest', () => someFunction())
     * ```
     */
    reset(): void {
      Object.keys(metrics).forEach(key => delete metrics[key])
    },
  }
}
