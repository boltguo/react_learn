# 📚 课程大纲

> 30 节课 × 4 个递进阶段，从零基础到源码级 React 开发。

::: tip 📌 学习方式说明（重要）
本课程 **不提供额外配套代码仓库**。所有实现均在课文中用可复制的 code snippet 给出，确保你在阅读时就能完成“看懂 → 手敲 → 运行 → 复盘”的闭环。
:::

::: details 🧭 推荐学习节奏（VitePress 折叠阅读）
- 工作日：每天 1 小节（60~90 分钟）
- 周末：完成 1 次阶段复盘（06 / 16 / 28 / 30）
- 每节课至少做完：1 个 L1 + 1 个 L2（收官课额外 1 个 L3）
:::

---

## Phase 1：📝 Todo App `基础篇 · 预计 1-2 周`

> 从零搭建一个功能完整的 Todo 应用，每节课实现一个具体功能。

| # | 课时标题 | 项目推进 | 核心知识 | 深度专题 |
|:-:|---------|---------|---------|---------| 
| [01](./Lesson_01.md) | 搭建项目 + 静态页面 | 初始化 Vite + TS + Tailwind，渲染静态 Todo 界面 | JSX 语法、项目结构、TS 基础 | Virtual DOM、Reconciliation、Fiber 架构 |
| [02](./Lesson_02.md) | 拆分组件 | 拆为 Header / TodoInput / TodoItem / TodoList | 函数组件、Props 类型、children | 单向数据流 vs 双向绑定 |
| [03](./Lesson_03.md) | 实现添加任务 | 输入文字 → 点击添加 → 列表更新 | useState、事件处理、不可变更新 | Hooks 闭包陷阱 |
| [04](./Lesson_04.md) | 完成 / 删除 / 筛选 | 勾选完成、删除任务、按状态筛选 | 数组不可变操作、派生状态 | React 19 自动批量更新 |
| [05](./Lesson_05.md) | 持久化 + 编辑功能 | localStorage 存储、双击编辑任务 | useEffect、useRef 深度、useLayoutEffect | React 19 `use()` 与 Suspense |
| [06](./Lesson_06.md) | useReducer 重构 + 性能优化 | 统一状态逻辑、优化渲染 | useReducer、memo、useMemo、useCallback | React Compiler 展望、useActionState |

**完成后你将拥有：** 一个增删改查 + 筛选 + 本地持久化的 Todo App，扎实理解 React 核心概念。

---

## Phase 2：📋 任务管理系统 `进阶篇 · 预计 2-3 周`

> 从 Todo 升级为多项目、多页面的任务管理系统，引入现代 React 生态。

| # | 课时标题 | 项目推进 | 核心知识 | 深度专题 |
|:-:|---------|---------|---------|---------| 
| [07](./Lesson_07.md) | 多页面架构 | 搭建首页 / 项目列表 / 任务看板 / 设置 | React Router v7 基础路由 | SPA 路由原理 |
| [08](./Lesson_08.md) | 嵌套布局 | Sidebar + Header 固定布局 | 嵌套路由、Layout、动态路由 | Loader / Action 模式 |
| [09](./Lesson_09.md) | 全局状态 | Zustand 管理项目 / 任务 / 偏好 | Context API、useContext、Zustand | Context 性能陷阱 vs Zustand Selector |
| [10](./Lesson_10.md) | 持久化 + 主题 | 暗色模式、数据持久化 | Zustand 中间件 | 状态架构设计 |
| [11](./Lesson_11.md) | 对接 Mock API | 从服务端获取和创建任务 | TanStack Query useQuery / useMutation | 服务端 vs 客户端状态 |
| [12](./Lesson_12.md) | 高级数据交互 | 乐观更新、无限滚动、搜索防抖 | useDebounce、useInfiniteQuery、AbortController | 请求竞态与取消 |
| [13](./Lesson_13.md) | 专业 UI 升级 | shadcn/ui 重建界面 | shadcn/ui、cn() 原理、cva 变体 | Headless UI 理念 |
| [14](./Lesson_14.md) | 表单与验证 | 创建/编辑任务表单 | React Hook Form + Zod、useId | React 19 ref as prop（移除 forwardRef） |
| [15](./Lesson_15.md) | 自定义 Hooks | 提取 useDebounce / useTasks 等 | 自定义 Hook、useImperativeHandle、Compound Components | React 19 `useOptimistic` |
| [16](./Lesson_16.md) | 项目收尾 | 错误处理、加载状态、代码规范 | ErrorBoundary、Suspense、React.lazy | 并发渲染特性（useTransition、useDeferredValue） |

