# Vue Form Validator 使用指南

> 🚀 基于 Vue 3 Composition API 的现代表单验证解决方案

## 📖 概述

Vue Form Validator 是一个专为 Vue 3 设计的表单验证库，提供了类似 Ant Design Vue Form 的强大验证功能。它基于 `async-validator` 构建，提供完整的 TypeScript 支持和灵活的 API 设计。

### ✨ 核心特性

- 🎯 **Vue 3 原生支持**：基于 Composition API 设计，完美融入 Vue 3 生态
- 📝 **TypeScript 类型安全**：完整的类型定义和智能提示
- 🔄 **响应式验证**：自动监听数据变化，实时验证
- 🌊 **深度规则支持**：支持嵌套对象和数组的复杂验证场景
- ⚡ **防抖验证**：可配置的防抖延迟，优化性能
- 🎨 **灵活配置**：支持多种验证触发方式和自定义配置
- 🧹 **资源管理**：自动清理监听器，避免内存泄漏

### 📦 安装

```bash
npm install @easily-js/vue-form-validator async-validator
# 或
pnpm add @easily-js/vue-form-validator async-validator
# 或
yarn add @easily-js/vue-form-validator async-validator
```

## 🚀 快速开始

### 基础使用

```vue
<template>
  <el-form :model="model">
    <el-form-item label="用户名" v-bind="validationState.username">
      <el-input v-model="model.username" />
    </el-form-item>

    <el-form-item label="邮箱" v-bind="validationState.email">
      <el-input v-model="model.email" />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="handleSubmit">提交</el-button>
      <el-button @click="handleReset">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useForm } from '@easily-js/vue-form-validator'

// 定义表单数据模型
const model = reactive({
  username: '',
  email: '',
})

// 定义验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    {
      min: 3,
      max: 20,
      message: '用户名长度在 3 到 20 个字符',
      trigger: 'blur',
    },
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
  ],
}

// 创建表单验证实例
const { validationState, validate, validateField, resetFields, clearValidate } =
  useForm(model, rules)

// 提交表单
const handleSubmit = async () => {
  try {
    await validate()
    console.log('验证通过，提交表单：', model)
  } catch (errors) {
    console.log('验证失败：', errors)
  }
}

// 重置表单
const handleReset = () => {
  resetFields()
}
</script>
```

## 📚 核心概念

### 类型系统

Vue Form Validator 提供完整的 TypeScript 类型支持：

```typescript
// 表单数据模型接口
interface UseFormModel {
  [K: string | number]: any
}

// 验证规则项（继承自 async-validator）
interface UseFormRuleItem extends RuleItem {
  trigger?: 'blur' | 'change' | Array<'blur' | 'change'>
}

// 表单验证规则集合
type UseFormRules<T extends UseFormModel> = {
  [K in keyof T]?: UseFormRuleItem | UseFormRuleItem[]
}

// 配置选项
interface UseFormOptions {
  deepRule?: boolean // 启用深度规则验证
  strict?: boolean // 严格模式
  validateOnRuleChange?: boolean // 规则变更时自动验证
  debounceMs?: number // 防抖延迟时间（毫秒）
  cloneDeep?: <T>(value: T) => T // 自定义深拷贝函数
}
```

### 验证状态

每个字段都有对应的验证状态信息：

```typescript
interface UseFormValidateInfo {
  required?: boolean // 是否必填
  validateStatus?: 'error' | 'validating' | 'success' | '' // 验证状态
  error?: string // 错误信息
}
```

## 🎯 API 参考

### useForm 函数

```typescript
function useForm<T extends UseFormModel>(
  modelRef?: T | Ref<T>,
  rulesRef?: UseFormRules<T> | Ref<UseFormRules<T>>,
  options?: UseFormOptions
): UseFormResult<T>
```

**参数：**

- `modelRef` - 表单数据模型，可以是响应式对象或 ref
- `rulesRef` - 验证规则对象，可以是响应式对象或 ref
- `options` - 配置选项

