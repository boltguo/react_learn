# Lesson 03：实现添加任务 — useState 让数据活起来


## 🧭 本节统一学习流程

1. **学习目标**：先明确本节要解决的业务问题与核心 API。
2. **主线实战**：跟随课程实现可运行功能（先跑通，再优化）。
3. **原理深挖**：理解为什么这样设计，以及常见误区。
4. **练习挑战**：完成 L1/L2（阶段收官课建议加 L3）巩固迁移能力。
5. **本节小结**：回顾“做了什么 / 学到了什么 / 下节前检查项”。

> 建议节奏：阅读 20% + 编码 60% + 复盘 20%。

> 🎯 **本节目标**：用 `useState` 管理 Todo 数据，实现"输入文字 → 点击添加 → 列表更新"。
>
> 📦 **本节产出**：Todo App 可以动态添加新任务了！


## 一、为什么需要 State？

Lesson 02 的数据是硬编码的常量，UI 无法响应用户操作。**State 让组件拥有"记忆"——数据变了，UI 自动更新。**

```mermaid
flowchart LR
    subgraph "❌ 普通变量"
        A1["let count = 0"] --> A2["count++"]
        A2 --> A3["值变了<br/>但 React 不知道<br/>UI 不更新 😢"]
    end
    
    subgraph "✅ useState"
        B1["const [count, setCount]<br/>= useState(0)"] --> B2["setCount(1)"]
        B2 --> B3["React 知道了！<br/>重新渲染组件<br/>UI 更新 🎉"]
    end
```

```tsx
import { useState } from 'react'

// ❌ 普通变量：点击后 count 变了，但页面不变
function Bad() {
  let count = 0
  return <button onClick={() => { count++ }}>Count: {count}</button>
}

// ✅ useState：点击后 React 重新渲染，页面更新
function Good() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>
}
```

### useState 的渲染循环

```mermaid
sequenceDiagram
    participant React
    participant App as App 组件
    participant DOM as 真实 DOM

    Note over React,DOM: 🟢 初次渲染
    React->>App: 调用 App()
    App->>App: useState(0) → [0, setCount]
    App->>React: 返回 JSX（count=0）
    React->>DOM: 渲染到 DOM

    Note over React,DOM: 🔵 用户点击按钮
    App->>React: setCount(1)
    React->>React: 安排重新渲染
    React->>App: 再次调用 App()
    App->>App: useState(0) → [1, setCount] ← 返回新值！初始值被忽略
    App->>React: 返回新 JSX（count=1）
    React->>DOM: Diff 对比 → 只更新变化的部分
```

---

## 二、改造 App.tsx

把硬编码数据替换为 `useState`：

```tsx
// src/App.tsx
import { useState } from 'react'
import type { Todo, Filter } from './types'
import Header from './components/Header'
import TodoInput from './components/TodoInput'
import TodoFilter from './components/TodoFilter'
import TodoList from './components/TodoList'

function App() {
  // ✅ 用 useState 管理数据
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: '学习 JSX 语法', completed: true },
    { id: 2, text: '拆分组件，理解 Props', completed: true },
    { id: 3, text: '用 useState 添加任务', completed: false },
  ])
  const [filter, setFilter] = useState<Filter>('all')

  // ✅ 添加任务 —— 真正能工作了！
  const addTodo = (text: string) => {
    setTodos(prev => [
      ...prev,
      { id: Date.now(), text, completed: false }
    ])
  }

  // 下节课实现
  const toggleTodo = (id: number) => console.log('toggle', id)
  const deleteTodo = (id: number) => console.log('delete', id)

  // 派生数据 —— 从 state 直接计算，不需要额外 useState
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    return true
  })
  const completedCount = todos.filter(t => t.completed).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="max-w-xl mx-auto px-4 py-12">
        <Header total={todos.length} completed={completedCount} />
        <TodoInput onAdd={addTodo} />
        <TodoFilter current={filter} onChange={setFilter} />
        <TodoList todos={filteredTodos} onToggle={toggleTodo} onDelete={deleteTodo} />
      </div>
    </div>
  )
}

export default App
```

输入文字，点击"添加"，任务出现在列表中！🎉

