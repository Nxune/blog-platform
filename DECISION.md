# Blog Platform — 最终技术方案（Leader 裁决）

## 技术栈确定

| 层面 | 最终选型 | 裁决依据 |
|------|---------|---------|
| **全栈框架** | Next.js 16 (App Router) | 全票通过 |
| **数据库** | **PostgreSQL** | 采纳 Researcher 建议 — 评论并发需 MVCC，ts_vector 原生全文搜索减少依赖 |
| **ORM** | **Prisma 7** | 全票通过 |
| **认证** | **NextAuth.js v5 (Auth.js)** | Leader 裁决 — 比 Better Auth 更成熟，Next.js 集成更深，社区更大，生产验证更充分 |
| **编辑器** | **TipTap v3** | 采纳 Researcher 建议 — ProseMirror 基础，Markdown 导入导出，WYSIWYG 体验优于纯 react-markdown |
| **样式** | **Tailwind CSS** | 全票通过，暂不引入 shadcn/ui（减少初期复杂度） |
| **测试** | **Vitest + Playwright** | 全票通过 |
| **部署** | **Docker Compose** | 采纳 Researcher 建议 — 统一容器编排，PostgreSQL + App 一体化部署 |

## 目录结构（采纳 Researcher 的方案微调）

```
blog-platform/
├── .github/workflows/     # CI/CD
├── prisma/schema.prisma   # 数据模型（PostgreSQL）
├── src/
│   ├── app/               # App Router
│   │   ├── (public)/      # 公开路由组
│   │   ├── (auth)/        # 认证路由组
│   │   ├── dashboard/     # 管理后台
│   │   └── api/           # API Route Handlers
│   ├── components/        # ui/ layout/ blog/ comments/ editor/ auth/
│   ├── lib/               # prisma, auth, validations, utils
│   ├── services/          # 业务逻辑层（Researcher 建议）
│   ├── hooks/             # 自定义 Hooks
│   └── types/             # TS 类型
├── tests/unit/ integration/ e2e/
└── docker-compose.yml
```

## 数据模型（采纳 Researcher 的 Prisma Schema + CommentStatus 枚举）
