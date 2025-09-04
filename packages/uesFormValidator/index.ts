/**
 * @fileoverview Vue Form Validator - Vue 3 表单验证组合式 API
 *
 * 提供类似 Ant Design Vue Form 的表单验证功能，基于 Vue 3 Composition API 构建
 * 支持响应式验证、深度规则、防抖验证等高级特性
 *
 * @version 1.0.0
 * @author Vue Form Validator Team
 * @license MIT
 */

import type { ValidateFieldsError } from 'async-validator'
import type { Ref } from 'vue'
import type { Executable, UseFormItemPropertyKey, UseFormModel, UseFormOptions, UseFormResult, UseFormRules } from './src/types'
import { computed, effectScope, nextTick, ref, toRaw, unref, watch } from 'vue'
import { FormValidator } from './src/validator'

export * from './src/devtools'
export * from './src/rules'
// 重新导出所有类型和工具函数
export * from './src/types'
export * from './src/utils'

/**
 * useForm 函数重载声明 - 严格类型版本
 *
 * 当传入具体的 model 和 rules 时，提供严格的类型约束
 *
 * @template T - 表单数据模型类型
 * @template M - 模型引用类型，默认与 T 相同
 * @template R - 验证规则类型，默认为 UseFormRules<T>
 * @param modelRef - 表单数据模型引用
 * @param rulesRef - 验证规则引用
 * @param options - 可选的配置选项
 * @returns 表单验证结果对象
 */
export function useForm<T extends UseFormModel, M extends T = T, R extends UseFormRules<T> = UseFormRules<T>>(
  modelRef: M,
  rulesRef: R,
  options?: UseFormOptions,
): UseFormResult<T, M, R>

/**
 * useForm 函数重载声明 - 灵活类型版本
 *
 * 支持可选参数和响应式引用，提供更灵活的使用方式
 *
 * @template T - 表单数据模型类型
 * @template M - 模型引用类型，可以是值或 Ref
 * @template R - 验证规则类型，可以是值或 Ref
 * @param modelRef - 可选的表单数据模型引用
 * @param rulesRef - 可选的验证规则引用
 * @param options - 可选的配置选项
 * @returns 表单验证结果对象
 */
export function useForm<T extends UseFormModel, M extends T | Ref<T> = T | Ref<T>, R extends UseFormRules<T> | Ref<UseFormRules<T>> = UseFormRules<T> | Ref<UseFormRules<T>>>(
  modelRef?: M,
  rulesRef?: R,
  options?: UseFormOptions,
): UseFormResult<T, M, R>

/**
 * Vue 3 表单验证组合式函数
 *
 * 核心功能：
 * - 响应式表单验证：基于 async-validator 提供强大的验证能力
 * - 深度规则支持：支持嵌套对象和数组的验证
 * - 防抖验证：可配置的防抖延迟，避免频繁验证
 * - 灵活的 API：支持单字段验证、批量验证、重置等操作
 * - TypeScript 支持：完整的类型定义和类型推导
 *
 * @template T - 表单数据模型类型，必须继承自 UseFormModel
 * @template M - 模型引用类型，可以是值或 Ref<T>
 * @template R - 验证规则类型，可以是值或 Ref<UseFormRules<T>>
 *
 * @param [modelRef] - 表单数据模型，可以是响应式对象或 ref，默认为空对象的 ref
 * @param [rulesRef] - 验证规则对象，可以是响应式对象或 ref，默认为空对象的 ref
 * @param [options={}] - 配置选项
 * @param [options.debounceMs=0] - 防抖延迟时间（毫秒），0 表示不使用防抖
 * @param [options.strict] - 严格模式，控制不存在的键是否进行验证
 * @param [options.deepRule] - 是否启用深度规则验证
 * @param [options.validateOnRuleChange] - 规则变更时是否自动验证
 * @param [options.cloneDeep] - 深拷贝函数，默认使用 structuredClone
 *
 * @returns 表单验证结果对象，包含验证方法和状态
 *
 * @example
 * ```typescript
 * // 基础用法
 * const model = ref({ name: '', email: '' })
 * const rules = ref({
 *   name: [{ required: true, message: '请输入姓名' }],
 *   email: [
 *     { required: true, message: '请输入邮箱' },
 *     { type: 'email', message: '邮箱格式不正确' }
 *   ]
 * })
 *
 * const { validationState, validate, validateField, resetFields } = useForm(model, rules)
 *
 * // 验证单个字段
 * await validateField('name')
 *
 * // 验证所有字段
 * await validate()
 *
 * // 重置表单
 * resetFields()
 * ```
 *
 * @example
 * ```typescript
 * // 防抖验证
 * const { validationState } = useForm(model, rules, {
 *   debounceMs: 300
 * })
 *
 * // 深度规则验证
 * const nestedModel = ref({
 *   user: { profile: { name: '', age: 0 } }
 * })
 * const { validationState } = useForm(nestedModel, rules, {
 *   deepRule: true
 * })
 *
 * // 访问深度字段验证状态
 * validationState['user.profile.name']
 * ```
 */

