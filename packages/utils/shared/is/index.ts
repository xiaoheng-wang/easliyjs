/**
 * 检查代码是否在客户端（浏览器）环境中运行。
 */
export const isClient: boolean = typeof window !== 'undefined'

/**
 * 检查一个值是否已定义。
 *
 * @template T - 值的类型。
 * @param {T} val - 要检查的值。
 * @returns {val is T} - 如果该值已定义，则返回 `true`。
 */
export const isDef = <T = any>(val?: T): val is T => typeof val !== 'undefined'

/**
 * 断言条件是否为真，如果为假则发出警告。
 *
 * @param {boolean} condition - 要断言的条件。
 * @param {...any[]} infos - 警告信息。
 */
export function assert(condition: boolean, ...infos: any[]): void {
  if (!condition) {
    throw new Error(...infos)
  }
}

/**
 * 对象的 toString 方法。
 */
const toString = Object.prototype.toString

/**
 * 检查一个值是否为布尔类型。
 *
 * @param {any} val - 要检查的值。
 * @returns {val is boolean} - 如果该值是布尔类型，则返回 `true`。
 */
export const isBoolean = (val: any): val is boolean => typeof val === 'boolean'

/**
 * 检查一个值是否为函数类型。
 *
 * @template T - 函数类型。
 * @param {any} val - 要检查的值。
 * @returns {val is T} - 如果该值是函数类型，则返回 `true`。
 */
export const isFunction = <T extends (...args: any[]) => any>(val: any): val is T => typeof val === 'function'

/**
 * 检查一个值是否为数字类型。
 *
 * @param {any} val - 要检查的值。
 * @returns {val is number} - 如果该值是数字类型，则返回 `true`。
 */
export const isNumber = (val: any): val is number => typeof val === 'number'

/**
 * 检查一个值是否为字符串类型。
 *
 * @param {unknown} val - 要检查的值。
 * @returns {val is string} - 如果该值是字符串类型，则返回 `true`。
 */
export const isString = (val: unknown): val is string => typeof val === 'string'

/**
 * 检查一个值是否为对象类型。
 *
 * @param {any} val - 要检查的值。
 * @returns {val is object} - 如果该值是对象类型，则返回 `true`。
 */
export const isObject = (val: any): val is object => toString.call(val) === '[object Object]'

/**
 * 检查一个值是否为窗口对象。
 *
 * @param {any} val - 要检查的值。
 * @returns {val is Window} - 如果该值是窗口对象，则返回 `true`。
 */
export const isWindow = (val: any): val is Window => typeof window !== 'undefined' && toString.call(val) === '[object Window]'

/**
 * 获取当前时间的时间戳。
 *
 * @returns {number} - 当前时间的时间戳。
 */
export const now = (): number => Date.now()

/**
 * 获取当前时间的时间戳（与 `now` 方法相同）。
 *
 * @returns {number} - 当前时间的时间戳。
 */
export const timestamp = (): number => +Date.now()

/**
 * 将数字限制在指定的范围内。
 *
 * @param {number} n - 要限制的数字。
 * @param {number} min - 最小值。
 * @param {number} max - 最大值。
 * @returns {number} - 限制后的数字。
 */
export const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n))

/**
 * 空函数。
 */
export function noop(): void {}

/**
 * 生成指定范围内的随机整数。
 * @param {number} min - 最小值（包含）。
 * @param {number} max - 最大值（包含）。
 * @returns {number} 生成的随机整数。
 */
export function rand(min: number, max: number): number {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 检测当前设备是否是 iOS 设备。
 * @returns {boolean} 如果当前设备是 iOS 设备，则返回 true；否则返回 false。
 */
export const isIOS = /* #__PURE__ */ isClient && window?.navigator?.userAgent && /iP(?:ad|hone|od)/.test(window.navigator.userAgent)

/**
 * 检查对象是否拥有指定的属性。
 * @param {T} val - 要检查的对象。
 * @param {K} key - 要检查的属性。
 * @returns {key is K} 如果对象拥有指定的属性，则返回 true；否则返回 false。
 */
export const hasOwn = <T extends object, K extends keyof T>(val: T, key: K): key is K => Object.prototype.hasOwnProperty.call(val, key)