**完成后你将拥有：** 一个多页面任务管理系统，熟练运用 React Router / Zustand / TanStack Query / shadcn/ui。

---

## Phase 3：🛒 全栈电商 `实战篇 · 预计 3-4 周`

> 使用 Next.js 15 构建全栈电商，涵盖 SSR、数据库、认证、支付、测试、部署。

| # | 课时标题 | 项目推进 | 核心知识 | 深度专题 |
|:-:|---------|---------|---------|---------| 
| [17](./Lesson_17.md) | Next.js 项目搭建 | App Router、首页 + 商品列表 | Next.js 15 App Router、error.tsx 约定 | CSR / SSR / SSG / ISR |
| [18](./Lesson_18.md) | Server Components | 商品详情页 | RSC、`"use client"` 边界与传染性 | RSC 架构原理、序列化约束 |
| [19](./Lesson_19.md) | 数据库设计 | Prisma 建模 | Prisma Schema、Migration | 数据库范式 (1NF/2NF/3NF)、复合索引 |
| [20](./Lesson_20.md) | Server Actions | 商品管理后台 | `"use server"`、useFormStatus、revalidation | 全栈类型安全 |
| [21](./Lesson_21.md) | 用户认证 | 注册 / 登录 / OAuth | NextAuth.js v5、Middleware 路由守卫 | JWT vs Session、RBAC |
| [22](./Lesson_22.md) | 商品展示 | 分类、搜索、分页 | 动态路由、Server-side 分页 | SEO Metadata、JSON-LD 结构化数据 |
| [23](./Lesson_23.md) | 购物车与订单 | 购物车、下单结算 | Zustand + Next.js 混合状态 | SSR Hydration Mismatch 解决、Prisma 事务 |
| [24](./Lesson_24.md) | 支付集成 | Stripe 在线支付 | Stripe Checkout、Webhook | 支付安全与幂等 |
| [25](./Lesson_25.md) | 单元测试 | 组件 / Hook / API 测试 | Vitest + Testing Library | 测试金字塔 |
| [26](./Lesson_26.md) | E2E 测试 | 完整流程自动化 | Playwright、Page Object Model | 视觉回归测试、CI/CD 集成 |
| [27](./Lesson_27.md) | 性能优化 | Core Web Vitals、Bundle 分析 | next/image、next/font、loading.tsx、流式渲染 | 缓存策略、性能预算与监控 |
| [28](./Lesson_28.md) | 部署上线 | Vercel 部署 | 环境变量分层、Sentry 监控 | 生产运维实践 |

**完成后你将拥有：** 一个含支付和认证的全栈电商应用，具备独立开发和部署生产级 React 应用的能力。

---

## Phase 4：⚫ 专精进阶 `精通篇 · 按需选学`

> 超越"会用"进入"精通"层次——最佳实践、反模式速查、React 内部原理与面试高频考点。

| # | 课时标题 | 核心知识 | 深度专题 |
|:-:|---------|---------|---------| 
| [29](./Lesson_29.md) | 最佳实践与反模式 | 组件设计、状态管理决策树、useEffect 合法用例 | TypeScript 泛型组件、无障碍 (a11y)、安全防护 |
| [30](./Lesson_30.md) | React 源码深度剖析 | Fiber 数据结构、双缓冲、Reconciliation Diff | Scheduler 调度器、Hook 链表、React Compiler 原理 |

**完成后你将拥有：** 对 React 内部运行机制的深刻理解，能够通过顶级公司前端面试，写出专业级代码。

---

## 🎯 完成全部课程后你将掌握

