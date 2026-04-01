# Lesson 25：单元测试 — Vitest + Testing Library

## 🧩 本节信息卡（学习前先看）

- **阶段定位**：Phase 3（实战篇）
- **推荐时长**：120~180 分钟（首次学习）
- **先修要求**：完成 Phase 1~2，理解路由、状态管理与异步请求
- **学习产出**：完成本节功能，并能用自己的话解释关键设计取舍

::: details ✅ 本节完成标准（自检清单）
- [ ] 我可以独立复现文中的核心代码片段
- [ ] 我能解释“为什么这样实现”，而不只是“照着写”
- [ ] 我记录了至少 1 个踩坑点和修复方法
::: 

## 🧭 本节统一学习流程

1. **学习目标**：先明确本节要解决的业务问题与核心 API。
2. **主线实战**：跟随课程实现可运行功能（先跑通，再优化）。
3. **原理深挖**：理解为什么这样设计，以及常见误区。
4. **练习挑战**：完成 L1/L2（阶段收官课建议加 L3）巩固迁移能力。
5. **本节小结**：回顾“做了什么 / 学到了什么 / 下节前检查项”。

> 建议节奏：阅读 20% + 编码 60% + 复盘 20%。

> 🎯 **本节目标**：为组件、自定义 Hook 和 Server Action 编写单元测试，建立代码质量保障体系。
>
> 📦 **本节产出**：覆盖关键业务逻辑的测试套件，确保后续重构不破坏既有功能。


## 一、为什么要写测试？

项目越大，每次修改代码都可能引发"蝴蝶效应"——改了 A 模块，B 模块莫名崩了。
测试的核心价值是：**给你修改代码的勇气。**

```mermaid
flowchart TB
    subgraph "测试金字塔"
        E2E["🔺 E2E 测试 (端到端)<br/>模拟完整用户流程<br/>数量少，运行慢，覆盖广"]
        Integration["🔶 集成测试<br/>多个模块协作<br/>数量中等"]
        Unit["🟢 单元测试<br/>单个函数/组件<br/>数量多，运行快"]
    end
    
    style Unit fill:#10b981,color:#fff
    style Integration fill:#f59e0b,color:#fff
    style E2E fill:#ef4444,color:#fff
```

本节课聚焦 **单元测试** (金字塔底层)，下节课做 **E2E 测试** (金字塔顶层)。

---

## 二、安装 Vitest 与 Testing Library

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

创建 `vitest.config.ts`：

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',      // 模拟浏览器环境
    globals: true,             // 全局注入 describe/it/expect
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
})
```

```ts
// src/test/setup.ts
import '@testing-library/jest-dom'  // 注入 toBeInTheDocument() 等匹配器
```

在 `package.json` 添加：
```json
"scripts": {
  "test": "vitest",
  "test:run": "vitest run"
}
```

---

## 三、测试组件

### 3.1 测试一个简单的组件

```tsx
// src/components/__tests__/ProductCard.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

// 假设我们有一个 ProductCard 组件
function ProductCard({ name, price }: { name: string; price: number }) {
  return (
    <div>
      <h2>{name}</h2>
      <p>¥{price}</p>
    </div>
  )
}

describe('ProductCard', () => {
  it('应该正确显示商品名称和价格', () => {
    render(<ProductCard name="React 手册" price={99} />)
    
    expect(screen.getByText('React 手册')).toBeInTheDocument()
    expect(screen.getByText('¥99')).toBeInTheDocument()
  })
})
```

运行测试：
```bash
npm test
```

### 3.2 测试用户交互

```tsx
// src/components/__tests__/AddToCartButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

function AddToCartButton({ onAdd }: { onAdd: () => void }) {
  return <button onClick={onAdd}>加入购物车</button>
}

describe('AddToCartButton', () => {
  it('点击时应该调用 onAdd 回调', () => {
    const mockOnAdd = vi.fn()  // 创建一个间谍函数
    render(<AddToCartButton onAdd={mockOnAdd} />)
    
    fireEvent.click(screen.getByText('加入购物车'))
    
    expect(mockOnAdd).toHaveBeenCalledTimes(1)
  })
})
```

---

## 四、测试自定义 Hook

自定义 Hook 不能直接调用（只能在 React 组件中使用），需要用 `renderHook`：

```tsx
// src/hooks/__tests__/useCartStore.test.ts
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '@/store/useCartStore'

