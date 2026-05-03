# 贡献指南

欢迎参与 AI Coding 开发者社区的开发。本文档描述了贡献流程和代码规范。

## 开发流程

### 1. 分支策略

| 分支 | 用途 | 来源 |
|------|------|------|
| `main` | 生产就绪代码 | — |
| `feat/*` | 新功能开发 | `main` |
| `fix/*` | Bug 修复 | `main` |
| `docs/*` | 文档更新 | `main` |

### 2. 本地开发

```bash
# 克隆并安装
git clone https://github.com/Nxune/blog-platform.git
cd blog-platform
pnpm install

# 初始化数据库 (SQLite)
pnpm db:migrate

# 启动开发服务器
pnpm dev
```

### 3. 提交 PR

1. 从 `main` 创建新分支：`git checkout -b feat/your-feature`
2. 按规范编写代码并提交
3. 确保所有测试通过：`pnpm test`
4. 推送并创建 Pull Request 到 `main`

## 编码规范

### TypeScript

- 启用 `strict` 模式
- 禁止使用 `any`，优先 `unknown`
- 导出的函数和类型必须显式标注类型

### 导入顺序

```typescript
// 1. 第三方库
import { useSession } from "next-auth/react"
import { z } from "zod"

// 2. 内部模块
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

// 3. 组件
import { PostCard } from "@/components/blog/PostCard"

// 4. 类型
import type { PostWithAuthor } from "@/types"
```

### 命名约定

- **文件/目录**: kebab-case (`post-card.tsx`)
- **组件**: PascalCase (`PostCard`)
- **函数/变量**: camelCase (`getUserPosts`)
- **类型/接口**: PascalCase (`PostWithAuthor`)
- **枚举**: PascalCase (`Role`)
- **环境变量**: UPPER_SNAKE_CASE (`DATABASE_URL`)

### 组件规范

- 使用 Function Component 形式
- Props 使用 `interface` 定义，前缀 `XxxProps`
- 客户端交互组件使用 `"use client"`

```tsx
interface PostCardProps {
  post: PostWithAuthor
}

export function PostCard({ post }: PostCardProps) {
  return <div>{post.title}</div>
}
```

### API 路由规范

- 使用 Next.js App Router Route Handlers
- 通过 `services/` 层处理业务逻辑
- 统一错误响应格式：

```typescript
return Response.json({ error: "描述信息" }, { status: 401 })
// 401 UNAUTHORIZED — 未登录
// 403 FORBIDDEN  — 无权限
// 404 NOT_FOUND  — 资源不存在
```

### 数据库操作

- 通过 `lib/prisma.ts` 单例访问 Prisma
- 业务逻辑写在 `src/services/` 中
- 创建索引字段时在 schema 标注 `@unique` 或 `@@index`

## 测试要求

| 层级 | 工具 | 覆盖范围 | 要求 |
|------|------|----------|------|
| 单元测试 | Vitest | 工具函数、Services、Hooks | 必须 |
| 集成测试 | Vitest | API 路由 | 建议 |
| E2E 测试 | Playwright | 核心业务链路 | 新功能必须 |

```bash
pnpm test:unit         # 单元测试
pnpm test:integration  # 集成测试
pnpm test:e2e          # E2E 测试
pnpm test              # 全部测试
pnpm test:coverage     # 覆盖率报告
```

## 提交流程

使用 Conventional Commits 格式：

```
<type>: <简短描述>

<可选正文>
```

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `refactor` | 重构 |
| `test` | 测试 |
| `docs` | 文档 |
| `chore` | 构建/工具 |

示例：

```
feat: 添加用户资料编辑页面
fix: 修复搜索页错误处理静默忽略问题
refactor: 统一 API 错误响应格式
```

## 代码审查

PR 审查关注点：

1. 类型安全 — 无 `any`，无类型错误
2. 错误处理 — API 路由正确返回 HTTP 状态码
3. 权限校验 — 受保护路由调用 `requireAuth`/`requireAdmin`
4. 测试覆盖 — 新功能附带测试
5. 无安全隐患 — 输入经过 Zod 验证，无 XSS/SQL 注入

## 项目结构

```
src/
├── app/            # Next.js App Router
├── components/     # UI 组件
├── services/       # 业务逻辑
├── lib/            # 核心工具
├── hooks/          # React Hooks
└── types/          # 类型定义
```

---

Assisted-by: Claude Code CLI:deepseek-v4-pro[1m]
Signed-off-by: Nxune <nxune@users.noreply.github.com>
