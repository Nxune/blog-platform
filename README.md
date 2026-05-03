# AI Coding

> 面向开发者的技术社区 — 分享见解，交流经验，探索 AI 与代码的无限可能。

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-260%2B-passing)](tests/)

---

## 功能概览

| 模块 | 功能 |
|------|------|
| 📝 **社区发帖** | TipTap 富文本编辑器，标签分类，Markdown 支持 |
| 💬 **讨论区** | 嵌套评论回复，审核管理，垃圾检测 |
| 👤 **用户系统** | 注册登录，OAuth (GitHub/Google)，邮箱找回密码 |
| 🔐 **三级权限** | `SUPER_ADMIN` → `ADMIN` → `USER` 角色体系 |
| 🛡️ **企业管控** | 用户管理、全局内容审核、操作审计日志 |
| 🎨 **简约设计** | Tailwind CSS 响应式，桌面端 + 移动端适配 |

---

## 快速开始

### 前置要求

- **Node.js** ≥ 18
- **pnpm** ≥ 8
- **Docker** (可选，用于 PostgreSQL)

### 本地运行

```bash
# 克隆项目
git clone https://github.com/Nxune/blog-platform.git
cd blog-platform

# 安装依赖
pnpm install

# 配置环境
cp .env.example .env

# 初始化数据库 (SQLite 零配置)
pnpm db:migrate

# 启动
pnpm dev
```

浏览器访问 **http://localhost:3000**

> 注册后运行以下命令将用户提升为超级管理员：
> ```bash
> pnpm setup-admin <邮箱>
> ```

### 使用 PostgreSQL

```bash
docker-compose up -d postgres    # 启动 PostgreSQL
# 修改 .env: DATABASE_URL="postgresql://dev:dev_password@localhost:5432/blog_platform"
# 修改 prisma/schema.prisma: provider = "postgresql"
pnpm db:migrate
```

---

## 命令参考

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 开发服务器 (Turbopack HMR) |
| `pnpm build` | 生产构建 |
| `pnpm start` | 启动生产服务 |
| `pnpm test` | 运行全部测试 |
| `pnpm test:unit` | 单元测试 (Vitest) |
| `pnpm test:e2e` | E2E 测试 (Playwright) |
| `pnpm lint` | ESLint 检查 |
| `pnpm type-check` | TypeScript 类型检查 |
| `pnpm db:migrate` | 数据库迁移 |
| `pnpm db:studio` | Prisma Studio 管理界面 |
| `pnpm setup-admin <email>` | 设置超级管理员 |

---

## 项目结构

```
blog-platform/
├── prisma/schema.prisma    # 数据模型
├── scripts/                # 管理脚本
│   └── set-super-admin.ts  # 管理员重置
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (public)/       # 首页 / 帖子 / 标签 / 搜索 / 关于
│   │   ├── (auth)/         # 登录 / 注册 / 找回密码
│   │   ├── dashboard/      # 工作台 + 超级管理员控制台
│   │   └── api/            # REST API
│   ├── components/         # UI 组件
│   │   ├── ui/             # 基础通用组件
│   │   ├── layout/         # Header / Footer / DashboardShell
│   │   ├── blog/           # PostCard 帖子卡片
│   │   ├── comments/       # CommentForm / CommentTree
│   │   ├── editor/         # TipTap 编辑器 + 工具栏
│   │   └── auth/           # LoginForm / RegisterForm / AuthGuard
│   ├── lib/                # 核心库
│   │   ├── auth.ts         # NextAuth.js 配置
│   │   ├── auth-helpers.ts # requireAuth / requireAdmin / requireSuperAdmin
│   │   ├── prisma.ts       # Prisma 客户端
│   │   └── validations.ts  # Zod 验证 Schema
│   ├── services/           # 业务逻辑层
│   ├── hooks/              # useAuth / usePosts / useComments
│   └── types/              # TypeScript 类型定义
├── tests/
│   ├── unit/               # 单元测试 (Vitest)
│   ├── integration/        # 集成测试 (API)
│   └── e2e/                # E2E 测试 (Playwright)
├── docs/                   # 架构文档 / API 文档 / 部署指南
├── docker-compose.yml      # PostgreSQL + MinIO
└── next.config.ts          # Next.js 配置 + 安全头
```

---

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript (strict) |
| 样式 | Tailwind CSS |
| 数据库 | SQLite (开发) / PostgreSQL (生产) |
| ORM | Prisma |
| 认证 | NextAuth.js v5 + bcryptjs |
| 编辑器 | TipTap v3 (ProseMirror) |
| 验证 | Zod |
| 测试 | Vitest + Playwright |
| 部署 | Docker / Vercel |

---

## 权限体系

```
SUPER_ADMIN  ───  用户管理 · 全局帖子/评论管控 · 系统配置
    │
ADMIN        ───  内容审核 · 标签管理
    │
USER         ───  发帖 · 评论 · 个人设置
```

---

## 环境变量

| 变量 | 说明 | 必填 |
|------|------|:----:|
| `DATABASE_URL` | 数据库连接字符串 | ✓ |
| `AUTH_SECRET` | NextAuth 加密密钥 (`openssl rand -base64 32`) | ✓ |
| `AUTH_URL` | 应用地址 | — |
| `AUTH_GITHUB_ID` | GitHub OAuth Client ID | — |
| `AUTH_GITHUB_SECRET` | GitHub OAuth Secret | — |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | — |
| `AUTH_GOOGLE_SECRET` | Google OAuth Secret | — |
| `SMTP_HOST` | SMTP 服务器地址（密码重置邮件） | — |
| `SMTP_PORT` | SMTP 端口 | `587` |
| `SMTP_USER` | SMTP 用户名 | — |
| `SMTP_PASS` | SMTP 密码 | — |
| `SMTP_FROM` | 发件人地址 | `noreply@blog-platform.com` |

---

## 文档

| 文档 | 说明 |
|------|------|
| [API 文档](docs/api.md) | 全部 REST 端点参考 |
| [部署指南](docs/deploy.md) | Docker / 手动部署步骤 |
| [贡献指南](docs/CONTRIBUTING.md) | 分支策略、编码规范、PR 流程 |
| [更新日志](docs/CHANGELOG.md) | 版本变更记录 |
| [超级管理员设计](docs/super-admin-design.md) | 权限体系设计方案 |

---

## 许可证

[MIT](LICENSE)