describe('useCartStore', () => {
  beforeEach(() => {
    // 每个测试前清空购物车
    const { result } = renderHook(() => useCartStore())
    act(() => result.current.clearCart())
  })

  it('添加商品应该增加 items 数量', () => {
    const { result } = renderHook(() => useCartStore())
    
    act(() => {
      result.current.addItem({ id: '1', name: 'React 手册', price: 99 })
    })
    
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].name).toBe('React 手册')
  })

  it('添加相同商品应该增加数量而不是重复', () => {
    const { result } = renderHook(() => useCartStore())
    
    act(() => {
      result.current.addItem({ id: '1', name: 'React 手册', price: 99 })
      result.current.addItem({ id: '1', name: 'React 手册', price: 99 })
    })
    
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(2)
  })

  it('totalPrice 应该正确计算总价', () => {
    const { result } = renderHook(() => useCartStore())
    
    act(() => {
      result.current.addItem({ id: '1', name: 'A', price: 100 })
      result.current.addItem({ id: '2', name: 'B', price: 200 })
    })
    
    expect(result.current.totalPrice()).toBe(300)
  })
})
```

---

## 五、测试纯函数 (工具函数)

纯函数是最容易测试的，因为相同输入永远产生相同输出：

```ts
// src/lib/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest'

// 假设我们有个价格格式化函数
function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`
}

// 状态转换验证函数
function canTransition(from: string, to: string): boolean {
  const valid: Record<string, string[]> = {
    pending: ['paid', 'cancelled'],
    paid: ['shipped', 'refunded'],
  }
  return valid[from]?.includes(to) ?? false
}

describe('formatPrice', () => {
  it('应该格式化整数价格', () => {
    expect(formatPrice(99)).toBe('¥99.00')
  })
  it('应该保留两位小数', () => {
    expect(formatPrice(9.9)).toBe('¥9.90')
  })
})

describe('canTransition', () => {
  it('pending 可以转换到 paid', () => {
    expect(canTransition('pending', 'paid')).toBe(true)
  })
  it('pending 不可以直接跳到 shipped', () => {
    expect(canTransition('pending', 'shipped')).toBe(false)
  })
})
```

---

## 六、练习

1. 为商品列表页的搜索栏组件编写测试：模拟用户输入"React"并点击搜索，验证 `router.push` 被调用且包含正确的查询参数。
2. 为 `deleteProduct` Server Action 编写测试，使用 `vi.mock` 模拟 Prisma client。

---

## 📌 本节小结

| 你做了什么 | 你学到了什么 |
|-----------|------------|
| 配置了 Vitest + Testing Library 测试环境 | 测试金字塔与各层测试的定位 |
| 编写了组件渲染和交互测试 | `render` / `screen` / `fireEvent` API |
| 测试了 Zustand Store 的行为 | `renderHook` + `act` 测试自定义 Hook |
| 测试了纯函数和工具逻辑 | 间谍函数 `vi.fn()` 和模拟 `vi.mock()` |

---

## 七、覆盖率与测试分层策略

仅“写了测试”还不够，建议给关键模块设置覆盖率底线：

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'html'],
      lines: 80,
      functions: 80,
      branches: 70,
      statements: 80,
    },
  },
})
```

建议分层目标：
- 工具函数 / 状态机：高覆盖（85%+）
- 业务组件：关注关键交互与回归路径
- E2E：只覆盖关键主流程（登录、下单、支付回调）

## 八、测试夹具（Fixtures）与可维护性

把重复测试数据抽到 fixtures，降低重复代码与维护成本：

```ts
// src/test/fixtures/products.ts
export const productA = { id: 'p1', name: 'React 进阶', price: 199 }
export const productB = { id: 'p2', name: 'Next.js 实战', price: 299 }
```

```ts
// src/lib/__tests__/cart.test.ts
import { productA, productB } from '@/test/fixtures/products'
```

实践建议：
1. `fixtures/` 放稳定样本数据
2. `factories/` 放可定制数据生成器
3. 每个测试只关注一个行为断言，避免“巨型测试”

## 九、常见测试反模式

| 反模式 | 风险 | 改进方式 |
|---|---|---|
| 过度依赖快照（snapshot） | UI 微调导致大量无效变更 | 以行为断言为主（可见文本、按钮状态、回调触发） |
| 测试实现细节（内部 state） | 重构即破坏测试 | 只验证用户可观察行为 |
| Mock 一切外部依赖 | 与真实环境偏差大 | 保留关键集成点，按边界选择性 Mock |
| 单测替代 E2E | 关键流程未被端到端验证 | 对登录/下单/支付等主链路补 E2E |

## 十、进阶练习（补充）

1. 为 `createOrder` 增加失败分支测试：模拟 Prisma 抛错并断言返回可读错误。
2. 为商品卡片组件添加可访问性断言：按钮是否具备可读名称（`aria-label` / 文本）。
3. 输出覆盖率报告（HTML），识别最低覆盖模块并提出改进清单。
