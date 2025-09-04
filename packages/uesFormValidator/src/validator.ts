import type { WatchHandle } from 'vue'
import type { Executable, GetResult, UseFormItemPropertyKey, UseFormOptions, UseFormRuleItem, UseFormValidateFailure, UseFormValidateInfo } from './types'
import AsyncValidator from 'async-validator'
import { effectScope, reactive, ref, unref, watch } from 'vue'
import { getRuleByDeepRule, isRequired } from './rules'
import { FormValidationError } from './types'
import { debounce, get, normalizeKey, toArray } from './utils'

/**
 * 表单验证管理器
 *
 * 负责管理表单验证的核心逻辑，包括：
 * - 验证规则的标准化和存储
 * - 验证状态的管理
 * - 深度规则的处理
 * - 监听器的管理
 * - 防抖验证的支持
 *
 * @example
 * ```typescript
 * const options = { strict: true, debounceMs: 300 }
 * const validator = new FormValidator(model, options)
 *
 * // 触发验证
 * await validator.triggerValidate('name')
 *
 * // 清理资源
 * validator.dispose()
 * ```
 */
export class FormValidator {
  /** 标准化后的验证规则存储 */
  private normalizedRules = ref<Record<string, UseFormRuleItem[]>>({})

  /** 深度规则键的映射，记录哪些键是深度规则生成的 */
  private deepRuleKeys = new Map<string, boolean>()

  /** 标准化键名的缓存，避免重复计算 */
  private nkc: Record<string | number, string> = {}

  /** 监听器句柄的存储，用于后续清理 */
  private watchHandles: Record<string, WatchHandle> = {}

  /** 验证信息的响应式存储 */
  private _validateInfos: Record<string, UseFormValidateInfo> = reactive({})

  /** 作用域，用于管理所有响应式副作用 */
  private scope = effectScope()

  /** 防抖验证函数，当配置了防抖时间时生成 */
  private debouncedValidate?: (...args: any[]) => void

  /**
   * 创建表单验证器实例
   *
   * @param model - 表单数据模型，可以是响应式对象或 ref
   * @param options - 验证选项配置
   * @param options.debounceMs - 防抖延迟时间，0 表示不使用防抖
   * @param options.strict - 严格模式，控制不存在的键是否进行验证
   * @param options.deepRule - 是否启用深度规则
   * @param options.validateOnRuleChange - 规则变更时是否自动验证
   */
  constructor(
    private model: any,
    private options: UseFormOptions,
  ) {
    // 如果配置了防抖时间，创建防抖验证函数
    if (options.debounceMs && options.debounceMs > 0) {
      this.debouncedValidate = debounce((key: string, value?: any) => {
        this.triggerValidate(key, value).catch(() => {
          // 静默处理防抖验证中的错误
        })
      }, options.debounceMs)
    }
  }

  /**
   * 获取验证信息的代理对象
   *
   * 通过 Proxy 实现懒加载和动态创建深度规则：
   * - 当访问不存在的深度路径时，自动生成相应的验证规则
   * - 避免预先创建所有可能的深度路径，提高性能
   *
   * @returns 验证信息的代理对象，支持动态访问深度路径
   *
   * @example
   * ```typescript
   * // 访问普通字段
   * validator.validationState.name
   *
   * // 访问深度字段（如果启用了 deepRule）
   * validator.validationState['user.profile.name']
   * ```
   */
  get validationState() {
    return new Proxy(this._validateInfos, {
      get: (target, p, receiver) => {
        if (typeof p === 'string' && !p.startsWith('__v_')) {
          const key = normalizeKey(p, this.nkc)
          // 处理深度规则：如果是深度路径且未处理过，尝试生成深度规则
          if (!(key in target) && key.includes('.') && this.options.deepRule && !this.deepRuleKeys.has(key)) {
            const deepRules = getRuleByDeepRule(key, this.normalizedRules.value)
            if (deepRules.length) {
              this.setValidateInfo(key, { required: isRequired(deepRules) }, true)
              this.deepRuleKeys.set(key, true)
              this.normalizedRules.value[key] = deepRules
              this.addListeners(key)
            }
            else {
              this.deepRuleKeys.set(key, false)
            }
          }
          return Reflect.get(target, key, receiver)
        }
        return Reflect.get(target, p, receiver)
      },
      has: (target, p) => Reflect.has(target, p),
    })
  }

