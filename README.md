# AI Coding

AI Coding 是一个面向开发者的技术社区。分享技术见解，交流编程经验，一起探索 AI 与代码的无限可能。

基于 Next.js 16 + NextAuth.js + Prisma 构建。

## 功能特性

- **社区发帖** — TipTap 富文本编辑器、标签分类、Markdown 支持
- **讨论区** — 嵌套评论回复、审核管理、垃圾评论检测
- **用户系统** — 注册登录、OAuth (GitHub/Google)、密码找回
- **三级权限** — SUPER_ADMIN / ADMIN / USER 角色体系
- **超级管理员** — 数据库级用户管理、全局内容管控
- **SEO** — SSR/SSG 渲染、ISR 增量静态生成
- **简约 UI** — Tailwind CSS 响应式设计

## 快速开始

### 前置依赖

- Node.js >= 18.x
- pnpm >= 8.x
- Docker & Docker Compose（推荐用于 PostgreSQL）

### 本地开发

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env

# 启动数据库
docker-compose up -d postgres

# 初始化数据库
pnpm db:migrate
pnpm db:seed

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000

### 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm start` | 启动生产服务器 |
| `pnpm lint` | ESLint 代码检查 |
| `pnpm type-check` | TypeScript 类型检查 |
| `pnpm test` | 运行全部测试 |
| `pnpm test:unit` | 运行单元测试 |
| `pnpm test:integration` | 运行集成测试 |
| `pnpm test:e2e` | 运行 E2E 测试 |
| `pnpm db:migrate` | 运行数据库迁移 |
| `pnpm db:studio` | 打开 Prisma Studio |
| `pnpm db:seed` | 导入种子数据 |

## 项目结构

```
blog-platform/
├── prisma/
│   └── schema.prisma       # 数据模型
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (public)/       # 社区首页、帖子、标签、搜索
│   │   ├── (auth)/         # 登录、注册、找回密码
│   │   ├── dashboard/      # 工作台 + 管理后台
│   │   └── api/            # API 路由
│   │       ├── auth/       # 认证 (NextAuth + 密码重置)
│   │       ├── admin/      # 超级管理员 (用户管理)
│   │       ├── posts/      # 帖子 API
│   │       ├── comments/   # 评论 API
│   │       ├── tags/       # 标签 API
│   │       └── search/     # 搜索 API
│   ├── components/         # UI 组件
│   │   ├── ui/             # 基础组件
│   │   ├── layout/         # 布局组件
│   │   ├── blog/           # 文章组件
│   │   ├── comments/       # 评论组件
│   │   ├── editor/         # 编辑器组件
│   │   └── auth/           # 认证组件
│   ├── lib/                # 工具函数
│   │   ├── auth.ts         # NextAuth 配置
│   │   ├── prisma.ts       # Prisma 客户端
│   │   └── validations.ts  # Zod 验证
│   ├── services/           # 业务逻辑层
│   ├── hooks/              # 自定义 Hooks
│   ├── types/              # TypeScript 类型
│   └── middleware.ts       # 路由保护
├── tests/
│   ├── unit/               # 单元测试
│   ├── integration/        # 集成测试
│   └── e2e/                # E2E 测试
├── docs/                   # 文档
├── docker-compose.yml
├── Dockerfile
└── next.config.ts
```

## 技术栈

| 层级 | 选型 |
|------|------|
| **全栈框架** | Next.js 16 (App Router) + TypeScript (strict) |
| **UI** | Tailwind CSS + shadcn/ui |
| **数据库** | PostgreSQL 16 |
| **ORM** | Prisma |
| **认证** | NextAuth.js v5 (JWT + bcrypt) |
| **编辑器** | TipTap v3 |
| **Markdown 渲染** | react-markdown + rehype/remark |
| **测试** | Vitest + React Testing Library + Playwright |
| **包管理** | pnpm |
| **部署** | Docker / Vercel |

## 环境变量

| 变量名 | 说明 | 必填 | 默认值 |
|--------|------|:----:|--------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | 是 | `postgresql://...` |
| `AUTH_SECRET` | NextAuth 加密密钥 | 是 | - |
| `AUTH_URL` | 应用 URL | 否 | `http://localhost:3000` |
| `AUTH_GITHUB_ID` | GitHub OAuth Client ID | 否 | - |
| `AUTH_GITHUB_SECRET` | GitHub OAuth Secret | 否 | - |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | 否 | - |
| `AUTH_GOOGLE_SECRET` | Google OAuth Secret | 否 | - |

## 许可证

[MIT](LICENSE)
