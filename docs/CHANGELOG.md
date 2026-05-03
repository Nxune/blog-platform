# 更新日志

## v1.0.0 (2026-05-03)

### 功能特性

#### 权限与用户管理

- Role 枚举增加 `SUPER_ADMIN` 角色，形成 `SUPER_ADMIN → ADMIN → USER` 三级权限体系
- `auth-helpers` 增加 `requireSuperAdmin` 中间件
- AuthGuard 和 `useAuth` Hook 适配 `SUPER_ADMIN` 角色
- 创建用户管理页面，SUPER_ADMIN 侧边栏显示菜单
- 创建用户管理 API 路由（列表/搜索/批量操作）
- 帖子管理页支持 SUPER_ADMIN 全量操作和搜索筛选
- 评论管理页支持状态筛选和批量操作
- 用户管理页增加搜索和批量操作
- 升级 `admin@blog.com` 为 SUPER_ADMIN，添加 seed 脚本
- 优化管理员操作：替换密码验证为 YES 确认机制

#### 密码重置

- Prisma schema 增加 `PasswordResetToken` 模型
- 实现忘记密码页面和 API
- 实现重置密码页面和 API
- 登录页添加忘记密码链接
- 会话刷新：个人资料修改后即时生效

#### 审计日志

- 创建 `AuditLog` 模型（含 action/actor/target/status/detail/metadata 字段）
- 创建 `logAuditAction` 审计日志服务
- 关键管理操作接入审计记录

#### 安全加固

- 统一所有 API 错误处理：区分 `UNAUTHORIZED`(401) / `FORBIDDEN`(403)
- 修复所有 API 路由错误响应一致性
- 添加请求速率限制（速率限制中间件、评论创建、认证端点）
- 新增 CSP 和 HSTS 安全头
- 搜索查询长度限制，防止 DoS 攻击
- Zod 输入验证：注册路由及全局 API 入参校验
- 修复 bcryptjs 导入错误导致重置密码和管理 API 无法使用

#### 移动端适配

- Header 添加移动端汉堡菜单导航
- DashboardShell 添加移动端底部导航栏
- 添加缺失的 aria-labels 和 ARIA 属性，提升无障碍

#### 性能与体验

- 首页性能优化：首屏骨架屏、ISR 策略调整、PostCard 中 `img` 替换为 Next.js `Image`
- 创建 ErrorBoundary 组件
- 改进 Dashboard 页面加载指示器

#### 测试

- 超级管理员 API 集成测试
- 仪表盘 SUPER_ADMIN 集成测试
- auth-helpers 单元测试（SUPER_ADMIN/requireOwner）
- 文章权限集成测试
- 个人设置集成测试
- 仪表盘访问集成测试
- E2E 业务链路测试（注册→登录→发帖→评论→审核）
- 密码修改/会话刷新/密码重置 E2E 测试
- 数据库清理工具

### Bug 修复

- 修复 SUPER_ADMIN 被误拦截的三个页面
- 修复删除用户级联失败和帖子删除错误处理
- 修复 `logAuditAction` 失败不再阻断 API 响应
- 修复搜索页错误处理静默忽略问题
- 修复各 API 路由的 `UNAUTHORIZED` / `FORBIDDEN` 区分
- 修复 E2E 测试中 Settings 页面保存按钮、帖子 slug 传参等问题

### 项目基建

- 完善 Docker 配置（docker-compose.yml + Dockerfile）
- 优化 `next.config.ts` 生产配置
- 创建环境配置模板（.env.example）
- 添加企业级团队架构 Skill 文件
- 全队并行交付：速率限制、移动端 UI、Docker、安全加固

---

## v0.5.0 — 社区化改造

### 功能特性

- 博客平台更名为 **AI Coding 开发者社区**
- 完善仪表盘数据展示和首页优化
- 仪表盘文章列表按用户角色过滤

### Bug 修复

- 评论管理区分未登录和无权限的跳转
- 标签管理增加管理员保护
- 更新已有测试以匹配当前授权模型

### 测试

- 仪表盘访问集成测试
- requireOwner 单元测试
- 文章权限集成测试
- 个人设置集成测试

---

## v0.4.0 — 认证与权限重构

### 架构变更

- 从 Better-Auth 迁移至 NextAuth.js v5 认证方案
- 最终技术栈对齐：PostgreSQL + NextAuth.js

### 功能特性

- 完善用户权限系统：作者可管理自己的文章和评论
- 完善账号设置页面：支持修改邮箱、用户名和密码

### 安全审查

- XSS 防护加固（确认 DomPurify 配置正确）
- 安全审查完成

---

## v0.3.0 — 核心功能实现

### 功能特性

- 文章管理（创建/编辑/列表/搜索）
- 标签系统（创建/管理/筛选）
- 全文搜索
- TipTap 富文本编辑器集成
- 评论系统（嵌套回复、审核、垃圾检测）
- 管理统计接口
- 仪表盘管理后台

### 页面路由

- 公开页面：首页 / 帖子列表 / 帖子详情 / 标签 / 搜索 / 关于
- 认证页面：登录 / 注册 / 找回密码
- 管理后台：仪表盘 / 文章管理 / 评论管理 / 用户管理

---

## v0.2.0 — 项目基础设施

### 搭建内容

- Next.js App Router 项目骨架
- Prisma 数据模型（User/Post/Comment/Tag）
- Tailwind CSS 样式系统
- 项目目录结构搭建
- 技术架构文档

---

## v0.1.0 — 项目初始化

- 使用 Create Next App 初始化
- MIT 许可证

---

Assisted-by: Claude Code CLI:deepseek-v4-pro[1m]
Signed-off-by: Nxune <nxune@users.noreply.github.com>
