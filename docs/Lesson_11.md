# Lesson 11：对接服务端 API — TanStack Query 与状态分类

> 🎯 **本节目标**：理解客户端状态与服务端状态的本质区别，引入 TanStack Query (原 React Query) 管理异步数据。
>
> 📦 **本节产出**：将项目列表数据从本地 Zustand 迁移到远端 Mock API，并实现带 loading 的优雅请求。

---

## 一、重新思考：客户端状态 vs 服务端状态

在前两节课，我们把所有的应用数据都放进了 Zustand Store 里。
在**小型应用**或者**不联网的本地应用**中，这没问题。

但在**真实世界的全栈应用**中，数据分两类，它们有着天壤之别：

| 状态类型 | 特征 | 例子 | 谁来管？ |
|------|------|------|---------|
| **客户端状态 (Client State)** | 生命短暂，完全受控于用户交互，同步更新。 | UI 主题 (Dark/Light)，侧边栏折叠状态，表单草稿。 | **Zustand / Context** / useState |
| **服务端状态 (Server State)** | 保存在远端数据库，获取是**异步**的。可能在你不知情时被其他人修改（**数据会过期**）。需要处理 Loading / Error / 缓存。 | 项目列表，任务详情，用户资料。 | **TanStack Query** |

> [!WARNING]
> **最大反模式：** 把服务端请求回来的数据，手动存入 Redux 或 Zustand。
> 这会导致两处状态孤岛（本地一份，服务器一份），你要手动处理"何时更新缓存？"、"请求中转圈圈怎么写？"、"失败了怎么重试？" 这些极其繁琐的操作。

TanStack Query 登场！它是为了**管理异步服务端状态**而生的终极武器。

---

## 二、用 MSW / json-server 部署 Mock API

要体验请求，我们需要一个"假"服务器。
在真实开发中，前端进度如果快于后端，大家都会写或者开 Mock API。

我们使用 `json-server` 快速搞定（无需写 Node.js 后端）：

```bash
# -D 表示开发依赖
npm install -D json-server
```

在项目根目录创建一个文件：`db.json`

```json
{
  "projects": [
    { "id": "proj-1", "name": "新版官网开发", "icon": "🚀" },
    { "id": "proj-2", "name": "Q4 产品发布会", "icon": "🎉" }
  ],
  "tasks": [
    { "id": "t-1", "projectId": "proj-1", "title": "搭建骨架", "status": "done" },
    { "id": "t-2", "projectId": "proj-1", "title": "设计图切片", "status": "todo" }
  ]
}
```

修改 `package.json` 的 `scripts`：
```json
"scripts": {
  "dev": "vite",
  "mock": "json-server db.json --port 3001 --delay 800"
}
```
*(注意我们给假服务器加了 800ms 的延迟，用来模拟真实网络的 Loading 体验！)*

启动它（开一个新终端面板）：
```bash
npm run mock
```
👉 `http://localhost:3001/projects` 现在返回真实的 JSON 数据了！

---

## 三、安装并配置 TanStack Query

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

我们需要在应用的顶层（所有页面的外围）提供 `QueryClientProvider`：

```tsx
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// 1. 创建一个全新的 Query 客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 数据5分钟内认为是新鲜的，不重复发请求
    },
  },
})

// ... 原有的路由配置 router ...

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 2. 用 Provider 包裹 Router，注入能力 */}
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* 3. 赠品：极其强大的查询调试窗，只在开发环境有效！ */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
)
```

---

## 四、实战：抓取项目列表 `useQuery`

回到 `ProjectsLayout.tsx`。我们要把 Zustand 里的 `projects` 换成从网络抓取。

```tsx
// src/api/projectRequests.ts
// 抽取 API 请求层
export const fetchProjects = async () => {
  const res = await fetch('http://localhost:3001/projects')
  if (!res.ok) throw new Error('网络请求失败')
  return res.json()
}
```

```mermaid
flowchart TB
    A["useQuery"] --> B{ "有缓存吗？" }
    B -->|"有，且很新鲜 (staleTime 没过)"| C["马上返回缓存"]
    B -->|"有，但过期了 (staleTime 已过)"| D["马上返回缓存 (不让用户看白屏)\n👉 同时后台静默发请求更新"]
    B -->|"没缓存 (首次加载)"| E["isPending: true\n显示 Loading，并去发请求"]
    
    style C fill:#10b981,color:#fff
```