  /**
   * 为指定字段添加监听器
   *
   * 在作用域内为字段值的变化添加响应式监听，支持以下功能：
   * - 值变化时自动触发验证
   * - 支持防抖验证
   * - 避免重复创建监听器
   *
   * @param props - 要监听的字段标识符，可以是单个字符串或字符串数组
   *
   * @example
   * ```typescript
   * // 为单个字段添加监听器
   * validator.addListeners('name')
   *
   * // 为多个字段添加监听器
   * validator.addListeners(['name', 'email'])
   * ```
   */
  private addListeners(props: Executable<string>) {
    this.scope.run(() => {
      toArray(props).forEach((key) => {
        if (!this.watchHandles[key]) {
          this.watchHandles[key] = watch(
            () => get(unref(this.model), key),
            (value) => {
              if (this.debouncedValidate) {
                this.debouncedValidate(key, value)
              }
              else {
                // 捕获未处理的Promise拒绝
                this.triggerValidate(key, value).catch(() => {
                  // 静默处理验证错误，避免未捕获的Promise拒绝
                })
              }
            },
          )
        }
      })
    })
  }

  /**
   * 设置验证信息
   *
   * 为指定字段创建或更新验证状态信息
   *
   * @param key - 字段标识符
   * @param info - 验证信息对象，null 表示删除该字段的验证信息
   * @param [isCreate] - 是否为创建模式，true 时直接赋值，false 时合并属性
   *
   * @example
   * ```typescript
   * // 创建新的验证信息
   * validator.setValidateInfo('email', { required: true, validateStatus: 'success' }, true)
   *
   * // 更新现有验证信息
   * validator.setValidateInfo('email', { validateStatus: 'error', error: 'Invalid email' })
   *
   * // 删除验证信息
   * validator.setValidateInfo('email', null)
   * ```
   */
  private setValidateInfo(key: string, info: UseFormValidateInfo | null, isCreate?: boolean) {
    if (info) {
      isCreate ? (this._validateInfos[key] = info) : Object.assign(this._validateInfos[key], info)
    }
    else {
      delete this._validateInfos[key]
    }
  }

  /**
   * 获取要验证的字段列表
   *
   * 根据传入的参数和配置确定需要验证的字段：
   * - 如果传入具体字段，返回过滤后存在规则的字段
   * - 如果不传参数，返回所有规则中的字段
   * - 在深度规则模式下，过滤掉深度生成的字段
   *
   * @param [props] - 可选的字段名称或名称数组
   * @returns 标准化后的字段名称数组
   *
   * @example
   * ```typescript
   * // 获取所有有效字段
   * validator.obtainValidateFields()
   *
   * // 获取指定字段中有规则的字段
   * validator.obtainValidateFields(['name', 'email', 'nonExistent'])
   * ```
   */
  obtainValidateFields(props?: Executable<UseFormItemPropertyKey>) {
    const nr = unref(this.normalizedRules)
    const fields = toArray(props, true).map(key => normalizeKey(key, this.nkc))
    if (fields.length)
      return fields.filter(key => key in nr)
    const keys = Object.keys(nr)
    return this.options.deepRule ? keys.filter(key => !this.deepRuleKeys.has(key)) : keys
  }