**返回值：**

```typescript
interface UseFormResult<T> {
  model: Ref<T> // 表单数据模型
  rules: Ref<UseFormRules<T>> // 验证规则
  initialModel: Ref<T> // 初始表单数据
  validationState: UseFormValidateInfos<T> // 验证状态集合

  // 验证方法
  validate(callback?: UseFormValidateCallback): Promise<boolean>
  validateField(
    props?: string | string[],
    callback?: UseFormValidateCallback
  ): Promise<any>

  // 管理方法
  resetFields(newModel?: Partial<T>): void
  clearValidate(props?: string | string[]): void
  clearDeepValidation(props?: string | string[], strict?: boolean): void
  dispose(): void
}
```

### 验证方法详解

#### validate()

验证整个表单的所有字段。

```typescript
// 基础用法
try {
  await validate()
  console.log('表单验证通过')
} catch (errors) {
  console.log('验证失败:', errors)
}

// 使用回调
validate((isValid, invalidFields) => {
  if (isValid) {
    console.log('验证通过')
  } else {
    console.log('验证失败:', invalidFields)
  }
})
```

#### validateField()

验证指定字段。

```typescript
// 验证单个字段
await validateField('username')

// 验证多个字段
await validateField(['username', 'email'])

// 使用回调
validateField('username', (isValid, invalidFields) => {
  if (!isValid) {
    console.log('用户名验证失败:', invalidFields)
  }
})
```

#### resetFields()

重置表单到初始状态。

```typescript
// 重置所有字段
resetFields()

// 部分字段重置
resetFields({ username: '新用户名' })
```

#### clearValidate()

清除验证状态。

```typescript
// 清除所有字段验证状态
clearValidate()

// 清除指定字段验证状态
clearValidate('username')
clearValidate(['username', 'email'])
```

## 🌟 使用场景

### 1. 基础表单验证

```vue
<template>
  <el-form :model="model">
    <el-form-item label="姓名" v-bind="validationState.name">
      <el-input v-model="model.name" />
    </el-form-item>

    <el-form-item label="年龄" v-bind="validationState.age">
      <el-input-number v-model="model.age" />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useForm } from '@easily-js/vue-form-validator'

const model = reactive({ name: '', age: null })

const rules = {
  name: [
    { required: true, message: '请输入姓名' },
    { min: 2, max: 10, message: '姓名长度在 2-10 个字符' },
  ],
  age: [
    { required: true, message: '请输入年龄' },
    { type: 'number', min: 1, max: 120, message: '年龄必须在 1-120 之间' },
  ],
}

const { validationState, validate } = useForm(model, rules)
</script>
```

### 2. 深度规则验证（嵌套对象）

```typescript
// 嵌套对象模型
interface UserProfile {
  user: {
    profile: {
      name: string
      contacts: Array<{
        type: 'email' | 'phone'
        value: string
      }>
    }
  }
}

const model = reactive<UserProfile>({
  user: {
    profile: {
      name: '',
      contacts: [
        { type: 'email', value: '' },
        { type: 'phone', value: '' },
      ],
    },
  },
})

// 深度规则配置
const rules = {
  'user.profile': {
    type: 'object',
    required: true,
    fields: {
      name: { required: true, message: '请输入姓名' },
      contacts: {
        type: 'array',
        defaultField: {
          type: 'object',
          fields: {
            type: { required: true, message: '请选择联系方式类型' },
            value: { required: true, message: '请输入联系方式' },
          },
        },
      },
    },
  },
}

const { validationState } = useForm(model, rules, {
  deepRule: true, // 启用深度规则
})

// 访问深度字段验证状态
console.log(validationState['user.profile.name'])
console.log(validationState['user.profile.contacts.0.value'])
```

### 3. 动态表单验证