export function useForm<T extends UseFormModel, M extends T | Ref<T> = T | Ref<T>, R extends UseFormRules<T> | Ref<UseFormRules<T>> = UseFormRules<T> | Ref<UseFormRules<T>>>(
  modelRef?: M,
  rulesRef?: R,
  options: UseFormOptions = {},
): UseFormResult<T, M, R> {
  // 初始化默认配置
  const finalOptions = { debounceMs: 0, ...options }
  const cloneDeep = finalOptions.cloneDeep ?? structuredClone
  const model = (modelRef ?? ref({})) as M
  const rules = (typeof rulesRef === 'function' ? computed(rulesRef) : (rulesRef ?? ref({}))) as UseFormResult<T, M, R>['rules']

  // 保存初始模型状态，用于重置表单
  const initialModel = ref(cloneDeep(toRaw(unref(model)))) as Ref<T>

  // 创建表单验证器实例
  const validator = new FormValidator(model, finalOptions)

  let isFirst = true

  /**
   * 执行字段验证的内部函数
   *
   * 遍历指定字段并执行验证，收集所有验证错误
   *
   * @param [props] - 要验证的字段名称或名称数组，不传则验证所有字段
   * @returns Promise，resolve 为 true 表示验证成功，reject 包含所有验证错误
   */
  async function doValidateField(props?: Executable<UseFormItemPropertyKey>): Promise<boolean> {
    const fields = validator.obtainValidateFields(props)
    if (fields.length === 0)
      return true

    const validationErrors: ValidateFieldsError = {}
    for (const field of fields) {
      try {
        await validator.triggerValidate(field)
      }
      catch (fields) {
        Object.assign(validationErrors, fields)
      }
    }

    return Object.keys(validationErrors).length === 0 ? true : Promise.reject(validationErrors)
  }

  /**
   * 验证指定字段
   *
   * 支持单字段或多字段验证，可选择性提供回调函数处理验证结果
   *
   * @param [props] - 要验证的字段名称或名称数组，不传则验证所有字段
   * @param [callback] - 验证完成后的回调函数
   * @returns Promise，验证成功返回 true，失败时根据是否有回调决定是否抛出异常
   */
  const validateField: UseFormResult<T, M, R>['validateField'] = async (props, callback) => {
    const shouldThrow = typeof callback !== 'function'
    try {
      const result = await doValidateField(props)
      if (result === true) {
        await callback?.(result)
      }
      return result
    }
    catch (e) {
      if (e instanceof Error)
        throw e
      const invalidFields = e as ValidateFieldsError
      await callback?.(false, invalidFields)
      if (shouldThrow) {
        return Promise.reject(invalidFields)
      }
      return false
    }
  }

  /**
   * 验证整个表单
   *
   * 验证表单中的所有字段
   *
   * @param [callback] - 验证完成后的回调函数
   * @returns Promise，验证成功返回 true，失败时根据是否有回调决定是否抛出异常
   */
  const validate: UseFormResult<T, M, R>['validate'] = callback => validateField(undefined, callback)

  /**
   * 重置表单字段
   *
   * 将表单数据重置为初始状态，并清除所有验证状态
   *
   * @param [newModel] - 可选的新初始值，用于覆盖部分字段
   */
  const resetFields: UseFormResult<T, M, R>['resetFields'] = (newModel) => {
    Object.assign(unref(model), unref(initialModel), newModel)
    nextTick(() => validator.clearValidate())
  }

  /**
   * 清除验证状态
   *
   * 清除指定字段或所有字段的验证状态和错误信息
   *
   * @param [props] - 要清除的字段名称或名称数组，不传则清除所有字段
   */
  const clearValidate: UseFormResult<T, M, R>['clearValidate'] = (props) => {
    validator.clearValidate(props)
  }

  /**
   * 清除深度验证状态
   *
   * 清理不再需要的深度字段验证信息，通常在数据结构发生变化时使用
   *
   * @param [props] - 要检查的字段名称或名称数组
   * @param [strict] - 是否使用严格模式进行清理判断
   */
  const clearDeepValidation: UseFormResult<T, M, R>['clearDeepValidation'] = (props, strict) => {
    validator.clearDeepValidation(props, strict)
  }

  /**
   * 更新验证规则
   *
   * 内部函数，当规则发生变化时调用验证器更新规则
   */
  function updateRules() {
    validator.updateRules(rules, isFirst, () => {
      // 包装 validateField 调用以避免未捕获的 Promise 拒绝
      return validateField().catch(() => {
        // 静默处理验证错误
      })
    })
    isFirst = false
  }

  // 创建响应式作用域来管理规则监听
  const scope = effectScope()
  scope.run(() => {
    // 监听规则变化，立即执行且深度监听
    watch(rules, updateRules, { immediate: true, deep: true })
  })

  /**
   * 资源清理函数
   *
   * 停止所有监听器和响应式作用域，释放内存
   * 在组件卸载时应调用此函数
   */
  const dispose = () => {
    scope.stop()
    validator.dispose()
  }

  // 返回表单验证 API
  return {
    /** 表单数据模型 */
    model,
    /** 验证规则 */
    rules,
    /** 初始表单数据模型 */
    initialModel,
    /** 验证状态对象，包含每个字段的验证状态 */
    validationState: validator.validationState,
    /** 验证指定字段的函数 */
    validateField,
    /** 验证整个表单的函数 */
    validate,
    /** 重置表单字段的函数 */
    resetFields,
    /** 清除验证状态的函数 */
    clearValidate,
    /** 清除深度验证状态的函数 */
    clearDeepValidation,
    /** 资源清理函数 */
    dispose,
  }
}
