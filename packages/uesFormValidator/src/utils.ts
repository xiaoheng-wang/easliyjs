/**
 * @fileoverview Vue Form Validator 工具函数
 *
 * 提供表单验证库所需的通用工具函数，包括：
 * - 数组转换和处理
 * - 防抖函数实现
 * - 键名标准化
 * - 对象属性安全访问
 */

import type { Executable, GetResult, UseFormPropertyKey } from './types'

/**
 * 将值转换为数组
 *
 * 统一处理单个值、数组和空值的情况，确保返回值始终为数组
 *
 * @template T - 数组元素类型
 * @param [value] - 要转换的值，可以是单个值、数组或空值
 * @param [clone] - 是否克隆数组，为 true 时返回数组的浅拷贝
 * @returns 转换后的数组
 *
 * @example
 * ```typescript
 * // 单个值转换为数组
 * toArray('name') // ['name']
 *
 * // 数组保持不变
 * toArray(['name', 'email']) // ['name', 'email']
 *
 * // 空值返回空数组
 * toArray(undefined) // []
 * toArray(null) // []
 *
 * // 克隆数组
 * const arr = ['a', 'b']
 * const cloned = toArray(arr, true)
 * cloned !== arr // true
 * ```
 */
export function toArray<T>(value?: T | T[], clone?: boolean): T[] {
  if (Array.isArray(value))
    return clone ? value.slice() : value
  if (value === undefined || value === null)
    return []
  return [value]
}

/**
 * 创建防抖函数
 *
 * 创建一个防抖版本的函数，在指定延迟时间内多次调用只执行最后一次
 *
 * @template T - 原函数类型
 * @param fn - 要防抖的原函数
 * @param delay - 防抖延迟时间（毫秒）
 * @returns 防抖处理后的函数
 *
 * @example
 * ```typescript
 * // 创建防抖验证函数
 * const validate = (field: string) => console.log('Validating:', field)
 * const debouncedValidate = debounce(validate, 300)
 *
 * // 300ms 内多次调用只执行最后一次
 * debouncedValidate('name')
 * debouncedValidate('name') // 取消上一次调用
 * debouncedValidate('name') // 只有这次会执行
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeoutId)
      clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

/**
 * 标准化属性键名
 *
 * 将各种形式的键名标准化为点分隔的字符串格式，支持缓存以提高性能
 *
 * @param key - 要标准化的键，可以是字符串、数字或数组
 * @param nkc - 标准化键名缓存对象，用于避免重复计算
 * @returns 标准化后的键名字符串
 *
 * @example
 * ```typescript
 * const cache = {}
 *
 * // 数字转字符串
 * normalizeKey(123, cache) // '123'
 *
 * // 数组转点分隔
 * normalizeKey(['user', 'profile', 'name'], cache) // 'user.profile.name'
 *
 * // 数组标记法转换
 * normalizeKey('user[profile][name]', cache) // 'user.profile.name'
 * normalizeKey('items[0].name', cache) // 'items.0.name'
 * ```
 */
export function normalizeKey(key: Executable<UseFormPropertyKey>, nkc: Record<string | number, string>): string {
  if (typeof key === 'number')
    return String(key)
  if (Array.isArray(key))
    key = key.join('.')
  return nkc[key] ?? (nkc[key] = key.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, ''))
}

/**
 * 安全获取对象属性值
 *
 * 通过点分隔的路径安全地访问对象的嵌套属性，返回详细的访问结果
 *
 * @param obj - 要访问的对象
 * @param key - 点分隔的属性路径
 * @returns 包含值、存在性和路径差异的结果对象
 *
 * @example
 * ```typescript
 * const obj = {
 *   user: {
 *     profile: {
 *       name: 'John',
 *       age: 30
 *     }
 *   }
 * }
 *
 * // 成功访问
 * get(obj, 'user.profile.name')
 * // { value: 'John', exist: true, diff: 0 }
 *
 * // 路径不存在
 * get(obj, 'user.profile.email')
 * // { value: undefined, exist: true, diff: 0 } (最后一级不存在)
 *
 * // 中间路径不存在
 * get(obj, 'user.settings.theme')
 * // { value: undefined, exist: false, diff: 1 } (settings 不存在，差异1级)
 *
 * // 完全不存在的路径
 * get(obj, 'company.info.name')
 * // { value: undefined, exist: false, diff: 2 } (company 不存在，差异2级)
 * ```
 */
export function get(obj: Record<string, any>, key: string): GetResult {
  const keys = key.split('.')
  let value: any = obj
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i]
    if (k in value) {
      value = value[k]
    }
    else {
      const d = keys.length - i - 1
      return { value: undefined, exist: d === 0, diff: d }
    }
  }
  return { value, exist: true, diff: 0 }
}