```vue
<template>
  <el-form :model="model">
    <!-- 用户类型选择 -->
    <el-form-item label="用户类型" v-bind="validationState.userType">
      <el-radio-group v-model="model.userType">
        <el-radio value="normal">普通用户</el-radio>
        <el-radio value="admin">管理员</el-radio>
      </el-radio-group>
    </el-form-item>

    <!-- 管理员代码（仅当用户类型为管理员时显示） -->
    <el-form-item
      v-if="model.userType === 'admin'"
      label="管理员代码"
      v-bind="validationState.adminCode"
    >
      <el-input v-model="model.adminCode" />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useForm } from '@easily-js/vue-form-validator'

const model = reactive({
  userType: 'normal',
  adminCode: '',
})

// 动态规则：根据用户类型变化
const dynamicRules = computed(() => {
  const baseRules = {
    userType: { required: true, message: '请选择用户类型' },
  }

  if (model.userType === 'admin') {
    baseRules.adminCode = { required: true, message: '请输入管理员代码' }
  }

  return baseRules
})

const { validationState, clearValidate } = useForm(model, dynamicRules, {
  validateOnRuleChange: true, // 规则变化时自动验证
})

// 监听用户类型变化，清理相关验证状态
watch(
  () => model.userType,
  (newType, oldType) => {
    if (oldType === 'admin' && newType !== 'admin') {
      clearValidate('adminCode')
    }
  }
)
</script>
```

### 4. 防抖验证

```typescript
// 防抖验证配置：避免频繁验证，提升用户体验
const { validationState } = useForm(model, rules, {
  debounceMs: 300, // 300ms 防抖延迟
})

// 当用户快速输入时，只有停止输入 300ms 后才会触发验证
```

### 5. 数组字段验证

```vue
<template>
  <el-form :model="model">
    <el-form-item label="关键字列表" v-bind="validationState.keywords">
      <el-table :data="model.keywords">
        <el-table-column label="关键字">
          <template #default="{ row, $index }">
            <!-- 动态访问数组元素的验证状态 -->
            <el-form-item v-bind="validationState[`keywords.${$index}.name`]">
              <el-input v-model="row.name" />
            </el-form-item>
          </template>
        </el-table-column>

        <el-table-column label="操作">
          <template #default="{ $index }">
            <el-button @click="removeKeyword($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-button @click="addKeyword">添加关键字</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useForm } from '@easily-js/vue-form-validator'

interface Keyword {
  name: string
}

const model = reactive({
  keywords: [] as Keyword[],
})

const rules = {
  keywords: {
    type: 'array',
    required: true,
    message: '请至少添加一个关键字',
    defaultField: {
      type: 'object',
      fields: {
        name: [
          { required: true, message: '请输入关键字' },
          { min: 2, max: 10, message: '关键字长度在 2-10 个字符' },
        ],
      },
    },
  },
}

const { validationState, clearDeepValidation } = useForm(model, rules, {
  deepRule: true,
})

function addKeyword() {
  model.keywords.push({ name: '' })
}

function removeKeyword(index: number) {
  model.keywords.splice(index, 1)
  // 清理被删除项的验证信息
  clearDeepValidation([`keywords.${index}.name`])
}
</script>
```

## ⚙️ 高级配置

### 配置选项详解

#### deepRule - 深度规则验证

启用深度规则后，可以验证嵌套对象和数组：

```typescript
const { validationState } = useForm(model, rules, {
  deepRule: true,
})

// 可以访问深层嵌套字段的验证状态
validationState['user.profile.name']
validationState['items.0.title']
```

#### strict - 严格模式

控制对不存在字段的验证行为：

```typescript
const { validationState } = useForm(model, rules, {
  strict: true, // 即使字段不存在也进行验证
})
```

#### validateOnRuleChange - 规则变更时验证

当验证规则发生变化时自动触发验证：

```typescript
const { validationState } = useForm(model, dynamicRules, {
  validateOnRuleChange: true,
})
```

#### debounceMs - 防抖验证

设置验证防抖延迟，避免频繁验证：

```typescript
const { validationState } = useForm(model, rules, {
  debounceMs: 300, // 300ms 防抖
})
```