```tsx
// src/layouts/ProjectsLayout.tsx
import { NavLink, Outlet } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchProjects } from '../api/projectRequests'

export default function ProjectsLayout() {
  
  // 🐻 魔法代码：向服务端索要数据，交出管辖权！
  const { 
    data: projects,   // 拿到数据
    isPending,        // 首次加载状态 (没缓存)
    isError,          // 请求崩溃了没？
    error             // 如果崩溃了，错误详情在哪？
  } = useQuery({
    queryKey: ['projects'],    // 身份证号，用来做全局缓存的 key
    queryFn: fetchProjects,    // 提供数据的 Promise 函数
  })

  return (
    <div className="flex h-full"> 
      <aside className="w-64 bg-white border-r border-gray-200 shrink-0 flex flex-col py-4">
        <h2 className="px-6 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">近期项目</h2>
        <nav className="flex-1 px-3 space-y-1">
          
          {/* ✅ 分支 1: 处理中 */}
          {isPending && (
            <div className="px-3 py-2 text-sm text-gray-400 animate-pulse">正在从远端加载...</div>
          )}
          
          {/* ❌ 分支 2: 出错了 */}
          {isError && (
            <div className="px-3 py-2 text-sm text-red-500">😭 {error.message}</div>
          )}

          {/* ✨ 分支 3: 渲染数据 */}
          {projects && projects.map((proj: any) => (
            <NavLink key={proj.id} to={`/projects/${proj.id}`}>...</NavLink>
          ))}

        </nav>
      </aside>

      <div className="flex-1 overflow-auto bg-gray-50/50 p-8">
        <Outlet />
      </div>
    </div>
  )
}
```

体验一下：
1. **第一次加载**：因为 `delay=800`，你一定会看到骨架屏跳闪一下，出现"正在从远端加载..."（处理 `isPending`）。
2. **点进某个路由再切回来**：瞬间秒开！不再有 Loading 闪烁和网络请求。因为 TanStack Query 的 `queryKey: ['projects']` 把缓存截留了！
3. **关闭假服务器** (`Ctrl+C` 停掉 `json-server`)，然后强制刷新页面：它会自动重试 3 次！如果还是失败，才会走入 `isError`。

这种极致的健壮性和心智负担的大幅下降，就是必须切分"客户端状态"和"服务端状态"的原因。

---

## 五、发送数据改动 `useMutation`

我们获取数据用的是 `useQuery`，而当我们想提交表单，修改服务端数据时（例如新建一个项目），就要用到 `useMutation`。

### 为什么修改和获取不一样？
1. 获取是可以无限缓存、自动刷新的。
2. 修改（POST/PUT/DELETE）是一次性的操作。

```tsx
// 假设这是我们提取的 API 函数
const postNewProject = async (newProj) => {
  return fetch('http://localhost:3001/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newProj)
  })
}
```

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

function AddProjectButton() {
  const queryClient = useQueryClient()

  // 发起修改请求
  const mutation = useMutation({
    mutationFn: postNewProject,     // 使用上面的 Promise
    
    // 成功后，你需要告诉 Query "刚刚那批数据过期了，请重新获取！"
    onSuccess: () => {
      // 通过之前定义的 queryKey 直接干掉缓存！
      // 页面里如果还在使用 useQuery(['projects'])，它会自动重发一次真实网络请求！
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })

  const handleAdd = () => {
    mutation.mutate({ id: `proj-${Date.now()}`, name: '新任务箱', icon: '📦' })
  }

  return (
    <button onClick={handleAdd} disabled={mutation.isPending}>
      {mutation.isPending ? '正在写入数据库...' : '增加新项目'}
    </button>
  )
}
```

这就是 TanStack Query 的底层灵魂：**一切基于缓存 Key (`queryKey`) 的失效机制。**
不手动维护数组、不要自己 `.push()`，只需要"令相关请求失效重新查询"。

---

## 六、🧠 深度专题：请求瀑布与 Suspense 模式配合

当 `ProjectsLayout.tsx` 里用 `useQuery` 获取了项目列表后，里面的 `Outlet` （对应的 `Board.tsx`） 又使用了 `useQuery` 去请求任务详情。

这两者能并发执行吗？
**答：不能。**
由于 `Board.tsx` 被嵌在内部，它必须等 `ProjectsLayout` 渲染完自己和 `Outlet`，才能被挂载触发网络请求。这叫作 **Waterfalls（瀑布流）**。

在之后的课程（第 16 课或 Phase 3 的 RSC 章节），我们会讲两种进阶技术解决这问题：
1. **React Router v7 loaders**：在路由匹配时，平行开火预取数据。
2. **React 19 `<Suspense>`**：使用 `<Suspense fallback={...}>` 拦截底层组件抛出的由于未命中缓存而 `throw` 出的 Promise（还记得第 5 课吗讲到的 `use()` 机制吗？）。

---

## 七、练习

1. **改造 `Board.tsx`**：为假服务器的 db.json 添加某个项目的待办数据，然后在 Board 页里用 `useQuery({ queryKey: ['tasks', projectId] })` 获取并显示它们！
2. 把 Zustand 的 `useProjectStore` 中管理 `projects` 相关的所有代码删掉！保留 `useThemeStore`，看看应用是不是变简单了。

---

## 📌 本节小结

| 你做了什么 | 你学到了什么 |
|-----------|------------|
| 了解状态被划分为"客户端"与"服务端" | Zustand 管本地，TanStack Query 管网络 |
| 运行了 `json-server` 的 Mock API 环境 | Mock 开发流的实践姿势 |
| 用 `useQuery` 抓取数据并展示加载条 | 缓存隔离 (`queryKey`) 与重试机制 |
| 用 `useMutation` 写入数据 | 控制状态过期 (`invalidateQueries`) 倒逼前端同步 |
| — | 理解由于组件挂载时机引起的嵌套瀑布流请求 |

---

## ➡️ 下一课

[**Lesson 12：高级数据交互 — 无限滚动与乐观更新**](./Lesson_12.md)
