# Vue Form Validator

🚀 Vue 3 表单验证组合式 API，提供类似 Ant Design Vue Form 的强大表单验证功能

[![npm version](https://img.shields.io/npm/v/@easily-js/vue-form-validator.svg)](https://www.npmjs.com/package/@easily-js/vue-form-validator)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

## ✨ 特性

- 🎯 **Vue 3 优化**: 基于 Composition API 构建，完全支持响应式
- 🔧 **TypeScript 支持**: 完整的类型定义，享受类型安全和智能提示
- 🌊 **灵活验证**: 支持单字段、多字段、整表单验证
- 🏗️ **深度规则**: 支持嵌套对象和数组的复杂验证场景
- ⚡ **防抖优化**: 可配置的防抖验证，提升用户体验
- 🧪 **开发工具**: 内置性能监控和规则验证工具
- 📦 **轻量无依赖**: 基于 async-validator，体积小巧
- 🔄 **兼容 Element Plus**: 无缝集成 `el-form-item` 组件

## 🤔 为什么选择 Vue Form Validator？

### 解决 Element Plus 表单验证的痛点

Element Plus 的表单验证虽然功能完善，但在现代 Vue 3 开发中存在一些局限性：

#### 🔗 **组件耦合度高**

```vue
<!-- Element Plus 方式：必须依赖 el-form 和 el-form-item -->
<el-form :model="form" :rules="rules" ref="formRef">
  <el-form-item label="用户名" prop="username">
    <el-input v-model="form.username" />
  </el-form-item>
</el-form>

<!-- Vue Form Validator：解耦组件依赖 -->
<el-form-item label="用户名" v-bind="validationState.username">
  <el-input v-model="model.username" />
</el-form-item>
```

#### 📱 **Composition API 支持有限**

```typescript
// Element Plus：需要通过 ref 获取表单实例
const formRef = ref()
const validate = () => formRef.value.validate()

// Vue Form Validator：纯 Composition API 体验
const { validate } = useForm(model, rules)
await validate() // 直接调用
```

#### 🌊 **深度验证困难**

```typescript
// Element Plus：嵌套验证配置复杂
const rules = {
  'user.profile.name': [{ required: true }], // 不够直观
}

// Vue Form Validator：原生深度验证支持
const rules = {
  'user.profile': {
    type: 'object',
    fields: {
      name: { required: true, message: '请输入姓名' },
      contacts: {
        type: 'array',
        defaultField: {
          /* 数组元素验证规则 */
        },
      },
    },
  },
}
```

### 🚀 Vue Form Validator 的技术优势

#### 1. **智能响应式验证状态**

```typescript
// 验证状态自动响应式更新，无需手动管理
interface UseFormValidateInfo {
  required?: boolean // 自动检测是否必填
  validateStatus?: 'error' | 'validating' | 'success' | ''
  error?: string // 错误信息
}
```

#### 2. **高性能懒加载机制**

- 使用 Proxy 实现深度字段的懒加载
- 只有在访问时才创建对应的验证规则和监听器
- 智能内存管理，自动清理不需要的资源

#### 3. **内置防抖优化**

```typescript
const { validationState } = useForm(model, rules, {
  debounceMs: 300, // 用户停止输入 300ms 后才验证
})
```

#### 4. **完整的 TypeScript 支持**

```typescript
interface UserForm {
  username: string
  email: string
}

// 完整的类型推导和约束
const { validationState } = useForm<UserForm>(model, rules)
// validationState.username ✅ 类型安全
// validationState.nonexistent ❌ TypeScript 错误
```

### 📊 性能对比

| 特性           | Vue Form Validator            | Element Plus Form           |
| -------------- | ----------------------------- | --------------------------- |
| **响应式更新** | 🟢 精确更新，只更新变化的字段 | 🟡 可能触发整个表单重新渲染 |
| **内存使用**   | 🟢 懒加载 + 自动清理          | 🟡 需要手动管理             |
| **验证频率**   | 🟢 内置防抖，可配置           | 🟡 需要手动实现             |
| **深度验证**   | 🟢 原生支持，性能优化         | 🔴 复杂场景性能差           |
| **TypeScript** | 🟢 完整类型推导               | 🟡 基础类型支持             |
| **组合式 API** | 🟢 专为 Composition API 设计  | 🟡 混合支持                 |

## 📦 安装

```bash
# npm
npm install @easily-js/vue-form-validator async-validator

# yarn
yarn add @easily-js/vue-form-validator async-validator

# pnpm
pnpm add @easily-js/vue-form-validator async-validator
```

## 🚀 快速开始

### 基础用法

```vue
<template>
  <el-form-item label="用户名" v-bind="validationState.username">
    <el-input v-model="model.username" placeholder="请输入用户名" />
  </el-form-item>

  <el-form-item label="邮箱" v-bind="validationState.email">
    <el-input v-model="model.email" placeholder="请输入邮箱" />
  </el-form-item>

  <el-form-item label="年龄" v-bind="validationState.age">
    <el-input-number v-model="model.age" />
  </el-form-item>
  <el-form-item>
    <el-button type="primary" @click="handleSubmit">提交</el-button>
    <el-button @click="resetFields">重置</el-button>
    <el-button @click="clearValidate">清除验证</el-button>
  </el-form-item>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useForm, type UseFormRules } from 'vue-form-validator'

// 定义表单数据类型
interface UserForm {
  username: string
  email: string
  age: number
}

// 定义验证规则
const rules: UseFormRules<UserForm> = {
  username: [
    { required: true, message: '请输入用户名' },
    { min: 3, max: 20, message: '用户名长度为 3-20 个字符' },
  ],
  email: [
    { required: true, message: '请输入邮箱地址' },
    { type: 'email', message: '请输入正确的邮箱格式' },
  ],
  age: [
    { required: true, message: '请输入年龄' },
    { type: 'number', min: 18, max: 120, message: '年龄必须在 18-120 之间' },
  ],
}

// 初始化表单
const model = reactive<UserForm>({
  username: '',
  email: '',
  age: 18,
})

// 使用 useForm
const { validationState, validate, validateField, resetFields, clearValidate } =
  useForm(model, rules)

// 提交处理
async function handleSubmit() {
  try {
    await validate()
    console.log('表单验证通过', model)
    // 处理提交逻辑
  } catch (errorInfo) {
    console.log('验证失败', errorInfo)
  }
}
</script>
```

### 高级用法

#### 1. 防抖验证

```vue
<script setup lang="ts">
// 配置 300ms 防抖延迟
const { validationState, validate } = useForm(model, rules, {
  debounceMs: 300, // 用户停止输入 300ms 后再触发验证
})
</script>
```

#### 2. 深度规则验证

```vue
<script setup lang="ts">
import { reactive } from 'vue'

// 嵌套对象表单
const model = reactive({
  user: {
    profile: {
      name: '',
      contact: {
        email: '',
        phone: '',
      },
    },
    preferences: {
      theme: 'light',
      notifications: true,
    },
  },
})

// 深度规则
const rules = {
  'user.profile.name': [{ required: true, message: '请输入姓名' }],
  'user.profile.contact.email': [
    { required: true, message: '请输入邮箱' },
    { type: 'email', message: '邮箱格式不正确' },
  ],
  'user.profile.contact.phone': [
    { required: true, message: '请输入手机号' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
  ],
}

const { validationState } = useForm(model, rules, {
  deepRule: true, // 启用深度规则
})
</script>

<template>
  <!-- 访问嵌套字段的验证状态 -->
  <el-form-item label="姓名" v-bind="validationState['user.profile.name']">
    <el-input v-model="model.user.profile.name" />
  </el-form-item>

  <el-form-item
    label="邮箱"
    v-bind="validationState['user.profile.contact.email']"
  >
    <el-input v-model="model.user.profile.contact.email" />
  </el-form-item>
</template>
```

#### 3. 数组验证

```vue
<script setup lang="ts">
const model = reactive({
  tags: [''],
  users: [{ name: '', email: '' }],
})

const rules = {
  tags: {
    type: 'array',
    required: true,
    defaultField: { type: 'string', required: true, message: '标签不能为空' },
  },
  users: {
    type: 'array',
    required: true,
    defaultField: {
      type: 'object',
      fields: {
        name: { required: true, message: '请输入姓名' },
        email: { type: 'email', required: true, message: '请输入正确的邮箱' },
      },
    },
  },
}
</script>
```

#### 4. 自定义验证器

```vue
<script setup lang="ts">
// 异步验证器示例
const checkUsernameAvailability = async (rule: any, value: string) => {
  if (!value) return Promise.reject('请输入用户名')

  // 模拟 API 调用
  const response = await fetch(`/api/check-username?name=${value}`)
  const { available } = await response.json()

  if (!available) {
    return Promise.reject('用户名已被占用')
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名' },
    { validator: checkUsernameAvailability, trigger: 'blur' },
  ],
}
</script>
```

## 📚 API 文档

### useForm

```typescript
function useForm<T extends UseFormModel>(
  modelRef?: T | Ref<T>,
  rulesRef?: UseFormRules<T> | Ref<UseFormRules<T>>,
  options?: UseFormOptions
): UseFormResult<T>
```

#### 参数

| 参数       | 类型                                      | 必填 | 默认值    | 说明         |
| ---------- | ----------------------------------------- | ---- | --------- | ------------ |
| `modelRef` | `T \| Ref<T>`                             | 否   | `ref({})` | 表单数据模型 |
| `rulesRef` | `UseFormRules<T> \| Ref<UseFormRules<T>>` | 否   | `ref({})` | 验证规则     |
| `options`  | `UseFormOptions`                          | 否   | `{}`      | 配置选项     |

#### UseFormOptions

| 属性                   | 类型       | 默认值            | 说明                               |
| ---------------------- | ---------- | ----------------- | ---------------------------------- |
| `debounceMs`           | `number`   | `0`               | 防抖延迟时间（毫秒），0 表示不防抖 |
| `deepRule`             | `boolean`  | `false`           | 是否启用深度规则验证               |
| `strict`               | `boolean`  | `false`           | 严格模式，控制不存在的键是否验证   |
| `validateOnRuleChange` | `boolean`  | `false`           | 规则变更时是否自动验证             |
| `cloneDeep`            | `function` | `structuredClone` | 深拷贝函数                         |

#### 返回值 UseFormResult

| 属性                  | 类型                        | 说明             |
| --------------------- | --------------------------- | ---------------- |
| `model`               | `T \| Ref<T>`               | 表单数据模型     |
| `rules`               | `UseFormRules<T>`           | 验证规则         |
| `initialModel`        | `Ref<T>`                    | 初始表单数据     |
| `validationState`     | `UseFormvalidationState<T>` | 验证状态信息     |
| `validate`            | `function`                  | 验证整个表单     |
| `validateField`       | `function`                  | 验证指定字段     |
| `resetFields`         | `function`                  | 重置表单         |
| `clearValidate`       | `function`                  | 清除验证状态     |
| `clearDeepValidation` | `function`                  | 清除深度验证状态 |
| `dispose`             | `function`                  | 释放资源         |

### 方法详解

#### validate(callback?)

验证整个表单。

```typescript
// Promise 方式
try {
  await validate()
  console.log('验证通过')
} catch (errorInfo) {
  console.log('验证失败', errorInfo)
}

// 回调方式
validate((valid, errorInfo) => {
  if (valid) {
    console.log('验证通过')
  } else {
    console.log('验证失败', errorInfo)
  }
})
```

#### validateField(props?, callback?)

验证指定字段。

```typescript
// 验证单个字段
await validateField('username')

// 验证多个字段
await validateField(['username', 'email'])

// 使用回调
validateField('username', (valid, errorInfo) => {
  console.log('字段验证结果', valid)
})
```

#### resetFields(newModel?)

重置表单到初始状态。

```typescript
// 重置到初始值
resetFields()

// 重置并设置新值
resetFields({ username: 'admin', email: 'admin@example.com' })
```

#### clearValidate(props?)

清除验证状态。

```typescript
// 清除所有验证状态
clearValidate()

// 清除指定字段
clearValidate(['username', 'email'])
```

## 🔧 开发工具

### 性能监控

```typescript
import { createPerformanceMonitor } from 'vue-form-validator'

const monitor = createPerformanceMonitor()

// 追踪验证性能
const result = monitor.track('formValidation', () => {
  return validate()
})

// 查看性能报告
console.table(monitor.getMetrics())
```

### 规则验证

```typescript
import { validateRules } from 'vue-form-validator'

const { isValid, errors, warnings } = validateRules(rules)

if (!isValid) {
  console.error('规则配置错误:', errors)
}

if (warnings.length > 0) {
  console.warn('规则配置警告:', warnings)
}
```

## 🎯 最佳实践

### 1. 类型安全

```typescript
// 定义严格的表单类型
interface UserRegistration {
  username: string
  email: string
  password: string
  confirmPassword: string
  terms: boolean
}

// 使用类型约束
const model = reactive<UserRegistration>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  terms: false,
})

// 类型安全的规则定义
const rules: UseFormRules<UserRegistration> = {
  // TypeScript 会提供字段名的智能提示
  username: [{ required: true, message: '请输入用户名' }],
}
```

### 2. 表单组件化

```vue
<!-- UserForm.vue -->
<template>
  <div class="user-form">
    <el-form-item label="用户名" v-bind="validationState.username">
      <el-input v-model="model.username" />
    </el-form-item>
    <!-- 其他字段... -->
  </div>
</template>

<script setup lang="ts">
interface Props {
  initialData?: Partial<UserForm>
}

interface Emits {
  (e: 'submit', data: UserForm): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const model = reactive<UserForm>({ ...defaultValues, ...props.initialData })
const { validationState, validate } = useForm(model, rules)

// 暴露验证方法给父组件
defineExpose({ validate })
</script>
```

### 3. 错误处理

```typescript
async function handleSubmit() {
  try {
    await validate()

    // 提交数据
    await submitForm(model)

    ElMessage.success('提交成功')
  } catch (errorInfo) {
    if (errorInfo instanceof Error) {
      // 系统错误
      ElMessage.error('系统错误，请稍后重试')
    } else {
      // 验证错误
      const firstError = Object.values(errorInfo)[0]?.[0]?.message
      if (firstError) {
        ElMessage.warning(firstError)
      }
    }
  }
}
```

### 4. 资源清理

```vue
<script setup lang="ts">
import { onBeforeUnmount } from 'vue'

const { dispose } = useForm(model, rules)

// 组件卸载时清理资源
onBeforeUnmount(() => {
  dispose()
})
</script>
```

## 🎯 适用场景

### ✅ 推荐使用 Vue Form Validator

- **复杂的嵌套表单验证**：支持多层对象和数组的深度验证
- **大量动态表单项**：智能内存管理，性能优异
- **需要高性能的表单应用**：内置防抖和懒加载优化
- **重度使用 Composition API 的项目**：完美的 API 设计
- **需要精确控制验证时机和状态**：灵活的配置选项

### ⚠️ Element Plus 表单验证仍然适用

- **简单的静态表单**：快速开发，无需复杂配置
- **快速原型开发**：Element Plus 全家桶方案
- **对 Element Plus 有强依赖的项目**：保持技术栈一致性

## 💡 设计理念

### 核心思想

1. **现代化优先**：完全为 Vue 3 Composition API 设计
2. **开发体验**：更好的 TypeScript 支持和 IDE 智能提示
3. **性能导向**：懒加载、防抖、智能内存管理
4. **灵活性**：解耦组件依赖，可以配合任何 UI 库使用

> **本质**：把表单验证从 UI 组件中解耦出来，让验证逻辑更加纯粹、灵活和高性能。

## 🔄 迁移指南

### 从 Ant Design Vue Form 迁移

```typescript
// Ant Design Vue
const { validate, validationState, resetFields } = Form.useForm(model, rules)

// Vue Form Validator (几乎相同的 API)
const { validate, validationState, resetFields } = useForm(model, rules)
```

### 从 Element Plus Form 迁移

```vue
<!-- 原来的 Element Plus Form -->
<el-form ref="formRef" :model="form" :rules="rules">
  <el-form-item label="用户名" prop="username">
    <el-input v-model="form.username" />
  </el-form-item>
</el-form>

<!-- 使用 UseForm -->
<el-form-item label="用户名" v-bind="validationState.username">
  <el-input v-model="model.username" />
</el-form-item>
```

## 📄 许可证

[MIT License](LICENSE)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

- 📖 [详细文档](./useForm使用指南.md)
- 🐛 [报告问题](https://github.com/xiaoheng-wang/easliyjs/vue-form-validator/issues)
- 💬 [讨论交流](https://github.com/xiaoheng-wang/easliyjs/vue-form-validator/discussions)
- ⭐ [GitHub 仓库](https://github.com/xiaoheng-wang/easliyjs/xiaoheng/vue-form-validator)

---

**@easily-js/vue-form-validator** - 让表单验证变得简单而高效 🚀
