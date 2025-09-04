/**
 * @fileoverview Vue Form Validator 类型定义
 *
 * 定义了表单验证库的所有 TypeScript 类型、接口和类型别名
 * 提供完整的类型支持，确保开发时的类型安全
 */

import type { RuleItem, ValidateError, ValidateFieldsError } from 'async-validator'
import type { ComputedGetter, ComputedRef, Ref, WritableComputedRef } from 'vue'

/**
 * 可执行类型，表示单个值或值的数组
 *
 * @template T - 值的类型
 * @example
 * ```typescript
 * // 可以是单个字符串
 * const single: Executable<string> = 'name'
 *
 * // 也可以是字符串数组
 * const multiple: Executable<string> = ['name', 'email']
 * ```
 */
export type Executable<T> = T | T[]

/**
 * 表单属性键类型
 *
 * 支持字符串和数字作为对象属性键
 */
export type UseFormPropertyKey = string | number

/**
 * 表单项属性键类型
 *
 * 可以是单个属性键或属性键数组
 */
export type UseFormItemPropertyKey = Executable<UseFormPropertyKey>

/**
 * 表单数据模型接口
 *
 * 定义表单数据的基本结构，支持任意键值对
 */
export interface UseFormModel {
  [K: UseFormPropertyKey]: any
}

/**
 * 表单验证规则触发时机
 *
 * - 'blur': 失去焦点时触发验证
 * - 'change': 值改变时触发验证
 */
export type UseFormRuleItemTrigger = 'blur' | 'change'

/**
 * 表单验证规则项
 *
 * 继承自 async-validator 的 RuleItem，添加了触发时机配置
 */
export interface UseFormRuleItem extends RuleItem {
  /** 验证触发时机，可以是单个值或数组 */
  trigger?: Executable<UseFormRuleItemTrigger>
}

/**
 * 表单验证规则集合
 *
 * 定义整个表单的验证规则，键对应表单字段，值为验证规则
 *
 * @template T - 表单数据模型类型，默认为 UseFormModel
 *
 * @example
 * ```typescript
 * const rules: UseFormRules<{ name: string; email: string }> = {
 *   name: { required: true, message: '请输入姓名' },
 *   email: [
 *     { required: true, message: '请输入邮箱' },
 *     { type: 'email', message: '邮箱格式不正确' }
 *   ]
 * }
 * ```
 */
export type UseFormRules<T extends UseFormModel = UseFormModel> = {
  [K in keyof T]?: UseFormRuleItem | UseFormRuleItem[]
}

/**
 * 表单配置选项
 *
 * 定义表单验证的各种配置参数
 */
export interface UseFormOptions {
  /**
   * 开启深度规则监听
   *
   * 启用后支持对嵌套对象和数组进行验证
   *
   * @default false
   * @example
   * ```typescript
   * // 启用深度规则后可以验证嵌套字段
   * const model = { user: { profile: { name: '' } } }
   * const options = { deepRule: true }
   * // 可以访问 validationState['user.profile.name']
   * ```
   */
  deepRule?: boolean

  /**
   * 严格模式
   *
   * - false: 键不存在时不进行验证
   * - true: 键不存在时仍然进行验证
   *
   * @default false
   */
  strict?: boolean

  /**
   * 规则变更时自动验证
   *
   * 当验证规则发生变化时是否自动触发验证
   *
   * @default false
   */
  validateOnRuleChange?: boolean

  /**
   * 验证防抖延迟时间（毫秒）
   *
   * 设置大于 0 的值可以避免频繁验证，提高性能
   *
   * @default 0
   * @example
   * ```typescript
   * // 300ms 防抖延迟
   * const options = { debounceMs: 300 }
   * ```
   */
  debounceMs?: number

  /**
   * 深度克隆函数
   *
   * 用于克隆初始表单数据，支持自定义克隆逻辑
   *
   * @default structuredClone
   * @example
   * ```typescript
   * import { cloneDeep } from 'lodash-es'
   * const options = { cloneDeep }
   * ```
   */
  cloneDeep?: <T>(value: T) => T
}

/**
 * 表单验证结果类型
 *
 * 表示异步验证操作的 Promise 结果
 */
export type UseFormValidationResult = Promise<boolean>

/**
 * 表单验证回调函数类型
 *
 * 用于处理验证完成后的结果
 *
 * @param isValid - 验证是否通过
 * @param invalidFields - 验证失败的字段信息，仅在验证失败时提供
 *
 * @example
 * ```typescript
 * const callback: UseFormValidateCallback = (isValid, invalidFields) => {
 *   if (isValid) {
 *     console.log('验证通过')
 *   } else {
 *     console.log('验证失败:', invalidFields)
 *   }
 * }
 * ```
 */
export type UseFormValidateCallback = (isValid: boolean, invalidFields?: ValidateFieldsError) => Promise<void> | void

/**
 * 表单验证失败信息
 *
 * 包含验证失败时的错误详情
 */
export interface UseFormValidateFailure {
  /** 验证错误数组，可能为 null */
  errors: ValidateError[] | null
  /** 按字段分组的验证错误 */
  fields: ValidateFieldsError
}

/**
 * 表单验证状态
 *
 * - 'error': 验证失败
 * - 'validating': 验证中
 * - 'success': 验证成功
 * - '': 未验证或已清除状态
 */
