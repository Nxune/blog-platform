# Blog Platform — 技术架构方案

## 技术选型

| 层面 | 选型 | 理由 |
|------|------|------|
| **全栈框架** | Next.js (App Router) | SSR/SSG 利于博客 SEO、API Routes |
| **语言** | TypeScript (strict) | 类型安全 |
| **数据库** | SQLite + Prisma | 零配置、轻量部署 |
| **认证** | NextAuth.js v5 | 标准方案、JWT session |
| **样式** | Tailwind CSS | 响应式快速开发 |
| **Markdown** | react-markdown + remark/rehype | 安全渲染 |
| **测试** | Vitest + Playwright | 单元/集成/E2E |
| **包管理** | pnpm | 快速 |
| **部署** | Docker | 一键部署 |

## 数据模型

- **User**: id, email, username, password, name, avatar, role(ADMIN/AUTHOR/READER), bio
- **Post**: id, title, slug, content(md), excerpt, coverImage, status(DRAFT/PUBLISHED/ARCHIVED), authorId, categoryId, viewCount
- **Category**: id, name, slug, description
- **Tag**: id, name, slug; PostTag(多对多)
- **Comment**: id, content, postId, authorId, parentId(嵌套), isApproved

## 项目结构

```
src/
├── app/              # App Router (pages + API)
├── components/       # ui/, layout/, posts/, comments/, auth/, admin/
├── lib/              # prisma, auth, validations, utils
├── types/            # TS 类型
└── middleware.ts     # Auth guard
prisma/schema.prisma
tests/unit/, integration/, e2e/
```