#### cloneDeep - 自定义深拷贝

提供自定义的深拷贝函数：

```typescript
import { cloneDeep } from 'lodash-es'

const { validationState } = useForm(model, rules, {
  cloneDeep: cloneDeep,
})
```

### 验证规则编写

#### 基础规则

```typescript
const rules = {
  // 必填验证
  name: { required: true, message: '请输入姓名' },

  // 类型验证
  email: { type: 'email', message: '请输入有效邮箱' },
  age: { type: 'number', message: '年龄必须是数字' },

  // 长度验证
  username: { min: 3, max: 20, message: '用户名长度在 3-20 个字符' },

  // 模式验证
  phone: {
    pattern: /^1[3-9]\d{9}$/,
    message: '请输入有效手机号',
  },
}
```

#### 组合规则

```typescript
const rules = {
  password: [
    { required: true, message: '请输入密码' },
    { min: 8, message: '密码至少8个字符' },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]/,
      message: '密码必须包含大小写字母和数字',
    },
  ],
}
```

#### 自定义验证器

```typescript
const customValidator = (rule: any, value: any) => {
  return new Promise((resolve, reject) => {
    if (!value) {
      reject(new Error('请输入值'))
    } else if (value.length < 6) {
      reject(new Error('至少输入6个字符'))
    } else {
      resolve(true)
    }
  })
}

const rules = {
  customField: { validator: customValidator, trigger: 'blur' },
}
```

#### 异步验证

```typescript
const asyncValidator = async (rule: any, value: any) => {
  if (!value) {
    throw new Error('请输入用户名')
  }

  // 模拟异步检查用户名是否存在
  const response = await fetch(`/api/check-username?name=${value}`)
  const result = await response.json()

  if (result.exists) {
    throw new Error('用户名已存在')
  }
}

const rules = {
  username: { validator: asyncValidator, trigger: 'blur' },
}
```

## 🚀 性能优化

### 防抖验证

避免频繁验证，提升用户体验和应用性能：

```typescript
// 设置防抖延迟
const { validationState } = useForm(model, rules, {
  debounceMs: 300,
})

// 用户输入时，只有停止输入 300ms 后才会触发验证
```

### 懒加载深度规则

深度规则采用懒加载策略，只有在访问时才创建：

```typescript
// 启用深度规则
const { validationState } = useForm(model, rules, {
  deepRule: true,
})

// 第一次访问时才会创建对应的验证规则和监听器
console.log(validationState['user.profile.name'])
```

### 资源管理

组件卸载时自动清理资源：

```vue
<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { useForm } from '@easily-js/vue-form-validator'

const { dispose } = useForm(model, rules)

// 组件卸载时清理资源
onBeforeUnmount(() => {
  dispose()
})
</script>
```

### 内存优化建议

1. **使用 shallowRef 优化大型表单**：

```typescript
import { shallowRef } from 'vue'

// 对于大型表单数据，使用 shallowRef 减少响应式开销
const largeModel = shallowRef({
  // 大量字段...
})
```

2. **及时清理深度验证信息**：

```typescript
// 删除数组项后清理相关验证信息
function removeItem(index: number) {
  model.items.splice(index, 1)
  clearDeepValidation([`items.${index}`])
}
```

## 🔧 常见问题与解决方案

### 1. 深度字段验证状态访问

**问题**：无法访问嵌套字段的验证状态

**解决方案**：

```typescript
// ❌ 错误方式 - 未启用深度规则
const { validationState } = useForm(model, rules)
console.log(validationState['user.name']) // undefined

// ✅ 正确方式 - 启用深度规则
const { validationState } = useForm(model, rules, {
  deepRule: true,
})
console.log(validationState['user.name']) // 正常访问
```

### 2. 动态表单字段验证

**问题**：动态添加/删除字段后验证状态混乱

**解决方案**：