---

## 三、useState 类型标注

```tsx
// 简单类型 —— TS 自动推断
const [count, setCount] = useState(0)         // number
const [name, setName] = useState('Alice')     // string
const [open, setOpen] = useState(false)        // boolean

// 复杂类型 —— 需要泛型 <>
const [todos, setTodos] = useState<Todo[]>([])         // Todo 数组
const [user, setUser] = useState<User | null>(null)     // 可能为 null
const [filter, setFilter] = useState<Filter>('all')    // 联合类型
```

---

## 四、⭐ 不可变更新（最重要的概念）

React 通过 **引用比较（`===`）** 检测状态是否变化，所以必须创建 **新引用**：

```mermaid
flowchart TB
    subgraph "❌ 可变更新（直接修改）"
        M1["const arr = [1, 2, 3]"]
        M2["arr.push(4)"]
        M3["setArr(arr)"]
        M4["arr === arr → true<br/>React 认为没变化<br/>不更新 UI ❌"]
        M1 --> M2 --> M3 --> M4
    end
    
    subgraph "✅ 不可变更新（创建新引用）"
        I1["const arr = [1, 2, 3]"]
        I2["const newArr = [...arr, 4]"]
        I3["setArr(newArr)"]
        I4["newArr !== arr → true<br/>React 知道有变化<br/>更新 UI ✅"]
        I1 --> I2 --> I3 --> I4
    end
    
    style M4 fill:#ef4444,color:#fff
    style I4 fill:#10b981,color:#fff
```

### 数组操作速查

```tsx
const [todos, setTodos] = useState<Todo[]>([])

// ✅ 添加 → 展开创建新数组
setTodos([...todos, newTodo])
setTodos([newTodo, ...todos])        // 添加到开头

// ✅ 删除 → filter 返回新数组
setTodos(todos.filter(t => t.id !== id))

// ✅ 修改某项 → map 返回新数组
setTodos(todos.map(t =>
  t.id === id ? { ...t, completed: !t.completed } : t
))

// ✅ 排序 → 先复制（sort 会修改原数组！）
setTodos([...todos].sort((a, b) => a.text.localeCompare(b.text)))

// ❌ 直接 push — 修改原数组，引用不变！
todos.push(newTodo)
setTodos(todos)     // React 认为没变化，不更新！
```

### 对象操作速查

```tsx
const [profile, setProfile] = useState({ name: 'Alice', age: 25, email: 'a@b.com' })

// ✅ 展开 + 覆盖
setProfile({ ...profile, name: 'Bob' })

// ❌ 直接修改
profile.name = 'Bob'
setProfile(profile)  // 同一引用，React 不更新！
```

### 速查表

| 操作 | ❌ 可变方法 | ✅ 不可变方法 |
|------|-----------|-------------|
| 添加 | `push`、`unshift` | `[...arr, item]` |
| 删除 | `splice`、`pop` | `filter` |
| 修改 | `arr[i] = x` | `map` |
| 排序 | `sort`、`reverse` | `[...arr].sort()` 或 `toSorted()` |

---

## 五、函数式更新

当新值 **依赖前一个值** 时，用函数式更新最安全：

```mermaid
flowchart TB
    subgraph "❌ 直接引用 state"
        A1["setCount(count + 1)  // count=0 → 1"]
        A2["setCount(count + 1)  // count=0 → 1（仍是旧值！）"]
        A3["setCount(count + 1)  // count=0 → 1"]
        A4["最终 count = 1 😢"]
        A1 --> A2 --> A3 --> A4
    end
    
    subgraph "✅ 函数式更新"
        B1["setCount(prev => prev + 1)  // 0 → 1"]
        B2["setCount(prev => prev + 1)  // 1 → 2"]
        B3["setCount(prev => prev + 1)  // 2 → 3"]
        B4["最终 count = 3 ✅"]
        B1 --> B2 --> B3 --> B4
    end
    
    style A4 fill:#ef4444,color:#fff
    style B4 fill:#10b981,color:#fff
```

```tsx
// 我们的 addTodo 就使用了函数式更新：
const addTodo = (text: string) => {
  setTodos(prev => [...prev, { id: Date.now(), text, completed: false }])
  //       ↑ prev 保证拿到最新值
}
```

