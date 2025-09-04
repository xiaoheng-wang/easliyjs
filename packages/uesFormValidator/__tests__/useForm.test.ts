import type { UseFormRuleItem } from '../src/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive, ref } from 'vue'
import { useForm } from '../index'

describe('useForm', () => {
  let consoleWarnSpy: any
  let formInstances: any[] = []

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    formInstances = []
  })

  afterEach(async () => {
    consoleWarnSpy.mockRestore()
    // 确保清理所有表单实例的资源
    formInstances.forEach((instance) => {
      if (instance?.dispose) {
        instance.dispose()
      }
    })
    formInstances = []
    // 等待一个微任务以确保所有异步操作完成
    await new Promise(resolve => setTimeout(resolve, 0))
  })

  // 辅助函数：创建表单并自动添加到清理列表
  const createForm = (...args: any[]) => {
    const form = useForm(...args)
    formInstances.push(form)
    return form
  }

  describe('基础功能', () => {
    it('应该正确初始化表单', () => {
      const model = reactive({ name: '', age: 0 })
      const rules = {
        name: { required: true, message: '请输入姓名' } as UseFormRuleItem,
        age: { type: 'number' as const, min: 0, message: '年龄必须大于0' } as UseFormRuleItem,
      }

      const formResult = createForm(model, rules)

      expect(formResult.model).toBe(model)
      expect(formResult.rules).toBe(rules)
      expect(formResult.initialModel.value).toEqual({ name: '', age: 0 })
      expect(formResult.validationState).toBeDefined()
      expect(typeof formResult.validate).toBe('function')
      expect(typeof formResult.validateField).toBe('function')
      expect(typeof formResult.resetFields).toBe('function')
      expect(typeof formResult.clearValidate).toBe('function')
    })

    it('应该支持空参数初始化', () => {
      const formResult = createForm()

      expect(formResult.model).toBeDefined()
      expect(formResult.rules).toBeDefined()
      expect(formResult.validationState).toBeDefined()
    })

    it('应该支持 ref 类型的 model 和 rules', () => {
      const model = ref({ name: '', email: '' })
      const rules = ref({
        name: { required: true, message: '请输入姓名' } as UseFormRuleItem,
        email: { required: true, type: 'email' as const, message: '请输入有效邮箱' } as UseFormRuleItem,
      })

      const formResult = createForm(model, rules)

      expect(formResult.model).toBe(model)
      expect(formResult.rules).toBe(rules)
    })
  })

  describe('字段验证', () => {
    it('应该正确验证单个字段', async () => {
      const model = reactive({ name: '', email: 'test@example.com' })
      const rules = {
        name: { required: true, message: '请输入姓名' } as UseFormRuleItem,
        email: { type: 'email' as const, message: '请输入有效邮箱' } as UseFormRuleItem,
      }

      const { validateField, validationState } = useForm(model, rules)

      // 验证失败的字段
      await expect(validateField('name')).rejects.toEqual({
        name: [{ message: '请输入姓名', fieldValue: '', field: 'name' }],
      })
      expect(validationState.name?.validateStatus).toBe('error')
      expect(validationState.name?.error).toBe('请输入姓名')

      // 设置有效值后验证成功
      model.name = '张三'
      await nextTick()
      const result = await validateField('name')
      expect(result).toBe(true)
      expect(validationState.name?.validateStatus).toBe('success')
    })

    it('应该支持多字段验证', async () => {
      const model = reactive({ name: '', email: '' })
      const rules = {
        name: { required: true, message: '请输入姓名' } as UseFormRuleItem,
        email: { required: true, message: '请输入邮箱' } as UseFormRuleItem,
      }

      const { validateField } = useForm(model, rules)

      await expect(validateField(['name', 'email'])).rejects.toEqual({
        name: [{ message: '请输入姓名', fieldValue: '', field: 'name' }],
        email: [{ message: '请输入邮箱', fieldValue: '', field: 'email' }],
      })
    })

    it('应该支持验证回调函数', async () => {
      const model = reactive({ name: '' })
      const rules = {
        name: { required: true, message: '请输入姓名' } as UseFormRuleItem,
      }

      const { validateField } = useForm(model, rules)

      const callback = vi.fn()
      const result = await validateField('name', callback)

      expect(result).toBe(false)
      expect(callback).toHaveBeenCalledWith(false, expect.any(Object))
    })
  })

  describe('表单验证', () => {
    it('应该正确验证整个表单', async () => {
      const model = reactive({ name: '张三', email: 'test@example.com' })
      const rules = {
        name: { required: true, message: '请输入姓名' } as UseFormRuleItem,
        email: { type: 'email' as const, message: '请输入有效邮箱' } as UseFormRuleItem,
      }

      const { validate } = useForm(model, rules)

      const result = await validate()
      expect(result).toBe(true)
    })

    it('应该在验证失败时返回错误', async () => {
      const model = reactive({ name: '', email: 'invalid-email' })
      const rules = {
        name: { required: true, message: '请输入姓名' } as UseFormRuleItem,
        email: { type: 'email' as const, message: '请输入有效邮箱' } as UseFormRuleItem,
      }

      const { validate } = createForm(model, rules)

      try {
        await validate()
        expect.fail('Expected validation to fail')
      }
      catch (errors: any) {
        expect(errors).toHaveProperty('name')
        expect(errors).toHaveProperty('email')
        expect(errors.name).toEqual([{ message: '请输入姓名', fieldValue: '', field: 'name' }])
        expect(errors.email).toEqual([{ message: '请输入有效邮箱', fieldValue: 'invalid-email', field: 'email' }])
      }
    })
  })

  describe('表单重置', () => {
    it('应该重置表单到初始状态', async () => {
      const model = reactive({ name: '', email: '' })
      const rules = {
        name: { required: true, message: '请输入姓名' } as UseFormRuleItem,
      }

      const { resetFields, validateField, validationState } = useForm(model, rules)

      // 修改数据并触发验证错误
      model.name = '张三'
      model.email = 'test@example.com'

      await validateField('name') // 这次应该成功，不触发错误      // 重置表单
      resetFields()

      expect(model.name).toBe('')
      expect(model.email).toBe('')

      await nextTick()
      expect(validationState.name?.validateStatus).toBe('')
    })

    it('应该支持部分字段重置', async () => {
      const model = reactive({ name: '张三', email: 'test@example.com' })
      const { resetFields } = useForm(model, {})

      resetFields({ name: '李四' })

      expect(model.name).toBe('李四')
      expect(model.email).toBe('test@example.com')
    })
  })

  describe('清除验证状态', () => {
    it('应该清除指定字段的验证状态', async () => {
      const model = reactive({ name: '', email: '' })
      const rules = {
        name: { required: true, message: '请输入姓名' } as UseFormRuleItem,
        email: { required: true, message: '请输入邮箱' } as UseFormRuleItem,
      }

      const { validateField, clearValidate, validationState } = useForm(model, rules)

      // 触发验证错误
      await expect(validateField(['name', 'email'])).rejects.toEqual({
        name: [{ message: '请输入姓名', fieldValue: '', field: 'name' }],
        email: [{ message: '请输入邮箱', fieldValue: '', field: 'email' }],
      })

      expect(validationState.name?.validateStatus).toBe('error')
      expect(validationState.email?.validateStatus).toBe('error')

      // 清除单个字段
      clearValidate('name')
      await nextTick()

      expect(validationState.name?.validateStatus).toBe('')
      expect(validationState.email?.validateStatus).toBe('error')
    })

    it('应该清除所有字段的验证状态', async () => {
      const model = reactive({ name: '', email: '' })
      const rules = {
        name: { required: true, message: '请输入姓名' } as UseFormRuleItem,
        email: { required: true, message: '请输入邮箱' } as UseFormRuleItem,
      }

      const { validateField, clearValidate, validationState } = useForm(model, rules)

      // 触发验证错误
      await expect(validateField()).rejects.toEqual({
        name: [{ message: '请输入姓名', fieldValue: '', field: 'name' }],
        email: [{ message: '请输入邮箱', fieldValue: '', field: 'email' }],
      })

      expect(validationState.name?.validateStatus).toBe('error')
      expect(validationState.email?.validateStatus).toBe('error')

      // 清除所有字段
      clearValidate()
      await nextTick()

      expect(validationState.name?.validateStatus).toBe('')
      expect(validationState.email?.validateStatus).toBe('')
    })
  })

  describe('高级配置', () => {
    it('应该支持防抖验证', async () => {
      const model = reactive({ name: '' })
      const rules = {
        name: { required: true, message: '请输入姓名' } as UseFormRuleItem,
      }

      const { validateField } = createForm(model, rules, { debounceMs: 100 })

      // 这里只是验证防抖配置不会报错，具体防抖逻辑需要集成测试
      try {
        const result = await validateField('name')
        expect(result).toBe(false)
      }
      catch (error) {
        // 预期的验证失败
        expect(error).toBeDefined()
      }
    })

    it('应该支持深度规则', () => {
      const model = reactive({
        user: {
          profile: { name: '', age: 0 },
        },
      })
      const rules = {
        'user.profile.name': { required: true, message: '请输入姓名' } as UseFormRuleItem,
      }

      const { validationState } = useForm(model, rules, { deepRule: true })

      expect(validationState).toBeDefined()
      // 验证深度规则配置不会报错
    })

    it('应该支持自定义克隆函数', () => {
      const model = reactive({ name: '张三' })
      const rules = {}

      const customClone = vi.fn((obj: any) => ({ ...obj }))
      const { initialModel } = useForm(model, rules, { cloneDeep: customClone })

      expect(customClone).toHaveBeenCalled()
      expect(initialModel.value).toEqual({ name: '张三' })
    })
  })

  describe('资源清理', () => {
    it('应该正确清理资源', () => {
      const model = reactive({ name: '' })
      const rules = { name: { required: true, message: '请输入姓名' } as UseFormRuleItem }

      const { dispose } = useForm(model, rules)

      expect(() => dispose()).not.toThrow()
    })
  })

  describe('复杂验证场景', () => {
    it('应该支持数组规则', async () => {
      const model = reactive({ email: '' })
      const rules = {
        email: [
          { required: true, message: '请输入邮箱' },
          { type: 'email' as const, message: '邮箱格式不正确' },
        ] as UseFormRuleItem[],
      }

      const { validateField, validationState } = useForm(model, rules)

      // 测试必填验证
      await expect(validateField('email')).rejects.toEqual({
        email: [{ message: '请输入邮箱', fieldValue: '', field: 'email' }],
      })
      expect(validationState.email?.error).toBe('请输入邮箱')

      // 测试格式验证
      model.email = 'invalid-email'
      await expect(validateField('email')).rejects.toEqual({
        email: [{ message: '邮箱格式不正确', fieldValue: 'invalid-email', field: 'email' }],
      })
      expect(validationState.email?.error).toBe('邮箱格式不正确')

      // 测试验证通过
      model.email = 'test@example.com'
      const result = await validateField('email')
      expect(result).toBe(true)
      expect(validationState.email?.validateStatus).toBe('success')
    })

    it('应该正确处理必填字段标识', async () => {
      const model = reactive({ name: '', optional: '' })
      const rules = {
        name: { required: true, message: '请输入姓名' } as UseFormRuleItem,
        optional: { message: '可选字段' } as UseFormRuleItem,
      }

      const { validationState } = useForm(model, rules)

      await nextTick()

      expect(validationState.name?.required).toBe(true)
      expect(validationState.optional?.required).toBeFalsy()
    })
  })
})