```typescript
function addItem() {
  model.items.push({ name: '' })
}

function removeItem(index: number) {
  model.items.splice(index, 1)
  // 重要：清理被删除项的验证信息
  clearDeepValidation([`items.${index}.name`])
}
```

### 3. 异步验证错误处理

**问题**：异步验证器中的网络错误导致验证卡住

**解决方案**：

```typescript
const asyncValidator = async (rule: any, value: any) => {
  try {
    const response = await fetch(`/api/validate?value=${value}`)
    if (!response.ok) {
      throw new Error('验证服务不可用')
    }
    const result = await response.json()
    if (!result.valid) {
      throw new Error(result.message)
    }
  } catch (error) {
    // 网络错误时提供友好的错误信息
    if (error instanceof TypeError) {
      throw new Error('网络连接失败，请检查网络后重试')
    }
    throw error
  }
}
```

### 4. 表单重置后验证状态残留

**问题**：调用 `resetFields()` 后验证状态没有清除

**解决方案**：

```typescript
import { nextTick } from 'vue'

const handleReset = () => {
  resetFields()
  // resetFields 会在 nextTick 中自动清除验证状态
}

// 或者手动清除
const handleReset = async () => {
  resetFields()
  await nextTick()
  clearValidate()
}
```

### 5. 防抖验证不生效

**问题**：设置了防抖但验证仍然很频繁

**解决方案**：

```typescript
// ❌ 防抖设置过小
const { validationState } = useForm(model, rules, {
  debounceMs: 50, // 太小，几乎没有防抖效果
})

// ✅ 合理的防抖时间
const { validationState } = useForm(model, rules, {
  debounceMs: 300, // 300ms 是一个较好的默认值
})
```

## 🛠️ 最佳实践

### 1. 规则组织

将复杂的验证规则组织到单独的文件中：

```typescript
// rules/userRules.ts
export const userRules = {
  username: [
    { required: true, message: '请输入用户名' },
    { min: 3, max: 20, message: '用户名长度在 3-20 个字符' },
  ],
  email: [
    { required: true, message: '请输入邮箱' },
    { type: 'email', message: '邮箱格式不正确' },
  ],
}

// 组件中使用
import { userRules } from './rules/userRules'
const { validationState } = useForm(model, userRules)
```

### 2. 类型安全

定义清晰的表单数据类型：

```typescript
interface UserForm {
  username: string
  email: string
  age: number
}

const model = reactive<UserForm>({
  username: '',
  email: '',
  age: 0,
})

const rules: UseFormRules<UserForm> = {
  username: { required: true, message: '请输入用户名' },
  email: { required: true, type: 'email', message: '请输入有效邮箱' },
  age: { required: true, type: 'number', min: 1, message: '请输入有效年龄' },
}
```

### 3. 错误处理

优雅地处理验证错误：

```typescript
const handleSubmit = async () => {
  try {
    await validate()
    // 验证通过，提交表单
    await submitForm(model)
    ElMessage.success('提交成功')
  } catch (errors) {
    // 验证失败，显示错误信息
    const firstError = Object.values(errors)[0][0].message
    ElMessage.error(firstError)
  }
}
```

### 4. 性能优化

对于大型表单，合理使用配置选项：

```typescript
const { validationState } = useForm(model, rules, {
  debounceMs: 300, // 防抖验证
  deepRule: false, // 如果不需要深度验证，关闭以提升性能
  validateOnRuleChange: false, // 如果规则稳定，关闭自动验证
})
```

## 📚 与其他表单库对比

### 与 Element Plus Form 对比

| 特性       | Vue Form Validator           | Element Plus Form |
| ---------- | ---------------------------- | ----------------- |
| Vue 3 支持 | ✅ 原生支持                  | ✅ 支持           |
| TypeScript | ✅ 完整类型定义              | ✅ 基础支持       |
| 深度验证   | ✅ 原生支持                  | ❌ 需要额外配置   |
| 防抖验证   | ✅ 内置支持                  | ❌ 需要手动实现   |
| 组合式 API | ✅ 专为 Composition API 设计 | ⚠️ 混合支持       |
| 资源管理   | ✅ 自动清理                  | ⚠️ 需要手动处理   |

