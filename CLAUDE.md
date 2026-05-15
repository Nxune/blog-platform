@AGENTS.md

# Nexus Community Engine（nexus-community）

## 项目定位
AI 原生内容社区平台。不是又一个博客系统——AI 深度嵌入写作、搜索、审核、推荐的每一个环节。

## 技术栈
- Next.js 16 (App Router) + TypeScript strict
- Prisma + SQLite (dev) / PostgreSQL (prod)
- NextAuth.js v5 + @simplewebauthn (Passkey/WebAuthn)
- TipTap v3 富文本编辑器
- Tailwind CSS + Zod
- Vitest + Playwright (98 测试)
- Docker + docker-compose

## 架构原则
- Schema 先行——任何功能必须先 `prisma migrate`，确认迁移完整再写前端
- API Route 代理 AI 调用——不引入额外后端服务
- SQLite 本地优先，PostgreSQL 生产可选
- 单仓库、pnpm workspace 预留 monorepo

## 当前版本：v1.0 → v2.0
- v1.0：社区基础（认证、发帖、评论、权限、搜索、安全）
- v2.0 方向：AI 辅助写作 → 语义搜索 → AI 审核 → AI 推荐
- 详见 `docs/v2.0-nexus-plan.md`

## 关键规则
- 默认不写注释，只注释 WHY 而非 WHAT
- 优先编辑已有文件，不新建
- 不引入不必要的抽象或错误处理
- API 错误统一格式：`Response.json({ error: "描述" }, { status: xxx })`
- 401 UNAUTHORIZED / 403 FORBIDDEN / 404 NOT_FOUND 必须区分

## 上一支团队的教训
- 最多 5 个并行 Agent
- 安全审查与开发并行，不要拖到最后
- 测试在开发过程中持续跑
- 详见 `docs/FAREWELL.md`
