# Lesson 28：部署上线 — 让世界看到你的作品

> 🎯 **本节目标**：将全栈电商应用部署到 Vercel，配置生产级数据库、环境变量分层、错误监控和域名，真正上线可访问。
>
> 📦 **本节产出**：一个公网可访问的、完整的全栈电商网站，带有监控和自动化部署。

---

## 一、部署架构全景

```mermaid
flowchart TB
    subgraph "你的代码"
        GH["GitHub 仓库"]
    end
    
    subgraph "Vercel 平台"
        Build["自动构建\nnpm run build"]
        Edge["Edge Network\n(全球 CDN)"]
        Serverless["Serverless Functions\n(Server Components\n& Server Actions)"]
    end
    
    subgraph "外部服务"
        DB["PostgreSQL\n(Neon)"]
        Auth["NextAuth\n(OAuth)"]
        Pay["Stripe"]
        Monitor["Sentry\n(错误监控)"]
    end
    
    GH -->|"git push"| Build
    Build --> Edge
    Build --> Serverless
    Serverless <--> DB
    Serverless <--> Auth
    Serverless <--> Pay
    Serverless --> Monitor
    
    style Edge fill:#10b981,color:#fff
    style Serverless fill:#818cf8,color:#fff
```

---

## 二、切换到生产级数据库

SQLite 不适合生产环境（单文件、不支持并发）。切换到 **PostgreSQL**。

推荐使用 **Neon**（免费 Serverless PostgreSQL）：