  /**
   * 触发字段验证
   *
   * 对指定字段执行异步验证，处理以下逻辑：
   * - 检查字段是否存在（基于 strict 模式）
   * - 处理深度规则的级联验证
   * - 更新验证状态（validating -> success/error）
   * - 返回验证结果
   *
   * @param key - 要验证的字段标识符
   * @param [getResult] - 预先获取的字段值结果，避免重复计算
   * @returns Promise，resolve 为 true 表示验证成功，reject 包含验证错误信息
   *
   * @throws {FormValidationError} 当验证发生未知错误时
   *
   * @example
   * ```typescript
   * // 验证单个字段
   * try {
   *   await validator.triggerValidate('email')
   *   console.log('Email validation passed')
   * } catch (errors) {
   *   console.log('Validation errors:', errors)
   * }
   *
   * // 使用预计算的值
   * const result = get(model, 'name')
   * await validator.triggerValidate('name', result)
   * ```
   */
  async triggerValidate(key: string, getResult?: GetResult): Promise<boolean> {
    const { value, exist, diff } = getResult || get(unref(this.model), key)

    // 如果字段不存在且不在严格模式下，或路径差异较大，清除验证状态
    if (!exist && (!this.options.strict || diff > 1)) {
      this.setValidateInfo(key, { validateStatus: '', error: undefined })

      // 处理深度规则：清除相关深度字段的验证状态
      if (this.options.deepRule) {
        this.deepRuleKeys.forEach((valid, k) => {
          if (valid && key.startsWith(k) && key !== k) {
            this.setValidateInfo(k, { validateStatus: '', error: undefined })
          }
        })
      }
      return true
    }

    // 设置验证中状态
    this.setValidateInfo(key, { validateStatus: 'validating', error: undefined })

    // 收集需要同时验证的深度字段
    const deepKeys: string[] = []
    if (this.options.deepRule) {
      this.deepRuleKeys.forEach((valid, k) => {
        if (valid && k.startsWith(key) && key !== k) {
          deepKeys.push(k)
          this.setValidateInfo(k, { validateStatus: 'validating', error: undefined })
        }
      })
    }

    // 执行异步验证
    const validator = new AsyncValidator({ [key]: this.normalizedRules.value[key] })
    return validator
      .validate({ [key]: value }, { firstFields: true })
      .then(() => {
        // 验证成功，更新状态
        this.setValidateInfo(key, { validateStatus: 'success' })
        deepKeys.forEach((k) => {
          this.setValidateInfo(k, { validateStatus: 'success' })
        })
        return true
      })
      .catch((err) => {
        // 验证失败，处理错误信息
        const { errors, fields } = err as UseFormValidateFailure
        if (!errors && !fields) {
          console.error('Validation error:', err)
          throw new FormValidationError(key, 'unknown', value, 'Unknown validation error')
        }

        // 更新主字段的验证状态
        this.setValidateInfo(key, key in fields ? { validateStatus: 'error', error: errors?.[0]?.message } : { validateStatus: 'success', error: '' })

        // 更新深度字段的验证状态
        deepKeys.forEach((k) => {
          if (k in fields)
            this.setValidateInfo(k, { validateStatus: 'error', error: fields[k][0].message })
          else this.setValidateInfo(k, { validateStatus: 'success', error: undefined })
        })

        return Promise.reject(fields)
      })
  }

  /**
   * 清除验证状态
   *
   * 清除指定字段或所有字段的验证状态信息，包括：
   * - 清除验证状态（validating/success/error -> ''）
   * - 清除错误信息
   * - 处理相关的深度字段
   *
   * @param [props] - 要清除的字段名称或名称数组，不传则清除所有字段
   *
   * @example
   * ```typescript
   * // 清除所有字段的验证状态
   * validator.clearValidate()
   *
   * // 清除指定字段的验证状态
   * validator.clearValidate('email')
   *
   * // 清除多个字段的验证状态
   * validator.clearValidate(['name', 'email'])
   * ```
   */
  clearValidate(props?: Executable<UseFormItemPropertyKey>) {
    const fields = this.obtainValidateFields(props)
    fields.forEach((key) => {
      this.setValidateInfo(key, { validateStatus: '', error: undefined })
    })
    // 清除相关深度字段的验证状态
    this.deepRuleKeys.forEach((valid, key) => {
      if (valid && fields.some(f => key.startsWith(f) && key !== f)) {
        this.setValidateInfo(key, { validateStatus: '', error: undefined })
      }
    })
  }

  /**
   * 清除深度字段信息
   *
   * 当深度字段对应的数据不存在时，清理相关的验证信息和监听器
   *
   * @param key - 深度字段的键名
   * @param [strict] - 是否使用严格模式进行清理判断
   *
   * @private
   */
  private clearDeepInfo(key: string, strict?: boolean) {
    const { exist, diff } = get(unref(this.model), key)
    if (!exist && (strict || diff)) {
      this.setValidateInfo(key, null)
      this.deepRuleKeys.delete(key)
      this.watchHandles[key]()
      delete this.watchHandles[key]
      delete this.normalizedRules.value[key]
    }
  }