> **原则：如果新值依赖旧值，永远用 `setState(prev => ...)` 形式。**

---

## 六、延迟初始化

如果初始值计算 **昂贵**，传函数避免每次渲染重复计算：

```tsx
// ❌ 每次渲染都执行 JSON.parse（即使只用第一次的结果）
const [data, setData] = useState(JSON.parse(localStorage.getItem('data') || '[]'))

// ✅ 传函数，只在首次渲染执行
const [data, setData] = useState(() => {
  const saved = localStorage.getItem('data')
  return saved ? JSON.parse(saved) : []
})
```

---

## 七、🧠 深度专题：Hooks 闭包陷阱

### 7.1 什么是闭包？

```mermaid
flowchart TB
    subgraph "闭包原理"
        F["外层函数 createCounter()"]
        V["变量 count = 0"]
        I["内层函数 increment()"]
        F --> V
        F --> I
        I -.->|"引用外层变量\n即使外层已执行完"| V
    end
```

函数可以"记住"它被创建时的环境变量——这就是闭包。

### 7.2 在 React 中的陷阱

```tsx
function Timer() {
  const [count, setCount] = useState(0)

  const showCount = () => {
    setTimeout(() => {
      alert(`Count: ${count}`)  // ⚠️ 这个 count 是点击时的值！
    }, 3000)
  }

  // 操作：count=0 时点 showCount → 快速 +1 三次 → 3秒后弹窗显示 0（不是 3）
}
```

```mermaid
sequenceDiagram
    participant User as 用户
    participant R1 as 渲染 #1 (count=0)
    participant R2 as 渲染 #2 (count=1)
    participant R3 as 渲染 #3 (count=2)
    participant R4 as 渲染 #4 (count=3)

    User->>R1: 点击 showCount → setTimeout 捕获 count=0
    User->>R2: 点击 +1
    User->>R3: 点击 +1
    User->>R4: 点击 +1
    Note over R1: 3秒后 setTimeout 触发
    R1->>User: alert("Count: 0") 😱
    Note right of R1: 闭包捕获的是 R1 的 count=0
```

每次渲染创建新的闭包环境。旧的 `setTimeout` 仍持有旧闭包中的 `count=0`。

### 7.3 解决方案

```tsx
import { useState, useRef } from 'react'

function Timer() {
  const [count, setCount] = useState(0)
  const countRef = useRef(count)    // useRef 创建一个"盒子"
  countRef.current = count          // 每次渲染同步最新值

  const showCount = () => {
    setTimeout(() => {
      alert(`Count: ${countRef.current}`)  // ✅ 读的是 ref，始终最新
    }, 3000)
  }
}
```

### 7.4 setInterval 经典陷阱

```tsx
// ❌ count 永远显示 1（闭包捕获了 count=0）
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1)    // count 永远是初始闭包中的 0
  }, 1000)
  return () => clearInterval(id)
}, [])

// ✅ 函数式更新不依赖闭包中的值
useEffect(() => {
  const id = setInterval(() => {
    setCount(prev => prev + 1)   // 不读闭包中的 count
  }, 1000)
  return () => clearInterval(id)
}, [])
```

---

## 八、练习

1. **实现 toggleTodo 和 deleteTodo**：用 `map` 和 `filter` 的不可变模式（答案在下节课）
2. **添加清空功能**：按钮"清空已完成"，删除所有 `completed: true` 的项
3. **闭包体验**：写一个 3 秒后弹窗显示 `todos.length` 的按钮，然后添加几个任务，观察弹窗值

---

## 📌 本节小结

| 你做了什么 | 你学到了什么 |
|-----------|------------|
| 用 useState 管理 todos 和 filter | `const [s, setS] = useState(init)` |
| 实现了"添加任务"功能 | 不可变更新：`[...arr, item]` / `filter` / `map` |
| 筛选功能工作了 | 派生数据不需要额外 state |
| — | 函数式更新 `setState(prev => ...)` |
| — | 延迟初始化 `useState(() => ...)` |
| — | Hooks 闭包陷阱原理与解决方案 |