1. 注册 [neon.tech](https://neon.tech) 并创建项目
2. 获取连接字符串

修改 `prisma/schema.prisma`：
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

```bash
# 更新 .env
DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"

# 重新生成和迁移
npx prisma migrate dev --name switch-to-postgres
npx prisma db seed
```

---

## 三、环境变量分层管理

在真实的团队开发中，你会有三套环境，每套环境使用不同的密钥和配置：

```mermaid
flowchart LR
    subgraph "Development (本地)"
        D1[".env.local\nSQLite / 本地 Postgres\nStripe 测试密钥\nlocalhost"]
    end
    
    subgraph "Preview (PR 预览)"
        P1["Vercel Preview 环境变量\n独立的测试数据库\nStripe 测试密钥\n随机域名"]
    end
    
    subgraph "Production (生产)"
        PR1["Vercel Production 环境变量\n生产数据库\nStripe 正式密钥\n正式域名"]
    end
```

**Next.js 的环境变量加载顺序：**

| 文件 | 加载时机 | 是否提交 Git |
|------|---------|------------|
| `.env` | 所有环境 | ✅ 可以（放默认值） |
| `.env.local` | 本地开发 | ❌ 不提交！ |
| `.env.development` | `next dev` | ✅ |
| `.env.production` | `next build` | ✅ |

> [!CAUTION]
> **安全规则：**
> - 以 `NEXT_PUBLIC_` 开头的变量会暴露给浏览器，**只放公开信息**（如 Stripe Publishable Key）
> - 所有密钥（数据库密码、Stripe Secret Key、Auth Secret）**绝不要**以 `NEXT_PUBLIC_` 开头
> - `.env.local` 必须在 `.gitignore` 中

---

## 四、部署到 Vercel

### 4.1 推送到 GitHub

```bash
git add .
git commit -m "feat: complete e-commerce application"
git push origin main
```

### 4.2 连接 Vercel

1. 访问 [vercel.com](https://vercel.com) → "Import Project"
2. 选择你的 GitHub 仓库
3. Vercel 自动检测为 Next.js 项目

### 4.3 配置环境变量

在 Vercel → Settings → Environment Variables 中，分环境添加：

```
# Production 环境
DATABASE_URL=postgresql://...@neon.tech/prod_db
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXTAUTH_SECRET=your-random-secret-at-least-32-chars
NEXTAUTH_URL=https://your-domain.vercel.app
GITHUB_ID=your-github-oauth-app-id
GITHUB_SECRET=your-github-oauth-app-secret

# Preview 环境（可以用不同的测试数据库）
DATABASE_URL=postgresql://...@neon.tech/preview_db
STRIPE_SECRET_KEY=sk_test_...
```

### 4.4 数据库迁移

Vercel 部署不会自动运行 `prisma migrate`。在构建脚本中添加：

```json
// package.json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build",
    "postinstall": "prisma generate"
  }
}
```

或者首次部署前手动执行：
```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
DATABASE_URL="postgresql://..." npx prisma db seed
```

### 4.5 点击 Deploy

Vercel 会自动：
1. 克隆代码
2. 安装依赖 (`npm ci`)
3. 执行 `npm run build`
4. 将 Server Components 部署为 Serverless Functions
5. 将静态资源分发到全球 CDN

几分钟后，你的应用就在 `https://your-project.vercel.app` 上线了！

---

## 五、配置 Stripe Webhook

生产环境的 Stripe Webhook URL 需要更新：

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com)
2. 进入 Developers → Webhooks
3. 添加 Endpoint：`https://your-domain.vercel.app/api/webhook/stripe`
4. 选择事件：`checkout.session.completed`
5. 获取新的 Webhook Secret，更新 Vercel 环境变量

同样，GitHub OAuth App 的回调 URL 也需要更新为生产域名。

---

## 六、错误监控：Sentry 集成

线上应用不可避免会出现 Bug。你需要一个错误捕获和告警系统：

```bash
npx @sentry/wizard@latest -i nextjs
```

这个 wizard 会给你做这几件事：
1. 安装 `@sentry/nextjs` 依赖
2. 创建 `sentry.client.config.ts` 和 `sentry.server.config.ts`
3. 创建 `instrumentation.ts` 初始化 Sentry
4. 修改 `next.config.ts` 注入 Sentry 插件

核心配置：

```ts
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1, // 采样 10% 的请求进行性能追踪
  environment: process.env.NODE_ENV,
})
```

配置完成后，线上发生的任何报错（Server Component 渲染失败、API 500 错误等）都会自动上报到 Sentry Dashboard 并通过邮件/Slack 告警。

```mermaid
flowchart LR
    Error["线上发生 JS 错误"] --> Sentry["Sentry 捕获"]
    Sentry --> Dashboard["Sentry Dashboard\n错误详情 + 堆栈"]
    Sentry --> Alert["Slack / 邮件\n实时告警"]
    Sentry --> Trace["性能追踪\n慢请求定位"]
```

---

## 七、自定义域名

1. 在 Vercel → Settings → Domains 添加你的域名（如 `shop.example.com`）
2. 在域名注册商（阿里云/Cloudflare）配置 DNS CNAME 指向 `cname.vercel-dns.com`
3. Vercel 自动签发免费的 HTTPS 证书

---

## 八、生产环境部署检查清单

```
✅ 所有环境变量已在 Vercel 中配置（Production + Preview 分开）
✅ 数据库迁移已应用到生产环境
✅ Stripe Webhook URL 已更新为生产域名
✅ GitHub OAuth 回调 URL 已更新为生产域名
✅ NEXTAUTH_URL 指向正式域名
✅ .env.local 已加入 .gitignore
✅ Sentry 错误监控已接入
✅ Lighthouse 评分 > 90
✅ E2E 测试全部通过
✅ build 命令包含 prisma generate + migrate deploy
```

---

## 九、Phase 3 回顾与阶段收官

🎉 **恭喜你！** 你已经完成了从零到全栈的完整旅程。

```mermaid
flowchart TB
    P1["Phase 1: Todo App\n🟢 React 基础\nJSX / Hooks / useState / useEffect\nuseReducer / Performance"]
    
    P2["Phase 2: 任务管理系统\n🟡 现代 React 生态\nRouter / Zustand / TanStack Query\nshadcn/ui / RHF + Zod\nErrorBoundary / 并发渲染特性"]
    
    P3["Phase 3: 全栈电商平台\n🔴 独立开发者全栈\nNext.js 15 / RSC / Prisma\nNextAuth / Stripe / Testing\n性能优化 / 部署上线"]
    
    P1 --> P2 --> P3
    
    style P1 fill:#10b981,color:#fff
    style P2 fill:#f59e0b,color:#fff
    style P3 fill:#ef4444,color:#fff
```

### 你现在掌握的完整技术栈

| 领域 | 技术 | 学习课时 |
|------|------|---------|
| UI 框架 | React 19 + TypeScript | L01~L06 |
| 样式 | Tailwind CSS v4 + shadcn/ui | L07, L13 |
| 路由 | React Router v7 (SPA) / App Router (SSR) | L07, L17 |
| 客户端状态 | Zustand + persist | L09, L23 |
| 服务端状态 | TanStack Query / RSC | L11~L12, L18 |
| 表单 | React Hook Form + Zod | L14 |
| 数据库 | Prisma + PostgreSQL | L19 |
| 认证 | NextAuth.js v5 | L21 |
| 支付 | Stripe Checkout + Webhook | L24 |
| 测试 | Vitest + Playwright | L25~L26 |
| 性能 | Core Web Vitals + Bundle 分析 | L27 |
| 部署 | Vercel + Sentry + CI/CD | L28 |

### 下一步建议

1. **纵向深入**：阅读 React 源码、学习 V8 引擎和编译原理
2. **横向拓展**：React Native (移动端)、Electron (桌面端)、tRPC (类型安全 API)
3. **持续学习**：关注 [React Blog](https://react.dev/blog)、[Next.js Blog](https://nextjs.org/blog)
4. **实战检验**：把这套技术栈应用到自己的开源项目中

**祝你在 React 的世界里，永远保持好奇，代码永远没有 Bug！** 🚀

---

## 📌 本节小结

| 你做了什么 | 你学到了什么 |
|-----------|------------|
| 将数据库切换到 PostgreSQL | Prisma 多数据库切换 |
| 部署全栈应用到 Vercel | GitHub → Vercel CI/CD 自动化部署 |
| 配置了分层的环境变量 | Development / Preview / Production 隔离 |
| 集成了 Sentry 错误监控 | 线上错误自动捕获与告警 |
| 配置了自定义域名和 HTTPS | DNS 配置与 SSL 自动签发 |
| — | 完整的生产部署检查清单 |
| — | Phase 1~3 共 28 节课的完整知识图谱回顾 ✅ |

---

## ➡️ 下一课

[**Lesson 29：React 最佳实践与反模式 — 写出专业级代码**](./Lesson_29.md)