  /**
   * 批量清除深度字段信息
   *
   * 清理不再需要的深度字段验证信息，通常在数据结构发生变化时调用
   *
   * @param [props] - 要检查的字段名称或名称数组，不传则检查所有深度字段
   * @param [strict] - 是否使用严格模式进行清理判断
   *
   * @example
   * ```typescript
   * // 清理所有无效的深度字段
   * validator.clearDeepValidation()
   *
   * // 清理特定字段相关的深度字段
   * validator.clearDeepValidation(['user', 'profile'])
   *
   * // 严格模式清理
   * validator.clearDeepValidation(undefined, true)
   * ```
   */
  clearDeepValidation(props?: Executable<UseFormItemPropertyKey>, strict?: boolean) {
    if (!this.options.deepRule)
      return

    const keys = toArray(props)
    if (keys.length) {
      keys.forEach((key) => {
        key = normalizeKey(key, this.nkc)
        if (this.deepRuleKeys.get(key)) {
          this.clearDeepInfo(key, strict)
        }
      })
    }
    else {
      this.deepRuleKeys.forEach((valid, key) => {
        valid && this.clearDeepInfo(key, strict)
      })
    }
  }

  /**
   * 更新验证规则
   *
   * 动态更新表单的验证规则，处理以下逻辑：
   * - 清理旧的深度规则映射
   * - 标准化新的验证规则
   * - 复用现有的监听器，为新字段创建监听器
   * - 清理不再需要的字段信息
   * - 可选择性触发重新验证
   *
   * @param rules - 新的验证规则对象
   * @param isFirst - 是否为首次设置规则
   * @param validateField - 验证函数，在规则更新后可能被调用
   *
   * @example
   * ```typescript
   * const newRules = {
   *   name: { required: true, message: 'Name is required' },
   *   email: [
   *     { required: true, message: 'Email is required' },
   *     { type: 'email', message: 'Invalid email format' }
   *   ]
   * }
   *
   * validator.updateRules(newRules, false, () => {
   *   console.log('Rules updated, validation triggered')
   * })
   * ```
   */
  updateRules(rules: any, isFirst: boolean, validateField: () => void) {
    // 清理深度规则映射
    this.deepRuleKeys.clear()

    // 创建新的规则存储
    const newRules: Record<string, UseFormRuleItem[]> = (this.normalizedRules.value = {})
    const oldHandles = this.watchHandles
    this.watchHandles = {}
    const listenKeys: string[] = []

    // 处理新规则
    Object.entries(unref(rules)).forEach(([key, rule]) => {
      key = normalizeKey(key, this.nkc)
      newRules[key] = toArray(rule as UseFormRuleItem, true)

      let isCreate = false
      if (key in oldHandles) {
        // 复用现有监听器
        this.watchHandles[key] = oldHandles[key]
      }
      else {
        // 标记需要创建新监听器
        isCreate = true
        listenKeys.push(key)
      }

      // 设置验证信息
      this.setValidateInfo(key, { required: isRequired(newRules[key]) }, isCreate)
    })

    // 清理不再需要的字段
    Object.keys(oldHandles).forEach((key) => {
      if (!(key in this.watchHandles)) {
        oldHandles[key]() // 停止监听器
        this.setValidateInfo(key, null) // 删除验证信息
      }
    })

    // 为新字段添加监听器
    this.addListeners(listenKeys)

    // 如果不是首次设置且配置了规则变更时验证，则触发验证
    if (!isFirst && this.options.validateOnRuleChange) {
      validateField()
    }
  }

  /**
   * 释放资源
   *
   * 清理验证器使用的所有资源，包括：
   * - 停止响应式作用域
   * - 清理所有字段监听器
   * - 清空监听器句柄存储
   *
   * 在组件卸载或不再需要验证器时应调用此方法以避免内存泄漏
   *
   * @example
   * ```typescript
   * // 在组件卸载时清理资源
   * onBeforeUnmount(() => {
   *   validator.dispose()
   * })
   * ```
   */
  dispose() {
    // 停止响应式作用域
    this.scope.stop()

    // 清理所有监听器
    Object.values(this.watchHandles).forEach(handle => handle())
    this.watchHandles = {}
  }
}
