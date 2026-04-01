# Lesson 24：支付集成 — Stripe 在线支付

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

> 🎯 **本节目标**：对接 Stripe 支付网关，实现从下单到付款的完整闭环。
>
> 📦 **本节产出**：用户可以通过 Stripe Checkout 完成真实的支付流程（测试模式），并通过 Webhook 自动更新订单状态。


## 一、支付流程全景

```mermaid
sequenceDiagram
    participant User as 用户
    participant App as Next.js 应用
    participant Stripe as Stripe 服务器
    participant DB as 数据库
    
    User->>App: 1. 点击"去支付"
    App->>DB: 2. 创建 Order (status: pending)
    App->>Stripe: 3. 创建 Checkout Session
    Stripe-->>App: 4. 返回支付页面 URL
    App-->>User: 5. 重定向到 Stripe 支付页面
    User->>Stripe: 6. 输入银行卡信息，完成支付
    Stripe->>App: 7. Webhook 通知：支付成功
    App->>DB: 8. 更新 Order (status: paid)
    Stripe-->>User: 9. 重定向回成功页面
```

---

## 二、安装与配置 Stripe

```bash
npm install stripe
```

在 `.env` 中添加（去 [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys) 的测试模式获取密钥）：

```bash
STRIPE_SECRET_KEY=sk_test_xxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxx
```

创建 Stripe 客户端单例：

```ts
// src/lib/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})
```

---

## 三、创建 Checkout Session（Server Action）

```ts
// src/app/checkout/actions.ts
'use server'

import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function createCheckoutSession(items: { productId: string; quantity: number }[]) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // 1. 从数据库获取商品信息（防止前端篡改价格！）
  const products = await prisma.product.findMany({
    where: { id: { in: items.map(i => i.productId) } }
  })

  // 2. 创建订单
  const totalAmount = items.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId)!
    return sum + product.price * item.quantity
  }, 0)

  const order = await prisma.order.create({
    data: {
      userId: session.user.id!,
      total: totalAmount,
      status: 'pending',
      items: {
        create: items.map(item => {
          const product = products.find(p => p.id === item.productId)!
          return {
            productId: item.productId,
            quantity: item.quantity,
            price: product.price,
          }
        })
      }
    }
  })

  // 3. 创建 Stripe Checkout Session
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    metadata: { orderId: order.id },  // 关键！用于 Webhook 回调时定位订单
    line_items: items.map(item => {
      const product = products.find(p => p.id === item.productId)!
      return {
        price_data: {
          currency: 'cny',
          product_data: { name: product.name },
          unit_amount: Math.round(product.price * 100), // Stripe 要求以"分"为单位
        },
        quantity: item.quantity,
      }
    }),
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?orderId=${order.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cart`,
  })

  // 4. 重定向到 Stripe 托管的支付页面
  redirect(checkoutSession.url!)
}
```

> [!CAUTION]
> **安全铁律：永远不要信任前端传来的价格！**
> 我们在 Server Action 中，根据前端传来的 `productId` 重新从数据库查找真实价格来计算总额。恶意用户可以篡改前端的价格字段，但无法欺骗服务端的数据库查询。

---

## 四、Webhook 接收支付通知

当 Stripe 收到用户的银行卡支付后，它会向你预先配置好的 URL 发一个 POST 请求。
我们需要用 **API Route**（不是 Server Action）来接收它——因为这个请求来自 Stripe 的服务器，不是来自浏览器表单。

```ts
// src/app/api/webhook/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event
  try {
    // 验证请求确实来自 Stripe（防止伪造）
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json({ error: '签名验证失败' }, { status: 400 })
  }

  // 处理支付成功事件
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const orderId = session.metadata.orderId

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'paid' }
    })
  }

  return NextResponse.json({ received: true })
}
```

---

## 五、🧠 深度专题：支付安全与幂等性

### 5.1 为什么需要 Webhook？

网络不可靠！用户支付成功后，浏览器重定向回 `success_url` 可能会：
- 网断了
- 用户关闭了页面
- 浏览器崩溃了

如果你只依赖 `success_url` 来更新订单状态，就会出现"用户付了钱但订单还是 pending"的灾难。

Webhook 是 **Stripe 服务器**主动推送，只要 Stripe 确认收到钱，它就会不断重试推送直到你的服务器返回 200。

### 5.2 幂等性 (Idempotency)

Stripe 的 Webhook 可能因为网络问题而重复发送同一个事件。你的处理逻辑必须是**幂等的**：执行一次和执行十次的结果完全相同。

```ts
// ✅ 幂等写法：先查再更新
const order = await prisma.order.findUnique({ where: { id: orderId } })
if (order?.status !== 'pending') return // 已经处理过了，跳过

await prisma.order.update({ where: { id: orderId }, data: { status: 'paid' } })
```

---

## 六、练习

1. 创建 `/checkout/success` 页面，显示订单信息和支付成功提示。
2. 在本地用 Stripe CLI 测试 Webhook：`stripe listen --forward-to localhost:3000/api/webhook/stripe`。

---

## 📌 本节小结

| 你做了什么 | 你学到了什么 |
|-----------|------------|
| 创建了 Stripe Checkout Session | 服务端安全定价，不信任前端传值 |
| 编写了 Webhook 接收支付回调 | API Route vs Server Actions 的使用场景区分 |
| — | 支付安全：签名验证与幂等性 |
| — | Webhook 解决网络不可靠导致的状态丢失 |

---

## 七、进阶实战：支付失败与订单恢复策略

仅有「支付成功」路径不够，生产环境必须覆盖失败与中断场景。

### 7.1 失败页与取消页

- `success_url`：展示订单摘要 +「继续购物」入口
- `cancel_url`：提示支付未完成，并允许用户重新发起支付

```tsx
// src/app/checkout/cancel/page.tsx
import Link from 'next/link'

export default function CheckoutCancelPage() {
  return (
    <main className="mx-auto max-w-lg space-y-4 py-10">
      <h1 className="text-2xl font-semibold">支付未完成</h1>
      <p className="text-muted-foreground">你可以返回订单页重新支付，不会重复创建订单。</p>
      <Link href="/orders" className="underline">返回订单中心</Link>
    </main>
  )
}
```

### 7.2 订单恢复任务（补偿机制）

当用户支付后页面关闭，Webhook 延迟或短时失败时，可通过定时任务做状态对账：

```ts
// 伪代码：每 10 分钟扫描 pending 且创建超过 30 分钟的订单
const staleOrders = await prisma.order.findMany({
  where: {
    status: 'pending',
    createdAt: { lt: new Date(Date.now() - 30 * 60 * 1000) }
  }
})

for (const order of staleOrders) {
  // 向 Stripe 查询 checkout session 最终状态
  // 如已支付则补写 paid，否则标记 expired
}
```

### 7.3 幂等键与重复点击防护

- 服务端创建 Checkout Session 时，建议携带业务主键（如 `orderId`）作为幂等标识
- 前端在提交后立即禁用按钮，防止双击
- Webhook 处理前先判断事件是否已消费（可建 `webhook_events` 表）

---

## 八、联调与排障清单（推荐保存）

1. `STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET` 是否来自同一 Stripe 环境（测试/生产不要混用）
2. 本地 `stripe listen` 转发地址是否与当前端口一致
3. `metadata.orderId` 是否成功写入并在 Webhook 中可读
4. Webhook 接口是否返回 2xx（否则 Stripe 会持续重试）
5. 是否记录了事件 `id`，用于排查重复投递与幂等处理
