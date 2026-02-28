import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: 'React 19 学习体系',
    description: '30 节课 × 4 个递进阶段，从零基础到源码级 React 开发',
    lang: 'zh-CN',
    lastUpdated: true,

    head: [
      ['link', { rel: 'icon', href: '/favicon.ico' }],
    ],

    themeConfig: {
      logo: '/logo.svg',
      siteTitle: 'React 19 学习体系',

      nav: [],

      sidebar: {
        '/docs/': [
          {
            text: '📚 课程大纲',
            link: '/docs/CURRICULUM'
          },
          {
            text: 'Phase 1：📝 Todo App',
            collapsed: false,
            items: [
              { text: 'L01 搭建项目 + 静态页面', link: '/docs/Lesson_01' },
              { text: 'L02 拆分组件', link: '/docs/Lesson_02' },
              { text: 'L03 实现添加任务', link: '/docs/Lesson_03' },
              { text: 'L04 完成 / 删除 / 筛选', link: '/docs/Lesson_04' },
              { text: 'L05 持久化 + 编辑功能', link: '/docs/Lesson_05' },
              { text: 'L06 useReducer + 性能优化', link: '/docs/Lesson_06' },
            ]
          },
          {
            text: 'Phase 2：📋 任务管理系统',
            collapsed: false,
            items: [
              { text: 'L07 多页面架构', link: '/docs/Lesson_07' },
              { text: 'L08 嵌套布局', link: '/docs/Lesson_08' },
              { text: 'L09 全局状态', link: '/docs/Lesson_09' },
              { text: 'L10 持久化 + 主题', link: '/docs/Lesson_10' },
              { text: 'L11 对接 Mock API', link: '/docs/Lesson_11' },
              { text: 'L12 高级数据交互', link: '/docs/Lesson_12' },
              { text: 'L13 专业 UI 升级', link: '/docs/Lesson_13' },
              { text: 'L14 表单与验证', link: '/docs/Lesson_14' },
              { text: 'L15 自定义 Hooks', link: '/docs/Lesson_15' },
              { text: 'L16 项目收尾', link: '/docs/Lesson_16' },
            ]
          },
          {
            text: 'Phase 3：🛒 全栈电商',
            collapsed: false,
            items: [
              { text: 'L17 Next.js 项目搭建', link: '/docs/Lesson_17' },
              { text: 'L18 Server Components', link: '/docs/Lesson_18' },
              { text: 'L19 数据库设计', link: '/docs/Lesson_19' },
              { text: 'L20 Server Actions', link: '/docs/Lesson_20' },
              { text: 'L21 用户认证', link: '/docs/Lesson_21' },
              { text: 'L22 商品展示', link: '/docs/Lesson_22' },
              { text: 'L23 购物车与订单', link: '/docs/Lesson_23' },
              { text: 'L24 支付集成', link: '/docs/Lesson_24' },
              { text: 'L25 单元测试', link: '/docs/Lesson_25' },
              { text: 'L26 E2E 测试', link: '/docs/Lesson_26' },
              { text: 'L27 性能优化', link: '/docs/Lesson_27' },
              { text: 'L28 部署上线', link: '/docs/Lesson_28' },
            ]
          },
          {
            text: 'Phase 4：⚫ 专精进阶',
            collapsed: false,
            items: [
              { text: 'L29 最佳实践与反模式', link: '/docs/Lesson_29' },
              { text: 'L30 React 源码剖析', link: '/docs/Lesson_30' },
            ]
          }
        ],
      },

      outline: {
        level: [2, 3],
        label: '本页目录'
      },

      socialLinks: [
        { icon: 'github', link: 'https://github.com/boltguo/react_learn' }
      ],

      footer: {
        message: '项目驱动 · 边写边学 · React 19',
      },

      search: {
        provider: 'local',
        options: {
          translations: {
            button: { buttonText: '搜索课程', buttonAriaLabel: '搜索课程' },
            modal: {
              noResultsText: '无法找到相关结果',
              resetButtonTitle: '清除查询条件',
              footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
            }
          }
        }
      },

      docFooter: {
        prev: '上一课',
        next: '下一课'
      },

      lastUpdated: {
        text: '最后更新于',
      },

      returnToTopLabel: '回到顶部',
      sidebarMenuLabel: '菜单',
      darkModeSwitchLabel: '主题',
    },

    mermaid: {
      theme: 'default',
      suppressErrorRendering: true,
    },

    mermaidPlugin: {
      class: 'mermaid',
    },
  })
)