| 能力维度 | 具体内容 |
|---------|---------| 
| ⚛️ React 核心 | Virtual DOM、Reconciliation、Fiber、Hooks 原理、闭包陷阱 |
| 🪝 全部核心 Hooks | useState、useEffect、useContext、useRef、useReducer、useMemo、useCallback、useId、useLayoutEffect、useImperativeHandle |
| 🆕 React 19 新特性 | use()、useOptimistic、useActionState、useFormStatus、Server Components、ref as prop |
| 🏗️ 组件设计模式 | Compound Components、Render Props、ErrorBoundary、React.lazy 代码分割 |
| 🛠️ 现代生态 | Router v7 / Zustand / TanStack Query / shadcn/ui / React Hook Form + Zod |
| 🏗️ 全栈开发 | Next.js 15 App Router / Prisma / NextAuth / Stripe / Sentry |
| ✅ 工程能力 | TypeScript / Vitest + Playwright / 性能调优 / CI/CD / Vercel 部署 |
| ♿ 无障碍 & 安全 | ARIA 属性、键盘导航、XSS 防护、Server Actions 鉴权 |
| 🔬 源码级理解 | Fiber 架构、Scheduler 调度、Reconciliation O(n) 算法、React Compiler |


---

## 🧪 统一练习分级与验收标准（适用于全部课时）

为避免各课练习难度与验收口径不一致，统一采用以下分级：

| 等级 | 目标 | 时间参考 | 验收标准 |
|---|---|---:|---|
| L1 基础 | 跟随本课知识点完成最小功能 | 15-30 分钟 | 功能可运行、无明显报错、能解释核心 API 用法 |
| L2 进阶 | 处理边界条件与错误分支 | 30-60 分钟 | 包含异常处理、状态回滚或空态/加载态，代码具备可读性 |
| L3 实战 | 接近真实生产问题 | 60-120 分钟 | 提供可验证证据（截图/日志/测试），并给出取舍说明 |

### 通用提交要求

1. **代码正确性**：功能可运行，关键路径无报错。
2. **工程质量**：通过 lint / build（或给出无法通过的原因）。
3. **可维护性**：提交说明中包含“做了什么、为什么这样做、还有什么风险”。
4. **复盘能力**：至少记录 1 个踩坑点与修复方式。

> 建议：每节课至少包含 1 个 L1 + 1 个 L2；阶段收官课（06/16/28/30）额外增加 1 个 L3。

### 统一评分量表（建议）

| 维度 | 分值 | 判定标准 |
|---|---:|---|
| 功能正确性 | 40 | 主链路可运行，边界输入不崩溃 |
| 代码质量 | 20 | 命名清晰、结构合理、无明显重复 |
| 学习解释力 | 20 | 能解释关键 API 与设计取舍 |
| 复盘与改进 | 20 | 有踩坑记录、可执行改进项 |

> 参考线：60 分合格，80 分优秀，90+ 分可作为面试项目讲解素材。


## 🔁 统一授课流程（每一课默认遵循）

为保证学习体验一致，Lesson 01~30 统一采用相同流程：

1. 学习目标
2. 主线实战
3. 原理深挖
4. 练习挑战（L1/L2/L3）
5. 本节小结与下节衔接

> 你可以把每节课都当作“同一模板下的不同主题”，降低切换成本、提升学习效率。

---

## 🧩 VitePress 阅读体验建议

为保证“文章即课堂”，后续课文统一优先使用以下 VitePress 能力提升阅读交互：

1. `::: tip / warning / danger`：标注关键结论、常见误区、风险提醒。
2. `::: details`：折叠扩展内容（原理补充、可选实现、排错过程）。
3. 任务清单 `- [ ]`：每节课可执行自检，避免“看完就忘”。
4. Mermaid 图：流程图/时序图可视化复杂链路。
5. 课末“下一课预告 + 回链大纲”导航，降低跳转成本。

### Mermaid 图表术语与配色约定（统一视觉语言）

- **术语约定**
  - render / 渲染：组件计算与生成 UI 描述。
  - commit / 提交：将变更提交到 DOM（可见更新发生在此阶段）。
  - effect / 副作用：`useEffect` 等副作用逻辑在提交后执行。
  - 统一用语：使用“重新渲染”，不使用“重渲染”。

- **配色约定（4 级）**
  - 成功/推荐：`#10b981`（绿色）
  - 进行中/信息：`#3b82f6`（蓝色）
  - 警示/注意：`#f59e0b`（橙色）
  - 错误/反例：`#ef4444`（红色）