### 与 VeeValidate 对比

| 特性              | Vue Form Validator | VeeValidate   |
| ----------------- | ------------------ | ------------- |
| 学习曲线          | 🟢 简单易上手      | 🟡 中等复杂度 |
| Bundle 大小       | 🟢 轻量级          | 🟡 相对较大   |
| Element Plus 集成 | ✅ 原生适配        | ⚠️ 需要适配器 |
| 异步验证          | ✅ 简单直观        | ✅ 支持但复杂 |
| 国际化            | ⚠️ 手动实现        | ✅ 内置支持   |

## 🔧 开发工具

### 性能监控

使用内置的性能监控工具来分析表单验证性能：

```typescript
import { createPerformanceMonitor } from '@easily-js/vue-form-validator'

// 创建性能监控器
const monitor = createPerformanceMonitor()

// 监控验证性能
const result = monitor.track('fieldValidation', async () => {
  return await validateField('email')
})

// 查看性能指标
const metrics = monitor.getMetrics()
console.table(metrics)
```

### DevTools 集成

在开发环境中启用调试模式：

```typescript
const { validationState } = useForm(model, rules, {
  devtools: process.env.NODE_ENV === 'development',
})
```

## 🔧 深度清理机制详解

### clearDeepValidation 方法

`clearDeepValidation` 是专门用于清理深度验证信息的方法，解决深度验证场景下的内存管理和性能优化问题。

**核心目的：**

- 🧹 **内存清理**：清除不再需要的深度验证信息，防止内存泄漏
- ⚡ **性能优化**：移除无效的监听器，减少不必要的响应式计算
- 🔄 **状态同步**：确保验证状态与实际数据结构保持一致

### 使用场景

#### 1. 动态表单项删除

```typescript
function removeUser(index: number) {
  model.users.splice(index, 1)
  // 清理被删除用户的验证信息
  clearDeepValidation([`users.${index}.name`, `users.${index}.email`])
}
```

#### 2. 条件性字段清理

```typescript
watch(
  () => model.userType,
  (newType, oldType) => {
    if (oldType === 'admin' && newType !== 'admin') {
      // 清理管理员相关字段的验证信息
      clearDeepValidation('adminCode', true) // 使用严格模式
    }
  }
)
```

#### 3. 组件卸载时清理

```typescript
onBeforeUnmount(() => {
  clearDeepValidation() // 清理所有深度验证信息
})
```

## 🌍 社区与支持

### 贡献指南

欢迎参与项目贡献：

1. Fork 项目仓库
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交变更：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 创建 Pull Request

### 问题报告

如果遇到问题，请在 [GitHub Issues](https://github.com/xiaoheng-wang/easliyjs/issues) 中报告，并提供：

- 详细的问题描述
- 最小可复现示例
- 环境信息（Vue 版本、浏览器等）

### 许可证

本项目基于 MIT 许可证开源，详见 [LICENSE](https://github.com/xiaoheng-wang/easliyjs/LICENSE) 文件。

---

## 🎓 总结

Vue Form Validator 是一个现代、强大且易用的 Vue 3 表单验证解决方案。它提供了：

- ✅ **完整的 TypeScript 支持**：类型安全和智能提示
- ✅ **响应式验证机制**：基于 Vue 3 响应式系统
- ✅ **深度验证能力**：支持复杂嵌套结构
- ✅ **性能优化**：防抖验证和懒加载
- ✅ **灵活的 API 设计**：简单直观的使用方式
- ✅ **完善的资源管理**：自动清理，避免内存泄漏

无论是简单的联系表单还是复杂的企业级应用，Vue Form Validator 都能提供优雅的解决方案。希望这份指南能帮助你快速上手并充分利用这个库的强大功能！

🚀 开始你的表单验证之旅吧！
