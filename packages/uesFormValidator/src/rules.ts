/**
 * @fileoverview Vue Form Validator 规则处理工具
 *
 * 提供验证规则相关的处理函数，包括：
 * - 必填规则检测
 * - 深度规则识别和处理
 * - 规则有效性验证
 */

import type { UseFormModel, UseFormRuleItem, UseFormRules } from './types'
import { toArray } from './utils'

/**
 * 检测规则是否包含必填要求
 *
 * 检查单个或多个验证规则中是否存在 required: true 的规则
 *
 * @param rule - 验证规则，可以是单个规则或规则数组
 * @returns 如果存在必填规则返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * // 单个必填规则
 * isRequired({ required: true, message: '必填' }) // true
 *
 * // 规则数组中包含必填
 * isRequired([
 *   { type: 'string' },
 *   { required: true, message: '必填' }
 * ]) // true
 *
 * // 无必填规则
 * isRequired({ type: 'email' }) // false
 * ```
 */
export function isRequired(rule: UseFormRuleItem | UseFormRuleItem[]): boolean {
  return toArray(rule).some(r => r.required)
}

/**
 * 判断是否为深度规则
 *
 * 检查规则是否支持嵌套验证（对象或数组类型且有嵌套字段定义）
 *
 * @param rule - 要检查的验证规则
 * @returns 如果是深度规则返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * // 对象深度规则
 * isDeepRule({
 *   type: 'object',
 *   fields: {
 *     name: { required: true }
 *   }
 * }) // true
 *
 * // 数组深度规则
 * isDeepRule({
 *   type: 'array',
 *   defaultField: { type: 'string' }
 * }) // true
 *
 * // 普通规则
 * isDeepRule({ required: true }) // false
 * ```
 */
export function isDeepRule(rule: UseFormRuleItem): boolean {
  return (rule.type === 'object' || rule.type === 'array') && !!(rule.fields || rule.defaultField)
}

/**
 * 根据深度规则获取指定路径的验证规则
 *
 * 递归解析深度规则，提取指定路径对应的验证规则
 * 支持对象嵌套和数组嵌套的复杂场景
 *
 * @param key - 点分隔的字段路径，如 'user.profile.name'
 * @param ruleSource - 规则源对象，包含所有字段的验证规则
 * @returns 适用于该路径的验证规则数组
 *
 * @example
 * ```typescript
 * const rules = {
 *   'user': {
 *     type: 'object',
 *     fields: {
 *       profile: {
 *         type: 'object',
 *         fields: {
 *           name: { required: true, type: 'string' }
 *         }
 *       }
 *     }
 *   }
 * }
 *
 * // 获取嵌套字段的规则
 * getRuleByDeepRule('user.profile.name', rules)
 * // 返回: [{ required: true, type: 'string' }]
 *
 * // 数组场景
 * const arrayRules = {
 *   'items': {
 *     type: 'array',
 *     defaultField: { type: 'string', required: true }
 *   }
 * }
 *
 * getRuleByDeepRule('items.0', arrayRules)
 * // 返回: [{ type: 'string', required: true }]
 * ```
 */
export function getRuleByDeepRule(key: string, ruleSource: Record<string, UseFormRuleItem | UseFormRuleItem[]>) {
  const keys = key.split('.')
  const rules: UseFormRuleItem[] = []

  for (let i = 0; i < keys.length; i++) {
    let j = i + 1
    let deepRules: UseFormRuleItem[] = toArray(ruleSource[keys.slice(0, j).join('.')])

    // 递归解析深度规则
    while (deepRules.length && j < keys.length) {
      const currentKey = keys[j]
      const currentRules: UseFormRuleItem[] = []

      for (const rule of deepRules) {
        if (isDeepRule(rule)) {
          // 添加默认字段规则（用于数组元素）
          currentRules.push(...toArray(rule.defaultField))
          // 添加指定字段规则（用于对象属性）
          currentRules.push(...toArray(rule.fields?.[currentKey]))
        }
      }

      deepRules = currentRules
      j++
    }

    // 如果路径完全匹配，添加到结果中
    if (j >= keys.length) {
      rules.push(...deepRules)
    }
  }

  return rules
}

/**
 * 验证规则有效性检查器
 *
 * 开发者工具函数，用于检查验证规则的有效性和潜在问题
 * 帮助开发者发现规则配置中的错误和不合理之处
 *
 * @template T - 表单数据模型类型
 * @param rules - 要检查的验证规则集合
 * @returns 包含验证结果、错误和警告的对象
 *
 * @example
 * ```typescript
 * const rules = {
 *   name: { required: true },
 *   age: { type: 'number', min: '18' }, // 类型错误
 *   email: { required: false, min: 5 }, // 逻辑警告
 *   empty: {} // 缺少验证条件
 * }
 *
 * const result = validateRules(rules)
 * // {
 * //   isValid: false,
 * //   errors: ['规则 "age[0]" type 为 number 但 min 值为字符串'],
 * //   warnings: [
 * //     '规则 "email[0]" 设置了 required: false 但同时设置了 min 限制',
 * //     '规则 "empty[0]" 缺少验证条件'
 * //   ]
 * // }
 * ```
 */
export function validateRules<T extends UseFormModel>(
  rules: UseFormRules<T>,
): {
  /** 规则是否有效（无错误） */
    isValid: boolean
    /** 严重错误列表 */
    errors: string[]
    /** 警告信息列表 */
    warnings: string[]
  } {
  const errors: string[] = []
  const warnings: string[] = []

  Object.entries(rules).forEach(([key, rule]) => {
    const ruleArray = toArray(rule)

    ruleArray.forEach((r, index) => {
      // 检查是否缺少验证条件
      if (!r.type && !r.required && !r.validator && !r.pattern) {
        warnings.push(`规则 "${key}[${index}]" 缺少验证条件`)
      }

      // 检查逻辑矛盾：非必填但设置了最小值
      if (r.required === false && r.min !== undefined) {
        warnings.push(`规则 "${key}[${index}]" 设置了 required: false 但同时设置了 min 限制`)
      }

      // 检查类型不匹配：数字类型但最小值为字符串
      if (r.type === 'number' && typeof r.min === 'string') {
        errors.push(`规则 "${key}[${index}]" type 为 number 但 min 值为字符串`)
      }
    })
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}