export type UseFormValidateStatus = 'error' | 'validating' | 'success' | ''

/**
 * 表单字段验证信息
 *
 * 包含单个字段的验证状态和错误信息
 */
export interface UseFormValidateInfo {
  /**
   * 是否为必填项
   *
   * 通常从验证规则中的 required 属性推导而来
   */
  required?: boolean

  /**
   * 验证状态
   *
   * 表示当前字段的验证状态
   */
  validateStatus?: UseFormValidateStatus

  /**
   * 错误信息
   *
   * 验证失败时的具体错误描述
   */
  error?: string
}

/**
 * 表单验证信息集合
 *
 * 包含表单中所有字段的验证信息，支持类型安全的字段访问
 *
 * @template T - 表单数据模型类型，默认为 UseFormModel
 *
 * @example
 * ```typescript
 * const validationState: UseFormValidateInfos<{ name: string; email: string }> = {
 *   name: { required: true, validateStatus: 'success' },
 *   email: { required: true, validateStatus: 'error', error: '邮箱格式不正确' }
 * }
 * ```
 */
export type UseFormValidateInfos<T extends UseFormModel = UseFormModel> = {
  [key in keyof T]?: UseFormValidateInfo
} & {
  [key: UseFormPropertyKey]: UseFormValidateInfo
}

/**
 * useForm 函数的返回结果类型
 *
 * 定义了 useForm 组合式函数返回的完整 API 接口
 *
 * @template T - 表单数据模型类型
 * @template M - 模型引用类型，可以是值或 Ref
 * @template R - 验证规则类型，支持多种响应式形式
 *
 * @example
 * ```typescript
 * interface UserForm {
 *   name: string
 *   email: string
 * }
 *
 * const result: UseFormResult<UserForm, Ref<UserForm>, Ref<UseFormRules<UserForm>>> = useForm(
 *   ref({ name: '', email: '' }),
 *   ref({ name: { required: true } })
 * )
 * ```
 */
export interface UseFormResult<
  T extends UseFormModel,
  M extends T | Ref<T>,
  R extends UseFormRules<T> | Ref<UseFormRules<T>> | ComputedRef<UseFormRules<T>> | WritableComputedRef<UseFormRules<T>> | (() => UseFormRules<T>),
> {
  /** 表单数据模型 */
  model: M

  /** 验证规则，类型根据传入的规则类型推导 */
  rules: R extends ComputedGetter<any> ? ComputedRef<UseFormRules<T>> : R

  /** 初始表单数据模型，用于重置表单 */
  initialModel: Ref<T>

  /** 验证状态集合，包含所有字段的验证状态 */
  validationState: UseFormValidateInfos<T>

  /**
   * 验证整个表单
   *
   * @param callback - 可选的验证完成回调
   * @returns Promise，验证成功返回 true
   */
  validate: (callback?: UseFormValidateCallback) => UseFormValidationResult

  /**
   * 验证指定字段
   *
   * @param props - 要验证的字段名称或名称数组
   * @param callback - 可选的验证完成回调
   * @returns Promise，验证结果
   */
  validateField: (props?: Executable<UseFormItemPropertyKey>, callback?: UseFormValidateCallback) => Promise<any>

  /**
   * 重置表单字段
   *
   * @param newModel - 可选的新初始值，用于覆盖部分字段
   */
  resetFields: (newModel?: Partial<T>) => void

  /**
   * 清除验证状态
   *
   * @param props - 要清除的字段名称或名称数组
   */
  clearValidate: (props?: Executable<UseFormItemPropertyKey>) => void

  /**
   * 清除深度验证状态
   *
   * 用于清除深层嵌套字段的验证状态和缓存
   *
   * @param props - 要清除的字段名称或名称数组，不传则清除所有深度信息
   * @param strict - 严格模式，为 true 时会强制清除即使字段不存在
   */
  clearDeepValidation: (props?: Executable<UseFormItemPropertyKey>, strict?: boolean) => void

  /**
   * 释放资源
   *
   * 清理所有监听器和响应式作用域
   */
  dispose: () => void
}

/**
 * 字段值获取结果
 *
 * 包含字段值及其存在性和路径差异信息
 */
export interface GetResult {
  /** 字段值 */
  value: any
  /** 字段是否存在 */
  exist: boolean
  /** 路径差异程度 */
  diff: number
}

/**
 * 表单验证错误类
 *
 * 继承自 Error，提供结构化的验证错误信息
 *
 * @example
 * ```typescript
 * try {
 *   // 验证逻辑
 * } catch (error) {
 *   if (error instanceof FormValidationError) {
 *     console.log(`字段 ${error.field} 验证失败: ${error.message}`)
 *   }
 * }
 * ```
 */
export class FormValidationError extends Error {
  /**
   * 创建表单验证错误实例
   *
   * @param field - 验证失败的字段名
   * @param rule - 触发错误的验证规则
   * @param value - 验证失败时的字段值
   * @param message - 可选的错误消息，默认生成标准消息
   */
  constructor(
    public field: string,
    public rule: string,
    public value: any,
    message?: string,
  ) {
    super(message || `Validation failed for field "${field}"`)
    this.name = 'FormValidationError'
  }
}
